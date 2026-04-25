/**
 * OTP Utility
 * Generates a 6-digit OTP and logs it to console (no email service required).
 * In production, replace the sendOTP function body with your email/SMS provider.
 */

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getOTPExpiry = () => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 2); // 2 minutes
  return expiry;
};

const sendOTP = async (email, name, otp) => {
  // Console-based OTP delivery (development mode)
  console.log('\n========================================');
  console.log(`🔐 OTP for ${name} (${email}): ${otp}`);
  console.log(`⏰ Valid for 2 minutes`);
  console.log('========================================\n');
  return true;
};

const isOTPExpired = (otpExpiry) => {
  return new Date() > new Date(otpExpiry);
};

module.exports = { generateOTP, getOTPExpiry, sendOTP, isOTPExpired };
