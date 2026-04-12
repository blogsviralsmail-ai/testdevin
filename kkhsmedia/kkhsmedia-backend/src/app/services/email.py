"""Email service for sending OTP, notifications, and transactional emails."""
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from app.config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, FROM_EMAIL

logger = logging.getLogger(__name__)


async def send_email(to: str, subject: str, html_body: str, text_body: Optional[str] = None) -> bool:
    """Send email via SMTP. Returns True if sent successfully."""
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning(f"SMTP not configured - skipping email to {to}: {subject}")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = FROM_EMAIL
        msg["To"] = to

        if text_body:
            msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(FROM_EMAIL, to, msg.as_string())

        logger.info(f"Email sent to {to}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")
        return False


async def send_otp_email(to: str, otp: str, purpose: str = "verify") -> bool:
    """Send OTP verification email."""
    from app.database import get_db
    db = get_db()
    settings = await db.settings.find_one({"key": "site"})
    brand = (settings or {}).get("brandName", "KKHS Media")

    if purpose == "verify":
        subject = f"{brand} - Email Verification OTP"
        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
            <h2 style="color:#6366f1;">{brand}</h2>
            <p>Your email verification code is:</p>
            <div style="background:#f3f4f6;padding:20px;text-align:center;border-radius:12px;margin:20px 0;">
                <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1f2937;">{otp}</span>
            </div>
            <p style="color:#6b7280;font-size:14px;">This code expires in 10 minutes. Do not share it with anyone.</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
            <p style="color:#9ca3af;font-size:12px;">{brand} - 24/7 Live Streaming Platform</p>
        </div>
        """
    else:
        subject = f"{brand} - Password Reset OTP"
        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
            <h2 style="color:#6366f1;">{brand}</h2>
            <p>Your password reset code is:</p>
            <div style="background:#f3f4f6;padding:20px;text-align:center;border-radius:12px;margin:20px 0;">
                <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1f2937;">{otp}</span>
            </div>
            <p style="color:#6b7280;font-size:14px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
            <p style="color:#9ca3af;font-size:12px;">{brand} - 24/7 Live Streaming Platform</p>
        </div>
        """

    return await send_email(to, subject, html)


async def send_welcome_email(to: str, first_name: str) -> bool:
    """Send welcome email after registration."""
    from app.database import get_db
    db = get_db()
    settings = await db.settings.find_one({"key": "site"})
    brand = (settings or {}).get("brandName", "KKHS Media")

    subject = f"Welcome to {brand}!"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
        <h2 style="color:#6366f1;">Welcome to {brand}!</h2>
        <p>Hi {first_name},</p>
        <p>Thanks for joining {brand}! Your account is ready. You can now:</p>
        <ul>
            <li>Upload your videos</li>
            <li>Create live streaming slots</li>
            <li>Stream 24/7 on YouTube, Facebook, Twitch & more</li>
        </ul>
        <p>Get started now!</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
        <p style="color:#9ca3af;font-size:12px;">{brand} - 24/7 Live Streaming Platform</p>
    </div>
    """
    return await send_email(to, subject, html)


async def send_stream_notification(to: str, slot_name: str, event: str) -> bool:
    """Send stream start/stop/error notification."""
    from app.database import get_db
    db = get_db()
    settings = await db.settings.find_one({"key": "site"})
    brand = (settings or {}).get("brandName", "KKHS Media")

    events = {
        "started": ("Stream Started", "Your live stream has started successfully.", "#22c55e"),
        "stopped": ("Stream Stopped", "Your live stream has been stopped.", "#ef4444"),
        "error": ("Stream Error", "There was an error with your live stream. We're trying to restart it.", "#f59e0b"),
        "restarted": ("Stream Restarted", "Your stream was automatically restarted after a brief interruption.", "#3b82f6"),
    }
    title, message, color = events.get(event, ("Stream Update", f"Stream event: {event}", "#6366f1"))

    subject = f"{brand} - {title}: {slot_name}"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
        <h2 style="color:#6366f1;">{brand}</h2>
        <div style="background:{color}10;border-left:4px solid {color};padding:15px;border-radius:0 8px 8px 0;margin:20px 0;">
            <h3 style="color:{color};margin:0 0 5px 0;">{title}</h3>
            <p style="margin:0;color:#374151;">{message}</p>
        </div>
        <p style="color:#6b7280;font-size:14px;">Slot: <strong>{slot_name}</strong></p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
        <p style="color:#9ca3af;font-size:12px;">{brand} - 24/7 Live Streaming Platform</p>
    </div>
    """
    return await send_email(to, subject, html)


async def send_payment_confirmation(to: str, order_id: str, amount: float, currency: str) -> bool:
    """Send payment confirmation email."""
    from app.database import get_db
    db = get_db()
    settings = await db.settings.find_one({"key": "site"})
    brand = (settings or {}).get("brandName", "KKHS Media")

    subject = f"{brand} - Payment Confirmation #{order_id}"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
        <h2 style="color:#6366f1;">{brand}</h2>
        <div style="background:#dcfce7;padding:15px;border-radius:8px;margin:20px 0;">
            <h3 style="color:#16a34a;margin:0;">Payment Successful!</h3>
        </div>
        <p>Order ID: <strong>{order_id}</strong></p>
        <p>Amount: <strong>{currency} {amount:.2f}</strong></p>
        <p>Your streaming slots have been activated.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
        <p style="color:#9ca3af;font-size:12px;">{brand} - 24/7 Live Streaming Platform</p>
    </div>
    """
    return await send_email(to, subject, html)
