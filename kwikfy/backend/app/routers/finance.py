from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.order import Order
from app.models.finance import CostEntry, GSTConfig, AdCampaign, Expense
from app.utils.auth import get_current_user
from app.utils.helpers import parse_period

router = APIRouter(prefix="/api/finance", tags=["finance"])


class GSTConfigUpdate(BaseModel):
    gstin: str = ""
    business_state: str = ""
    default_hsn: str = ""
    default_gst_rate: float = 18.0


class CostEntryModel(BaseModel):
    category: str
    description: str = ""
    amount: float = 0.0


@router.get("/profit")
def profit_report(
    period: str = Query("month"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start, end = parse_period(period)

    revenue = float(db.query(func.coalesce(func.sum(Order.total_amount), 0)).filter(
        Order.account_id == user.id, Order.order_date >= start, Order.order_date <= end,
        Order.status != "cancelled", Order.status != "rto",
    ).scalar())

    product_cost = float(db.query(func.coalesce(func.sum(Order.total_amount * 0.4), 0)).filter(
        Order.account_id == user.id, Order.order_date >= start, Order.order_date <= end,
        Order.status.in_(["delivered", "shipped", "out_for_delivery"]),
    ).scalar())

    shipping = float(db.query(func.coalesce(func.sum(Order.shipping_cost), 0)).filter(
        Order.account_id == user.id, Order.order_date >= start, Order.order_date <= end,
    ).scalar())

    ad_spend = float(db.query(func.coalesce(func.sum(AdCampaign.spend), 0)).filter(
        AdCampaign.account_id == user.id, AdCampaign.date >= start, AdCampaign.date <= end,
    ).scalar())

    extra_costs = float(db.query(func.coalesce(func.sum(CostEntry.amount), 0)).filter(
        CostEntry.account_id == user.id, CostEntry.date >= start, CostEntry.date <= end,
    ).scalar())

    rto_loss = float(db.query(func.coalesce(func.sum(Order.shipping_cost), 0)).filter(
        Order.account_id == user.id, Order.order_date >= start, Order.order_date <= end,
        Order.status == "rto",
    ).scalar())

    total_costs = product_cost + shipping + ad_spend + extra_costs + rto_loss
    net_profit = revenue - total_costs

    return {
        "revenue": revenue,
        "product_cost": product_cost,
        "shipping_cost": shipping,
        "ad_spend": ad_spend,
        "extra_costs": extra_costs,
        "rto_loss": rto_loss,
        "total_costs": total_costs,
        "net_profit": net_profit,
        "margin": (net_profit / revenue * 100) if revenue else 0,
        "period": period,
    }


@router.get("/costs")
def list_costs(
    period: str = Query("month"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start, end = parse_period(period)
    costs = db.query(CostEntry).filter(
        CostEntry.account_id == user.id, CostEntry.date >= start, CostEntry.date <= end,
    ).order_by(CostEntry.date.desc()).all()
    return {
        "costs": [
            {"id": c.id, "category": c.category, "description": c.description, "amount": c.amount, "date": c.date.isoformat() if c.date else None}
            for c in costs
        ]
    }


@router.post("/costs")
def add_cost(req: CostEntryModel, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c = CostEntry(account_id=user.id, category=req.category, description=req.description, amount=req.amount)
    db.add(c)
    db.commit()
    db.refresh(c)
    return {"status": "ok", "cost_id": c.id}


@router.delete("/costs/{cost_id}")
def delete_cost(cost_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c = db.query(CostEntry).filter(CostEntry.id == cost_id, CostEntry.account_id == user.id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Cost not found")
    db.delete(c)
    db.commit()
    return {"status": "ok"}


@router.get("/rto-loss")
def rto_loss(
    period: str = Query("month"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start, end = parse_period(period)
    rto_orders = db.query(Order).filter(
        Order.account_id == user.id, Order.order_date >= start, Order.order_date <= end,
        Order.status == "rto",
    ).all()

    total_loss = sum(o.shipping_cost + (o.total_amount * 0.1) for o in rto_orders)
    shipping_loss = sum(o.shipping_cost for o in rto_orders)

    return {
        "rto_orders": len(rto_orders),
        "total_loss": total_loss,
        "shipping_loss": shipping_loss,
        "product_damage_loss": total_loss - shipping_loss,
        "orders": [
            {"order_number": o.order_number, "amount": o.total_amount, "shipping": o.shipping_cost, "courier": o.courier_name, "city": o.city}
            for o in rto_orders[:50]
        ],
    }


@router.get("/gst")
def gst_report(
    period: str = Query("month"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start, end = parse_period(period)
    orders = db.query(Order).filter(
        Order.account_id == user.id, Order.order_date >= start, Order.order_date <= end,
        Order.status.in_(["delivered", "shipped", "out_for_delivery", "confirmed"]),
    ).all()

    config = db.query(GSTConfig).filter(GSTConfig.account_id == user.id).first()
    gst_rate = config.default_gst_rate if config else 18.0
    state = config.business_state if config else ""

    total_taxable = sum(o.total_amount / (1 + gst_rate / 100) for o in orders)
    total_gst = sum(o.total_amount - o.total_amount / (1 + gst_rate / 100) for o in orders)

    return {
        "total_taxable": total_taxable,
        "total_gst": total_gst,
        "cgst": total_gst / 2,
        "sgst": total_gst / 2,
        "igst": 0,
        "orders_count": len(orders),
        "gst_rate": gst_rate,
        "gstin": config.gstin if config else "",
        "business_state": state,
    }


@router.get("/gst/config")
def get_gst_config(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    config = db.query(GSTConfig).filter(GSTConfig.account_id == user.id).first()
    return {
        "gstin": config.gstin if config else "",
        "business_state": config.business_state if config else "",
        "default_hsn": config.default_hsn if config else "",
        "default_gst_rate": config.default_gst_rate if config else 18.0,
    }


@router.post("/gst/config")
def update_gst_config(req: GSTConfigUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    config = db.query(GSTConfig).filter(GSTConfig.account_id == user.id).first()
    if not config:
        config = GSTConfig(account_id=user.id)
        db.add(config)
    config.gstin = req.gstin
    config.business_state = req.business_state
    config.default_hsn = req.default_hsn
    config.default_gst_rate = req.default_gst_rate
    db.commit()
    return {"status": "ok"}


@router.get("/gst/product/{product_id}")
def get_product_gst(product_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.models.order import Product
    p = db.query(Product).filter(Product.id == product_id, Product.account_id == user.id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"product_id": p.id, "hsn_code": p.hsn_code, "gst_rate": p.gst_rate}


@router.get("/ads")
def ads_overview(
    period: str = Query("month"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start, end = parse_period(period)
    campaigns = db.query(AdCampaign).filter(
        AdCampaign.account_id == user.id, AdCampaign.date >= start, AdCampaign.date <= end,
    ).all()

    total_spend = sum(c.spend for c in campaigns)
    total_revenue = sum(c.revenue for c in campaigns)
    total_conversions = sum(c.conversions for c in campaigns)

    by_platform = {}
    for c in campaigns:
        if c.platform not in by_platform:
            by_platform[c.platform] = {"spend": 0, "revenue": 0, "conversions": 0, "clicks": 0, "impressions": 0}
        by_platform[c.platform]["spend"] += c.spend
        by_platform[c.platform]["revenue"] += c.revenue
        by_platform[c.platform]["conversions"] += c.conversions
        by_platform[c.platform]["clicks"] += c.clicks
        by_platform[c.platform]["impressions"] += c.impressions

    return {
        "total_spend": total_spend,
        "total_revenue": total_revenue,
        "total_conversions": total_conversions,
        "blended_roas": total_revenue / total_spend if total_spend else 0,
        "by_platform": by_platform,
        "campaigns": [
            {
                "id": c.id, "platform": c.platform, "campaign_name": c.campaign_name,
                "spend": c.spend, "revenue": c.revenue, "roas": c.roas,
                "conversions": c.conversions, "clicks": c.clicks,
            }
            for c in campaigns[:50]
        ],
    }
