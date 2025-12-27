const nodemailer = require('nodemailer');
const dotenv = require('dotenv'); 

dotenv.config();

const sendEmail = async (options) => {
  // Create transporter (Use environment variables for credentials)
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_PASS:", process.env.EMAIL_PASS);

  const transporter = nodemailer.createTransport({
    service: 'gmail', // or your SMTP provider
    auth: {
      // ⚠️ HARDCODE YOUR CREDENTIALS HERE TEMPORARILY ⚠️
      user: 'hamidsaif214@gmail.com',
      pass: 'oaggtwmhgvdmdgpx' // For Gmail, use App Password
    }
  });

  const message = {
    from: `${process.env.FROM_NAME} <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.message
  };

  await transporter.sendMail(message);
};

module.exports = sendEmail;