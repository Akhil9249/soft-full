const { User } = require("../../models/administration/userModel.js");
const { Staff } = require("../../models/administration/staffModel.js");
const Intern = require("../../models/administration/internModel.js");
const Otp = require("../../models/administration/otpModel.js");
const sendEmail = require("../../utils/sendEmail.js");
const { generatePasswordHash } = require("../../utils/bcrypt.js");

// 1. Send OTP for Forgot Password
const sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const lowerEmail = email.toLowerCase().trim();

    // Check if user exists in any of the collections (User, Staff, Intern)
    let user = await User.findOne({ email: lowerEmail });
    if (!user) {
      user = await Staff.findOne({
        $or: [{ email: lowerEmail }, { officialEmail: lowerEmail }],
        isDeleted: { $ne: true }
      });
    }
    if (!user) {
      user = await Intern.findOne({
        $or: [{ email: lowerEmail }, { officialEmail: lowerEmail }],
        isDeleted: { $ne: true }
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No registered account found with this email address."
      });
    }

    // Generate a 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 1000); // 30 seconds from now

    // Save/Update OTP in Otp collection
    await Otp.findOneAndUpdate(
      { email: lowerEmail },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    // Send email using Nodemailer
    const emailSubject = "Password Reset OTP - Softroniics LMS";
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #E99732; text-align: center;">Softroniics LMS</h2>
        <h3 style="color: #333333;">Password Reset Request</h3>
        <p style="color: #666666; font-size: 16px;">
          You requested to reset your password. Please use the following One-Time Password (OTP) to proceed:
        </p>
        <div style="background-color: #f7f7f7; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333333;">${otp}</span>
        </div>
        <p style="color: #999999; font-size: 14px; text-align: center;">
          This OTP is valid for 30 seconds. If you did not make this request, you can safely ignore this email.
        </p>
      </div>
    `;

    await sendEmail({
      to: lowerEmail,
      subject: emailSubject,
      text: `Your password reset OTP is ${otp}. It is valid for 30 seconds.`,
      html: emailHtml
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email address."
    });

  } catch (error) {
    console.error("Error in sendOtp controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send OTP email. Please try again."
    });
  }
};

// 2. Reset Password using OTP
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required"
      });
    }

    const lowerEmail = email.toLowerCase().trim();

    // Verify OTP exists and is valid
    const otpRecord = await Otp.findOne({ email: lowerEmail, otp });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP code. Please check and try again."
      });
    }

    // Verify OTP expiry
    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one."
      });
    }

    // Find the user in collections
    let user = await User.findOne({ email: lowerEmail });
    
    if (!user) {
      user = await Staff.findOne({
        $or: [{ email: lowerEmail }, { officialEmail: lowerEmail }],
        isDeleted: { $ne: true }
      });
    }
    
    if (!user) {
      user = await Intern.findOne({
        $or: [{ email: lowerEmail }, { officialEmail: lowerEmail }],
        isDeleted: { $ne: true }
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found."
      });
    }

    // Hash the new password
    const hashedPassword = await generatePasswordHash(password);

    // Update password
    user.password = hashedPassword;
    await user.save();

    // Clean up OTP
    await Otp.deleteMany({ email: lowerEmail });

    return res.status(200).json({
      success: true,
      message: "Password reset successful! You can now log in with your new password."
    });

  } catch (error) {
    console.error("Error in resetPassword controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to reset password. Please try again."
    });
  }
};

// 3. Verify OTP code
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required"
      });
    }

    const lowerEmail = email.toLowerCase().trim();

    // Verify OTP exists and is valid
    const otpRecord = await Otp.findOne({ email: lowerEmail, otp: otp.trim() });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP code. Please check and try again."
      });
    }

    // Verify OTP expiry
    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one."
      });
    }

    // Extend expiry so the user has time to type their new password
    otpRecord.expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await otpRecord.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. Please enter your new password."
    });

  } catch (error) {
    console.error("Error in verifyOtp controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify OTP. Please try again."
    });
  }
};

module.exports = {
  sendOtp,
  resetPassword,
  verifyOtp
};
