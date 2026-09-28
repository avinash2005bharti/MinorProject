import os
from typing import Dict, Any, List
import requests
from loguru import logger

class EmailTools:
    """
    Brevo transactional email integration for Python AI Agents.
    Supports sending OTP, attendance alerts, assignment reminders, and circulars.
    """
    def __init__(self):
        self.api_key = os.getenv("BREVO_API_KEY", "")
        self.sender_email = os.getenv("BREVO_SENDER_EMAIL", "cse-erp@college.edu")
        self.sender_name = os.getenv("BREVO_SENDER_NAME", "CSE Agentic ERP")
        self.api_url = "https://api.brevo.com/v3/smtp/email"

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key != "your_brevo_api_key_here")

    def send_email(self, to_email: str, subject: str, html_body: str) -> Dict[str, Any]:
        if not self.is_configured():
            logger.info(f"[EmailTools] BREVO_API_KEY not configured. Mocking email to {to_email}: '{subject}'")
            return {"success": True, "mocked": True, "message": "Email mocked successfully"}

        headers = {
            "api-key": self.api_key,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        payload = {
            "sender": {"name": self.sender_name, "email": self.sender_email},
            "to": [{"email": to_email}],
            "subject": subject,
            "htmlContent": html_body
        }

        try:
            resp = requests.post(self.api_url, json=payload, headers=headers, timeout=10)
            if resp.status_code in [200, 201]:
                logger.info(f"[EmailTools] Email delivered via Brevo to {to_email}")
                return {"success": True, "data": resp.json()}
            else:
                logger.error(f"[EmailTools] Brevo error: {resp.text}")
                return {"success": False, "error": resp.text}
        except Exception as e:
            logger.error(f"[EmailTools] Connection exception: {e}")
            return {"success": False, "error": str(e)}

    def send_attendance_shortage_alert(self, email: str, student_name: str, subject: str, percentage: int):
        subject_line = f"[URGENT] CSE Department - Attendance Shortage Warning: {percentage}%"
        html = f"""
        <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem;">
            <h2 style="color: #f87171;">⚠️ Attendance Shortage Warning</h2>
            <p>Dear <strong>{student_name}</strong>,</p>
            <p>Your attendance in <strong>{subject}</strong> is currently at <strong>{percentage}%</strong>.</p>
            <p>This is below the mandatory 75% departmental requirement. Please meet your TG immediately.</p>
        </div>
        """
        return self.send_email(email, subject_line, html)

email_tools = EmailTools()
