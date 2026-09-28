from typing import Dict, Any, List
from loguru import logger
from tools.email_tools import email_tools

class EmailAgent:
    """
    Email Agent using Brevo to handle:
    - OTP verification delivery
    - Assignment reminders
    - Attendance shortage alerts (< 75%)
    - Department circular notifications
    """
    def __init__(self):
        self.email_tools = email_tools

    def send_otp(self, email: str, otp_code: str, name: str = "Student/Faculty") -> Dict[str, Any]:
        subject = f"[CSE ERP] Verification OTP: {otp_code}"
        html = f"""
        <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; border-radius: 8px;">
            <h2 style="color: #38bdf8;">CSE Department ERP Authentication</h2>
            <p>Hello <strong>{name}</strong>,</p>
            <p>Your OTP verification code is:</p>
            <h1 style="color: #38bdf8; letter-spacing: 5px; background: #1e293b; padding: 1rem; text-align: center;">{otp_code}</h1>
            <p>Valid for 10 minutes.</p>
        </div>
        """
        return self.email_tools.send_email(email, subject, html)

    def send_assignment_reminder(self, email: str, name: str, assignment_title: str, deadline: str) -> Dict[str, Any]:
        subject = f"[Reminder] CSE Assignment Submission: {assignment_title}"
        html = f"""
        <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; border-radius: 8px;">
            <h2 style="color: #fbbf24;">📝 Assignment Submission Reminder</h2>
            <p>Dear <strong>{name}</strong>,</p>
            <p>Submission deadline for <strong>{assignment_title}</strong> is approaching:</p>
            <p style="font-size: 1.1rem; color: #fde68a;"><strong>Deadline:</strong> {deadline}</p>
            <p>Please submit via the CSE Student Portal.</p>
        </div>
        """
        return self.email_tools.send_email(email, subject, html)

    def send_attendance_alert(self, email: str, name: str, subject: str, percentage: int) -> Dict[str, Any]:
        return self.email_tools.send_attendance_shortage_alert(email, name, subject, percentage)

    def broadcast_circular(self, emails: List[str], title: str, summary: str) -> Dict[str, Any]:
        subject = f"[CSE Circular] {title}"
        html = f"""
        <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; border-radius: 8px;">
            <h2 style="color: #38bdf8;">📢 CSE Department Circular</h2>
            <h3>{title}</h3>
            <p style="line-height: 1.6;">{summary}</p>
        </div>
        """
        results = []
        for e in emails:
            res = self.email_tools.send_email(e, subject, html)
            results.append(res)
        return {"total_sent": len(results), "success": True}

email_agent = EmailAgent()
