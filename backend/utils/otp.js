const nodemailer = require('nodemailer');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getOTPExpiry = () => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 2); // 2 minutes
  return expiry;
};

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use gmail or specify SMTP details
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendOTP = async (email, name, otp, role) => {
  const roleDisplay = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
  
  // Console-based OTP delivery (development mode fallback if email not configured)
  console.log('\n========================================');
  console.log(`🔐 OTP for ${name} (${email}): ${otp}`);
  console.log(`⏰ Valid for 2 minutes`);
  console.log('========================================\n');

  if (!process.env.SMTP_EMAIL || process.env.SMTP_EMAIL === 'your_email@gmail.com') {
    console.log('⚠️ SMTP Credentials not provided, skipping actual email delivery.');
    return true; 
  }

  const mailOptions = {
    from: `"Food Bridge System" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: `Your Food Bridge Login Verification Code`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #10B981; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Food Bridge 🍽️</h1>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #374151;">Hello ${name},</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            You are logging in to the Food Bridge platform as a <strong>${roleDisplay}</strong>. 
            Please use the following 6-digit OTP verification code to securely access your dashboard:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; background-color: #10B981; color: white; font-size: 32px; font-weight: bold; padding: 12px 28px; border-radius: 8px; letter-spacing: 5px;">
              ${otp}
            </span>
          </div>
          <p style="color: #4b5563; font-size: 16px; margin-bottom: 24px;">
            This security code acts as your temporary access token and is only valid for <strong>2 minutes</strong>. Please do not share it with anyone.
          </p>
          <p style="color: #6b7280; font-size: 14px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            Thank you for being part of our mission to bridge the gap between food waste and hunger! <br/>
            <strong>- The Food Bridge Team</strong>
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('📧 OTP Email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('❌ Error sending OTP Email:', error);
    // return false or throw error if desired, returning true for development fallback
    return true; 
  }
};

const isOTPExpired = (otpExpiry) => {
  return new Date() > new Date(otpExpiry);
};

module.exports = { generateOTP, getOTPExpiry, sendOTP, isOTPExpired };
