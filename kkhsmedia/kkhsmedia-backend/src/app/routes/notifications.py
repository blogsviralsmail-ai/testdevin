"""WhatsApp, Telegram, and notification management."""
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from bson import ObjectId

from app.database import get_db
from app.utils.auth import get_current_user, get_admin_user, serialize_doc, serialize_docs

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


class NotificationSettingsRequest(BaseModel):
    whatsappEnabled: bool = False
    whatsappNumber: str = ""
    telegramEnabled: bool = False
    telegramChatId: str = ""
    emailNotifications: bool = True
    streamStartNotify: bool = True
    streamStopNotify: bool = True
    streamErrorNotify: bool = True
    paymentNotify: bool = True
    expiryNotify: bool = True


# ============ USER NOTIFICATION SETTINGS ============

@router.get("/settings")
async def get_notification_settings(user=Depends(get_current_user)):
    db = get_db()
    settings = await db.notification_settings.find_one({"userId": user["id"]})
    if not settings:
        return {
            "whatsappEnabled": False, "whatsappNumber": "",
            "telegramEnabled": False, "telegramChatId": "",
            "emailNotifications": True,
            "streamStartNotify": True, "streamStopNotify": True,
            "streamErrorNotify": True, "paymentNotify": True,
            "expiryNotify": True,
        }
    return serialize_doc(settings)


@router.put("/settings")
async def update_notification_settings(req: NotificationSettingsRequest, user=Depends(get_current_user)):
    db = get_db()
    data = req.model_dump()
    data["userId"] = user["id"]
    data["updatedAt"] = datetime.utcnow()

    await db.notification_settings.update_one(
        {"userId": user["id"]},
        {"$set": data},
        upsert=True,
    )
    return {"message": "Notification settings updated"}


# ============ NOTIFICATION HISTORY ============

@router.get("/history")
async def get_notification_history(page: int = 1, limit: int = 50, user=Depends(get_current_user)):
    db = get_db()
    total = await db.notifications.count_documents({"userId": user["id"]})
    skip = (page - 1) * limit
    notifications = await db.notifications.find(
        {"userId": user["id"]}
    ).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    return {"notifications": serialize_docs(notifications), "total": total, "page": page}


@router.put("/read/{notification_id}")
async def mark_read(notification_id: str, user=Depends(get_current_user)):
    db = get_db()
    await db.notifications.update_one(
        {"_id": ObjectId(notification_id), "userId": user["id"]},
        {"$set": {"read": True}}
    )
    return {"message": "Marked as read"}


@router.put("/read-all")
async def mark_all_read(user=Depends(get_current_user)):
    db = get_db()
    await db.notifications.update_many(
        {"userId": user["id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "All marked as read"}


@router.get("/unread-count")
async def unread_count(user=Depends(get_current_user)):
    db = get_db()
    count = await db.notifications.count_documents({"userId": user["id"], "read": False})
    return {"count": count}


# ============ ADMIN: Telegram Bot Settings ============

@router.get("/admin/telegram-config")
async def admin_get_telegram_config(admin=Depends(get_admin_user)):
    db = get_db()
    config = await db.settings.find_one({"key": "telegram"})
    if not config:
        return {"botToken": "", "configured": False}
    return {"botToken": config.get("botToken", ""), "configured": bool(config.get("botToken"))}


@router.put("/admin/telegram-config")
async def admin_update_telegram_config(botToken: str = "", admin=Depends(get_admin_user)):
    db = get_db()
    await db.settings.update_one(
        {"key": "telegram"},
        {"$set": {"botToken": botToken, "updatedAt": datetime.utcnow()}},
        upsert=True,
    )
    return {"message": "Telegram bot configured"}


@router.get("/admin/whatsapp-config")
async def admin_get_whatsapp_config(admin=Depends(get_admin_user)):
    db = get_db()
    config = await db.settings.find_one({"key": "whatsapp"})
    if not config:
        return {"apiKey": "", "phoneId": "", "configured": False}
    return {
        "apiKey": config.get("apiKey", ""),
        "phoneId": config.get("phoneId", ""),
        "configured": bool(config.get("apiKey") and config.get("phoneId")),
    }


@router.put("/admin/whatsapp-config")
async def admin_update_whatsapp_config(apiKey: str = "", phoneId: str = "", admin=Depends(get_admin_user)):
    db = get_db()
    await db.settings.update_one(
        {"key": "whatsapp"},
        {"$set": {"apiKey": apiKey, "phoneId": phoneId, "updatedAt": datetime.utcnow()}},
        upsert=True,
    )
    return {"message": "WhatsApp API configured"}


# ============ SEND FUNCTIONS ============

async def send_notification(user_id: str, title: str, message: str, notification_type: str = "info"):
    """Store notification and send via configured channels."""
    try:
        db = get_db()

        # Store in-app notification
        await db.notifications.insert_one({
            "userId": user_id,
            "title": title,
            "message": message,
            "type": notification_type,
            "read": False,
            "createdAt": datetime.utcnow(),
        })

        # Get user notification settings
        settings = await db.notification_settings.find_one({"userId": user_id})
        if not settings:
            return

        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return

        # Send email
        if settings.get("emailNotifications", True):
            from app.services.email import send_email
            await send_email(user["email"], title, f"<p>{message}</p>")

        # Send Telegram
        if settings.get("telegramEnabled") and settings.get("telegramChatId"):
            await _send_telegram(settings["telegramChatId"], f"*{title}*\n{message}")

        # Send WhatsApp
        if settings.get("whatsappEnabled") and settings.get("whatsappNumber"):
            await _send_whatsapp(settings["whatsappNumber"], f"{title}\n{message}")

    except Exception as e:
        logger.error(f"Notification error for user {user_id}: {e}")


async def _send_telegram(chat_id: str, text: str):
    """Send Telegram message via bot."""
    try:
        from app.database import get_db
        db = get_db()
        config = await db.settings.find_one({"key": "telegram"})
        if not config or not config.get("botToken"):
            return

        import httpx
        async with httpx.AsyncClient() as client:
            await client.post(
                f"https://api.telegram.org/bot{config['botToken']}/sendMessage",
                json={"chat_id": chat_id, "text": text, "parse_mode": "Markdown"},
                timeout=10,
            )
    except Exception as e:
        logger.error(f"Telegram send error: {e}")


async def _send_whatsapp(number: str, text: str):
    """Send WhatsApp message via API (supports multiple providers)."""
    try:
        from app.database import get_db
        db = get_db()
        config = await db.settings.find_one({"key": "whatsapp"})
        if not config or not config.get("apiKey"):
            return

        phone_id = config.get("phoneId", "")
        if not phone_id:
            return

        import httpx
        # Using WhatsApp Business API format
        async with httpx.AsyncClient() as client:
            await client.post(
                f"https://graph.facebook.com/v18.0/{phone_id}/messages",
                headers={"Authorization": f"Bearer {config['apiKey']}", "Content-Type": "application/json"},
                json={
                    "messaging_product": "whatsapp",
                    "to": number,
                    "type": "text",
                    "text": {"body": text},
                },
                timeout=10,
            )
    except Exception as e:
        logger.error(f"WhatsApp send error: {e}")
