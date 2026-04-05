import requests
import json
from django.conf import settings
import smtplib
from email.mime.text import MIMEText

class MailcowClient:
    """Client for mailcow API"""

    def __init__(self):
        self.base_url = "https://mail.tibernium.com/api"
        self.admin_user = "admin@tibernium.com"
        self.admin_pass = "moohoo"
        self.timeout = 30
        self.verify_ssl = False  # Local cert, ignore SSL warnings

    def _get_api_key(self):
        """Get API key from mailcow"""
        try:
            response = requests.post(
                f"{self.base_url}/v1/auth/login",
                json={
                    "username": self.admin_user,
                    "password": self.admin_pass
                },
                timeout=self.timeout,
                verify=self.verify_ssl
            )
            response.raise_for_status()
            return response.json().get('api_token')
        except Exception as e:
            print(f"Failed to get mailcow API key: {e}")
            return None

    def create_account(self, email: str, password: str) -> dict:
        """Create email account in mailcow"""
        api_key = self._get_api_key()
        if not api_key:
            return {'success': False, 'error': 'Could not authenticate with mailcow'}

        try:
            response = requests.post(
                f"{self.base_url}/v1/add/mailbox",
                headers={"X-API-Key": api_key},
                json={
                    "local_part": email.split('@')[0],
                    "domain": "tibernium.com",
                    "password": password,
                    "password2": password,
                    "active": 1,
                    "force_pw_update": 0,
                    "tls_enforce_in": 0,
                    "tls_enforce_out": 0,
                },
                timeout=self.timeout,
                verify=self.verify_ssl
            )
            response.raise_for_status()
            return {'success': True, 'email': email}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def send_test_email(self, email: str, password: str) -> dict:
        """Send test email to verify account works"""
        try:
            # Connect to mailcow SMTP
            server = smtplib.SMTP("mail.tibernium.com", 587, timeout=self.timeout)
            server.starttls()
            server.login(email, password)

            # Send test email
            msg = MIMEText("This is a test email from centra_point. Your email account is working!")
            msg['Subject'] = "centra_point Test Email"
            msg['From'] = email
            msg['To'] = email

            server.send_message(msg)
            server.quit()

            return {'success': True, 'message': 'Test email sent'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

mailcow = MailcowClient()
