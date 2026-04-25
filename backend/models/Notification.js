const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['success', 'info', 'warning', 'error'],
    default: 'info',
  },
  category: {
    type: String,
    enum: ['donation', 'account', 'delivery', 'system'],
    default: 'system',
  },
  relatedDonationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    default: null,
  },
  isRead: { type: Boolean, default: false },
}, {
  timestamps: true,
});

notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
