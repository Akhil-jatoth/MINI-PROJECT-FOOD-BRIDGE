const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect, requireRole, requireApproved } = require('../middleware/auth');
const {
  createDonation, getDonations, getDonationById,
  cancelDonation, acceptDonation, rejectDonation,
  assignVolunteer, markDelivered, getDonationStats,
} = require('../controllers/donationController');

router.get('/stats', protect, requireApproved, getDonationStats);
router.get('/', protect, requireApproved, getDonations);
router.get('/:id', protect, requireApproved, getDonationById);

router.post('/', protect, requireApproved, requireRole('donor'), upload.single('foodPhoto'), createDonation);
router.put('/:id/cancel', protect, requireApproved, requireRole('donor'), cancelDonation);
router.put('/:id/accept', protect, requireApproved, requireRole('ngo'), acceptDonation);
router.put('/:id/reject', protect, requireApproved, requireRole('ngo'), rejectDonation);
router.put('/:id/assign-volunteer', protect, requireApproved, requireRole('volunteer'), assignVolunteer);
router.put('/:id/deliver', protect, requireApproved, requireRole('volunteer'), markDelivered);

module.exports = router;
