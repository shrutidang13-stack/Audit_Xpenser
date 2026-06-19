from dataclasses import dataclass
from email.message import EmailMessage
import smtplib

from app.core.config import get_settings


@dataclass
class EmailAttachment:
    filename: str
    content: bytes
    content_type: str


def send_email(to_email: str, subject: str, body: str, attachments: list[EmailAttachment] | None = None) -> dict:
    settings = get_settings()
    if not settings.smtp_host or not settings.smtp_username or not settings.smtp_password:
        return {
            "sent": False,
            "setup_required": True,
            "message": "SMTP is not configured. Add SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD and SMTP_FROM_EMAIL in backend/.env.",
        }

    from_email = settings.smtp_from_email or settings.smtp_username
    message = EmailMessage()
    message["From"] = from_email
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    for attachment in attachments or []:
        maintype, subtype = attachment.content_type.split("/", 1)
        message.add_attachment(
            attachment.content,
            maintype=maintype,
            subtype=subtype,
            filename=attachment.filename,
        )

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30) as smtp:
        if settings.smtp_use_tls:
            smtp.starttls()
        smtp.login(settings.smtp_username, settings.smtp_password)
        smtp.send_message(message)

    return {"sent": True, "setup_required": False, "message": f"Mail sent to {to_email} from {from_email}."}
