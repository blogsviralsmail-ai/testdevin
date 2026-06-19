import csv
import io
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.order import Order
from app.utils.auth import get_current_user
from app.utils.helpers import parse_period

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/orders/export")
def export_orders(
    period: str = Query("month"),
    status: str = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start, end = parse_period(period)
    q = db.query(Order).filter(Order.account_id == user.id, Order.order_date >= start, Order.order_date <= end)
    if status:
        q = q.filter(Order.status == status)
    orders = q.order_by(Order.order_date.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Order#", "Date", "Customer", "Phone", "Product", "Amount", "Status", "Payment", "Courier", "AWB", "City", "State", "Pincode"])

    for o in orders:
        writer.writerow([
            o.order_number,
            o.order_date.strftime("%Y-%m-%d") if o.order_date else "",
            o.customer_name,
            o.customer_phone,
            o.product_name,
            o.total_amount,
            o.status,
            o.payment_method,
            o.courier_name,
            o.awb_number,
            o.city,
            o.state,
            o.pincode,
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=orders_export.csv"},
    )


@router.get("/customers/export")
def export_customers(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.models.order import Customer
    customers = db.query(Customer).filter(Customer.account_id == user.id).order_by(Customer.total_spent.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Email", "Phone", "City", "State", "Total Orders", "Total Spent"])
    for c in customers:
        writer.writerow([c.name, c.email, c.phone, c.city, c.state, c.total_orders, c.total_spent])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=customers_export.csv"},
    )


@router.get("/summary")
def report_summary(
    period: str = Query("month"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from sqlalchemy import func
    start, end = parse_period(period)

    total_orders = db.query(Order).filter(Order.account_id == user.id, Order.order_date >= start, Order.order_date <= end).count()
    revenue = float(db.query(func.coalesce(func.sum(Order.total_amount), 0)).filter(
        Order.account_id == user.id, Order.order_date >= start, Order.order_date <= end
    ).scalar())
    delivered = db.query(Order).filter(Order.account_id == user.id, Order.order_date >= start, Order.order_date <= end, Order.status == "delivered").count()
    rto = db.query(Order).filter(Order.account_id == user.id, Order.order_date >= start, Order.order_date <= end, Order.status == "rto").count()

    return {
        "period": period,
        "total_orders": total_orders,
        "total_revenue": revenue,
        "avg_order_value": revenue / total_orders if total_orders else 0,
        "delivered": delivered,
        "rto": rto,
        "delivery_rate": (delivered / total_orders * 100) if total_orders else 0,
        "rto_rate": (rto / total_orders * 100) if total_orders else 0,
    }
