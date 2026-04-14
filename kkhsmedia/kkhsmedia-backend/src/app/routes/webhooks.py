"""Webhook notifications system - send HTTP callbacks on stream events."""
import ipaddress
import logging
import socket
from datetime import datetime
from typing import Optional
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from bson import ObjectId

from app.database import get_db
from app.utils.auth import get_current_user, get_admin_user, serialize_doc, serialize_docs

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])


class CreateWebhookRequest(BaseModel):
    url: str
    events: list = ["stream.started", "stream.stopped", "stream.error", "stream.restarted"]
    secret: str = ""
    isActive: bool = True


class UpdateWebhookRequest(BaseModel):
    url: Optional[str] = None
    events: Optional[list] = None
    secret: Optional[str] = None
    isActive: Optional[bool] = None


@router.get("")
async def get_webhooks(user=Depends(get_current_user)):
    db = get_db()
    hooks = await db.webhooks.find({"userId": user["id"]}).sort("createdAt", -1).to_list(50)
    return serialize_docs(hooks)


def _validate_webhook_url(url: str) -> None:
    """Reject webhook URLs targeting private/internal networks (SSRF protection)."""
    parsed = urlparse(url)
    if parsed.scheme not in ("https", "http"):
        raise HTTPException(status_code=400, detail="Webhook URL must use http or https")
    hostname = parsed.hostname
    if not hostname:
        raise HTTPException(status_code=400, detail="Invalid webhook URL")
    try:
        resolved = socket.getaddrinfo(hostname, None)
        for _family, _type, _proto, _canonname, sockaddr in resolved:
            ip = ipaddress.ip_address(sockaddr[0])
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                raise HTTPException(
                    status_code=400,
                    detail="Webhook URL must not target private or internal networks",
                )
    except socket.gaierror:
        raise HTTPException(status_code=400, detail="Cannot resolve webhook URL hostname")


@router.post("")
async def create_webhook(req: CreateWebhookRequest, user=Depends(get_current_user)):
    _validate_webhook_url(req.url)
    db = get_db()
    count = await db.webhooks.count_documents({"userId": user["id"]})
    if count >= 10:
        raise HTTPException(status_code=400, detail="Maximum 10 webhooks allowed")

    hook = {
        "userId": user["id"],
        "url": req.url,
        "events": req.events,
        "secret": req.secret,
        "isActive": req.isActive,
        "failCount": 0,
        "lastTriggered": None,
        "createdAt": datetime.utcnow(),
    }
    result = await db.webhooks.insert_one(hook)
    hook["id"] = str(result.inserted_id)
    return serialize_doc(hook)


@router.put("/{webhook_id}")
async def update_webhook(webhook_id: str, req: UpdateWebhookRequest, user=Depends(get_current_user)):
    db = get_db()
    update = {}
    for field, value in req.model_dump(exclude_none=True).items():
        update[field] = value
    if "url" in update:
        _validate_webhook_url(update["url"])
    if update:
        await db.webhooks.update_one(
            {"_id": ObjectId(webhook_id), "userId": user["id"]},
            {"$set": update}
        )
    hook = await db.webhooks.find_one({"_id": ObjectId(webhook_id), "userId": user["id"]})
    if not hook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    return serialize_doc(hook)


@router.delete("/{webhook_id}")
async def delete_webhook(webhook_id: str, user=Depends(get_current_user)):
    db = get_db()
    await db.webhooks.delete_one({"_id": ObjectId(webhook_id), "userId": user["id"]})
    return {"message": "Webhook deleted"}


@router.get("/logs")
async def get_webhook_logs(page: int = 1, limit: int = 50, user=Depends(get_current_user)):
    """Get webhook delivery logs."""
    db = get_db()
    total = await db.webhook_logs.count_documents({"userId": user["id"]})
    skip = (page - 1) * limit
    logs = await db.webhook_logs.find(
        {"userId": user["id"]}
    ).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    return {"logs": serialize_docs(logs), "total": total, "page": page}


# ============ TRIGGER FUNCTION ============

async def trigger_webhooks(user_id: str, event: str, payload: dict):
    """Send webhook notifications for a stream event."""
    import httpx
    import hashlib
    import hmac
    import json

    try:
        db = get_db()
        hooks = await db.webhooks.find({
            "userId": user_id,
            "isActive": True,
            "events": event,
        }).to_list(50)

        for hook in hooks:
            try:
                body = json.dumps({"event": event, "data": payload, "timestamp": datetime.utcnow().isoformat()})

                headers = {"Content-Type": "application/json"}
                if hook.get("secret"):
                    sig = hmac.new(hook["secret"].encode(), body.encode(), hashlib.sha256).hexdigest()
                    headers["X-Webhook-Signature"] = sig

                async with httpx.AsyncClient() as client:
                    resp = await client.post(hook["url"], content=body, headers=headers, timeout=10)

                await db.webhook_logs.insert_one({
                    "userId": user_id,
                    "webhookId": str(hook["_id"]),
                    "event": event,
                    "url": hook["url"],
                    "statusCode": resp.status_code,
                    "success": 200 <= resp.status_code < 300,
                    "createdAt": datetime.utcnow(),
                })

                if resp.status_code >= 400:
                    await db.webhooks.update_one(
                        {"_id": hook["_id"]},
                        {"$inc": {"failCount": 1}, "$set": {"lastTriggered": datetime.utcnow()}}
                    )
                else:
                    await db.webhooks.update_one(
                        {"_id": hook["_id"]},
                        {"$set": {"failCount": 0, "lastTriggered": datetime.utcnow()}}
                    )
            except Exception as e:
                logger.error(f"Webhook delivery failed for {hook.get('url')}: {e}")
                await db.webhook_logs.insert_one({
                    "userId": user_id,
                    "webhookId": str(hook["_id"]),
                    "event": event,
                    "url": hook["url"],
                    "statusCode": 0,
                    "success": False,
                    "error": str(e),
                    "createdAt": datetime.utcnow(),
                })
    except Exception as e:
        logger.error(f"Webhook trigger error: {e}")
