const nodemailer = require('nodemailer');

let transporter;

try {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
} catch (e) {
  console.warn('[Mailer] Transporter init warning:', e.message);
}

const sendMail = async ({ to, subject, html, text }) => {
  const from = process.env.EMAIL_FROM || '"CampusFlow CSE ERP" <no-reply@campusflow.com>';
  
  if (!process.env.SMTP_USER || process.env.SMTP_PASS === 'app_password_mock') {
    console.log(`\n[EMAIL MOCK DISPATCH]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Preview: ${text || subject}`);
    console.log(`------------------------------------\n`);
    return { success: true, mocked: true };
  }

  try {
    const info = await transporter.sendMail({ from, to, subject, html, text });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Mailer] Send failed:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendMail };
