"""
Unified notification utility - sends Telegram + Email notifications for all events.
"""
import os
import smtplib
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

try:
    import requests
except ImportError:
    requests = None


def _get_notification_settings(conn) -> dict:
    """Get notification settings from DB."""
    rows = conn.execute(
        "SELECT key, value FROM settings WHERE key LIKE 'telegram_%' OR key LIKE 'email_%' OR key LIKE 'notify_%' OR key LIKE 'notification_%' OR key IN ('site_url','company_name','smtp_host','smtp_port','smtp_user','smtp_password','smtp_from_name')"
    ).fetchall()
    return {r["key"]: r["value"] for r in rows}


def _send_telegram(token: str, chat_ids: str, message: str):
    """Send a Telegram message to multiple chat IDs (comma-separated)."""
    if not token or not chat_ids or not requests:
        return
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    # Support multiple comma-separated chat IDs
    ids = [cid.strip() for cid in chat_ids.split(",") if cid.strip()]
    for cid in ids:
        try:
            requests.post(url, json={
                "chat_id": cid,
                "text": message,
                "parse_mode": "HTML",
                "disable_web_page_preview": True,
            }, timeout=10)
        except Exception as e:
            print(f"[Telegram] Error sending to {cid}: {e}")


def _send_email_notification(to_email: str, subject: str, body_html: str, smtp_host: str = "smtp.gmail.com", smtp_port: int = 587, from_email: str = "", from_password: str = ""):
    """Send email notification."""
    if not to_email or not from_email or not from_password:
        return
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_email
        msg["To"] = to_email
        msg.attach(MIMEText(body_html, "html"))
        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            server.starttls()
            server.login(from_email, from_password)
            server.sendmail(from_email, to_email, msg.as_string())
    except Exception as e:
        print(f"[Email] Error: {e}")


# Map event_type -> settings key for notify flag
EVENT_KEY_MAP = {
    "payment": "notify_payment",
    "enquiry": "notify_enquiry",
    "lead": "notify_lead",
    "student": "notify_student",
    "document": "notify_document",
    "career": "notify_career",
    "support": "notify_support",
    "notice": "notify_notice",
    "blog": "notify_blog",
    "placement": "notify_placement",
    "testimonial": "notify_testimonial",
    "general": "notify_general",
}


def send_notification(conn, event_type: str, title: str, message: str, link_path: str = ""):
    """
    Send notification to admin via Telegram and Email.
    Checks enabled flags before sending. Runs in background thread.
    
    Args:
        conn: DB connection (used to read settings)
        event_type: e.g. 'payment', 'enquiry', 'lead', 'student', 'document', 'career', 'support', etc.
        title: Notification title
        message: Notification body text
        link_path: Relative path for direct link, e.g. '/admin/accounts'
    """
    settings = _get_notification_settings(conn)
    
    # Check if this event type is enabled (default to true if not set)
    event_key = EVENT_KEY_MAP.get(event_type, f"notify_{event_type}")
    event_enabled = settings.get(event_key, "true")
    if event_enabled == "false":
        print(f"[Notification] Event '{event_type}' is disabled, skipping.")
        return
    
    # Check Telegram enabled
    telegram_enabled = settings.get("telegram_enabled", "true")
    telegram_token = settings.get("telegram_bot_token", "")
    telegram_chat_id = settings.get("telegram_chat_id", "")
    
    # Check Email enabled
    email_enabled = settings.get("email_enabled", "true")
    notif_email = settings.get("notification_email", "")
    notif_email_pass = settings.get("notification_email_password", "")
    # Try multiple possible SMTP setting keys
    smtp_host = settings.get("notification_email_smtp", "") or settings.get("smtp_host", "smtp.gmail.com")
    smtp_port_str = settings.get("notification_email_port", "") or settings.get("smtp_port", "587")
    smtp_port = int(smtp_port_str or "587")
    # Also try smtp_user/smtp_password as fallback
    if not notif_email:
        notif_email = settings.get("smtp_user", "")
    if not notif_email_pass:
        notif_email_pass = settings.get("smtp_password", "")
    
    site_url = settings.get("site_url", "https://asffeducationhub.com")
    company_name = settings.get("company_name", "ASFF Education Hub")
    
    now = datetime.now().strftime("%d-%b-%Y %I:%M %p")
    full_link = f"{site_url}{link_path}" if link_path else ""
    
    # Build Telegram message
    emoji_map = {
        "payment": "\U0001F4B0",
        "enquiry": "\U0001F4E9",
        "lead": "\U0001F464",
        "student": "\U0001F393",
        "document": "\U0001F4C4",
        "career": "\U0001F4BC",
        "support": "\U0001F6A8",
        "general": "\U0001F514",
    }
    emoji = emoji_map.get(event_type, "\U0001F514")
    
    tg_msg = f"{emoji} <b>{title}</b>\n\n{message}\n\n\U0001F552 {now}"
    if full_link:
        tg_msg += f"\n\U0001F517 <a href=\"{full_link}\">Open in Dashboard</a>"
    
    # Build Email HTML
    email_html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:20px;text-align:center;">
            <h2 style="color:white;margin:0;">{company_name}</h2>
        </div>
        <div style="padding:24px;">
            <h3 style="color:#1e3a5f;margin-top:0;">{emoji} {title}</h3>
            <p style="color:#374151;line-height:1.6;white-space:pre-line;">{message}</p>
            <p style="color:#6b7280;font-size:13px;">\U0001F552 {now}</p>
            {"<a href='" + full_link + "' style='display:inline-block;background:#2563eb;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px;'>Open in Dashboard</a>" if full_link else ""}
        </div>
        <div style="background:#f9fafb;padding:12px;text-align:center;font-size:12px;color:#9ca3af;">
            {company_name} - Automated Notification
        </div>
    </div>
    """
    
    # Send in background thread
    def _do_send():
        if telegram_enabled != "false" and telegram_token and telegram_chat_id:
            print(f"[Notification] Sending Telegram for '{event_type}' to {telegram_chat_id}")
            _send_telegram(telegram_token, telegram_chat_id, tg_msg)
        else:
            print(f"[Notification] Telegram skipped: enabled={telegram_enabled}, token={'yes' if telegram_token else 'no'}, chat_id={'yes' if telegram_chat_id else 'no'}")
        if email_enabled != "false" and notif_email and notif_email_pass:
            print(f"[Notification] Sending Email for '{event_type}' to {notif_email}")
            _send_email_notification(
                to_email=notif_email,
                subject=f"[{company_name}] {title}",
                body_html=email_html,
                smtp_host=smtp_host,
                smtp_port=smtp_port,
                from_email=notif_email,
                from_password=notif_email_pass,
            )
        else:
            print(f"[Notification] Email skipped: enabled={email_enabled}, email={'yes' if notif_email else 'no'}, pass={'yes' if notif_email_pass else 'no'}")
    
    thread = threading.Thread(target=_do_send, daemon=True)
    thread.start()
