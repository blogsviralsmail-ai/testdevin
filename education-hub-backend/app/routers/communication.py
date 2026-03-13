from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.database import get_db
from app.utils.auth import require_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/communication", tags=["Communication"])

# SMTP Config (set env vars to enable)
SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_FROM_NAME = os.environ.get("SMTP_FROM_NAME", "A Step For Future Education Hub")

# WhatsApp API Config (set env vars to enable)
WHATSAPP_API_URL = os.environ.get("WHATSAPP_API_URL", "")
WHATSAPP_API_TOKEN = os.environ.get("WHATSAPP_API_TOKEN", "")

# SMS API Config (set env vars to enable)
SMS_API_URL = os.environ.get("SMS_API_URL", "")
SMS_API_KEY = os.environ.get("SMS_API_KEY", "")
SMS_SENDER_ID = os.environ.get("SMS_SENDER_ID", "EDUHUB")


def send_email(to_email: str, subject: str, body: str, student_name: str = "") -> bool:
    """Send email via SMTP."""
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASSWORD or not to_email:
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_USER}>"
        msg["To"] = to_email
        msg["Subject"] = subject
        html_body = body.replace("{{name}}", student_name).replace("{{email}}", to_email)
        html = f'<html><body style="font-family:Arial;max-width:600px;margin:0 auto;padding:20px;"><div style="background:linear-gradient(135deg,#1e40af,#7c3aed);padding:20px;border-radius:12px 12px 0 0;text-align:center;"><h2 style="color:white;margin:0;">A Step For Future Education Hub</h2></div><div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;"><div style="color:#374151;font-size:14px;line-height:1.6;">{html_body}</div><hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/><p style="color:#9ca3af;font-size:12px;text-align:center;">A Step For Future Education Hub | asffeducationhub.com</p></div></body></html>'
        msg.attach(MIMEText(body, "plain"))
        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, to_email, msg.as_string())
        return True
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_email, str(e))
        return False


def send_whatsapp(phone: str, message: str) -> bool:
    """Send WhatsApp message via Business API."""
    if not WHATSAPP_API_URL or not WHATSAPP_API_TOKEN or not phone:
        return False
    try:
        import httpx
        if not phone.startswith("+"):
            phone = "+91" + phone.lstrip("0")
        payload = {"messaging_product": "whatsapp", "to": phone, "type": "text", "text": {"body": message}}
        headers = {"Authorization": f"Bearer {WHATSAPP_API_TOKEN}", "Content-Type": "application/json"}
        resp = httpx.post(WHATSAPP_API_URL, json=payload, headers=headers, timeout=30)
        return resp.status_code in (200, 201)
    except Exception as e:
        logger.error("Failed to send WhatsApp to %s: %s", phone, str(e))
        return False


def send_sms(phone: str, message: str) -> bool:
    """Send SMS via API."""
    if not SMS_API_URL or not SMS_API_KEY or not phone:
        return False
    try:
        import httpx
        headers = {"authkey": SMS_API_KEY, "Content-Type": "application/json"}
        payload = {"sender": SMS_SENDER_ID, "route": "4", "country": "91", "sms": [{"message": message, "to": [phone]}]}
        resp = httpx.post(SMS_API_URL, json=payload, headers=headers, timeout=30)
        return resp.status_code in (200, 201)
    except Exception as e:
        logger.error("Failed to send SMS to %s: %s", phone, str(e))
        return False


def replace_variables(text: str, student: dict) -> str:
    """Replace template variables."""
    for key, field in [("{{name}}", "name"), ("{{email}}", "email"), ("{{phone}}", "phone"), ("{{course}}", "category_name"), ("{{university}}", "university_name"), ("{{enrollment}}", "enrollment_no")]:
        text = text.replace(key, student.get(field, "") or "")
    return text


@router.get("/templates")
async def list_templates(channel: Optional[str] = None, user: dict = Depends(require_admin)):
    conn = get_db()
    query = "SELECT * FROM message_templates WHERE 1=1"
    params = []
    if channel:
        query += " AND channel = ?"
        params.append(channel)
    query += " ORDER BY created_at DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/templates")
