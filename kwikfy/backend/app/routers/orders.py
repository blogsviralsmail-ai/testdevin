import datetime
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.order import Order
from app.utils.auth import get_current_user
from app.utils.helpers import parse_period

router = APIRouter(prefix="/api/orders", tags=["orders"])


class OrderUpdate(BaseModel):
    status: Optional[str] = None
    courier_name: Optional[str] = None
    awb_number: Optional[str] = None
    tracking_url: Optional[str] = None
    notes: Optional[str] = None
    payment_status: Optional[str] = None


@router.get("/")
def list_orders(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(150, ge=1, le=500),
    period: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Order).filter(Order.account_id == user.id)
    if status:
        q = q.filter(Order.status == status)
    if period:
        start, end = parse_period(period)
        q = q.filter(Order.order_date >= start, Order.order_date <= end)

    total = q.count()
    orders = q.order_by(Order.order_date.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "orders": [
            {
                "id": o.id,
                "order_number": o.order_number,
                "customer_name": o.customer_name,
                "customer_phone": o.customer_phone,
                "product_name": o.product_name,
                "total_amount": o.total_amount,
                "status": o.status,
                "payment_method": o.payment_method,
                "payment_status": o.payment_status,
                "courier_name": o.courier_name,
                "awb_number": o.awb_number,
                "city": o.city,
                "state": o.state,
                "pincode": o.pincode,
                "rto_risk": o.rto_risk,
                "order_date": o.order_date.isoformat() if o.order_date else None,
                "shipped_at": o.shipped_at.isoformat() if o.shipped_at else None,
                "delivered_at": o.delivered_at.isoformat() if o.delivered_at else None,
            }
            for o in orders
        ],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/tracking")
def order_tracking(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .filter(Order.account_id == user.id, Order.status.in_(["shipped", "out_for_delivery"]))
        .order_by(Order.shipped_at.desc())
        .limit(200)
        .all()
    )
    return {
        "orders": [
            {
                "id": o.id,
                "order_number": o.order_number,
                "customer_name": o.customer_name,
                "status": o.status,
                "courier_name": o.courier_name,
                "awb_number": o.awb_number,
                "tracking_url": o.tracking_url,
                "shipped_at": o.shipped_at.isoformat() if o.shipped_at else None,
                "city": o.city,
                "total_amount": o.total_amount,
            }
            for o in orders
        ]
    }


@router.get("/analytics")
def order_analytics(
    period: str = Query("month"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start, end = parse_period(period)
    base = db.query(Order).filter(Order.account_id == user.id, Order.order_date >= start, Order.order_date <= end)

    total = base.count()
    revenue = db.query(func.coalesce(func.sum(Order.total_amount), 0)).filter(
        Order.account_id == user.id, Order.order_date >= start, Order.order_date <= end
    ).scalar()

    by_status = (
        db.query(Order.status, func.count(Order.id))
        .filter(Order.account_id == user.id, Order.order_date >= start, Order.order_date <= end)
        .group_by(Order.status)
        .all()
    )
    by_payment = (
        db.query(Order.payment_method, func.count(Order.id))
        .filter(Order.account_id == user.id, Order.order_date >= start, Order.order_date <= end)
        .group_by(Order.payment_method)
        .all()
    )

    return {
        "total_orders": total,
        "revenue": float(revenue),
        "avg_order_value": float(revenue) / total if total else 0,
        "by_status": {r[0]: r[1] for r in by_status},
        "by_payment": {r[0]: r[1] for r in by_payment},
    }


@router.get("/{order_id}")
def get_order(order_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id, Order.account_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {
        "id": order.id,
        "order_number": order.order_number,
        "customer_name": order.customer_name,
        "customer_email": order.customer_email,
        "customer_phone": order.customer_phone,
        "product_name": order.product_name,
        "quantity": order.quantity,
        "total_amount": order.total_amount,
        "subtotal": order.subtotal,
        "discount": order.discount,
        "shipping_cost": order.shipping_cost,
        "tax": order.tax,
        "status": order.status,
        "payment_method": order.payment_method,
        "payment_status": order.payment_status,
        "courier_name": order.courier_name,
        "awb_number": order.awb_number,
        "tracking_url": order.tracking_url,
        "city": order.city,
        "state": order.state,
        "pincode": order.pincode,
        "address": order.address,
        "rto_risk": order.rto_risk,
        "rto_score": order.rto_score,
        "notes": order.notes,
        "tags": order.tags,
        "order_date": order.order_date.isoformat() if order.order_date else None,
        "shipped_at": order.shipped_at.isoformat() if order.shipped_at else None,
        "delivered_at": order.delivered_at.isoformat() if order.delivered_at else None,
    }


@router.put("/{order_id}")
def update_order(order_id: int, req: OrderUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id, Order.account_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if req.status is not None:
        order.status = req.status
        if req.status == "shipped" and not order.shipped_at:
            order.shipped_at = datetime.datetime.utcnow()
        elif req.status == "delivered" and not order.delivered_at:
            order.delivered_at = datetime.datetime.utcnow()
    if req.courier_name is not None:
        order.courier_name = req.courier_name
    if req.awb_number is not None:
        order.awb_number = req.awb_number
    if req.tracking_url is not None:
        order.tracking_url = req.tracking_url
    if req.notes is not None:
        order.notes = req.notes
    if req.payment_status is not None:
        order.payment_status = req.payment_status

    db.commit()
    return {"status": "ok", "order_id": order.id}
