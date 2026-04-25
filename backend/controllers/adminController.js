const User = require('../models/User');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');
const bcrypt = require('bcryptjs');

// @desc   Get all users (admin)
// @route  GET /api/admin/users
// @access Private (Admin)
const getAllUsers = async (req, res, next) => {
  try {
    const { role, status, page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { role: { $ne: 'admin' } };
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-passwordHash -otp -otpExpiry')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

// @desc   Approve a user
// @route  PUT /api/admin/users/:id/approve
// @access Private (Admin)
const approveUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await Notification.create({
      userId: user._id,
      title: 'Account Approved! 🎉',
      message: 'Your account has been approved by the admin. You can now use Food Bridge!',
      type: 'success',
      category: 'account',
    });

    const io = req.app.get('io');
    if (io) io.to(user._id.toString()).emit('account:approved', { userId: user._id });

    res.json({ success: true, message: `${user.name}'s account approved`, user });
  } catch (err) {
    next(err);
  }
};

// @desc   Reject a user
// @route  PUT /api/admin/users/:id/reject
// @access Private (Admin)
const rejectUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await Notification.create({
      userId: user._id,
      title: 'Account Update',
      message: 'Your account registration was not approved. Please contact support.',
      type: 'error',
      category: 'account',
    });

    res.json({ success: true, message: `${user.name}'s account rejected`, user });
  } catch (err) {
    next(err);
  }
};

// @desc   Get all donations (admin)
// @route  GET /api/admin/donations
// @access Private (Admin)
const getAllDonations = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (status) query.status = status;

    const donations = await Donation.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('donorId', 'name email phone')
      .populate('acceptedByNgo', 'name roleData.organizationName')
      .populate('assignedVolunteer', 'name');

    const total = await Donation.countDocuments(query);

    res.json({
      success: true,
      donations,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

// @desc   Get analytics
// @route  GET /api/admin/analytics
// @access Private (Admin)
const getAnalytics = async (req, res, next) => {
  try {
    const [
      totalUsers, pendingUsers, approvedUsers,
      totalDonations, donationsByStatus,
      donationsByRole, recentDonations
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ status: 'pending', role: { $ne: 'admin' } }),
      User.countDocuments({ status: 'approved', role: { $ne: 'admin' } }),
      Donation.countDocuments(),
      Donation.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      User.aggregate([
        { $match: { role: { $ne: 'admin' } } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      Donation.find().sort({ createdAt: -1 }).limit(5)
        .populate('donorId', 'name'),
    ]);

    const statusMap = {};
    donationsByStatus.forEach(s => { statusMap[s._id] = s.count; });

    const roleMap = {};
    donationsByRole.forEach(r => { roleMap[r._id] = r.count; });

    res.json({
      success: true,
      analytics: {
        users: { total: totalUsers, pending: pendingUsers, approved: approvedUsers },
        donations: {
          total: totalDonations,
          pending: statusMap.pending || 0,
          accepted: statusMap.accepted || 0,
          delivered: statusMap.delivered || 0,
          cancelled: statusMap.cancelled || 0,
          rejected: statusMap.rejected || 0,
        },
        usersByRole: {
          donors: roleMap.donor || 0,
          ngos: roleMap.ngo || 0,
          volunteers: roleMap.volunteer || 0,
        },
        recentDonations,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc   Create admin (seed only)
// @route  POST /api/admin/create
// @access Public (should be disabled in production)
const createAdmin = async (req, res, next) => {
  try {
    const { name, email, password, secretKey } = req.body;
    if (secretKey !== 'FOODBRIDGE_ADMIN_2026') {
      return res.status(403).json({ success: false, message: 'Invalid secret key' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Admin already exists' });

    const admin = await User.create({
      name,
      email,
      phone: '0000000000',
      passwordHash: password,
      role: 'admin',
      status: 'approved',
    });

    res.status(201).json({ success: true, message: 'Admin created', admin });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, approveUser, rejectUser, getAllDonations, getAnalytics, createAdmin };
