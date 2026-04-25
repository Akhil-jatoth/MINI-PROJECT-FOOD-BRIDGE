const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const {
  register, login, verifyOTP, resendOTP,
  getMe, updateProfilePhoto, removeProfilePhoto,
} = require('../controllers/authController');

router.post('/register', upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'idFile', maxCount: 1 },
  { name: 'ngoCertificate', maxCount: 1 },
]), register);

router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.get('/me', protect, getMe);
router.put('/profile-photo', protect, upload.single('profilePhoto'), updateProfilePhoto);
router.delete('/profile-photo', protect, removeProfilePhoto);

module.exports = router;
