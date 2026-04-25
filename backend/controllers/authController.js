const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { generateOTP, getOTPExpiry, sendOTP, isOTPExpired } = require('../utils/otp');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @desc   Register a new user
// @route  POST /api/auth/register
// @access Public
const register = async (req, res, next) => {
  try {
    const {
      name, email, phone, password, role,
      hno, landmark, district, pincode, lat, lng,
      idType, idNumber,
      // Role-specific
      organizationName, serviceAreaRadius,
      availabilityTime, transportOption, maxCapacity,
      foodType, defaultQuantity,
    } = req.body;

    // Check if email exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Build address
    const fullAddress = `${hno}, ${landmark}, ${district} - ${pincode}`;

    // Build role data
    const roleData = {};
    if (role === 'ngo') {
      roleData.organizationName = organizationName || '';
      roleData.serviceAreaRadius = serviceAreaRadius || 10;
      if (req.files && req.files['ngoCertificate']) {
        roleData.ngoCertificate = req.files['ngoCertificate'][0].filename;
      }
    }
    if (role === 'volunteer') {
      roleData.availabilityTime = availabilityTime || '';
      roleData.transportOption = transportOption || 'bicycle';
      roleData.maxCapacity = maxCapacity || 3;
    }
    if (role === 'donor') {
      roleData.foodType = foodType || '';
      roleData.defaultQuantity = defaultQuantity || '';
    }

    // Build user object
    const userData = {
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash: password, // will be hashed by pre-save hook
      role,
      address: {
        hno: hno || '',
        landmark: landmark || '',
        district: district || '',
        pincode: pincode || '',
        full: fullAddress,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
      },
      idType: idType || '',
      idNumber: idNumber || '',
      roleData,
    };

    if (req.files) {
      if (req.files['idFile']) userData.idFile = req.files['idFile'][0].filename;
      if (req.files['profilePhoto']) userData.profilePhoto = req.files['profilePhoto'][0].filename;
    }

    const user = await User.create(userData);

    // Notify admin (create a notification for all admins)
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        userId: admin._id,
        title: 'New User Registration',
        message: `${name} registered as ${role}. Pending your approval.`,
        type: 'info',
        category: 'account',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Your account is pending admin approval.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc   Login step 1 — verify credentials, send OTP
// @route  POST /api/auth/login
// @access Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({ success: false, message: 'Your account has been rejected by admin.' });
    }

    // Generate OTP
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = getOTPExpiry();
    await user.save({ validateBeforeSave: false });

    await sendOTP(user.email, user.name, otp);

    res.json({
      success: true,
      message: 'OTP sent. Please check your console (development mode).',
      userId: user._id,
      status: user.status, // so frontend can show "pending approval" message
    });
  } catch (err) {
    next(err);
  }
};

// @desc   Login step 2 — verify OTP, return JWT
// @route  POST /api/auth/verify-otp
// @access Public
const verifyOTP = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (isOTPExpired(user.otpExpiry)) {
      return res.status(400).json({ success: false, message: 'OTP expired. Please login again.' });
    }

    // Clear OTP
    user.otp = null;
    user.otpExpiry = null;
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        profilePhoto: user.profilePhoto,
        address: user.address,
        roleData: user.roleData,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc   Resend OTP
// @route  POST /api/auth/resend-otp
// @access Public
const resendOTP = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = getOTPExpiry();
    await user.save({ validateBeforeSave: false });

    await sendOTP(user.email, user.name, otp);

    res.json({ success: true, message: 'OTP resent successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc   Get current logged-in user's profile
// @route  GET /api/auth/me
// @access Private
const getMe = async (req, res, next) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (err) {
    next(err);
  }
};

// @desc   Update profile photo
// @route  PUT /api/auth/profile-photo
// @access Private
const updateProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePhoto: req.file.filename },
      { new: true }
    );

    res.json({ success: true, message: 'Profile photo updated', profilePhoto: user.profilePhoto });
  } catch (err) {
    next(err);
  }
};

// @desc   Remove profile photo
// @route  DELETE /api/auth/profile-photo
// @access Private
const removeProfilePhoto = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { profilePhoto: null });
    res.json({ success: true, message: 'Profile photo removed' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, verifyOTP, resendOTP, getMe, updateProfilePhoto, removeProfilePhoto };
