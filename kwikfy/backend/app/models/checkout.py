import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON
from app.database import Base


class CheckoutConfig(Base):
    __tablename__ = "checkout_configs"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, unique=True, index=True, nullable=False)
    brand_name = Column(String(255), default="")
    brand_color = Column(String(20), default="#6366f1")
    logo_url = Column(String(500), default="")
    cod_enabled = Column(Boolean, default=True)
    prepaid_discount = Column(Float, default=0.0)
    upi_enabled = Column(Boolean, default=True)
    cards_enabled = Column(Boolean, default=True)
    netbanking_enabled = Column(Boolean, default=True)
    wallet_enabled = Column(Boolean, default=True)
    otp_login = Column(Boolean, default=True)
    free_gift_enabled = Column(Boolean, default=False)
    free_gift_threshold = Column(Float, default=0.0)
    free_gift_product = Column(String(255), default="")
    upsell_enabled = Column(Boolean, default=False)
    custom_css = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    code = Column(String(50), nullable=False, index=True)
    type = Column(String(20), default="percentage")
    value = Column(Float, default=0.0)
    min_order = Column(Float, default=0.0)
    max_discount = Column(Float, default=0.0)
    usage_limit = Column(Integer, default=0)
    used_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class CheckoutSession(Base):
    __tablename__ = "checkout_sessions"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    session_token = Column(String(200), unique=True, index=True)
    customer_phone = Column(String(50), default="")
    customer_name = Column(String(255), default="")
    customer_email = Column(String(255), default="")
    address_id = Column(Integer, nullable=True)
    product_id = Column(Integer, nullable=True)
    product_name = Column(String(500), default="")
    quantity = Column(Integer, default=1)
    subtotal = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    shipping = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    coupon_code = Column(String(50), default="")
    payment_method = Column(String(50), default="")
    status = Column(String(50), default="active")
    converted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class CustomerAddress(Base):
    __tablename__ = "customer_addresses"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    customer_phone = Column(String(50), index=True, nullable=False)
    name = Column(String(255), default="")
    phone = Column(String(50), default="")
    address_line1 = Column(String(500), default="")
    address_line2 = Column(String(500), default="")
    city = Column(String(100), default="")
    state = Column(String(100), default="")
    pincode = Column(String(20), default="")
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class TrackingConfig(Base):
    __tablename__ = "tracking_configs"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, unique=True, index=True, nullable=False)
    brand_name = Column(String(255), default="")
    brand_color = Column(String(20), default="#6366f1")
    logo_url = Column(String(500), default="")
    show_amount = Column(Boolean, default=True)
    custom_message = Column(Text, default="")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    invoice_number = Column(String(100), nullable=False)
    amount = Column(Float, default=0.0)
    status = Column(String(50), default="pending")
    plan = Column(String(50), default="")
    period_start = Column(DateTime, nullable=True)
    period_end = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
