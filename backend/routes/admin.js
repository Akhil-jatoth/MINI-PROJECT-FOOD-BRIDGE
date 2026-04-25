const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const { getAllUsers, approveUser, rejectUser, getAllDonations, getAnalytics, createAdmin } = require('../controllers/adminController');

router.post('/create', createAdmin); // seed admin — disable in production
router.use(protect, requireRole('admin')); // all below require admin role

router.get('/users', getAllUsers);
router.put('/users/:id/approve', approveUser);
router.put('/users/:id/reject', rejectUser);
router.get('/donations', getAllDonations);
router.get('/analytics', getAnalytics);

module.exports = router;
