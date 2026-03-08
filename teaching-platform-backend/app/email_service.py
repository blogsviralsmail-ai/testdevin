"""Email notification service for GuruConnect platform"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.database import get_db

logger = logging.getLogger(__name__)


def get_email_config():
    """Get email configuration from database"""
    with get_db() as conn:
        row = conn.execute("SELECT * FROM email_config WHERE id = 1").fetchone()
        if not row:
            return None
        return dict(row)


def is_notification_enabled(key: str) -> bool:
    """Check if a specific notification type is enabled"""
    with get_db() as conn:
        row = conn.execute(
            "SELECT is_enabled FROM email_notification_settings WHERE key = ?", (key,)
        ).fetchone()
        return bool(row and row["is_enabled"])


def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """Send an email using configured SMTP settings"""
    config = get_email_config()
    if not config or not config["is_enabled"]:
        logger.info(f"Email not sent (disabled): {subject} -> {to_email}")
        return False

    if not config["smtp_host"] or not config["smtp_username"]:
        logger.warning("SMTP not configured, skipping email")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{config['sender_name']} <{config['sender_email']}>"
        msg["To"] = to_email

        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(config["smtp_host"], config["smtp_port"]) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(config["smtp_username"], config["smtp_password"])
            server.send_message(msg)

        logger.info(f"Email sent: {subject} -> {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False


def _wrap_html(title: str, content: str) -> str:
    """Wrap content in a styled HTML email template"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#10b981,#14b8a6);padding:24px;border-radius:16px 16px 0 0;text-align:center;">
          <h1 style="color:white;margin:0;font-size:24px;">GuruConnect</h1>
          <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:14px;">India's Premier Teaching Platform</p>
        </div>
        <div style="background:#1e293b;padding:32px;border-radius:0 0 16px 16px;color:#e2e8f0;">
          <h2 style="color:#10b981;margin:0 0 16px;font-size:20px;">{title}</h2>
          {content}
          <hr style="border:none;border-top:1px solid #334155;margin:24px 0;">
          <p style="color:#64748b;font-size:12px;text-align:center;">
            This is an automated notification from GuruConnect.<br>
            Please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
    """


# ===== Notification Functions =====

def notify_student_registration(email: str, name: str):
    """Send welcome email to new student"""
    if not is_notification_enabled("new_student_registration"):
        return
    content = f"""
    <p style="color:#cbd5e1;">Hi <strong>{name}</strong>,</p>
    <p style="color:#cbd5e1;">Welcome to GuruConnect! Your student account has been created successfully.</p>
    <p style="color:#cbd5e1;">You can now search for expert teachers, book classes, and start learning!</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="#" style="background:linear-gradient(135deg,#10b981,#14b8a6);color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">Start Learning</a>
    </div>
    """
    send_email(email, "Welcome to GuruConnect!", _wrap_html("Welcome, " + name + "!", content))


def notify_teacher_registration(email: str, name: str):
    """Send welcome email to new teacher"""
    if not is_notification_enabled("new_teacher_registration"):
        return
    content = f"""
    <p style="color:#cbd5e1;">Hi <strong>{name}</strong>,</p>
    <p style="color:#cbd5e1;">Welcome to GuruConnect! Your teacher account has been created.</p>
    <p style="color:#cbd5e1;">Your profile is pending approval by our admin team. You'll be notified once approved.</p>
    """
    send_email(email, "Welcome to GuruConnect - Teacher Registration", _wrap_html("Welcome, " + name + "!", content))


def notify_teacher_approval(email: str, name: str):
    """Notify teacher when their profile is approved"""
    if not is_notification_enabled("teacher_approval"):
        return
    content = f"""
    <p style="color:#cbd5e1;">Hi <strong>{name}</strong>,</p>
    <p style="color:#cbd5e1;">Great news! Your teacher profile has been <strong style="color:#10b981;">approved</strong> by our admin team.</p>
    <p style="color:#cbd5e1;">Students can now find and book classes with you. Set up your availability to start teaching!</p>
    """
    send_email(email, "Your Teacher Profile is Approved!", _wrap_html("Profile Approved!", content))


def notify_new_booking(student_email: str, student_name: str, teacher_email: str, teacher_name: str, class_title: str, scheduled_at: str):
    """Notify both student and teacher about new booking"""
    if not is_notification_enabled("new_booking"):
        return
    # Student email
    student_content = f"""
    <p style="color:#cbd5e1;">Hi <strong>{student_name}</strong>,</p>
    <p style="color:#cbd5e1;">Your class booking has been confirmed!</p>
    <div style="background:#334155;padding:16px;border-radius:8px;margin:16px 0;">
      <p style="color:#94a3b8;margin:0;"><strong style="color:white;">Class:</strong> {class_title}</p>
      <p style="color:#94a3b8;margin:8px 0 0;"><strong style="color:white;">Teacher:</strong> {teacher_name}</p>
      <p style="color:#94a3b8;margin:8px 0 0;"><strong style="color:white;">Scheduled:</strong> {scheduled_at}</p>
    </div>
    """
    send_email(student_email, f"Booking Confirmed: {class_title}", _wrap_html("Booking Confirmed!", student_content))

    # Teacher email
    teacher_content = f"""
    <p style="color:#cbd5e1;">Hi <strong>{teacher_name}</strong>,</p>
    <p style="color:#cbd5e1;">You have a new class booking!</p>
    <div style="background:#334155;padding:16px;border-radius:8px;margin:16px 0;">
      <p style="color:#94a3b8;margin:0;"><strong style="color:white;">Class:</strong> {class_title}</p>
      <p style="color:#94a3b8;margin:8px 0 0;"><strong style="color:white;">Student:</strong> {student_name}</p>
      <p style="color:#94a3b8;margin:8px 0 0;"><strong style="color:white;">Scheduled:</strong> {scheduled_at}</p>
    </div>
    """
    send_email(teacher_email, f"New Booking: {class_title}", _wrap_html("New Booking!", teacher_content))


def notify_payment_received(email: str, name: str, amount: float, class_title: str):
    """Notify student when payment is confirmed in escrow"""
    if not is_notification_enabled("payment_received"):
        return
    content = f"""
    <p style="color:#cbd5e1;">Hi <strong>{name}</strong>,</p>
    <p style="color:#cbd5e1;">Your payment of <strong style="color:#10b981;">Rs {amount}</strong> for <strong>{class_title}</strong> has been received and is held securely in escrow.</p>
    <p style="color:#cbd5e1;">The payment will be released to the teacher after class completion.</p>
    """
    send_email(email, f"Payment Received: Rs {amount}", _wrap_html("Payment Confirmed", content))


def notify_payment_released(email: str, name: str, amount: float):
    """Notify teacher when payment is released from escrow"""
    if not is_notification_enabled("payment_released"):
        return
    content = f"""
    <p style="color:#cbd5e1;">Hi <strong>{name}</strong>,</p>
    <p style="color:#cbd5e1;">A payment of <strong style="color:#10b981;">Rs {amount}</strong> has been released from escrow to your account.</p>
    """
    send_email(email, f"Payment Released: Rs {amount}", _wrap_html("Payment Released!", content))


def notify_payment_refunded(email: str, name: str, amount: float):
    """Notify student when payment is refunded"""
    if not is_notification_enabled("payment_refunded"):
        return
    content = f"""
    <p style="color:#cbd5e1;">Hi <strong>{name}</strong>,</p>
    <p style="color:#cbd5e1;">A refund of <strong style="color:#10b981;">Rs {amount}</strong> has been processed to your account.</p>
    """
    send_email(email, f"Refund Processed: Rs {amount}", _wrap_html("Refund Processed", content))


def notify_class_completed(student_email: str, student_name: str, teacher_email: str, teacher_name: str, class_title: str):
    """Notify both parties when class is marked complete"""
    if not is_notification_enabled("class_completed"):
        return
    student_content = f"""
    <p style="color:#cbd5e1;">Hi <strong>{student_name}</strong>,</p>
    <p style="color:#cbd5e1;">Your class <strong>{class_title}</strong> with {teacher_name} has been marked as completed.</p>
    <p style="color:#cbd5e1;">Please leave a review for your teacher!</p>
    """
    send_email(student_email, f"Class Completed: {class_title}", _wrap_html("Class Completed!", student_content))

    teacher_content = f"""
    <p style="color:#cbd5e1;">Hi <strong>{teacher_name}</strong>,</p>
    <p style="color:#cbd5e1;">Your class <strong>{class_title}</strong> has been marked as completed. Payment will be released shortly.</p>
    """
    send_email(teacher_email, f"Class Completed: {class_title}", _wrap_html("Class Completed!", teacher_content))


def notify_support_ticket_update(email: str, name: str, ticket_subject: str, new_status: str):
    """Notify user when their support ticket is updated"""
    if not is_notification_enabled("support_ticket_update"):
        return
    content = f"""
    <p style="color:#cbd5e1;">Hi <strong>{name}</strong>,</p>
    <p style="color:#cbd5e1;">Your support ticket "<strong>{ticket_subject}</strong>" has been updated to: <strong style="color:#10b981;">{new_status}</strong></p>
    """
    send_email(email, f"Ticket Update: {ticket_subject}", _wrap_html("Support Ticket Update", content))


def notify_payout_processed(email: str, name: str, amount: float, method: str, reference: str):
    """Notify teacher when bank payout is processed"""
    if not is_notification_enabled("payout_processed"):
        return
    content = f"""
    <p style="color:#cbd5e1;">Hi <strong>{name}</strong>,</p>
    <p style="color:#cbd5e1;">Your payout of <strong style="color:#10b981;">Rs {amount}</strong> has been processed!</p>
    <div style="background:#334155;padding:16px;border-radius:8px;margin:16px 0;">
      <p style="color:#94a3b8;margin:0;"><strong style="color:white;">Method:</strong> {method}</p>
      <p style="color:#94a3b8;margin:8px 0 0;"><strong style="color:white;">Reference:</strong> {reference}</p>
    </div>
    """
    send_email(email, f"Payout Processed: Rs {amount}", _wrap_html("Payout Processed!", content))
