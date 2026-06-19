from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.notification import Notification, Alert, NDRAlert, Announcement
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


class NDRActionReq(BaseModel):
    action: str
    notes: str = ""


@router.get("/")
def list_notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notifs = db.query(Notification).filter(Notification.account_id == user.id).order_by(Notification.created_at.desc()).limit(50).all()
    return {
        "notifications": [
            {"id": n.id, "title": n.title, "body": n.body, "icon": n.icon, "link": n.link, "severity": n.severity, "is_read": n.is_read, "created_at": n.created_at.isoformat() if n.created_at else None}
            for n in notifs
        ],
        "unread_count": sum(1 for n in notifs if not n.is_read),
    }


@router.post("/read-all")
def read_all_notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.account_id == user.id, Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"status": "ok"}


@router.get("/alerts")
def list_alerts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    alerts = db.query(Alert).filter(Alert.account_id == user.id).order_by(Alert.created_at.desc()).limit(50).all()
    return {
        "alerts": [
            {"id": a.id, "type": a.type, "title": a.title, "message": a.message, "severity": a.severity, "order_number": a.order_number, "is_read": a.is_read, "action_taken": a.action_taken, "created_at": a.created_at.isoformat() if a.created_at else None}
            for a in alerts
        ]
    }


@router.get("/ndr")
def list_ndr_alerts(
    status: str = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(NDRAlert).filter(NDRAlert.account_id == user.id)
    if status == "active":
        q = q.filter(NDRAlert.is_resolved == False)
    elif status == "resolved":
        q = q.filter(NDRAlert.is_resolved == True)
    ndrs = q.order_by(NDRAlert.created_at.desc()).limit(100).all()
    return {
        "ndr_alerts": [
            {
                "id": n.id, "order_number": n.order_number, "awb_number": n.awb_number,
                "courier_name": n.courier_name, "ndr_reason": n.ndr_reason,
                "attempt_count": n.attempt_count, "customer_phone": n.customer_phone,
                "customer_name": n.customer_name, "action": n.action, "rto_risk": n.rto_risk,
                "amount": n.amount, "is_resolved": n.is_resolved,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in ndrs
        ]
    }


@router.post("/ndr/{ndr_id}/action")
def ndr_action(ndr_id: int, req: NDRActionReq, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ndr = db.query(NDRAlert).filter(NDRAlert.id == ndr_id, NDRAlert.account_id == user.id).first()
    if not ndr:
        raise HTTPException(status_code=404, detail="NDR alert not found")
    ndr.action = req.action
    if req.action in ("reattempt", "rto", "resolved"):
        ndr.is_resolved = True
    db.commit()
    return {"status": "ok"}


@router.get("/ndr/analytics")
def ndr_analytics(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total = db.query(NDRAlert).filter(NDRAlert.account_id == user.id).count()
    active = db.query(NDRAlert).filter(NDRAlert.account_id == user.id, NDRAlert.is_resolved == False).count()
    resolved = total - active
    return {"total": total, "active": active, "resolved": resolved, "resolution_rate": (resolved / total * 100) if total else 0}


@router.get("/rto-shield")
def rto_shield(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.models.order import Order
    from sqlalchemy import func
    total_orders = db.query(Order).filter(Order.account_id == user.id).count()
    rto_orders = db.query(Order).filter(Order.account_id == user.id, Order.status == "rto").count()
    high_risk = db.query(Order).filter(Order.account_id == user.id, Order.rto_risk == "high").count()

    return {
        "total_orders": total_orders,
        "rto_orders": rto_orders,
        "rto_rate": (rto_orders / total_orders * 100) if total_orders else 0,
        "high_risk_orders": high_risk,
        "flagged_orders": high_risk,
        "cod_to_prepaid_converted": 0,
        "savings": 0,
    }


@router.get("/announcements")
def get_announcements(db: Session = Depends(get_db)):
    anns = db.query(Announcement).filter(Announcement.is_active == True).order_by(Announcement.created_at.desc()).limit(10).all()
    return {
        "announcements": [
            {"id": a.id, "title": a.title, "body": a.body, "type": a.type, "created_at": a.created_at.isoformat() if a.created_at else None}
            for a in anns
        ]
    }