async def create_template(data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO message_templates (name, channel, subject, body, variables) VALUES (?, ?, ?, ?, ?)",
        (data.get("name",""), data.get("channel","email"), data.get("subject",""), data.get("body",""), data.get("variables",""))
    )
    conn.commit()
    tid = cursor.lastrowid
    conn.close()
    return {"id": tid, "message": "Template created"}

@router.put("/templates/{tid}")
async def update_template(tid: int, data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute(
        "UPDATE message_templates SET name=?, channel=?, subject=?, body=?, variables=? WHERE id=?",
        (data.get("name",""), data.get("channel","email"), data.get("subject",""), data.get("body",""), data.get("variables",""), tid)
    )
    conn.commit()
    conn.close()
    return {"message": "Template updated"}

@router.delete("/templates/{tid}")
async def delete_template(tid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("DELETE FROM message_templates WHERE id = ?", (tid,))
    conn.commit()
    conn.close()
    return {"message": "Template deleted"}

@router.get("/campaigns")
async def list_campaigns(user: dict = Depends(require_admin)):
    conn = get_db()
    rows = conn.execute("SELECT * FROM campaigns ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/campaigns")
async def create_campaign(data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO campaigns (name, channel, template_id, target_audience, filters, status, scheduled_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (data.get("name",""), data.get("channel","email"), data.get("template_id"), data.get("target_audience","all_students"),
         data.get("filters",""), data.get("status","draft"), data.get("scheduled_at"))
    )
    conn.commit()
    cid = cursor.lastrowid
    conn.close()
    return {"id": cid, "message": "Campaign created"}

@router.put("/campaigns/{cid}")
async def update_campaign(cid: int, data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute(
        "UPDATE campaigns SET name=?, channel=?, template_id=?, target_audience=?, filters=?, status=?, scheduled_at=? WHERE id=?",
        (data.get("name",""), data.get("channel","email"), data.get("template_id"), data.get("target_audience","all_students"),
         data.get("filters",""), data.get("status","draft"), data.get("scheduled_at"), cid)
    )
    conn.commit()
    conn.close()
    return {"message": "Campaign updated"}

@router.delete("/campaigns/{cid}")
async def delete_campaign(cid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("DELETE FROM campaigns WHERE id = ?", (cid,))
    conn.commit()
    conn.close()
    return {"message": "Campaign deleted"}

@router.post("/campaigns/{cid}/send")
async def send_campaign(cid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    campaign = conn.execute("SELECT * FROM campaigns WHERE id = ?", (cid,)).fetchone()
    if not campaign:
        conn.close()
        raise HTTPException(status_code=404, detail="Campaign not found")
    channel = campaign["channel"]
    audience = campaign["target_audience"]
    sq = "SELECT s.id, s.name, s.email, s.phone, s.enrollment_no, c.name as category_name, u.name as university_name FROM students s LEFT JOIN categories c ON s.category_id = c.id LEFT JOIN universities u ON s.university_id = u.id"
    if audience == "pending_students":
        sq += " WHERE s.status='pending'"
    else:
        sq += " WHERE s.status='active'"
    students = conn.execute(sq).fetchall()
    template = None
    if campaign["template_id"]:
        template = conn.execute("SELECT * FROM message_templates WHERE id=?", (campaign["template_id"],)).fetchone()
    email_sent = 0
    sms_sent = 0
    whatsapp_sent = 0
    for s in students:
        sd = dict(s)
        title = template["subject"] if template else campaign["name"]
        body = template["body"] if template else campaign["name"]
        title = replace_variables(title, sd)
        body = replace_variables(body, sd)
        if channel == "email":
            if send_email(sd.get("email", ""), title, body, sd.get("name", "")):
                email_sent += 1
        elif channel == "whatsapp":
            if send_whatsapp(sd.get("phone", ""), body):
                whatsapp_sent += 1
        elif channel == "sms":
            if send_sms(sd.get("phone", ""), body):
                sms_sent += 1
        conn.execute("INSERT INTO notifications (user_id, title, message, type) VALUES ((SELECT user_id FROM students WHERE id=?), ?, ?, 'campaign')", (s["id"], title, body))
    total = len(students)
    conn.execute("UPDATE campaigns SET status='sent', sent_count=?, sent_at=CURRENT_TIMESTAMP WHERE id=?", (total, cid))
    conn.commit()
    conn.close()
    details = []
    if channel == "email":
        details.append(f"{email_sent} emails sent" if SMTP_HOST else "SMTP not configured - notifications saved")
    elif channel == "whatsapp":
        details.append(f"{whatsapp_sent} WhatsApp sent" if WHATSAPP_API_URL else "WhatsApp not configured - notifications saved")
    elif channel == "sms":
        details.append(f"{sms_sent} SMS sent" if SMS_API_URL else "SMS not configured - notifications saved")
    msg = f"Campaign sent to {total} students"
    if details:
        msg += f" ({', '.join(details)})"
    return {"message": msg, "sent_count": total, "email_sent": email_sent, "sms_sent": sms_sent, "whatsapp_sent": whatsapp_sent}

@router.get("/notifications")
async def list_notifications(user: dict = Depends(require_admin)):
    conn = get_db()
    rows = conn.execute("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.delete("/templates/bulk")
async def bulk_delete_templates(data: dict, user: dict = Depends(require_admin)):
    ids = data.get("ids", [])
    if not ids:
        return {"message": "No templates selected"}
    conn = get_db()
    placeholders = ",".join(["?"] * len(ids))
    conn.execute(f"DELETE FROM message_templates WHERE id IN ({placeholders})", ids)
    conn.commit()
    conn.close()
    return {"message": f"{len(ids)} templates deleted"}

@router.delete("/campaigns/bulk")
async def bulk_delete_campaigns(data: dict, user: dict = Depends(require_admin)):
    ids = data.get("ids", [])
    if not ids:
        return {"message": "No campaigns selected"}
    conn = get_db()
    placeholders = ",".join(["?"] * len(ids))
    conn.execute(f"DELETE FROM campaigns WHERE id IN ({placeholders})", ids)
    conn.commit()
    conn.close()
    return {"message": f"{len(ids)} campaigns deleted"}

@router.get("/stats")
async def communication_stats(user: dict = Depends(require_admin)):
    conn = get_db()
    total_campaigns = conn.execute("SELECT COUNT(*) FROM campaigns").fetchone()[0]
    sent_campaigns = conn.execute("SELECT COUNT(*) FROM campaigns WHERE status='sent'").fetchone()[0]
    total_templates = conn.execute("SELECT COUNT(*) FROM message_templates").fetchone()[0]
    total_sent = conn.execute("SELECT COALESCE(SUM(sent_count),0) FROM campaigns WHERE status='sent'").fetchone()[0]
    conn.close()
    return {"total_campaigns": total_campaigns, "sent_campaigns": sent_campaigns, "total_templates": total_templates, "total_sent": total_sent,
        "email_configured": bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD), "whatsapp_configured": bool(WHATSAPP_API_URL and WHATSAPP_API_TOKEN), "sms_configured": bool(SMS_API_URL and SMS_API_KEY)}

@router.post("/test-email")
async def test_email(data: dict, user: dict = Depends(require_admin)):
    to_email = data.get("email", "")
    if not to_email:
        raise HTTPException(status_code=400, detail="Email address required")
    if not SMTP_HOST or not SMTP_USER:
        return {"success": False, "message": "SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD env vars."}
    success = send_email(to_email, "Test Email - ASFF Education Hub", "This is a test email. If you received this, email is working!", "Admin")
    return {"success": success, "message": "Test email sent!" if success else "Failed. Check SMTP config."}

@router.get("/config-status")
async def config_status(user: dict = Depends(require_admin)):
    return {
        "email": {"configured": bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD), "host": SMTP_HOST or "Not configured"},
        "whatsapp": {"configured": bool(WHATSAPP_API_URL and WHATSAPP_API_TOKEN)},
        "sms": {"configured": bool(SMS_API_URL and SMS_API_KEY)}
    }
