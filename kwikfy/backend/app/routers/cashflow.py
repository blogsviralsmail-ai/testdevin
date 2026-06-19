from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.finance import Payment, CODRemittance, WalletTransaction
from app.utils.auth import get_current_user
from app.utils.helpers import parse_period

router = APIRouter(prefix="/api/cashflow", tags=["cashflow"])


@router.get("/overview")
def cashflow_overview(
    period: str = Query("month"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start, end = parse_period(period)

    total_collected = float(db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
        Payment.account_id == user.id, Payment.created_at >= start, Payment.created_at <= end, Payment.status == "captured"
    ).scalar())

    total_settled = float(db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
        Payment.account_id == user.id, Payment.created_at >= start, Payment.created_at <= end, Payment.settled == True
    ).scalar())

    cod_pending = float(db.query(func.coalesce(func.sum(CODRemittance.amount), 0)).filter(
        CODRemittance.account_id == user.id, CODRemittance.status == "pending"
    ).scalar())

    in_transit = total_collected - total_settled

    return {
        "total_collected": total_collected,
        "total_settled": total_settled,
        "in_transit": in_transit,
        "cod_pending": cod_pending,
        "available_balance": total_settled - cod_pending,
        "period": period,
    }


@router.get("/settlements")
def list_settlements(
    period: str = Query("month"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start, end = parse_period(period)
    payments = db.query(Payment).filter(
        Payment.account_id == user.id, Payment.created_at >= start, Payment.created_at <= end, Payment.settled == True
    ).order_by(Payment.created_at.desc()).limit(100).all()

    return {
        "settlements": [
            {
                "id": p.id,
                "razorpay_payment_id": p.razorpay_payment_id,
                "amount": p.amount,
                "fee": p.fee,
                "net_amount": p.amount - p.fee,
                "settlement_id": p.settlement_id,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in payments
        ]
    }


@router.get("/cod-remittances")
def list_cod_remittances(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    remittances = db.query(CODRemittance).filter(CODRemittance.account_id == user.id).order_by(CODRemittance.created_at.desc()).limit(50).all()
    return {
        "remittances": [
            {
                "id": r.id,
                "courier_name": r.courier_name,
                "amount": r.amount,
                "orders_count": r.orders_count,
                "status": r.status,
                "remittance_date": r.remittance_date.isoformat() if r.remittance_date else None,
            }
            for r in remittances
        ]
    }


@router.get("/wallet")
def wallet_overview(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    transactions = db.query(WalletTransaction).filter(WalletTransaction.account_id == user.id).order_by(WalletTransaction.created_at.desc()).limit(50).all()
    balance = float(db.query(func.coalesce(func.sum(WalletTransaction.amount), 0)).filter(WalletTransaction.account_id == user.id).scalar())
    return {
        "balance": balance,
        "transactions": [
            {"id": t.id, "type": t.type, "amount": t.amount, "description": t.description, "reference": t.reference, "created_at": t.created_at.isoformat() if t.created_at else None}
            for t in transactions
        ],
    }


@router.get("/projection")
def cashflow_projection(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    in_transit = float(db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
        Payment.account_id == user.id, Payment.settled == False, Payment.status == "captured"
    ).scalar())
    cod_pending = float(db.query(func.coalesce(func.sum(CODRemittance.amount), 0)).filter(
        CODRemittance.account_id == user.id, CODRemittance.status == "pending"
    ).scalar())

    return {
        "in_transit": in_transit,
        "cod_pending": cod_pending,
        "expected_in_7_days": in_transit * 0.8,
        "expected_in_30_days": in_transit + cod_pending * 0.6,
    }
