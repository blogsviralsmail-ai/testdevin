import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON
from app.database import Base


class WhatsAppConfig(Base):
    __tablename__ = "whatsapp_configs"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, unique=True, index=True, nullable=False)
    api_key = Column(String(500), default="")
    phone_number_id = Column(String(100), default="")
    waba_id = Column(String(100), default="")
    business_phone = Column(String(50), default="")
    is_connected = Column(Boolean, default=False)
    webhook_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class WhatsAppTemplate(Base):
    __tablename__ = "whatsapp_templates"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    template_id = Column(String(100), default="")
    name = Column(String(255), nullable=False)
    category = Column(String(50), default="MARKETING")
    language = Column(String(20), default="en")
    status = Column(String(50), default="draft")
    header_type = Column(String(50), default="")
    header_text = Column(String(500), default="")
    body = Column(Text, default="")
    footer = Column(String(200), default="")
    buttons = Column(JSON, default=list)
    variables = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class WhatsAppCampaign(Base):
    __tablename__ = "whatsapp_campaigns"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    template_id = Column(Integer, nullable=True)
    template_name = Column(String(255), default="")
    segment = Column(JSON, default=dict)
    audience_count = Column(Integer, default=0)
    sent_count = Column(Integer, default=0)
    delivered_count = Column(Integer, default=0)
    read_count = Column(Integer, default=0)
    replied_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    status = Column(String(50), default="draft")
    scheduled_at = Column(DateTime, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class WhatsAppContact(Base):
    __tablename__ = "whatsapp_contacts"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    phone = Column(String(50), nullable=False, index=True)
    name = Column(String(255), default="")
    email = Column(String(255), default="")
    tags = Column(JSON, default=list)
    opted_in = Column(Boolean, default=True)
    last_message_at = Column(DateTime, nullable=True)
    source = Column(String(50), default="manual")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class WhatsAppMessage(Base):
    __tablename__ = "whatsapp_messages"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    phone = Column(String(50), index=True, nullable=False)
    direction = Column(String(10), default="outgoing")
    message_type = Column(String(50), default="text")
    content = Column(Text, default="")
    media_url = Column(String(500), default="")
    status = Column(String(50), default="sent")
    wamid = Column(String(200), default="")
    template_name = Column(String(255), default="")
    assigned_to = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class WhatsAppAutomation(Base):
    __tablename__ = "whatsapp_automations"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    trigger = Column(String(100), nullable=False)
    template_id = Column(Integer, nullable=True)
    template_name = Column(String(255), default="")
    delay_minutes = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    conditions = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class WhatsAppLabel(Base):
    __tablename__ = "whatsapp_labels"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    color = Column(String(20), default="#6366f1")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class WhatsAppQuickReply(Base):
    __tablename__ = "whatsapp_quick_replies"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    shortcut = Column(String(50), default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class WhatsAppChatLink(Base):
    __tablename__ = "whatsapp_chat_links"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    message = Column(Text, default="")
    slug = Column(String(100), default="")
    clicks = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class WhatsAppBusinessHours(Base):
    __tablename__ = "whatsapp_business_hours"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, unique=True, index=True, nullable=False)
    enabled = Column(Boolean, default=False)
    timezone = Column(String(50), default="Asia/Kolkata")
    schedule = Column(JSON, default=dict)
    away_message = Column(Text, default="")


class OrderAutomation(Base):
    __tablename__ = "order_automations"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    event = Column(String(100), nullable=False)
    template_name = Column(String(255), default="")
    is_active = Column(Boolean, default=True)
    delay_minutes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class AbandonedCartConfig(Base):
    __tablename__ = "abandoned_cart_configs"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, unique=True, index=True, nullable=False)
    enabled = Column(Boolean, default=False)
    step1_delay = Column(Integer, default=30)
    step1_template = Column(String(255), default="")
    step2_delay = Column(Integer, default=120)
    step2_template = Column(String(255), default="")
    step3_delay = Column(Integer, default=1440)
    step3_template = Column(String(255), default="")
    coupon_code = Column(String(100), default="")
    discount_percent = Column(Float, default=0.0)
