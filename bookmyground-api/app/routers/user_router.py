from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from app.database import get_db
from app.auth import get_current_user
import os
import uuid
import hmac
import hashlib

router = APIRouter(prefix="/api/users", tags=["users"])


class UpdateProfileRequest(BaseModel):
    name: str | None = None
    email: str | None = None
    city: str | None = None
    photo_url: str | None = None


class AddMoneyRequest(BaseModel):
    amount: float
    gateway: str = "razorpay"


class WithdrawRequest(BaseModel):
    amount: float


class KYCRequest(BaseModel):
    bank_name: str
    account_number: str
    ifsc_code: str
    document_type: str
    document_url: str | None = None
    upi_id: str | None = None


@router.get("/me")
async def get_profile(user: dict = Depends(get_current_user)):
    with get_db() as db:
        u = db.execute("SELECT * FROM users WHERE id = ?", (user["user_id"],)).fetchone()
        if not u:
            raise HTTPException(status_code=404, detail="User not found")
        bookings_count = db.execute(
            "SELECT COUNT(*) as cnt FROM bookings WHERE user_id = ? AND status != 'cancelled'", (user["user_id"],)
        ).fetchone()["cnt"]
        referral_count = db.execute(
            "SELECT COUNT(*) as cnt FROM referrals WHERE referrer_id = ? AND status = 'completed'", (user["user_id"],)
        ).fetchone()["cnt"]
        return {
            **dict(u),
            "total_bookings": bookings_count,
            "total_referrals": referral_count,
        }


@router.put("/me")
async def update_profile(req: UpdateProfileRequest, user: dict = Depends(get_current_user)):
    with get_db() as db:
        updates = []
        params: list = []
        if req.name:
            updates.append("name = ?")
            params.append(req.name)
        if req.email:
            updates.append("email = ?")
            params.append(req.email)
        if req.city:
            updates.append("city = ?")
            params.append(req.city)
        if req.photo_url is not None:
            updates.append("photo_url = ?")
            params.append(req.photo_url)
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        params.append(user["user_id"])
        db.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)
        u = db.execute("SELECT * FROM users WHERE id = ?", (user["user_id"],)).fetchone()
        return dict(u)




class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.put("/me/password")
async def change_password(req: ChangePasswordRequest, user: dict = Depends(get_current_user)):
    """Change password for any user (user/owner/admin)"""
    import bcrypt
    with get_db() as db:
        u = db.execute("SELECT password_hash FROM users WHERE id = ?", (user["user_id"],)).fetchone()
        if not u:
            raise HTTPException(status_code=404, detail="User not found")
        # Verify current password
        if not u["password_hash"] or not bcrypt.checkpw(req.current_password.encode(), u["password_hash"].encode()):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        if len(req.new_password) < 6:
            raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
        new_hash = bcrypt.hashpw(req.new_password.encode(), bcrypt.gensalt()).decode()
        db.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, user["user_id"]))
        return {"message": "Password changed successfully"}


@router.get("/me/wallet")
async def get_wallet(user: dict = Depends(get_current_user)):
    with get_db() as db:
        u = db.execute("SELECT wallet_balance, kyc_status, kyc_reject_reason FROM users WHERE id = ?", (user["user_id"],)).fetchone()
        cashbacks = db.execute(
            "SELECT booking_id, cashback_amount, created_at FROM bookings WHERE user_id = ? AND cashback_amount > 0 ORDER BY created_at DESC",
            (user["user_id"],),
        ).fetchall()
        refunds = db.execute(
            "SELECT booking_id, refund_amount, created_at FROM bookings WHERE user_id = ? AND refund_amount > 0 ORDER BY created_at DESC",
            (user["user_id"],),
        ).fetchall()
        withdrawals = db.execute(
            "SELECT id, amount, charge, net_amount, status, created_at, processed_at, transaction_id, proof_url FROM withdraw_requests WHERE user_id = ? ORDER BY created_at DESC",
            (user["user_id"],),
        ).fetchall()
        return {
            "balance": u["wallet_balance"],
            "kyc_status": u["kyc_status"] if "kyc_status" in u.keys() else "pending",
            "kyc_reject_reason": u["kyc_reject_reason"] if "kyc_reject_reason" in u.keys() else None,
            "cashbacks": [dict(c) for c in cashbacks],
            "refunds": [dict(r) for r in refunds],
            "withdrawals": [dict(w) for w in withdrawals],
        }


