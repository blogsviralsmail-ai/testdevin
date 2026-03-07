from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional
from app.auth import get_current_user, require_role
from app.database import get_db
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/payments", tags=["Payments"])


@router.get("/")
def list_payments(
    status: str = Query(None),
    current_user: dict = Depends(get_current_user)
):
    with get_db() as conn:
        query = """
            SELECT p.*, c.title as class_title,
                   student.full_name as student_name,
                   teacher.full_name as teacher_name
            FROM payments p
            JOIN bookings b ON b.id = p.booking_id
            JOIN classes c ON c.id = b.class_id
            JOIN users student ON student.id = p.student_id
            JOIN teacher_profiles tp ON tp.id = c.teacher_id
            JOIN users teacher ON teacher.id = tp.user_id
            WHERE 1=1
        """
        params = []

        if current_user["role"] == "student":
            query += " AND p.student_id = ?"
            params.append(current_user["user_id"])
        elif current_user["role"] == "teacher":
            query += " AND tp.user_id = ?"
            params.append(current_user["user_id"])

        if status:
            query += " AND p.status = ?"
            params.append(status)

        query += " ORDER BY p.created_at DESC"
        payments = conn.execute(query, params).fetchall()

        result = []
        for p in payments:
            item = {
                "id": p["id"],
                "booking_id": p["booking_id"],
                "class_title": p["class_title"],
                "student_name": p["student_name"],
                "teacher_name": p["teacher_name"],
                "amount": p["amount"],
                "platform_fee": p["platform_fee"],
                "teacher_amount": p["teacher_amount"],
                "status": p["status"],
                "payment_method": p["payment_method"],
                "transaction_id": p["transaction_id"],
                "created_at": p["created_at"],
                "released_at": p["released_at"],
                "payment_type": p["payment_type"] if "payment_type" in p.keys() else "pay_in",
                "card_last4": p["card_last4"] if "card_last4" in p.keys() else None,
                "card_brand": p["card_brand"] if "card_brand" in p.keys() else None,
                "payout_method": p["payout_method"] if "payout_method" in p.keys() else None,
                "payout_reference": p["payout_reference"] if "payout_reference" in p.keys() else None,
                "payout_at": p["payout_at"] if "payout_at" in p.keys() else None
            }
            result.append(item)
        return result


@router.post("/release/{payment_id}")
def release_payment(payment_id: int, current_user: dict = Depends(require_role("admin"))):
    with get_db() as conn:
        payment = conn.execute("SELECT * FROM payments WHERE id = ?", (payment_id,)).fetchone()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        if payment["status"] != "escrow":
            raise HTTPException(status_code=400, detail=f"Payment is already {payment['status']}")

        now = datetime.utcnow().isoformat()
        conn.execute(
            "UPDATE payments SET status = 'released', released_at = ? WHERE id = ?",
            (now, payment_id)
        )

        # Update teacher earnings (teacher_id in payments = teacher_profiles.id)
        conn.execute(
            """UPDATE teacher_profiles SET total_earnings = total_earnings + ?
               WHERE id = ?""",
            (payment["teacher_amount"], payment["teacher_id"])
        )

        # Look up actual user_id for notification
        tp = conn.execute("SELECT user_id FROM teacher_profiles WHERE id = ?", (payment["teacher_id"],)).fetchone()
        teacher_user_id = tp["user_id"] if tp else payment["teacher_id"]

        # Notify teacher
        conn.execute(
            "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
            (teacher_user_id, "Payment Released!",
             f"Payment of Rs. {payment['teacher_amount']} has been released to your account.", "payment")
        )

        return {"message": "Payment released to teacher successfully", "payment_id": payment_id}


@router.post("/refund/{payment_id}")
def refund_payment(payment_id: int, current_user: dict = Depends(require_role("admin"))):
    with get_db() as conn:
        payment = conn.execute("SELECT * FROM payments WHERE id = ?", (payment_id,)).fetchone()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        if payment["status"] != "escrow":
            raise HTTPException(status_code=400, detail=f"Payment is already {payment['status']}")

        conn.execute("UPDATE payments SET status = 'refunded' WHERE id = ?", (payment_id,))

        # Notify student
        conn.execute(
            "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
            (payment["student_id"], "Payment Refunded!",
             f"Payment of Rs. {payment['amount']} has been refunded to your account.", "payment")
        )

        return {"message": "Payment refunded to student successfully"}


class PayoutRequest(BaseModel):
    payment_id: int
    method: str = "bank_transfer"  # bank_transfer, upi


@router.post("/payout")
def process_payout(req: PayoutRequest, current_user: dict = Depends(require_role("admin"))):
    """Process payout to teacher's bank account (dummy)"""
    with get_db() as conn:
        payment = conn.execute("SELECT * FROM payments WHERE id = ?", (req.payment_id,)).fetchone()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        if payment["status"] != "released":
            raise HTTPException(status_code=400, detail="Payment must be released before payout")

        # Get teacher bank details
        teacher_profile = conn.execute(
            "SELECT * FROM teacher_profiles WHERE user_id = ?", (payment["teacher_id"],)
        ).fetchone()

        payout_ref = f"PAY-{uuid.uuid4().hex[:12].upper()}"
        now = datetime.utcnow().isoformat()

        conn.execute(
            """UPDATE payments SET payout_method = ?, payout_reference = ?, payout_at = ?
               WHERE id = ?""",
            (req.method, payout_ref, now, req.payment_id)
        )

        bank_info = ""
        if teacher_profile and teacher_profile.get("bank_name"):
            bank_info = f" to {teacher_profile['bank_name']} A/C ***{teacher_profile['bank_account'][-4:] if teacher_profile.get('bank_account') else '****'}"

        # Look up actual user_id for notification
        tp_user = conn.execute("SELECT user_id FROM teacher_profiles WHERE id = ?", (payment["teacher_id"],)).fetchone()
        teacher_uid = tp_user["user_id"] if tp_user else payment["teacher_id"]

        # Notify teacher
        conn.execute(
            "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
            (teacher_uid, "Payout Processed!",
             f"Payout of Rs. {payment['teacher_amount']}{bank_info} via {req.method}. Ref: {payout_ref}", "payment")
        )

        return {
            "message": "Payout processed successfully",
            "payout_reference": payout_ref,
            "amount": payment["teacher_amount"],
            "method": req.method
        }


@router.get("/stats")
def payment_stats(current_user: dict = Depends(require_role("admin"))):
    with get_db() as conn:
        total_escrow = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'escrow'"
        ).fetchone()["total"]

        total_released = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'released'"
        ).fetchone()["total"]

        total_refunded = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'refunded'"
        ).fetchone()["total"]

        total_platform_fee = conn.execute(
            "SELECT COALESCE(SUM(platform_fee), 0) as total FROM payments WHERE status = 'released'"
        ).fetchone()["total"]

        total_transactions = conn.execute("SELECT COUNT(*) as cnt FROM payments").fetchone()["cnt"]

        return {
            "total_escrow": total_escrow,
            "total_released": total_released,
            "total_refunded": total_refunded,
            "total_platform_fee": total_platform_fee,
            "total_transactions": total_transactions
        }
