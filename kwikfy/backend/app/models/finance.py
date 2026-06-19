import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON
from app.database import Base


class CostEntry(Base):
    __tablename__ = "cost_entries"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(String(500), default="")
    amount = Column(Float, default=0.0)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    recurring = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class GSTConfig(Base):
    __tablename__ = "gst_configs"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, unique=True, index=True, nullable=False)
    gstin = Column(String(50), default="")
    business_state = Column(String(100), default="")
    default_hsn = Column(String(50), default="")
    default_gst_rate = Column(Float, default=18.0)


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    order_id = Column(Integer, nullable=True)
    razorpay_payment_id = Column(String(100), default="")
    razorpay_order_id = Column(String(100), default="")
    amount = Column(Float, default=0.0)
    currency = Column(String(10), default="INR")
    method = Column(String(50), default="")
    status = Column(String(50), default="pending")
    settled = Column(Boolean, default=False)
    settlement_id = Column(String(100), default="")
    fee = Column(Float, default=0.0)
    tax_on_fee = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class CODRemittance(Base):
    __tablename__ = "cod_remittances"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    courier_name = Column(String(100), default="")
    amount = Column(Float, default=0.0)
    orders_count = Column(Integer, default=0)
    status = Column(String(50), default="pending")
    remittance_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    type = Column(String(50), nullable=False)
    amount = Column(Float, default=0.0)
    description = Column(String(500), default="")
    reference = Column(String(200), default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    category = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    amount = Column(Float, default=0.0)
    period = Column(String(50), default="monthly")
    date = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class AdCampaign(Base):
    __tablename__ = "ad_campaigns"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    platform = Column(String(50), nullable=False)
    campaign_id = Column(String(100), default="")
    campaign_name = Column(String(255), default="")
    spend = Column(Float, default=0.0)
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    conversions = Column(Integer, default=0)
    revenue = Column(Float, default=0.0)
    roas = Column(Float, default=0.0)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
