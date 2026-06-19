import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON
from app.database import Base


class Integration(Base):
    __tablename__ = "integrations"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    provider = Column(String(50), nullable=False, index=True)
    config = Column(JSON, default=dict)
    is_connected = Column(Boolean, default=False)
    last_sync = Column(DateTime, nullable=True)
    sync_status = Column(String(50), default="idle")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class SyncLog(Base):
    __tablename__ = "sync_logs"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    provider = Column(String(50), nullable=False)
    action = Column(String(100), default="")
    records_synced = Column(Integer, default=0)
    status = Column(String(50), default="success")
    error = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class ShippingRate(Base):
    __tablename__ = "shipping_rates"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    courier_name = Column(String(100), nullable=False)
    zone = Column(String(50), default="")
    weight_slab = Column(String(50), default="")
    base_rate = Column(Float, default=0.0)
    per_kg_rate = Column(Float, default=0.0)
    cod_charge = Column(Float, default=0.0)
    rto_charge = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)


class DeliveryPartner(Base):
    __tablename__ = "delivery_partners"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    api_key = Column(String(500), default="")
    api_secret = Column(String(500), default="")
    config = Column(JSON, default=dict)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
