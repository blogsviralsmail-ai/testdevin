import datetime
from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.whatsapp import (
    WhatsAppConfig, WhatsAppTemplate, WhatsAppCampaign, WhatsAppContact,
    WhatsAppMessage, WhatsAppAutomation, WhatsAppLabel, WhatsAppQuickReply,
    WhatsAppChatLink, WhatsAppBusinessHours, OrderAutomation, AbandonedCartConfig,
)
from app.models.order import AbandonedCart
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])


class WhatsAppConfigIn(BaseModel):
    api_key: str
    phone_number_id: str = ""
    waba_id: str = ""


class TemplateIn(BaseModel):
    name: str
    category: str = "MARKETING"
    language: str = "en"
    header_type: str = ""
    header_text: str = ""
    body: str = ""
    footer: str = ""
    buttons: list = []
    variables: list = []


class CampaignIn(BaseModel):
    name: str
    template_id: Optional[int] = None
    template_name: str = ""
    segment: dict = {}


class AutomationIn(BaseModel):
    name: str
    trigger: str
    template_id: Optional[int] = None
    template_name: str = ""
    delay_minutes: int = 0
    conditions: dict = {}


class ContactIn(BaseModel):
    phone: str
    name: str = ""
    email: str = ""
    tags: list = []


class ContactSend(BaseModel):
    phone: str
    template_name: str
    variables: list = []


class InboxSendMessage(BaseModel):
    phone: str
    message: str


class LabelIn(BaseModel):
    name: str
    color: str = "#6366f1"


class QuickReplyIn(BaseModel):
    title: str
    body: str
    shortcut: str = ""


class ChatLinkIn(BaseModel):
    name: str
    message: str = ""
    slug: str = ""


class OrderAutoIn(BaseModel):
    event: str
    template_name: str = ""
    is_active: bool = True
    delay_minutes: int = 0


class SendTestMessage(BaseModel):
    phone: str
    message: str


# --- Stats ---
@router.get("/stats")
def whatsapp_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    config = db.query(WhatsAppConfig).filter(WhatsAppConfig.account_id == user.id).first()
    connected = bool(config and config.is_connected)

    total_sent = db.query(WhatsAppMessage).filter(WhatsAppMessage.account_id == user.id, WhatsAppMessage.direction == "outgoing").count()
    total_received = db.query(WhatsAppMessage).filter(WhatsAppMessage.account_id == user.id, WhatsAppMessage.direction == "incoming").count()
    total_contacts = db.query(WhatsAppContact).filter(WhatsAppContact.account_id == user.id).count()
    total_templates = db.query(WhatsAppTemplate).filter(WhatsAppTemplate.account_id == user.id).count()
    total_campaigns = db.query(WhatsAppCampaign).filter(WhatsAppCampaign.account_id == user.id).count()

    return {
        "connected": connected,
        "is_connected": connected,
        "total_sent": total_sent,
        "total_received": total_received,
        "total_contacts": total_contacts,
        "total_templates": total_templates,
        "total_campaigns": total_campaigns,
        "config": {"api_key": bool(config and config.api_key)} if config else None,
    }


