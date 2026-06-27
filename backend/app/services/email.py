import smtplib
from email.mime.text import MIMEText
from app.core.config import get_settings
from app.core.logging import get_logger

settings = get_settings()
logger = get_logger("email")


async def send_verification_email(to_email: str, verify_url: str) -> bool:
    if not settings.smtp_host:
        logger.info("email_not_configured", to=to_email, verify_url=verify_url)
        return False

    try:
        msg = MIMEText(f"Klik link berikut untuk verifikasi email Anda:\n\n{verify_url}\n\nTerima kasih.\nFMA Labs Research")
        msg["Subject"] = "Verifikasi Email - FMA Labs Research"
        msg["From"] = settings.from_email
        msg["To"] = to_email

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            if settings.smtp_user:
                server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(msg)

        logger.info("email_sent", to=to_email)
        return True
    except Exception as e:
        logger.error("email_failed", to=to_email, error=str(e))
        return False
