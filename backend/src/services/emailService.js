const axios = require('axios');
const { emailLogger } = require('./loggerService');

class BrevoEmailService {
  constructor() {
    this.apiKey = process.env.BREVO_API_KEY || '';
    this.senderEmail = process.env.BREVO_SENDER_EMAIL || 'cse-erp@college.edu';
    this.senderName = process.env.BREVO_SENDER_NAME || 'CSE Agentic ERP';
    this.apiUrl = 'https://api.brevo.com/v3/smtp/email';
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey !== 'your_brevo_api_key_here');
  }

  async sendMail({ to, subject, htmlContent, textContent }) {
    if (!this.isConfigured()) {
      emailLogger.warn(`[Brevo Email] BREVO_API_KEY not configured. Mocking email delivery to: ${to} | Subject: "${subject}"`);
      return {
        success: true,
        mocked: true,
        messageId: `mock-${Date.now()}`
      };
    }

    try {
      const payload = {
        sender: {
          name: this.senderName,
          email: this.senderEmail
        },
        to: Array.isArray(to) ? to.map(e => ({ email: e })) : [{ email: to }],
        subject,
        htmlContent,
        textContent: textContent || 'CSE Department ERP Notification'
      };

      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      emailLogger.info(`[Brevo Email] Email sent successfully to ${to} | Subject: "${subject}" | Brevo ID: ${response.data.messageId}`);
      return {
        success: true,
        messageId: response.data.messageId
      };
    } catch (error) {
      const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
      emailLogger.error(`[Brevo Email] Failed to send email to ${to}: ${errorMsg}`);
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  // 1. Send OTP Email for login / forgot password
  async sendOtpEmail(email, otpCode, name = 'Student/Faculty') {
    const subject = `[CSE ERP] Your One-Time Password (OTP) - ${otpCode}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; border-radius: 8px;">
        <h2 style="color: #38bdf8; margin-bottom: 0.5rem;">CSE Department Agentic ERP</h2>
        <p style="color: #94a3b8;">Department of Computer Science & Engineering</p>
        <hr style="border: 0; border-top: 1px solid #334155; margin: 1.5rem 0;" />
        <p>Hello <strong>${name}</strong>,</p>
        <p>Use the verification code below to complete your login / password reset:</p>
        <div style="background: #1e293b; padding: 1.25rem; font-size: 2rem; font-weight: bold; letter-spacing: 6px; text-align: center; color: #38bdf8; border-radius: 6px; border: 1px dashed #38bdf8; margin: 1.5rem 0;">
          ${otpCode}
        </div>
        <p style="font-size: 0.85rem; color: #94a3b8;">This code is valid for 10 minutes. If you did not request this, please contact the CSE Department Admin immediately.</p>
      </div>
    `;
    return this.sendMail({ to: email, subject, htmlContent });
  }

  // 2. Send Attendance Alert (Below 75% threshold)
  async sendAttendanceAlert(studentEmail, studentName, subjectName, attendancePercent) {
    const subject = `[URGENT] CSE Department - Attendance Shortage Warning: ${attendancePercent}%`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; border-radius: 8px;">
        <h2 style="color: #f87171;">⚠️ Attendance Shortage Alert</h2>
        <p style="color: #94a3b8;">Department of Computer Science & Engineering</p>
        <hr style="border: 0; border-top: 1px solid #334155; margin: 1.5rem 0;" />
        <p>Dear <strong>${studentName}</strong>,</p>
        <p>Your recorded attendance in <strong>${subjectName}</strong> has dropped below the mandatory threshold of <strong>75%</strong>:</p>
        <div style="background: #2b1111; color: #fca5a5; padding: 1rem; border-radius: 6px; font-size: 1.2rem; margin: 1rem 0; border: 1px solid #f87171;">
          Current Attendance: <strong>${attendancePercent}%</strong>
        </div>
        <p>Please meet your subject faculty or Teacher Guardian immediately to avoid debarment from the upcoming semester examination.</p>
      </div>
    `;
    return this.sendMail({ to: studentEmail, subject, htmlContent });
  }

  // 3. Send Assignment Reminder
  async sendAssignmentReminder(studentEmail, studentName, assignmentTitle, deadline) {
    const subject = `[Reminder] CSE Assignment Deadline: ${assignmentTitle}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; border-radius: 8px;">
        <h2 style="color: #fbbf24;">📝 Assignment Reminder</h2>
        <p style="color: #94a3b8;">Department of Computer Science & Engineering</p>
        <hr style="border: 0; border-top: 1px solid #334155; margin: 1.5rem 0;" />
        <p>Dear <strong>${studentName}</strong>,</p>
        <p>This is a reminder that the submission window for <strong>${assignmentTitle}</strong> is closing soon.</p>
        <p><strong>Submission Deadline:</strong> ${new Date(deadline).toLocaleString()}</p>
        <p>Ensure you upload your solution in PDF/DOCX format via the Student Portal before the cut-off time.</p>
      </div>
    `;
    return this.sendMail({ to: studentEmail, subject, htmlContent });
  }

  // 4. Send Circular Notification
  async sendCircularNotification(recipientEmail, title, summary, date) {
    const subject = `[CSE Circular] ${title}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; border-radius: 8px;">
        <h2 style="color: #38bdf8;">📢 Department Circular</h2>
        <p style="color: #94a3b8;">Department of Computer Science & Engineering | ${new Date(date).toLocaleDateString()}</p>
        <hr style="border: 0; border-top: 1px solid #334155; margin: 1.5rem 0;" />
        <h3 style="color: #f1f5f9;">${title}</h3>
        <p style="color: #cbd5e1; line-height: 1.6;">${summary}</p>
        <p style="font-size: 0.85rem; color: #94a3b8; margin-top: 2rem;">Log into the CSE ERP Portal to view full document details and attachments.</p>
      </div>
    `;
    return this.sendMail({ to: recipientEmail, subject, htmlContent });
  }
}

module.exports = new BrevoEmailService();
