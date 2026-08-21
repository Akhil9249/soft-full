const nodemailer = require("nodemailer");
require("dotenv").config();

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    console.log("SMTP configuration check:");
    console.log("EMAIL_USER exists:", !!process.env.EMAIL_USER);
    console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);
    console.log("EMAIL_HOST:", process.env.EMAIL_HOST || "smtp.gmail.com");
    console.log("EMAIL_PORT:", process.env.EMAIL_PORT || "587");
    console.log("EMAIL_SECURE:", process.env.EMAIL_SECURE || "false");

    const user = (process.env.EMAIL_USER || "").trim();
    const pass = (process.env.EMAIL_PASS || "").trim().replace(/\s/g, "");

    if (!user) {
      throw new Error("EMAIL_USER is missing");
    }
    if (!pass) {
      throw new Error("EMAIL_PASS is missing");
    }

    const transporter = nodemailer.createTransport({
      host: (process.env.EMAIL_HOST || "smtp.gmail.com").trim(),
      port: parseInt(process.env.EMAIL_PORT || "587", 10),
      secure: (process.env.EMAIL_SECURE || "false").trim() === "true",
      auth: {
        user,
        pass,
      },
    });

    await transporter.verify();
    console.log("SMTP connection verified successfully");

    const mailOptions = {
      from: `"Softroniics LMS" <${user}>`,
      to,
      subject,
      text,
      html,
    };

    console.log(`Sending email to ${to}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("Nodemailer Error:", error.message);
    throw new Error(`SMTP Mailer failed: ${error.message}`);
  }
};

module.exports = sendEmail;
