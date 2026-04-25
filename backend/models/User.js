const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true,
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
  },
  role: {
    type: String,
    enum: ['donor', 'ngo', 'volunteer', 'admin'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  profilePhoto: {
    type: String,
    default: null,
  },
  // Address
  address: {
    hno: { type: String, default: '' },
    landmark: { type: String, default: '' },
    district: { type: String, default: '' },
    pincode: { type: String, default: '' },
    full: { type: String, default: '' },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  // ID Proof
  idType: { type: String, default: '' },
  idNumber: { type: String, default: '' },
  idFile: { type: String, default: null },

  // Role-specific data
  roleData: {
    // Donor
    foodType: { type: String, default: '' },
    defaultQuantity: { type: String, default: '' },
    // NGO
    organizationName: { type: String, default: '' },
    ngoCertificate: { type: String, default: null },
    serviceAreaRadius: { type: Number, default: 10 },
    // Volunteer
    availabilityTime: { type: String, default: '' },
    transportOption: { type: String, default: '' },
    maxCapacity: { type: Number, default: 3 },
  },

  // OTP
  otp: { type: String, default: null },
  otpExpiry: { type: Date, default: null },

  // Rating
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },

  isVerified: { type: Boolean, default: false },
}, {
  timestamps: true,
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.otp;
  delete obj.otpExpiry;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
