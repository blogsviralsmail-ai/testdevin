import secrets
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.checkout import CheckoutConfig, Coupon, CheckoutSession, CustomerAddress, TrackingConfig
from app.models.order import Order
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/checkout", tags=["checkout"])


class CheckoutConfigIn(BaseModel):
    brand_name: str = ""
    brand_color: str = "#6366f1"
    logo_url: str = ""
    cod_enabled: bool = True
    prepaid_discount: float = 0.0
    upi_enabled: bool = True
    cards_enabled: bool = True
    otp_login: bool = True
    free_gift_enabled: bool = False
    free_gift_threshold: float = 0.0
    free_gift_product: str = ""
    upsell_enabled: bool = False


class CouponIn(BaseModel):
    code: str
    type: str = "percentage"
    value: float = 0.0
    min_order: float = 0.0
    max_discount: float = 0.0
    usage_limit: int = 0


class CreateSession(BaseModel):
    product_id: Optional[int] = None
    product_name: str = ""
    quantity: int = 1
    variant: str = ""


class OTPLogin(BaseModel):
    phone: str


class VerifyOTP(BaseModel):
    phone: str
    otp: str


class ApplyCoupon(BaseModel):
    code: str


class AddressIn(BaseModel):
    name: str = ""
    phone: str = ""
    address_line1: str = ""
    address_line2: str = ""
    city: str = ""
    state: str = ""
    pincode: str = ""


class PaymentReq(BaseModel):
    session_token: str
    method: str = "cod"


class CODCheckReq(BaseModel):
    pincode: str
    amount: float = 0.0
    phone: str = ""


class TrackingConfigIn(BaseModel):
    brand_name: str = ""
    brand_color: str = "#6366f1"
    logo_url: str = ""
    show_amount: bool = True
    custom_message: str = ""


