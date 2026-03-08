"""Admin settings router for site configuration, email config, and notification settings"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.auth import get_current_user
from app.email_service import send_email, _wrap_html

router = APIRouter(prefix="/api/admin/settings", tags=["settings"])


def require_admin(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


# ===== Site Settings =====

class SiteSettingsUpdate(BaseModel):
    platform_name: Optional[str] = None
    support_email: Optional[str] = None
    commission_rate: Optional[str] = None
    currency: Optional[str] = None
    platform_description: Optional[str] = None


@router.get("/site")
def get_site_settings(user=Depends(require_admin)):
    with get_db() as conn:
        rows = conn.execute("SELECT key, value FROM site_settings").fetchall()
        return {row["key"]: row["value"] for row in rows}


@router.put("/site")
def update_site_settings(data: SiteSettingsUpdate, user=Depends(require_admin)):
    with get_db() as conn:
        updates = data.dict(exclude_none=True)
        for key, value in updates.items():
            conn.execute(
                "INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) "
                "ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP",
                (key, str(value), str(value))
            )
    return {"message": "Settings updated", "updated": list(updates.keys())}


# ===== Email Configuration =====

class EmailConfigUpdate(BaseModel):
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    sender_name: Optional[str] = None
    sender_email: Optional[str] = None
    is_enabled: Optional[bool] = None


@router.get("/email")
def get_email_config(user=Depends(require_admin)):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM email_config WHERE id = 1").fetchone()
        if not row:
            return {}
        result = dict(row)
        # Mask password
        if result.get("smtp_password"):
            result["smtp_password"] = "***" + result["smtp_password"][-4:] if len(result["smtp_password"]) > 4 else "****"
        return result


@router.put("/email")
def update_email_config(data: EmailConfigUpdate, user=Depends(require_admin)):
    with get_db() as conn:
        updates = data.dict(exclude_none=True)
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        # Build SET clause
        set_parts = []
        values = []
        for key, value in updates.items():
            if key == "is_enabled":
                value = 1 if value else 0
            set_parts.append(f"{key} = ?")
            values.append(value)
        set_parts.append("updated_at = CURRENT_TIMESTAMP")

        conn.execute(
            f"UPDATE email_config SET {', '.join(set_parts)} WHERE id = 1",
            values
        )
    return {"message": "Email config updated"}


class TestEmailRequest(BaseModel):
    to_email: str


@router.post("/email/test")
def send_test_email(data: TestEmailRequest, user=Depends(require_admin)):
    content = """
    <p style="color:#cbd5e1;">This is a test email from GuruConnect.</p>
    <p style="color:#cbd5e1;">If you received this, your email configuration is working correctly!</p>
    <div style="background:#334155;padding:16px;border-radius:8px;margin:16px 0;">
      <p style="color:#94a3b8;margin:0;">Sent from Admin Settings Panel</p>
    </div>
    """
    success = send_email(data.to_email, "GuruConnect Test Email", _wrap_html("Test Email", content))
    if success:
        return {"message": "Test email sent successfully"}
    else:
        raise HTTPException(status_code=400, detail="Failed to send test email. Check your SMTP settings.")


# ===== Notification Settings =====

@router.get("/notifications")
def get_notification_settings(user=Depends(require_admin)):
    with get_db() as conn:
        rows = conn.execute("SELECT key, is_enabled FROM email_notification_settings").fetchall()
        return {row["key"]: bool(row["is_enabled"]) for row in rows}


class NotificationSettingsUpdate(BaseModel):
    settings: dict  # {"key": bool}


@router.put("/notifications")
def update_notification_settings(data: NotificationSettingsUpdate, user=Depends(require_admin)):
    with get_db() as conn:
        for key, enabled in data.settings.items():
            conn.execute(
                "UPDATE email_notification_settings SET is_enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?",
                (1 if enabled else 0, key)
            )
    return {"message": "Notification settings updated"}