@router.post("/me/wallet/add")
async def add_money(req: AddMoneyRequest, user: dict = Depends(get_current_user)):
    if req.amount < 100:
        raise HTTPException(status_code=400, detail="Minimum amount is Rs.100")
    with get_db() as db:
        # Cash topup - admin approval required
        if req.gateway == "cash":
            cash_enabled = db.execute("SELECT value FROM settings WHERE key='wallet_cash_add_enabled'").fetchone()
            if not cash_enabled or cash_enabled["value"] != "1":
                raise HTTPException(status_code=400, detail="Cash wallet top-up is currently disabled by admin.")
            db.execute(
                "INSERT INTO withdraw_requests (user_id, amount, charge, net_amount, status) VALUES (?, ?, 0, ?, 'pending_topup')",
                (user["user_id"], req.amount, req.amount),
            )
            return {"message": f"Rs.{req.amount} top-up request submitted. Admin will verify and approve.", "status": "pending", "gateway": req.gateway}
        # Online gateway (Razorpay etc.) - create Razorpay order
        gw = db.execute("SELECT * FROM payment_gateways WHERE LOWER(name) = LOWER(?) AND is_active = 1", (req.gateway,)).fetchone()
        if not gw:
            raise HTTPException(status_code=400, detail=f"{req.gateway} gateway is not active. Please configure it in Admin > Gateways.")
        if not gw["api_key"] or gw["api_key"].strip() == "" or not gw["secret_key"] or gw["secret_key"].strip() == "":
            raise HTTPException(status_code=400, detail=f"{req.gateway} API keys not configured. Contact admin.")
        try:
            import razorpay
            client = razorpay.Client(auth=(gw["api_key"], gw["secret_key"]))
            order_data = {
                "amount": int(req.amount * 100),  # paise
                "currency": "INR",
                "receipt": f"wallet_topup_{user['user_id']}_{uuid.uuid4().hex[:8]}",
                "notes": {"type": "wallet_topup", "user_id": str(user["user_id"]), "amount": str(req.amount)}
            }
            order = client.order.create(data=order_data)
            return {
                "status": "razorpay_order",
                "order_id": order["id"],
                "amount": int(req.amount * 100),
                "currency": "INR",
                "key_id": gw["api_key"],
                "gateway": req.gateway,
            }
        except ImportError:
            raise HTTPException(status_code=500, detail="Razorpay SDK not installed on server. Contact admin.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")


class WalletTopupVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    amount: float