# --- Config ---
@router.get("/config")
def get_checkout_config(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    config = db.query(CheckoutConfig).filter(CheckoutConfig.account_id == user.id).first()
    if not config:
        return {"brand_name": user.brand, "brand_color": "#6366f1", "cod_enabled": True, "upi_enabled": True}
    return {
        "brand_name": config.brand_name,
        "brand_color": config.brand_color,
        "logo_url": config.logo_url,
        "cod_enabled": config.cod_enabled,
        "prepaid_discount": config.prepaid_discount,
        "upi_enabled": config.upi_enabled,
        "cards_enabled": config.cards_enabled,
        "otp_login": config.otp_login,
        "free_gift_enabled": config.free_gift_enabled,
        "free_gift_threshold": config.free_gift_threshold,
        "upsell_enabled": config.upsell_enabled,
    }


@router.post("/config")
def update_checkout_config(req: CheckoutConfigIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    config = db.query(CheckoutConfig).filter(CheckoutConfig.account_id == user.id).first()
    if not config:
        config = CheckoutConfig(account_id=user.id)
        db.add(config)
    config.brand_name = req.brand_name
    config.brand_color = req.brand_color
    config.logo_url = req.logo_url
    config.cod_enabled = req.cod_enabled
    config.prepaid_discount = req.prepaid_discount
    config.upi_enabled = req.upi_enabled
    config.cards_enabled = req.cards_enabled
    config.otp_login = req.otp_login
    config.free_gift_enabled = req.free_gift_enabled
    config.free_gift_threshold = req.free_gift_threshold
    config.upsell_enabled = req.upsell_enabled
    db.commit()
    return {"status": "ok"}


# --- Coupons ---
@router.get("/coupons")
def list_coupons(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    coupons = db.query(Coupon).filter(Coupon.account_id == user.id).order_by(Coupon.created_at.desc()).all()
    return {"coupons": [{"id": c.id, "code": c.code, "type": c.type, "value": c.value, "min_order": c.min_order, "max_discount": c.max_discount, "usage_limit": c.usage_limit, "used_count": c.used_count, "is_active": c.is_active} for c in coupons]}


@router.post("/coupons")
def create_coupon(req: CouponIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c = Coupon(account_id=user.id, code=req.code.upper(), type=req.type, value=req.value, min_order=req.min_order, max_discount=req.max_discount, usage_limit=req.usage_limit)
    db.add(c)
    db.commit()
    db.refresh(c)
    return {"status": "ok", "coupon_id": c.id}


@router.delete("/coupons/{cid}")
def delete_coupon(cid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c = db.query(Coupon).filter(Coupon.id == cid, Coupon.account_id == user.id).first()
    if c:
        db.delete(c)
        db.commit()
    return {"status": "ok"}


# --- Session ---
@router.post("/session")
def create_checkout_session(req: CreateSession, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    token = secrets.token_urlsafe(32)
    session = CheckoutSession(account_id=user.id, session_token=token, product_id=req.product_id, product_name=req.product_name, quantity=req.quantity)
    db.add(session)
    db.commit()
    return {"session_token": token}


@router.post("/otp/login")
def otp_login(req: OTPLogin):
    return {"status": "ok", "message": "OTP sent", "otp_sent": True}


@router.post("/otp/verify")
def otp_verify(req: VerifyOTP):
    return {"status": "ok", "verified": True, "token": secrets.token_urlsafe(16)}


@router.post("/coupon/apply")
def apply_coupon(req: ApplyCoupon, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c = db.query(Coupon).filter(Coupon.account_id == user.id, Coupon.code == req.code.upper(), Coupon.is_active == True).first()
    if not c:
        raise HTTPException(status_code=404, detail="Invalid coupon")
    if c.usage_limit > 0 and c.used_count >= c.usage_limit:
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")
    return {"status": "ok", "coupon": {"code": c.code, "type": c.type, "value": c.value}}


@router.post("/addresses")
def save_address(req: AddressIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    addr = CustomerAddress(account_id=user.id, customer_phone=req.phone, name=req.name, phone=req.phone, address_line1=req.address_line1, address_line2=req.address_line2, city=req.city, state=req.state, pincode=req.pincode)
    db.add(addr)
    db.commit()
    return {"status": "ok", "address_id": addr.id}


@router.get("/addresses/{phone}")
def get_addresses(phone: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    addrs = db.query(CustomerAddress).filter(CustomerAddress.account_id == user.id, CustomerAddress.customer_phone == phone).all()
    return {"addresses": [{"id": a.id, "name": a.name, "phone": a.phone, "address_line1": a.address_line1, "city": a.city, "state": a.state, "pincode": a.pincode} for a in addrs]}


@router.post("/pay")
def process_payment(req: PaymentReq, db: Session = Depends(get_db)):
    session = db.query(CheckoutSession).filter(CheckoutSession.session_token == req.session_token).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.payment_method = req.method
    session.status = "payment_initiated"
    db.commit()
    return {"status": "ok", "order_id": None, "payment_method": req.method}


@router.post("/cod-risk")
def check_cod_risk(req: CODCheckReq):
    high_risk_prefixes = ["110", "400", "500"]
    risk = "high" if any(req.pincode.startswith(p) for p in high_risk_prefixes) else "low"
    return {"risk": risk, "pincode": req.pincode, "allow_cod": risk != "high", "prepaid_nudge": risk == "high"}


@router.get("/analytics")
def checkout_analytics(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total_sessions = db.query(CheckoutSession).filter(CheckoutSession.account_id == user.id).count()
    converted = db.query(CheckoutSession).filter(CheckoutSession.account_id == user.id, CheckoutSession.converted == True).count()
    return {"total_sessions": total_sessions, "converted": converted, "conversion_rate": (converted / total_sessions * 100) if total_sessions else 0}


# --- Tracking ---
@router.get("/tracking/config")
def get_tracking_config(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    config = db.query(TrackingConfig).filter(TrackingConfig.account_id == user.id).first()
    if not config:
        return {"brand_name": user.brand, "brand_color": "#6366f1"}
    return {"brand_name": config.brand_name, "brand_color": config.brand_color, "logo_url": config.logo_url, "show_amount": config.show_amount, "custom_message": config.custom_message}


@router.post("/tracking/config")
def update_tracking_config(req: TrackingConfigIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    config = db.query(TrackingConfig).filter(TrackingConfig.account_id == user.id).first()
    if not config:
        config = TrackingConfig(account_id=user.id)
        db.add(config)
    config.brand_name = req.brand_name
    config.brand_color = req.brand_color
    config.logo_url = req.logo_url
    config.show_amount = req.show_amount
    config.custom_message = req.custom_message
    db.commit()
    return {"status": "ok"}


@router.get("/tracking/{awb}")
def track_order(awb: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.awb_number == awb).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {
        "order_number": order.order_number,
        "status": order.status,
        "courier_name": order.courier_name,
        "awb_number": order.awb_number,
        "product_name": order.product_name,
        "total_amount": order.total_amount,
        "shipped_at": order.shipped_at.isoformat() if order.shipped_at else None,
        "delivered_at": order.delivered_at.isoformat() if order.delivered_at else None,
    }


@router.get("/upsells")
def get_upsells(user: User = Depends(get_current_user)):
    return {"upsells": []}


@router.post("/upsells")
def create_upsell(user: User = Depends(get_current_user)):
    return {"status": "ok"}
