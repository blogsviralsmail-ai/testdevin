from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.order import Order, Customer
from app.utils.auth import get_current_user
from app.utils.helpers import parse_period

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/states")
def analytics_states(
    period: str = Query("month"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start, end = parse_period(period)
    rows = (
        db.query(Order.state, func.count(Order.id), func.sum(Order.total_amount))
        .filter(Order.account_id == user.id, Order.order_date >= start, Order.order_date <= end, Order.state != "")
        .group_by(Order.state)
        .order_by(func.count(Order.id).desc())
        .all()
    )
    return {
        "states": [
            {"state": r[0], "orders": r[1], "revenue": float(r[2] or 0)}
            for r in rows
        ]
    }


@router.get("/cities")
def analytics_cities(
    period: str = Query("month"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start, end = parse_period(period)
    rows = (
        db.query(Order.city, func.count(Order.id), func.sum(Order.total_amount))
        .filter(Order.account_id == user.id, Order.order_date >= start, Order.order_date <= end, Order.city != "")
        .group_by(Order.city)
        .order_by(func.count(Order.id).desc())
        .limit(50)
        .all()
    )
    return {
        "cities": [
            {"city": r[0], "orders": r[1], "revenue": float(r[2] or 0)}
            for r in rows
        ]
    }


@router.get("/pincodes")
def analytics_pincodes(
    period: str = Query("month"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start, end = parse_period(period)
    rows = (
        db.query(Order.pincode, func.count(Order.id), func.sum(Order.total_amount))
        .filter(Order.account_id == user.id, Order.order_date >= start, Order.order_date <= end, Order.pincode != "")
        .group_by(Order.pincode)
        .order_by(func.count(Order.id).desc())
        .limit(50)
        .all()
    )
    return {
        "pincodes": [
            {"pincode": r[0], "orders": r[1], "revenue": float(r[2] or 0)}
            for r in rows
        ]
    }


@router.get("/couriers")
def analytics_couriers(
    period: str = Query("month"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start, end = parse_period(period)
    rows = (
        db.query(
            Order.courier_name,
            func.count(Order.id),
            func.sum(Order.total_amount),
            func.sum(func.cast(Order.status == "delivered", db.bind.dialect.type_descriptor(type(1)))) if False else func.count(Order.id),
        )
        .filter(Order.account_id == user.id, Order.order_date >= start, Order.order_date <= end, Order.courier_name != "")
        .group_by(Order.courier_name)
        .order_by(func.count(Order.id).desc())
        .all()
    )

    result = []
    for r in rows:
        courier = r[0]
        total = r[1]
        delivered = db.query(Order).filter(
            Order.account_id == user.id, Order.order_date >= start, Order.order_date <= end,
            Order.courier_name == courier, Order.status == "delivered"
        ).count()
        rto = db.query(Order).filter(
            Order.account_id == user.id, Order.order_date >= start, Order.order_date <= end,
            Order.courier_name == courier, Order.status == "rto"
        ).count()
        result.append({
            "courier": courier, "total_orders": total, "revenue": float(r[2] or 0),
            "delivered": delivered, "rto": rto,
            "success_rate": (delivered / total * 100) if total else 0,
            "rto_rate": (rto / total * 100) if total else 0,
        })
    return {"couriers": result}


@router.get("/customers")
def analytics_customers(
    period: str = Query("month"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start, end = parse_period(period)
    customers = db.query(Customer).filter(Customer.account_id == user.id).order_by(Customer.total_spent.desc()).limit(100).all()

    total_customers = db.query(Customer).filter(Customer.account_id == user.id).count()
    new_customers = db.query(Customer).filter(
        Customer.account_id == user.id, Customer.created_at >= start, Customer.created_at <= end
    ).count()
    repeat_customers = db.query(Customer).filter(Customer.account_id == user.id, Customer.total_orders > 1).count()

    return {
        "total_customers": total_customers,
        "new_customers": new_customers,
        "repeat_customers": repeat_customers,
        "repeat_rate": (repeat_customers / total_customers * 100) if total_customers else 0,
        "top_customers": [
            {
                "id": c.id, "name": c.name, "phone": c.phone, "email": c.email,
                "city": c.city, "total_orders": c.total_orders, "total_spent": c.total_spent,
            }
            for c in customers
        ],
    }


@router.get("/products")
def analytics_products(
    period: str = Query("month"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start, end = parse_period(period)
    rows = (
        db.query(Order.product_name, func.count(Order.id), func.sum(Order.total_amount))
        .filter(Order.account_id == user.id, Order.order_date >= start, Order.order_date <= end, Order.product_name != "")
        .group_by(Order.product_name)
        .order_by(func.sum(Order.total_amount).desc())
        .limit(50)
        .all()
    )
    return {
        "products": [
            {"product": r[0], "orders": r[1], "revenue": float(r[2] or 0)}
            for r in rows
        ]
    }
