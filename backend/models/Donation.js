const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  donorName: { type: String, required: true },
  donorPhone: { type: String, default: '' },

  foodName: { type: String, required: [true, 'Food name is required'] },
  foodType: {
    type: String,
    enum: ['veg', 'non-veg', 'both'],
    default: 'veg',
  },
  quantity: { type: Number, required: [true, 'Quantity is required'] }, // in kg
  servesCount: { type: Number, default: 0 },
  description: { type: String, default: '' },

  pickupAddress: {
    full: { type: String, default: '' },
    district: { type: String, default: '' },
    landmark: { type: String, default: '' },
    pincode: { type: String, default: '' },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },

  pickupTime: { type: String, default: '' },
  expiryTime: { type: String, default: '' },
  expiryDateTime: { type: Date, default: null },

  foodPhoto: { type: String, default: null },

  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled', 'picked_up', 'delivered'],
    default: 'pending',
  },

  acceptedByNgo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  ngoName: { type: String, default: '' },

  assignedVolunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  volunteerName: { type: String, default: '' },

  rejectionReason: { type: String, default: '' },
  cancelReason: { type: String, default: '' },

  deliveredAt: { type: Date, default: null },
}, {
  timestamps: true,
});

// Index for location-based queries
donationSchema.index({ 'pickupAddress.lat': 1, 'pickupAddress.lng': 1 });
donationSchema.index({ status: 1 });
donationSchema.index({ donorId: 1 });

module.exports = mongoose.model('Donation', donationSchema);
