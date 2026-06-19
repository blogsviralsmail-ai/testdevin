import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    body = Column(Text, default="")
    icon = Column(String(50), default="")
    link = Column(String(255), default="")
    severity = Column(String(20), default="info")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    type = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, default="")
    severity = Column(String(20), default="warning")
    order_id = Column(Integer, nullable=True)
    order_number = Column(String(100), default="")
    is_read = Column(Boolean, default=False)
    action_taken = Column(String(100), default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class NDRAlert(Base):
    __tablename__ = "ndr_alerts"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    order_id = Column(Integer, nullable=True)
    order_number = Column(String(100), default="")
    awb_number = Column(String(100), default="")
    courier_name = Column(String(100), default="")
    ndr_reason = Column(String(255), default="")
    attempt_count = Column(Integer, default=1)
    customer_phone = Column(String(50), default="")
    customer_name = Column(String(255), default="")
    action = Column(String(100), default="pending")
    rto_risk = Column(String(20), default="medium")
    amount = Column(Float, default=0.0)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    body = Column(Text, default="")
    type = Column(String(50), default="info")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
