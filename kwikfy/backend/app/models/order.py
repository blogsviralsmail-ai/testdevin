import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON
from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    order_number = Column(String(100), index=True, nullable=False)
    shopify_order_id = Column(String(100), nullable=True)
    customer_name = Column(String(255), default="")
    customer_email = Column(String(255), default="")
    customer_phone = Column(String(50), default="")
    product_name = Column(String(500), default="")
    product_id = Column(Integer, nullable=True)
    quantity = Column(Integer, default=1)
    total_amount = Column(Float, default=0.0)
    subtotal = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    shipping_cost = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    status = Column(String(50), default="pending", index=True)
    payment_method = Column(String(50), default="cod")
    payment_status = Column(String(50), default="pending")
    courier_name = Column(String(100), default="")
    awb_number = Column(String(100), default="")
    tracking_url = Column(String(500), default="")
    city = Column(String(100), default="")
    state = Column(String(100), default="")
    pincode = Column(String(20), default="")
    address = Column(Text, default="")
    rto_risk = Column(String(20), default="low")
    rto_score = Column(Float, default=0.0)
    notes = Column(Text, default="")
    tags = Column(JSON, default=list)
    order_date = Column(DateTime, default=datetime.datetime.utcnow)
    shipped_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    shopify_product_id = Column(String(100), nullable=True)
    name = Column(String(500), nullable=False)
    sku = Column(String(100), default="")
    category = Column(String(200), default="")
    description = Column(Text, default="")
    cost_price = Column(Float, default=0.0)
    selling_price = Column(Float, default=0.0)
    mrp = Column(Float, default=0.0)
    stock_quantity = Column(Integer, default=0)
    low_stock_threshold = Column(Integer, default=10)
    weight = Column(Float, default=0.0)
    hsn_code = Column(String(50), default="")
    gst_rate = Column(Float, default=18.0)
    image_url = Column(String(500), default="")
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    name = Column(String(255), default="")
    email = Column(String(255), default="")
    phone = Column(String(50), default="", index=True)
    city = Column(String(100), default="")
    state = Column(String(100), default="")
    pincode = Column(String(20), default="")
    address = Column(Text, default="")
    total_orders = Column(Integer, default=0)
    total_spent = Column(Float, default=0.0)
    last_order_date = Column(DateTime, nullable=True)
    tags = Column(JSON, default=list)
    source = Column(String(50), default="shopify")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class AbandonedCart(Base):
    __tablename__ = "abandoned_carts"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    customer_name = Column(String(255), default="")
    customer_phone = Column(String(50), default="")
    customer_email = Column(String(255), default="")
    product_name = Column(String(500), default="")
    cart_value = Column(Float, default=0.0)
    recovery_status = Column(String(50), default="abandoned")
    recovery_link = Column(String(500), default="")
    whatsapp_sent = Column(Boolean, default=False)
    steps_completed = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    recovered_at = Column(DateTime, nullable=True)
