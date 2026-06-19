import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.order import Order, Product, Customer
from app.models.finance import Payment, AdCampaign
from app.models.checkout import Invoice
from app.utils.auth import get_current_user
from app.utils.helpers import parse_period
from pydantic import BaseModel

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


class BrandReq(BaseModel):
    brand: str


class OnboardingState(BaseModel):
    step_key: str
    done: bool = True


class PlanCheckout(BaseModel):
    plan: str


@router.get("/me")
def dashboard_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "brand": user.brand or "Kwikfy",
        "plan": user.plan,
        "features": user.features.split(",") if isinstance(user.features, str) and user.features else [],
        "theme": user.theme,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.get("/overview")
def dashboard_overview(
    period: str = Query("month"),
    frm: str = Query(None),
    to: str = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start, end = parse_period(period, frm, to)
    orders = db.query(Order).filter(
        Order.account_id == user.id,
        Order.order_date >= start,
        Order.order_date <= end,
    )

    total_orders = orders.count()
    total_revenue = db.query(func.coalesce(func.sum(Order.total_amount), 0)).filter(
        Order.account_id == user.id, Order.order_date >= start, Order.order_date <= end
    ).scalar()
    delivered = orders.filter(Order.status == "delivered").count()
    rto_count = orders.filter(Order.status == "rto").count()
    pending = orders.filter(Order.status == "pending").count()
    shipped = orders.filter(Order.status == "shipped").count()

    ad_spend = db.query(func.coalesce(func.sum(AdCampaign.spend), 0)).filter(
        AdCampaign.account_id == user.id, AdCampaign.date >= start, AdCampaign.date <= end
    ).scalar()

    net_profit = float(total_revenue) - float(ad_spend)

    return {
        "total_orders": total_orders,
        "total_revenue": float(total_revenue),
        "net_profit": net_profit,
        "delivered": delivered,
        "rto_count": rto_count,
        "pending": pending,
        "shipped": shipped,
        "ad_spend": float(ad_spend),
        "avg_order_value": float(total_revenue) / total_orders if total_orders else 0,
        "rto_rate": (rto_count / total_orders * 100) if total_orders else 0,
        "period": period,
    }


@router.get("/charts/status-breakdown")
def status_breakdown(
    period: str = Query("month"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start, end = parse_period(period)
    rows = (
        db.query(Order.status, func.count(Order.id))
        .filter(Order.account_id == user.id, Order.order_date >= start, Order.order_date <= end)
        .group_by(Order.status)
        .all()
    )
    return {"labels": [r[0] for r in rows], "values": [r[1] for r in rows]}


@router.get("/charts/revenue")
def revenue_chart(
    period: str = Query("month"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start, end = parse_period(period)
    rows = (
        db.query(func.date(Order.order_date), func.sum(Order.total_amount))
        .filter(Order.account_id == user.id, Order.order_date >= start, Order.order_date <= end)
        .group_by(func.date(Order.order_date))
        .order_by(func.date(Order.order_date))
        .all()
    )
    return {
        "labels": [str(r[0]) for r in rows],
        "values": [float(r[1] or 0) for r in rows],
    }


@router.get("/charts/daily-orders")
def daily_orders_chart(
    period: str = Query("month"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start, end = parse_period(period)
    rows = (
        db.query(func.date(Order.order_date), func.count(Order.id))
        .filter(Order.account_id == user.id, Order.order_date >= start, Order.order_date <= end)
        .group_by(func.date(Order.order_date))
        .order_by(func.date(Order.order_date))
        .all()
    )
    return {
        "labels": [str(r[0]) for r in rows],
        "values": [r[1] for r in rows],
    }


@router.post("/brand")
def update_brand(req: BrandReq, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.brand = req.brand
    db.commit()
    return {"status": "ok", "brand": user.brand}


@router.get("/onboarding")
def get_onboarding(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.models.integration import Integration
    from app.models.checkout import TrackingConfig
    from app.models.finance import GSTConfig

    integrations = db.query(Integration).filter(Integration.account_id == user.id).all()
    shopify_connected = any(i.provider == "shopify" and i.is_connected for i in integrations)
    whatsapp_connected = any(i.provider == "whatsapp" and i.is_connected for i in integrations)
    tracking = db.query(TrackingConfig).filter(TrackingConfig.account_id == user.id).first()
    gst = db.query(GSTConfig).filter(GSTConfig.account_id == user.id).first()

    steps = [
        {"key": "brand", "title": "Set your brand name", "done": bool(user.brand), "core": True, "cta_section": "settings"},
        {"key": "shopify", "title": "Connect Shopify", "done": shopify_connected, "core": True, "cta_section": "settings"},
        {"key": "sync", "title": "Sync your first orders", "done": bool(db.query(Order).filter(Order.account_id == user.id).first()), "core": True, "locked": not shopify_connected, "cta_section": "orders"},
        {"key": "whatsapp", "title": "Connect WhatsApp", "done": whatsapp_connected, "core": False, "cta_section": "whatsapp"},
        {"key": "tracking", "title": "Customize tracking page", "done": bool(tracking and tracking.brand_name), "core": False, "cta_section": "tracking"},
        {"key": "gst", "title": "Set up GST details", "done": bool(gst and gst.gstin), "core": False, "cta_section": "finance"},
    ]
    done_count = sum(1 for s in steps if s.get("done"))
    return {"steps": steps, "done": done_count, "total": len(steps), "progress": int(done_count / len(steps) * 100)}


@router.post("/onboarding/state")
def update_onboarding(req: OnboardingState, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    onb = user.onboarding or {}
    onb[req.step_key] = req.done
    user.onboarding = onb
    db.commit()
    return {"status": "ok"}


@router.get("/plans")
def get_plans():
    return {
        "plans": [
            {
                "id": "free", "name": "Starter", "price": 0, "currency": "INR",
                "features": ["Up to 100 orders/mo", "Order & customer management", "WhatsApp order updates", "Branded tracking page", "Email support"],
                "order_limit": 100,
            },
            {
                "id": "growth", "name": "Growth", "price": 999, "currency": "INR",
                "features": ["Up to 2,000 orders/mo", "WhatsApp inbox & campaigns", "RTO shield + COD→prepaid", "Shipping + NDR + tracking", "FB & Google ROAS", "Priority support"],
                "order_limit": 2000,
                "feature_keys": ["whatsapp", "ndr", "analytics", "finance"],
            },
            {
                "id": "pro", "name": "Pro", "price": 2999, "currency": "INR",
                "features": ["Unlimited orders", "Everything in Growth", "Full finance, GST & P&L", "Abandoned-cart recovery", "Multi-user team access", "Dedicated manager"],
                "order_limit": -1,
                "feature_keys": ["whatsapp", "ndr", "analytics", "finance", "cashflow", "team", "reports", "alerts", "inventory"],
            },
            {
                "id": "enterprise", "name": "Enterprise", "price": -1, "currency": "INR",
                "features": ["Everything in Pro", "Custom integrations", "White-label option", "SLA & onboarding", "API access"],
                "order_limit": -1,
                "feature_keys": ["whatsapp", "ndr", "analytics", "finance", "cashflow", "team", "reports", "alerts", "inventory"],
            },
        ]
    }


@router.post("/plan/checkout")
def plan_checkout(req: PlanCheckout, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan_features = {
        "free": [],
        "growth": ["whatsapp", "ndr", "analytics", "finance"],
        "pro": ["whatsapp", "ndr", "analytics", "finance", "cashflow", "team", "reports", "alerts", "inventory"],
        "enterprise": ["whatsapp", "ndr", "analytics", "finance", "cashflow", "team", "reports", "alerts", "inventory"],
    }
    if req.plan not in plan_features:
        return {"error": "Invalid plan"}
    user.plan = req.plan
    user.features = plan_features[req.plan]
    db.commit()
    return {"status": "ok", "plan": user.plan, "features": user.features}


@router.get("/invoices")
def get_invoices(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    invoices = db.query(Invoice).filter(Invoice.account_id == user.id).order_by(Invoice.created_at.desc()).all()
    return {
        "invoices": [
            {
                "id": inv.id,
                "invoice_number": inv.invoice_number,
                "amount": inv.amount,
                "status": inv.status,
                "plan": inv.plan,
                "period_start": inv.period_start.isoformat() if inv.period_start else None,
                "period_end": inv.period_end.isoformat() if inv.period_end else None,
                "created_at": inv.created_at.isoformat() if inv.created_at else None,
            }
            for inv in invoices
        ]
    }