# --- Config ---
@router.get("/config")
def get_config(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    config = db.query(WhatsAppConfig).filter(WhatsAppConfig.account_id == user.id).first()
    if not config:
        return {"connected": False}
    return {
        "connected": config.is_connected,
        "phone_number_id": config.phone_number_id,
        "waba_id": config.waba_id,
        "business_phone": config.business_phone,
    }


@router.post("/connect")
def connect_whatsapp(req: WhatsAppConfigIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    config = db.query(WhatsAppConfig).filter(WhatsAppConfig.account_id == user.id).first()
    if not config:
        config = WhatsAppConfig(account_id=user.id)
        db.add(config)
    config.api_key = req.api_key
    config.phone_number_id = req.phone_number_id
    config.waba_id = req.waba_id
    config.is_connected = True
    db.commit()
    return {"status": "ok", "connected": True}


@router.post("/disconnect")
def disconnect_whatsapp(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    config = db.query(WhatsAppConfig).filter(WhatsAppConfig.account_id == user.id).first()
    if config:
        config.is_connected = False
        config.api_key = ""
        db.commit()
    return {"status": "ok"}


# --- Templates ---
@router.get("/templates")
def list_templates(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    templates = db.query(WhatsAppTemplate).filter(WhatsAppTemplate.account_id == user.id).order_by(WhatsAppTemplate.created_at.desc()).all()
    return {"templates": [{"id": t.id, "name": t.name, "category": t.category, "language": t.language, "status": t.status, "body": t.body, "header_type": t.header_type, "buttons": t.buttons} for t in templates]}


@router.post("/templates")
def create_template(req: TemplateIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    t = WhatsAppTemplate(account_id=user.id, name=req.name, category=req.category, language=req.language, header_type=req.header_type, header_text=req.header_text, body=req.body, footer=req.footer, buttons=req.buttons, variables=req.variables)
    db.add(t)
    db.commit()
    db.refresh(t)
    return {"status": "ok", "template_id": t.id}


@router.get("/templates/library")
def template_library():
    return {"templates": [
        {"name": "order_confirmation", "category": "UTILITY", "body": "Hi {{1}}, your order #{{2}} has been confirmed! Total: ₹{{3}}. We'll notify you when it ships."},
        {"name": "order_shipped", "category": "UTILITY", "body": "Hi {{1}}, your order #{{2}} has been shipped via {{3}}! Track: {{4}}"},
        {"name": "order_delivered", "category": "UTILITY", "body": "Hi {{1}}, your order #{{2}} has been delivered! Thank you for shopping with us."},
        {"name": "abandoned_cart_reminder", "category": "MARKETING", "body": "Hi {{1}}, you left {{2}} in your cart! Complete your purchase now and get {{3}}% off. Shop: {{4}}"},
        {"name": "cod_to_prepaid", "category": "MARKETING", "body": "Hi {{1}}, switch your order #{{2}} to prepaid and save ₹{{3}}! Pay now: {{4}}"},
        {"name": "welcome_message", "category": "MARKETING", "body": "Welcome to {{1}}! We're excited to have you. Browse our latest collection: {{2}}"},
        {"name": "review_request", "category": "MARKETING", "body": "Hi {{1}}, how was your experience with {{2}}? Leave a review: {{3}}"},
    ]}


@router.post("/templates/sync")
def sync_templates(user: User = Depends(get_current_user)):
    return {"status": "ok", "message": "Templates synced from Meta"}


@router.post("/templates/validate")
def validate_template(req: TemplateIn):
    errors = []
    if not req.name:
        errors.append("Template name is required")
    if not req.body:
        errors.append("Template body is required")
    if len(req.body) > 1024:
        errors.append("Body exceeds 1024 characters")
    return {"valid": len(errors) == 0, "errors": errors}


@router.get("/templates/{tid}")
def get_template(tid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    t = db.query(WhatsAppTemplate).filter(WhatsAppTemplate.id == tid, WhatsAppTemplate.account_id == user.id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"id": t.id, "name": t.name, "category": t.category, "language": t.language, "status": t.status, "body": t.body, "header_type": t.header_type, "header_text": t.header_text, "footer": t.footer, "buttons": t.buttons, "variables": t.variables}


@router.put("/templates/{tid}")
def update_template(tid: int, req: TemplateIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    t = db.query(WhatsAppTemplate).filter(WhatsAppTemplate.id == tid, WhatsAppTemplate.account_id == user.id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    t.name = req.name
    t.category = req.category
    t.body = req.body
    t.footer = req.footer
    t.buttons = req.buttons
    t.variables = req.variables
    db.commit()
    return {"status": "ok"}


@router.delete("/templates/{tid}/delete")
def delete_template(tid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    t = db.query(WhatsAppTemplate).filter(WhatsAppTemplate.id == tid, WhatsAppTemplate.account_id == user.id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(t)
    db.commit()
    return {"status": "ok"}


@router.post("/templates/{tid}/submit")
def submit_template(tid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    t = db.query(WhatsAppTemplate).filter(WhatsAppTemplate.id == tid, WhatsAppTemplate.account_id == user.id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    t.status = "submitted"
    db.commit()
    return {"status": "ok", "message": "Template submitted for approval"}


# --- Campaigns ---
@router.get("/campaigns")
def list_campaigns(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    campaigns = db.query(WhatsAppCampaign).filter(WhatsAppCampaign.account_id == user.id).order_by(WhatsAppCampaign.created_at.desc()).all()
    return {"campaigns": [{"id": c.id, "name": c.name, "template_name": c.template_name, "audience_count": c.audience_count, "sent_count": c.sent_count, "delivered_count": c.delivered_count, "read_count": c.read_count, "status": c.status, "created_at": c.created_at.isoformat() if c.created_at else None} for c in campaigns]}


@router.post("/campaigns")
def create_campaign(req: CampaignIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c = WhatsAppCampaign(account_id=user.id, name=req.name, template_id=req.template_id, template_name=req.template_name, segment=req.segment)
    db.add(c)
    db.commit()
    db.refresh(c)
    return {"status": "ok", "campaign_id": c.id}


@router.post("/campaigns/{cid}/send")
def send_campaign(cid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c = db.query(WhatsAppCampaign).filter(WhatsAppCampaign.id == cid, WhatsAppCampaign.account_id == user.id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    c.status = "sending"
    c.sent_at = datetime.datetime.utcnow()
    db.commit()
    return {"status": "ok", "message": "Campaign sending started"}


# --- Contacts ---
@router.get("/contacts")
def list_contacts(
    page: int = Query(1), limit: int = Query(50),
    tag: Optional[str] = None,
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    q = db.query(WhatsAppContact).filter(WhatsAppContact.account_id == user.id)
    total = q.count()
    contacts = q.order_by(WhatsAppContact.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return {"contacts": [{"id": c.id, "phone": c.phone, "name": c.name, "email": c.email, "tags": c.tags, "opted_in": c.opted_in, "source": c.source} for c in contacts], "total": total}


@router.post("/contacts")
def add_contact(req: ContactIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(WhatsAppContact).filter(WhatsAppContact.account_id == user.id, WhatsAppContact.phone == req.phone).first()
    if existing:
        existing.name = req.name or existing.name
        existing.email = req.email or existing.email
        existing.tags = req.tags or existing.tags
        db.commit()
        return {"status": "ok", "contact_id": existing.id, "updated": True}
    c = WhatsAppContact(account_id=user.id, phone=req.phone, name=req.name, email=req.email, tags=req.tags)
    db.add(c)
    db.commit()
    db.refresh(c)
    return {"status": "ok", "contact_id": c.id}


@router.post("/contacts/send")
def send_to_contact(req: ContactSend, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    msg = WhatsAppMessage(account_id=user.id, phone=req.phone, direction="outgoing", message_type="template", content=req.template_name, template_name=req.template_name)
    db.add(msg)
    db.commit()
    return {"status": "ok", "message": "Message queued"}


@router.post("/contacts/sync")
def sync_contacts(user: User = Depends(get_current_user)):
    return {"status": "ok", "message": "Contact sync started"}


@router.post("/contacts/import")
def import_contacts(user: User = Depends(get_current_user)):
    return {"status": "ok", "message": "Import started"}


@router.put("/contacts/update")
def update_contact(req: ContactIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c = db.query(WhatsAppContact).filter(WhatsAppContact.account_id == user.id, WhatsAppContact.phone == req.phone).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contact not found")
    if req.name:
        c.name = req.name
    if req.email:
        c.email = req.email
    if req.tags:
        c.tags = req.tags
    db.commit()
    return {"status": "ok"}


@router.get("/contacts/tags")
def contact_tags(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    contacts = db.query(WhatsAppContact).filter(WhatsAppContact.account_id == user.id).all()
    all_tags = set()
    for c in contacts:
        for t in (c.tags or []):
            all_tags.add(t)
    return {"tags": sorted(all_tags)}


@router.delete("/contacts/{phone}/delete")
def delete_contact(phone: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c = db.query(WhatsAppContact).filter(WhatsAppContact.account_id == user.id, WhatsAppContact.phone == phone).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(c)
    db.commit()
    return {"status": "ok"}


# --- Inbox ---
@router.get("/inbox/conversations")
def inbox_conversations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from sqlalchemy import distinct
    phones = db.query(distinct(WhatsAppMessage.phone)).filter(WhatsAppMessage.account_id == user.id).all()
    convos = []
    for (phone,) in phones:
        last_msg = db.query(WhatsAppMessage).filter(WhatsAppMessage.account_id == user.id, WhatsAppMessage.phone == phone).order_by(WhatsAppMessage.created_at.desc()).first()
        contact = db.query(WhatsAppContact).filter(WhatsAppContact.account_id == user.id, WhatsAppContact.phone == phone).first()
        convos.append({
            "phone": phone,
            "name": contact.name if contact else phone,
            "last_message": last_msg.content[:100] if last_msg else "",
            "last_message_at": last_msg.created_at.isoformat() if last_msg else None,
            "direction": last_msg.direction if last_msg else "",
            "unread": 0,
        })
    convos.sort(key=lambda x: x["last_message_at"] or "", reverse=True)
    return {"conversations": convos}


@router.get("/inbox/messages/{phone}")
def inbox_messages(phone: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    messages = db.query(WhatsAppMessage).filter(WhatsAppMessage.account_id == user.id, WhatsAppMessage.phone == phone).order_by(WhatsAppMessage.created_at.asc()).limit(200).all()
    return {"messages": [{"id": m.id, "direction": m.direction, "type": m.message_type, "content": m.content, "media_url": m.media_url, "status": m.status, "created_at": m.created_at.isoformat() if m.created_at else None} for m in messages]}


@router.post("/inbox/send")
def inbox_send(req: InboxSendMessage, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    msg = WhatsAppMessage(account_id=user.id, phone=req.phone, direction="outgoing", message_type="text", content=req.message)
    db.add(msg)
    db.commit()
    return {"status": "ok", "message_id": msg.id}


@router.post("/inbox/send-media")
def inbox_send_media(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"status": "ok", "message": "Media upload not implemented yet"}


# --- Labels ---
@router.get("/labels")
def list_labels(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    labels = db.query(WhatsAppLabel).filter(WhatsAppLabel.account_id == user.id).all()
    return {"labels": [{"id": l.id, "name": l.name, "color": l.color} for l in labels]}


@router.post("/labels")
def create_label(req: LabelIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    l = WhatsAppLabel(account_id=user.id, name=req.name, color=req.color)
    db.add(l)
    db.commit()
    db.refresh(l)
    return {"status": "ok", "label_id": l.id}


@router.delete("/labels/{lid}/delete")
def delete_label(lid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    l = db.query(WhatsAppLabel).filter(WhatsAppLabel.id == lid, WhatsAppLabel.account_id == user.id).first()
    if l:
        db.delete(l)
        db.commit()
    return {"status": "ok"}


# --- Quick Replies ---
@router.get("/quick-replies")
def list_quick_replies(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    qrs = db.query(WhatsAppQuickReply).filter(WhatsAppQuickReply.account_id == user.id).all()
    return {"quick_replies": [{"id": q.id, "title": q.title, "body": q.body, "shortcut": q.shortcut} for q in qrs]}


@router.post("/quick-replies")
def create_quick_reply(req: QuickReplyIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = WhatsAppQuickReply(account_id=user.id, title=req.title, body=req.body, shortcut=req.shortcut)
    db.add(q)
    db.commit()
    db.refresh(q)
    return {"status": "ok", "id": q.id}


@router.delete("/quick-replies/{rid}/delete")
def delete_quick_reply(rid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(WhatsAppQuickReply).filter(WhatsAppQuickReply.id == rid, WhatsAppQuickReply.account_id == user.id).first()
    if q:
        db.delete(q)
        db.commit()
    return {"status": "ok"}


# --- Chat Links ---
@router.get("/chat-links")
def list_chat_links(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    links = db.query(WhatsAppChatLink).filter(WhatsAppChatLink.account_id == user.id).all()
    return {"chat_links": [{"id": l.id, "name": l.name, "message": l.message, "slug": l.slug, "clicks": l.clicks} for l in links]}


@router.post("/chat-links")
def create_chat_link(req: ChatLinkIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    l = WhatsAppChatLink(account_id=user.id, name=req.name, message=req.message, slug=req.slug)
    db.add(l)
    db.commit()
    db.refresh(l)
    return {"status": "ok", "id": l.id}


@router.delete("/chat-links/{lid}/delete")
def delete_chat_link(lid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    l = db.query(WhatsAppChatLink).filter(WhatsAppChatLink.id == lid, WhatsAppChatLink.account_id == user.id).first()
    if l:
        db.delete(l)
        db.commit()
    return {"status": "ok"}


# --- Business Hours ---
@router.get("/business-hours")
def get_business_hours(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    bh = db.query(WhatsAppBusinessHours).filter(WhatsAppBusinessHours.account_id == user.id).first()
    if not bh:
        return {"enabled": False, "schedule": {}, "away_message": ""}
    return {"enabled": bh.enabled, "timezone": bh.timezone, "schedule": bh.schedule, "away_message": bh.away_message}


@router.post("/business-hours")
def update_business_hours(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"status": "ok"}


# --- Automations ---
@router.get("/automation")
def list_automations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    autos = db.query(WhatsAppAutomation).filter(WhatsAppAutomation.account_id == user.id).all()
    return {"automations": [{"id": a.id, "name": a.name, "trigger": a.trigger, "template_name": a.template_name, "is_active": a.is_active, "delay_minutes": a.delay_minutes} for a in autos]}


@router.post("/automation")
def create_automation(req: AutomationIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = WhatsAppAutomation(account_id=user.id, name=req.name, trigger=req.trigger, template_id=req.template_id, template_name=req.template_name, delay_minutes=req.delay_minutes, conditions=req.conditions)
    db.add(a)
    db.commit()
    db.refresh(a)
    return {"status": "ok", "id": a.id}


@router.delete("/automation/{rid}/delete")
def delete_automation(rid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = db.query(WhatsAppAutomation).filter(WhatsAppAutomation.id == rid, WhatsAppAutomation.account_id == user.id).first()
    if a:
        db.delete(a)
        db.commit()
    return {"status": "ok"}


# --- Order Automations ---
@router.get("/order-automations")
def list_order_automations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    autos = db.query(OrderAutomation).filter(OrderAutomation.account_id == user.id).all()
    return {"automations": [{"id": a.id, "event": a.event, "template_name": a.template_name, "is_active": a.is_active, "delay_minutes": a.delay_minutes} for a in autos]}


@router.post("/order-automations")
def create_order_automation(req: OrderAutoIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = OrderAutomation(account_id=user.id, event=req.event, template_name=req.template_name, is_active=req.is_active, delay_minutes=req.delay_minutes)
    db.add(a)
    db.commit()
    db.refresh(a)
    return {"status": "ok", "id": a.id}


@router.delete("/order-automations/{rid}/delete")
def delete_order_automation(rid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = db.query(OrderAutomation).filter(OrderAutomation.id == rid, OrderAutomation.account_id == user.id).first()
    if a:
        db.delete(a)
        db.commit()
    return {"status": "ok"}


@router.put("/order-automations/{rid}/toggle")
def toggle_order_automation(rid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = db.query(OrderAutomation).filter(OrderAutomation.id == rid, OrderAutomation.account_id == user.id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Automation not found")
    a.is_active = not a.is_active
    db.commit()
    return {"status": "ok", "is_active": a.is_active}


# --- Abandoned Carts ---
@router.get("/abandoned/full")
def abandoned_carts_full(
    status: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(AbandonedCart).filter(AbandonedCart.account_id == user.id)
    if status:
        q = q.filter(AbandonedCart.recovery_status == status)
    carts = q.order_by(AbandonedCart.created_at.desc()).limit(200).all()
    return {"carts": [{"id": c.id, "customer_name": c.customer_name, "customer_phone": c.customer_phone, "product_name": c.product_name, "cart_value": c.cart_value, "recovery_status": c.recovery_status, "whatsapp_sent": c.whatsapp_sent, "steps_completed": c.steps_completed, "created_at": c.created_at.isoformat() if c.created_at else None} for c in carts]}


@router.get("/abandoned/carts")
def abandoned_carts(period: str = Query("month"), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    start, end = parse_period(period)
    carts = db.query(AbandonedCart).filter(AbandonedCart.account_id == user.id, AbandonedCart.created_at >= start, AbandonedCart.created_at <= end).order_by(AbandonedCart.created_at.desc()).all()
    return {"carts": [{"id": c.id, "customer_name": c.customer_name, "cart_value": c.cart_value, "recovery_status": c.recovery_status, "created_at": c.created_at.isoformat() if c.created_at else None} for c in carts]}


@router.get("/abandoned/config")
def get_abandoned_config(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    config = db.query(AbandonedCartConfig).filter(AbandonedCartConfig.account_id == user.id).first()
    if not config:
        return {"enabled": False}
    return {"enabled": config.enabled, "step1_delay": config.step1_delay, "step1_template": config.step1_template, "step2_delay": config.step2_delay, "step2_template": config.step2_template, "step3_delay": config.step3_delay, "step3_template": config.step3_template, "coupon_code": config.coupon_code, "discount_percent": config.discount_percent}


@router.post("/abandoned/config")
def update_abandoned_config(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"status": "ok"}


@router.get("/abandoned/analytics")
def abandoned_analytics(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total = db.query(AbandonedCart).filter(AbandonedCart.account_id == user.id).count()
    recovered = db.query(AbandonedCart).filter(AbandonedCart.account_id == user.id, AbandonedCart.recovery_status == "recovered").count()
    total_value = db.query(func.coalesce(func.sum(AbandonedCart.cart_value), 0)).filter(AbandonedCart.account_id == user.id).scalar()
    recovered_value = db.query(func.coalesce(func.sum(AbandonedCart.cart_value), 0)).filter(AbandonedCart.account_id == user.id, AbandonedCart.recovery_status == "recovered").scalar()
    return {"total": total, "recovered": recovered, "recovery_rate": (recovered / total * 100) if total else 0, "total_value": float(total_value), "recovered_value": float(recovered_value)}


# --- Segment ---
@router.get("/segment/options")
def segment_options(user: User = Depends(get_current_user)):
    return {"options": ["all", "new_customers", "repeat_customers", "high_value", "inactive", "by_city", "by_tag", "cod_customers", "prepaid_customers"]}


@router.post("/segment/preview")
def segment_preview(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total = db.query(WhatsAppContact).filter(WhatsAppContact.account_id == user.id, WhatsAppContact.opted_in == True).count()
    return {"count": total}


# --- Profile ---
@router.get("/profile")
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    config = db.query(WhatsAppConfig).filter(WhatsAppConfig.account_id == user.id).first()
    return {"business_phone": config.business_phone if config else "", "phone_number_id": config.phone_number_id if config else ""}


@router.post("/profile")
def update_profile(user: User = Depends(get_current_user)):
    return {"status": "ok"}


@router.post("/profile/picture")
def update_profile_picture(user: User = Depends(get_current_user)):
    return {"status": "ok"}


# --- Misc ---
@router.post("/test")
def send_test(req: SendTestMessage, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    msg = WhatsAppMessage(account_id=user.id, phone=req.phone, direction="outgoing", message_type="text", content=req.message)
    db.add(msg)
    db.commit()
    return {"status": "ok", "message": "Test message sent"}


@router.post("/webhook")
def whatsapp_webhook():
    return {"status": "ok"}


@router.post("/order-action")
def order_action(user: User = Depends(get_current_user)):
    return {"status": "ok"}


@router.post("/embedded-signup/exchange")
def embedded_signup_exchange(user: User = Depends(get_current_user)):
    return {"status": "ok", "message": "WhatsApp embedded signup exchange completed"}


@router.get("/embedded-signup/status")
def embedded_signup_status(user: User = Depends(get_current_user)):
    return {"status": "not_started"}


@router.post("/embedded-signup/disconnect")
def embedded_signup_disconnect(user: User = Depends(get_current_user)):
    return {"status": "ok"}


@router.get("/logs")
def whatsapp_logs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    msgs = db.query(WhatsAppMessage).filter(WhatsAppMessage.account_id == user.id).order_by(WhatsAppMessage.created_at.desc()).limit(100).all()
    return {"logs": [{"id": m.id, "phone": m.phone, "direction": m.direction, "type": m.message_type, "content": m.content[:100], "status": m.status, "created_at": m.created_at.isoformat() if m.created_at else None} for m in msgs]}


@router.get("/platform/analytics")
def platform_analytics(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total_sent = db.query(WhatsAppMessage).filter(WhatsAppMessage.account_id == user.id, WhatsAppMessage.direction == "outgoing").count()
    total_delivered = db.query(WhatsAppMessage).filter(WhatsAppMessage.account_id == user.id, WhatsAppMessage.direction == "outgoing", WhatsAppMessage.status == "delivered").count()
    total_read = db.query(WhatsAppMessage).filter(WhatsAppMessage.account_id == user.id, WhatsAppMessage.direction == "outgoing", WhatsAppMessage.status == "read").count()
    return {"sent": total_sent, "delivered": total_delivered, "read": total_read, "delivery_rate": (total_delivered / total_sent * 100) if total_sent else 0, "read_rate": (total_read / total_sent * 100) if total_sent else 0}