@router.post("/me/wallet/topup-verify")
async def verify_wallet_topup(req: WalletTopupVerifyRequest, user: dict = Depends(get_current_user)):
    """Verify Razorpay payment and add money to wallet"""
    with get_db() as db:
        gw = db.execute("SELECT * FROM payment_gateways WHERE LOWER(name) = 'razorpay' AND is_active = 1").fetchone()
        if not gw:
            raise HTTPException(status_code=400, detail="Razorpay not configured")
        # Verify signature
        message = req.razorpay_order_id + "|" + req.razorpay_payment_id
        generated_signature = hmac.new(
            gw["secret_key"].encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        if generated_signature != req.razorpay_signature:
            raise HTTPException(status_code=400, detail="Payment verification failed. Invalid signature.")
        # Check for duplicate - prevent double credit
        existing = db.execute(
            "SELECT id FROM withdraw_requests WHERE transaction_id = ? AND status = 'topup_completed'",
            (req.razorpay_payment_id,)
        ).fetchone()
        if existing:
            return {"status": "already_processed", "message": "This payment was already processed."}
        # Add to wallet
        db.execute("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?", (req.amount, user["user_id"]))
        # Record in withdraw_requests as completed topup
        db.execute(
            "INSERT INTO withdraw_requests (user_id, amount, charge, net_amount, status, transaction_id, processed_at) VALUES (?, ?, 0, ?, 'topup_completed', ?, CURRENT_TIMESTAMP)",
            (user["user_id"], req.amount, req.amount, req.razorpay_payment_id),
        )
        u = db.execute("SELECT wallet_balance FROM users WHERE id = ?", (user["user_id"],)).fetchone()
        return {"status": "success", "message": f"Rs.{int(req.amount)} added to wallet successfully!", "new_balance": u["wallet_balance"]}


@router.post("/me/wallet/withdraw")
async def withdraw_money(req: WithdrawRequest, user: dict = Depends(get_current_user)):
    if req.amount < 100:
        raise HTTPException(status_code=400, detail="Minimum withdrawal is Rs.100")
    with get_db() as db:
        u = db.execute("SELECT wallet_balance, kyc_status, kyc_reject_reason FROM users WHERE id = ?", (user["user_id"],)).fetchone()
        if u["wallet_balance"] < req.amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        kyc = u["kyc_status"] if "kyc_status" in u.keys() else "pending"
        if kyc not in ("verified", "approved"):
            raise HTTPException(status_code=400, detail="KYC verification required for withdrawals. Please complete KYC first.")
        charge = round(req.amount * 0.03, 2)
        net = req.amount - charge
        # Deduct from wallet and create pending withdrawal request
        db.execute("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?", (req.amount, user["user_id"]))
        db.execute(
            "INSERT INTO withdraw_requests (user_id, amount, charge, net_amount, status) VALUES (?, ?, ?, ?, 'pending')",
            (user["user_id"], req.amount, charge, net),
        )
        return {"message": f"Withdrawal request of Rs.{net} submitted (3% charge: Rs.{charge}). Admin will process it.", "charge": charge, "net_amount": net, "status": "pending"}


@router.post("/me/kyc")
async def submit_kyc(req: KYCRequest, user: dict = Depends(get_current_user)):
    with get_db() as db:
        db.execute(
            "UPDATE users SET kyc_status='pending', bank_name=?, bank_account=?, bank_ifsc=?, kyc_doc_type=?, upi_id=? WHERE id=?",
            (req.bank_name, req.account_number, req.ifsc_code, req.document_type, req.upi_id or '', user["user_id"]),
        )
        return {"message": "KYC submitted for verification. Admin will review shortly.", "status": "pending"}


# BUG-009 FIX: KYC document file upload endpoint
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "kyc")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/me/kyc/upload")
async def upload_kyc_document(
    document: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
    if document.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, and PDF files are allowed")
    # Validate file size (max 5MB)
    contents = await document.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 5MB")
    # Save file
    ext = document.filename.split(".")[-1] if document.filename else "jpg"
    filename = f"kyc_{user['user_id']}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)
    # Update user's KYC doc URL (append multiple docs comma-separated)
    doc_url = f"/uploads/kyc/{filename}"
    with get_db() as db:
        existing = db.execute("SELECT kyc_doc_url FROM users WHERE id = ?", (user["user_id"],)).fetchone()
        old_url = existing["kyc_doc_url"] if existing and existing["kyc_doc_url"] else ""
        if old_url:
            new_url = old_url + "," + doc_url
        else:
            new_url = doc_url
        db.execute("UPDATE users SET kyc_doc_url = ? WHERE id = ?", (new_url, user["user_id"]))
    return {"message": "Document uploaded successfully", "document_url": doc_url}


@router.get("/me/referral")
async def get_referral_info(user: dict = Depends(get_current_user)):
    with get_db() as db:
        u = db.execute("SELECT referral_code FROM users WHERE id = ?", (user["user_id"],)).fetchone()
        referrals = db.execute(
            "SELECT r.*, u.name as referee_name FROM referrals r JOIN users u ON r.referee_id = u.id WHERE r.referrer_id = ?",
            (user["user_id"],),
        ).fetchall()
        reward = db.execute("SELECT value FROM settings WHERE key='user_referral_reward'").fetchone()
        reward_amount = float(reward["value"]) if reward else 50
        return {
            "referral_code": u["referral_code"],
            "reward_amount": reward_amount,
            "total_referrals": len(referrals),
            "referrals": [dict(r) for r in referrals],
        }


# BUG-010 FIX: Implement favourites with database storage
@router.get("/me/favourites")
async def get_favourites(user: dict = Depends(get_current_user)):
    with get_db() as db:
        rows = db.execute(
            """SELECT g.* FROM favourites f JOIN grounds g ON f.ground_id = g.id
            WHERE f.user_id = ? ORDER BY f.created_at DESC""",
            (user["user_id"],)
        ).fetchall()
        return [dict(r) for r in rows]


@router.post("/me/favourites/{ground_id}")
async def toggle_favourite(ground_id: int, user: dict = Depends(get_current_user)):
    with get_db() as db:
        existing = db.execute(
            "SELECT id FROM favourites WHERE user_id = ? AND ground_id = ?",
            (user["user_id"], ground_id)
        ).fetchone()
        if existing:
            db.execute("DELETE FROM favourites WHERE id = ?", (existing["id"],))
            return {"message": "Removed from favourites", "is_favourite": False}
        else:
            db.execute(
                "INSERT INTO favourites (user_id, ground_id) VALUES (?, ?)",
                (user["user_id"], ground_id)
            )
            return {"message": "Added to favourites", "is_favourite": True}



@router.get("/me/transactions")
async def get_transactions(user: dict = Depends(get_current_user)):
    """Get all wallet transactions history"""
    with get_db() as db:
        transactions = []
        uid = user["user_id"]

        for c in db.execute("SELECT booking_id, cashback_amount, created_at FROM bookings WHERE user_id=? AND cashback_amount>0 ORDER BY created_at DESC", (uid,)).fetchall():
            transactions.append({"type":"cashback","amount":c["cashback_amount"],"description":"Cashback for "+str(c["booking_id"]),"reference_id":c["booking_id"],"created_at":c["created_at"]})

        for r in db.execute("SELECT booking_id, refund_amount, created_at FROM bookings WHERE user_id=? AND refund_amount>0 ORDER BY created_at DESC", (uid,)).fetchall():
            transactions.append({"type":"refund","amount":r["refund_amount"],"description":"Refund for "+str(r["booking_id"]),"reference_id":r["booking_id"],"created_at":r["created_at"]})

        for b in db.execute("SELECT booking_id, total_amount, created_at, payment_mode, status FROM bookings WHERE user_id=? AND status!='cancelled' ORDER BY created_at DESC", (uid,)).fetchall():
            transactions.append({"type":"booking","amount":-b["total_amount"],"description":"Booking "+str(b["booking_id"])+" ("+str(b["payment_mode"])+")","reference_id":b["booking_id"],"created_at":b["created_at"]})

        for t in db.execute("SELECT id, amount, net_amount, status, created_at FROM withdraw_requests WHERE user_id=? AND status IN ('pending_topup','topup_completed') ORDER BY created_at DESC", (uid,)).fetchall():
            st = "Approved" if t["status"]=="topup_completed" else "Pending"
            transactions.append({"type":"topup","amount":t["net_amount"],"description":"Wallet top-up ("+st+")","reference_id":str(t["id"]),"created_at":t["created_at"]})

        for w in db.execute("SELECT id, amount, charge, net_amount, status, created_at, transaction_id, proof_url FROM withdraw_requests WHERE user_id=? AND status IN ('pending','completed','rejected') ORDER BY created_at DESC", (uid,)).fetchall():
            txn_desc = "Withdrawal (charge: Rs."+str(w["charge"])+") - "+str(w["status"])
            if w["transaction_id"]:
                txn_desc += " | TXN: " + str(w["transaction_id"])
            transactions.append({"type":"withdrawal","amount":-w["amount"],"description":txn_desc,"reference_id":str(w["id"]),"created_at":w["created_at"],"transaction_id":w["transaction_id"] or "","proof_url":w["proof_url"] or ""})

        for n in db.execute("SELECT booking_id, cancel_charge, created_at FROM bookings WHERE user_id=? AND status='no_show' AND cancel_charge>0 ORDER BY created_at DESC", (uid,)).fetchall():
            transactions.append({"type":"penalty","amount":-n["cancel_charge"],"description":"No-show penalty for "+str(n["booking_id"]),"reference_id":n["booking_id"],"created_at":n["created_at"]})

        # Tournament wallet debit/credit from transactions table
        try:
            for t in db.execute("SELECT id, amount, type, description, status, created_at FROM transactions WHERE user_id=? ORDER BY created_at DESC", (uid,)).fetchall():
                txn_type = "tournament_debit" if t["type"] == "debit" else "tournament_credit"
                txn_amount = -t["amount"] if t["type"] == "debit" else t["amount"]
                transactions.append({"type": txn_type, "amount": txn_amount, "description": t["description"] or "", "reference_id": str(t["id"]), "created_at": t["created_at"]})
        except Exception:
            pass  # transactions table may not exist

        transactions.sort(key=lambda x: x["created_at"] or "", reverse=True)
        return transactions



@router.get("/me/transactions/csv")
async def get_transactions_csv(user: dict = Depends(get_current_user)):
    """Download transaction history as CSV"""
    import csv as _csv
    import io as _io
    transactions = await get_transactions(user)
    output = _io.StringIO()
    writer = _csv.writer(output)
    writer.writerow(["Type", "Amount", "Description", "Reference", "Date", "Transaction ID", "Proof URL"])
    for t in transactions:
        writer.writerow([t.get("type",""), t.get("amount",""), t.get("description",""), t.get("reference_id",""), t.get("created_at",""), t.get("transaction_id",""), t.get("proof_url","")])
    output.seek(0)
    from fastapi.responses import StreamingResponse
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=my_transactions.csv"})


class CreateTicketRequest(BaseModel):
    subject: str
    message: str
    ground_id: int | None = None


class TicketReplyRequest(BaseModel):
    message: str


@router.post("/me/tickets")
async def create_ticket(req: CreateTicketRequest, user: dict = Depends(get_current_user)):
    with get_db() as db:
        db.execute(
            "INSERT INTO tickets (user_id, ground_id, subject, message, status, priority) VALUES (?, ?, ?, ?, 'open', 'normal')",
            (user["user_id"], req.ground_id, req.subject, req.message),
        )
        return {"message": "Ticket created successfully. Our team will respond shortly."}


@router.get("/me/tickets")
async def list_tickets(user: dict = Depends(get_current_user)):
    with get_db() as db:
        rows = db.execute(
            """SELECT t.*, g.name as ground_name FROM tickets t
            LEFT JOIN grounds g ON t.ground_id = g.id
            WHERE t.user_id = ? ORDER BY t.created_at DESC""",
            (user["user_id"],),
        ).fetchall()
        tickets = []
        for r in rows:
            t = dict(r)
            replies = db.execute(
                """SELECT tr.*, u.name as user_name, u.role as user_role FROM ticket_replies tr
                JOIN users u ON tr.user_id = u.id WHERE tr.ticket_id = ? ORDER BY tr.created_at ASC""",
                (t["id"],),
            ).fetchall()
            t["replies"] = [dict(rep) for rep in replies]
            tickets.append(t)
        return tickets


@router.post("/me/tickets/{ticket_id}/reply")
async def reply_ticket(ticket_id: int, req: TicketReplyRequest, user: dict = Depends(get_current_user)):
    with get_db() as db:
        ticket = db.execute("SELECT * FROM tickets WHERE id = ? AND user_id = ?", (ticket_id, user["user_id"])).fetchone()
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        if ticket["status"] == "closed":
            raise HTTPException(status_code=400, detail="Cannot reply to a closed ticket")
        db.execute(
            "INSERT INTO ticket_replies (ticket_id, user_id, message) VALUES (?, ?, ?)",
            (ticket_id, user["user_id"], req.message),
        )
        db.execute("UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", (ticket_id,))
        return {"message": "Reply sent successfully"}


@router.post("/apply-referral")
async def apply_referral(referral_code: str, user: dict = Depends(get_current_user)):
    with get_db() as db:
        referrer = db.execute("SELECT * FROM users WHERE referral_code = ?", (referral_code,)).fetchone()
        if not referrer:
            raise HTTPException(status_code=404, detail="Invalid referral code")
        if referrer["id"] == user["user_id"]:
            raise HTTPException(status_code=400, detail="Cannot refer yourself")
        existing = db.execute("SELECT * FROM referrals WHERE referee_id = ?", (user["user_id"],)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Already referred")
        reward = float(db.execute("SELECT value FROM settings WHERE key='user_referral_reward'").fetchone()["value"])
        db.execute(
            "INSERT INTO referrals (referrer_id, referee_id, referral_type, reward_amount, status) VALUES (?, ?, 'user', ?, 'pending')",
            (referrer["id"], user["user_id"], reward),
        )
        db.execute("UPDATE users SET referred_by = ? WHERE id = ?", (referral_code, user["user_id"]))
        return {"message": f"Referral applied! Referrer gets Rs.{reward} on your first booking."}
