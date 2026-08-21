const nodemailer = require("nodemailer");
require("dotenv").config();

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // Setup SMTP transport config.
    // Nodemailer supports using GMail directly or generic SMTP servers.
    const transporter = nodemailer.createTransport({
      host: (process.env.EMAIL_HOST || "").trim() || "smtp.gmail.com",
      port: parseInt((process.env.EMAIL_PORT || "").trim() || "587", 10),
      secure: (process.env.EMAIL_SECURE || "").trim() === "true", // true for 465, false for 587
      auth: {
        user: (process.env.EMAIL_USER || "").trim(), // e.g. softroniics.lms.reset@gmail.com
        pass: (process.env.EMAIL_PASS || "").trim().replace(/\s/g, ""), // App password (remove spaces)
      },
    });

    const mailOptions = {
      from: `"Softroniics LMS" <${process.env.EMAIL_USER || "no-reply@softroniics.com"}>`,
      to,
      subject,
      text,
      html,
    };

    console.log(`Sending email to ${to}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully: ", info.messageId);
    return info;
  } catch (error) {
    console.error("Nodemailer Error: ", error.message);
    throw new Error(`SMTP Mailer failed: ${error.message}`);
  }
};

module.exports = sendEmail;
