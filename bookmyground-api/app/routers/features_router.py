"""V13 Feature Router - All new feature endpoints"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from app.database import get_db
from app.auth import get_current_user, require_role
from datetime import datetime, timezone, timedelta
from typing import Optional, List
import json

IST = timezone(timedelta(hours=5, minutes=30))
router = APIRouter(prefix="/api", tags=["features"])


# ==================== CHAT ====================
class ChatMessage(BaseModel):
    receiver_id: int
    ground_id: Optional[int] = None
    message: str

@router.post("/chat/send")
async def send_chat(msg: ChatMessage, user: dict = Depends(get_current_user)):
    with get_db() as db:
        db.execute("INSERT INTO chat_messages (sender_id, receiver_id, ground_id, message) VALUES (?,?,?,?)",
                   (user["user_id"], msg.receiver_id, msg.ground_id, msg.message))
        return {"status": "sent"}

@router.get("/chat/messages/{other_user_id}")
async def get_chat(other_user_id: int, ground_id: int = None, user: dict = Depends(get_current_user)):
    with get_db() as db:
        query = """SELECT cm.*, u1.name as sender_name, u2.name as receiver_name 
                   FROM chat_messages cm 
                   JOIN users u1 ON cm.sender_id = u1.id 
                   JOIN users u2 ON cm.receiver_id = u2.id
                   WHERE ((cm.sender_id = ? AND cm.receiver_id = ?) OR (cm.sender_id = ? AND cm.receiver_id = ?))"""
        params = [user["user_id"], other_user_id, other_user_id, user["user_id"]]
        if ground_id:
            query += " AND cm.ground_id = ?"
            params.append(ground_id)
        query += " ORDER BY cm.created_at ASC LIMIT 100"
        rows = db.execute(query, params).fetchall()
        # Mark as read
        db.execute("UPDATE chat_messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ?", (user["user_id"], other_user_id))
        result = []
        for r in rows:
            d = dict(r)
            d["is_mine"] = d["sender_id"] == user["user_id"]
            result.append(d)
        return result

@router.get("/chat/conversations")
async def get_conversations(user: dict = Depends(get_current_user)):
    with get_db() as db:
        rows = db.execute("""
            SELECT DISTINCT CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as other_id,
            MAX(created_at) as last_msg_time,
            (SELECT message FROM chat_messages cm2 WHERE ((cm2.sender_id = cm.sender_id AND cm2.receiver_id = cm.receiver_id) OR (cm2.sender_id = cm.receiver_id AND cm2.receiver_id = cm.sender_id)) ORDER BY cm2.created_at DESC LIMIT 1) as last_message,
            SUM(CASE WHEN receiver_id = ? AND is_read = 0 THEN 1 ELSE 0 END) as unread
            FROM chat_messages cm WHERE sender_id = ? OR receiver_id = ?
            GROUP BY other_id ORDER BY last_msg_time DESC
        """, (user["user_id"], user["user_id"], user["user_id"], user["user_id"])).fetchall()
        result = []
        for r in rows:
            d = dict(r)
            other = db.execute("SELECT id, name, phone, role FROM users WHERE id = ?", (d["other_id"],)).fetchone()
            if other:
                d["user_id"] = other["id"]
                d["user_name"] = other["name"]
                d["other_name"] = other["name"]
                d["other_role"] = other["role"]
                d["phone"] = other["phone"] or ""
                # Try to find ground name from chat
                ground_row = db.execute("SELECT DISTINCT cm.ground_id, g.name as ground_name FROM chat_messages cm LEFT JOIN grounds g ON cm.ground_id = g.id WHERE ((cm.sender_id = ? AND cm.receiver_id = ?) OR (cm.sender_id = ? AND cm.receiver_id = ?)) AND cm.ground_id IS NOT NULL LIMIT 1", (user["user_id"], other["id"], other["id"], user["user_id"])).fetchone()
                if ground_row and ground_row["ground_name"]:
                    d["ground_id"] = ground_row["ground_id"]
                    d["ground_name"] = ground_row["ground_name"]
                else:
                    d["ground_id"] = 0
                    d["ground_name"] = "Direct Chat"
            result.append(d)
        return result


@router.get("/chat/contacts")
async def get_chat_contacts(user: dict = Depends(get_current_user)):
    """Get list of contacts the user can chat with - admins, owners (with ground names), users"""
    with get_db() as db:
        contacts = []
        seen_ids = set()
        user_role = user.get("role", "user")
        
        if user_role == "user":
            # Users can chat with admins and ground owners (of grounds they've booked)
            admins = db.execute("SELECT DISTINCT id, name, role, phone FROM users WHERE role = 'admin' AND id != ?", (user["user_id"],)).fetchall()
            for a in admins:
                if a["id"] not in seen_ids:
                    seen_ids.add(a["id"])
                    contacts.append({"user_id": a["id"], "user_name": a["name"], "role": "admin", "phone": a["phone"] or "", "ground_id": 0, "ground_name": "Admin Support"})
            
            # Owners of grounds user has booked
            owners = db.execute("""SELECT DISTINCT u.id, u.name, u.role, u.phone, g.id as ground_id, g.name as ground_name
                FROM bookings b JOIN grounds g ON b.ground_id = g.id JOIN users u ON g.owner_id = u.id
                WHERE b.user_id = ? AND u.id != ?""", (user["user_id"], user["user_id"])).fetchall()
            for o in owners:
                key = (o["id"], o["ground_id"])
                if key not in seen_ids:
                    seen_ids.add(key)
                    contacts.append({"user_id": o["id"], "user_name": o["name"], "role": "owner", "phone": o["phone"] or "", "ground_id": o["ground_id"], "ground_name": o["ground_name"]})
        
        elif user_role == "owner":
            # Owners can chat with admins and users who booked their grounds
            admins = db.execute("SELECT DISTINCT id, name, role, phone FROM users WHERE role = 'admin' AND id != ?", (user["user_id"],)).fetchall()
            for a in admins:
                if a["id"] not in seen_ids:
                    seen_ids.add(a["id"])
                    contacts.append({"user_id": a["id"], "user_name": a["name"], "role": "admin", "phone": a["phone"] or "", "ground_id": 0, "ground_name": "Admin Support"})
            
            # Users who booked owner's grounds
            users = db.execute("""SELECT DISTINCT u.id, u.name, u.role, u.phone, g.id as ground_id, g.name as ground_name
                FROM bookings b JOIN users u ON b.user_id = u.id JOIN grounds g ON b.ground_id = g.id
                WHERE g.owner_id = ? AND u.id != ?""", (user["user_id"], user["user_id"])).fetchall()
            for u in users:
                key = (u["id"], u["ground_id"])
                if key not in seen_ids:
                    seen_ids.add(key)
                    contacts.append({"user_id": u["id"], "user_name": u["name"], "role": "user", "phone": u["phone"] or "", "ground_id": u["ground_id"], "ground_name": u["ground_name"]})
        
        elif user_role == "admin":
            # Admins can chat with all owners and users
            all_users = db.execute("SELECT id, name, role, phone FROM users WHERE id != ? ORDER BY role, name", (user["user_id"],)).fetchall()
            for u in all_users:
                if u["id"] not in seen_ids:
                    seen_ids.add(u["id"])
                    if u["role"] == "owner":
                        # Get owner's ground name
                        ground = db.execute("SELECT id, name FROM grounds WHERE owner_id = ? LIMIT 1", (u["id"],)).fetchone()
                        contacts.append({"user_id": u["id"], "user_name": u["name"], "role": "owner", "phone": u["phone"] or "", "ground_id": ground["id"] if ground else 0, "ground_name": ground["name"] if ground else "Ground Owner"})
                    else:
                        contacts.append({"user_id": u["id"], "user_name": u["name"], "role": u["role"], "phone": u["phone"] or "", "ground_id": 0, "ground_name": ""})
        
        return contacts


# ==================== DYNAMIC PRICING (Owner) ====================
class DynamicPriceRule(BaseModel):
    ground_id: int
    day_type: str = "weekday"
    time_slot: Optional[str] = None
    price_multiplier: float = 1.0

@router.get("/owner/dynamic-pricing")
async def get_dynamic_pricing(user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        if user["role"] == "admin":
            rows = db.execute("SELECT dp.*, g.name as ground_name FROM dynamic_pricing dp JOIN grounds g ON dp.ground_id = g.id ORDER BY dp.created_at DESC").fetchall()
        else:
            rows = db.execute("SELECT dp.*, g.name as ground_name FROM dynamic_pricing dp JOIN grounds g ON dp.ground_id = g.id WHERE g.owner_id = ? ORDER BY dp.created_at DESC", (user["user_id"],)).fetchall()
        return [dict(r) for r in rows]

@router.post("/owner/dynamic-pricing")
async def add_dynamic_pricing(rule: DynamicPriceRule, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        db.execute("INSERT INTO dynamic_pricing (ground_id, day_type, time_slot, price_multiplier) VALUES (?,?,?,?)",
                   (rule.ground_id, rule.day_type, rule.time_slot, rule.price_multiplier))
        return {"status": "added"}

@router.delete("/owner/dynamic-pricing/{rule_id}")
async def delete_dynamic_pricing(rule_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        db.execute("DELETE FROM dynamic_pricing WHERE id = ?", (rule_id,))
        return {"status": "deleted"}


# ==================== STAFF MANAGEMENT (Owner) ====================
class StaffMember(BaseModel):
    name: str
    phone: Optional[str] = None
    role: str = "staff"
    ground_id: Optional[int] = None

@router.get("/owner/staff")
async def get_staff(user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        rows = db.execute("SELECT s.*, g.name as ground_name FROM staff_members s LEFT JOIN grounds g ON s.ground_id = g.id WHERE s.owner_id = ? AND s.is_active = 1 ORDER BY s.created_at DESC", (user["user_id"],)).fetchall()
        return [dict(r) for r in rows]

@router.post("/owner/staff")
async def add_staff(staff: StaffMember, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        db.execute("INSERT INTO staff_members (owner_id, name, phone, role, ground_id) VALUES (?,?,?,?,?)",
                   (user["user_id"], staff.name, staff.phone, staff.role, staff.ground_id))
        return {"status": "added"}

@router.delete("/owner/staff/{staff_id}")
async def delete_staff(staff_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        db.execute("UPDATE staff_members SET is_active = 0 WHERE id = ? AND owner_id = ?", (staff_id, user["user_id"]))
        return {"status": "removed"}


# ==================== OWNER COUPONS ====================
class OwnerCoupon(BaseModel):
    ground_id: Optional[int] = None
    code: str
    discount_type: str = "percentage"
    discount_value: float = 10
    max_uses: int = 100
    valid_from: Optional[str] = None
    valid_to: Optional[str] = None

@router.get("/owner/coupons")
async def get_owner_coupons(user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        rows = db.execute("SELECT c.*, g.name as ground_name FROM owner_coupons c LEFT JOIN grounds g ON c.ground_id = g.id WHERE c.owner_id = ? ORDER BY c.created_at DESC", (user["user_id"],)).fetchall()
        return [dict(r) for r in rows]

@router.post("/owner/coupons")
async def add_owner_coupon(coupon: OwnerCoupon, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        db.execute("INSERT INTO owner_coupons (owner_id, ground_id, code, discount_type, discount_value, max_uses, valid_from, valid_to) VALUES (?,?,?,?,?,?,?,?)",
                   (user["user_id"], coupon.ground_id, coupon.code.upper(), coupon.discount_type, coupon.discount_value, coupon.max_uses, coupon.valid_from, coupon.valid_to))
        return {"status": "created"}

@router.delete("/owner/coupons/{coupon_id}")
async def delete_owner_coupon(coupon_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        db.execute("DELETE FROM owner_coupons WHERE id = ? AND owner_id = ?", (coupon_id, user["user_id"]))
        return {"status": "deleted"}


# ==================== EXPENSES (Owner) ====================
class ExpenseEntry(BaseModel):
    ground_id: Optional[int] = None
    category: str
    amount: float
    description: Optional[str] = None
    expense_date: Optional[str] = None

@router.get("/owner/expenses")
async def get_expenses(user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        rows = db.execute("SELECT e.*, g.name as ground_name FROM expenses e LEFT JOIN grounds g ON e.ground_id = g.id WHERE e.owner_id = ? ORDER BY e.expense_date DESC, e.created_at DESC", (user["user_id"],)).fetchall()
        return [dict(r) for r in rows]

@router.post("/owner/expenses")
async def add_expense(exp: ExpenseEntry, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        date = exp.expense_date or datetime.now(IST).strftime("%Y-%m-%d")
        db.execute("INSERT INTO expenses (owner_id, ground_id, category, amount, description, expense_date) VALUES (?,?,?,?,?,?)",
                   (user["user_id"], exp.ground_id, exp.category, exp.amount, exp.description, date))
        return {"status": "added"}

@router.delete("/owner/expenses/{expense_id}")
async def delete_expense(expense_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        db.execute("DELETE FROM expenses WHERE id = ? AND owner_id = ?", (expense_id, user["user_id"]))
        return {"status": "deleted"}


# ==================== MAINTENANCE SCHEDULE (Owner) ====================
class MaintenanceEntry(BaseModel):
    ground_id: int
    title: str
    description: Optional[str] = None
    start_date: str
    end_date: Optional[str] = None

@router.get("/owner/maintenance")
async def get_maintenance(user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        rows = db.execute("SELECT m.*, g.name as ground_name FROM maintenance_schedule m JOIN grounds g ON m.ground_id = g.id WHERE g.owner_id = ? ORDER BY m.start_date DESC", (user["user_id"],)).fetchall()
        return [dict(r) for r in rows]

@router.post("/owner/maintenance")
async def add_maintenance(entry: MaintenanceEntry, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        db.execute("INSERT INTO maintenance_schedule (ground_id, title, description, start_date, end_date) VALUES (?,?,?,?,?)",
                   (entry.ground_id, entry.title, entry.description, entry.start_date, entry.end_date))
        return {"status": "added"}

@router.put("/owner/maintenance/{entry_id}")
async def update_maintenance(entry_id: int, user: dict = Depends(get_current_user)):
    with get_db() as db:
        db.execute("UPDATE maintenance_schedule SET status = 'completed' WHERE id = ?", (entry_id,))
        return {"status": "updated"}

@router.delete("/owner/maintenance/{entry_id}")
async def delete_maintenance(entry_id: int, user: dict = Depends(get_current_user)):
    with get_db() as db:
        db.execute("DELETE FROM maintenance_schedule WHERE id = ?", (entry_id,))
        return {"status": "deleted"}


# ==================== AUTO REPLIES (Owner) ====================
class AutoReply(BaseModel):
    trigger_type: str = "booking_confirm"
    message: str

@router.get("/owner/auto-replies")
async def get_auto_replies(user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        rows = db.execute("SELECT * FROM auto_replies WHERE owner_id = ? ORDER BY created_at DESC", (user["user_id"],)).fetchall()
        return [dict(r) for r in rows]

@router.post("/owner/auto-replies")
async def add_auto_reply(reply: AutoReply, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        db.execute("INSERT INTO auto_replies (owner_id, trigger_type, message) VALUES (?,?,?)",
                   (user["user_id"], reply.trigger_type, reply.message))
        return {"status": "added"}

@router.delete("/owner/auto-replies/{reply_id}")
async def delete_auto_reply(reply_id: int, user: dict = Depends(get_current_user)):
    with get_db() as db:
        db.execute("DELETE FROM auto_replies WHERE id = ? AND owner_id = ?", (reply_id, user["user_id"]))
        return {"status": "deleted"}


# ==================== OWNER CRM (Customer Data) ====================
@router.get("/owner/crm")
async def get_owner_crm(user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        rows = db.execute("""
            SELECT u.id, u.name, u.phone, u.email, COUNT(b.id) as total_bookings,
            COALESCE(SUM(b.total_amount), 0) as total_spent, MAX(b.booking_date) as last_booking,
            MIN(b.booking_date) as first_booking
            FROM bookings b JOIN users u ON b.user_id = u.id JOIN grounds g ON b.ground_id = g.id
            WHERE g.owner_id = ? AND b.status != 'cancelled'
            GROUP BY u.id ORDER BY total_bookings DESC
        """, (user["user_id"],)).fetchall()
        return [dict(r) for r in rows]


# ==================== OWNER REVENUE ANALYTICS ====================
@router.get("/owner/analytics")
async def get_owner_analytics(user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        # Monthly revenue
        monthly = db.execute("""
            SELECT strftime('%Y-%m', b.booking_date) as month, COUNT(*) as bookings, 
            COALESCE(SUM(b.total_amount), 0) as revenue
            FROM bookings b JOIN grounds g ON b.ground_id = g.id
            WHERE g.owner_id = ? AND b.status != 'cancelled'
            GROUP BY month ORDER BY month DESC LIMIT 12
        """, (user["user_id"],)).fetchall()
        
        # Ground-wise revenue
        ground_rev = db.execute("""
            SELECT g.name, COUNT(b.id) as bookings, COALESCE(SUM(b.total_amount), 0) as revenue
            FROM bookings b JOIN grounds g ON b.ground_id = g.id
            WHERE g.owner_id = ? AND b.status != 'cancelled'
            GROUP BY g.id ORDER BY revenue DESC
        """, (user["user_id"],)).fetchall()

        # Peak hours
        peak = db.execute("""
            SELECT b.start_time as hour, COUNT(*) as count
            FROM bookings b JOIN grounds g ON b.ground_id = g.id
            WHERE g.owner_id = ? AND b.status != 'cancelled'
            GROUP BY hour ORDER BY count DESC LIMIT 10
        """, (user["user_id"],)).fetchall()

        # Today stats
        today = datetime.now(IST).strftime("%Y-%m-%d")
        today_stats = db.execute("""
            SELECT COUNT(*) as bookings, COALESCE(SUM(total_amount), 0) as revenue
            FROM bookings b JOIN grounds g ON b.ground_id = g.id
            WHERE g.owner_id = ? AND b.booking_date = ? AND b.status != 'cancelled'
        """, (user["user_id"], today)).fetchone()

        return {
            "monthly_revenue": [dict(r) for r in monthly],
            "ground_revenue": [dict(r) for r in ground_rev],
            "peak_hours": [dict(r) for r in peak],
            "today_bookings": today_stats["bookings"],
            "today_revenue": today_stats["revenue"],
        }


# ==================== GALLERY (Owner) ====================
@router.get("/owner/gallery/{ground_id}")
async def get_gallery(ground_id: int, user: dict = Depends(get_current_user)):
    with get_db() as db:
        rows = db.execute("SELECT id, ground_id, image_url, caption, created_at FROM ground_gallery WHERE ground_id = ? ORDER BY id DESC", (ground_id,)).fetchall()
        return [dict(r) for r in rows]

@router.post("/owner/gallery")
async def add_gallery_image(data: dict, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        ground_id = data.get("ground_id")
        image_data = data.get("image_data", data.get("image_url", ""))
        caption = data.get("caption", "")
        if not ground_id or not image_data:
            raise HTTPException(400, "ground_id and image required")
        import base64, uuid, os
        if image_data.startswith("data:image"):
            os.makedirs("/data/uploads/gallery", exist_ok=True)
            ext = "jpg"
            if "png" in image_data[:30]:
                ext = "png"
            elif "webp" in image_data[:30]:
                ext = "webp"
            filename = f"{uuid.uuid4().hex}.{ext}"
            b64_data = image_data.split(",", 1)[1] if "," in image_data else image_data
            filepath = f"/data/uploads/gallery/{filename}"
            with open(filepath, "wb") as f:
                f.write(base64.b64decode(b64_data))
            image_url = f"/uploads/gallery/{filename}"
        else:
            image_url = image_data
        db.execute("INSERT INTO ground_gallery (ground_id, image_url, caption) VALUES (?,?,?)",
                   (ground_id, image_url, caption))
        img_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
        return {"id": img_id, "image_url": image_url, "status": "added"}

@router.delete("/owner/gallery/{image_id}")
async def delete_gallery_image(image_id: int, user: dict = Depends(get_current_user)):
    with get_db() as db:
        row = db.execute("SELECT * FROM ground_gallery WHERE id = ?", (image_id,)).fetchone()
        if row:
            import os
            url = row["image_url"]
            if url and (url.startswith("/uploads/") or url.startswith("/data/uploads/")):
                filepath = f"/data{url}" if url.startswith("/uploads/") else url
                if os.path.exists(filepath):
                    os.remove(filepath)
        db.execute("DELETE FROM ground_gallery WHERE id = ?", (image_id,))
        return {"status": "deleted"}


# ==================== TOURNAMENTS ====================
class TournamentCreate(BaseModel):
    ground_id: Optional[int] = None
    name: str
    sport_type: str = "cricket"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    max_teams: int = 8
    entry_fee: float = 0
    prize_pool: float = 0
    description: Optional[str] = None

@router.get("/tournaments")
async def list_tournaments():
    with get_db() as db:
        rows = db.execute("""SELECT t.*, g.name as ground_name, u.name as organizer_name,
            (SELECT COUNT(*) FROM tournament_registrations WHERE tournament_id = t.id) as registered_teams
            FROM tournaments t LEFT JOIN grounds g ON t.ground_id = g.id JOIN users u ON t.organizer_id = u.id
            ORDER BY t.start_date DESC""").fetchall()
        return [dict(r) for r in rows]

@router.post("/tournaments")
async def create_tournament(data: TournamentCreate, user: dict = Depends(get_current_user)):
    with get_db() as db:
        db.execute("""INSERT INTO tournaments (organizer_id, ground_id, name, sport_type, start_date, end_date, max_teams, entry_fee, prize_pool, description) 
                      VALUES (?,?,?,?,?,?,?,?,?,?)""",
                   (user["user_id"], data.ground_id, data.name, data.sport_type, data.start_date, data.end_date, data.max_teams, data.entry_fee, data.prize_pool, data.description))
        return {"status": "created"}

@router.post("/tournaments/{tournament_id}/register")
async def register_tournament(tournament_id: int, data: dict, user: dict = Depends(get_current_user)):
    with get_db() as db:
        existing = db.execute("SELECT id FROM tournament_registrations WHERE tournament_id = ? AND user_id = ? AND status NOT IN ('cancelled')", (tournament_id, user["user_id"])).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Already registered for this tournament")
        tournament = db.execute("SELECT * FROM tournaments WHERE id = ?", (tournament_id,)).fetchone()
        if not tournament:
            raise HTTPException(404, "Tournament not found")
        payment_method = data.get("payment_method", "online")
        team_name = data.get("team_name", "")
        fee = tournament["entry_fee"] or 0
        if fee > 0 and payment_method == "wallet":
            # Wallet payment - direct deduction
            u = db.execute("SELECT wallet_balance FROM users WHERE id = ?", (user["user_id"],)).fetchone()
            balance = u["wallet_balance"] if u else 0
            if balance < fee:
                raise HTTPException(400, f"Insufficient wallet balance. Need Rs.{fee}, have Rs.{balance}. Please add money to wallet first.")
            db.execute("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?", (fee, user["user_id"]))
            db.execute("INSERT INTO tournament_registrations (tournament_id, user_id, team_name, status, payment_method) VALUES (?,?,?,?,?)",
                       (tournament_id, user["user_id"], team_name, "registered", "wallet"))
            db.execute("INSERT INTO transactions (user_id, amount, type, description, status) VALUES (?,?,?,?,?)",
                       (user["user_id"], fee, "debit", f"Tournament registration: {tournament['name']}", "completed"))
            new_bal = db.execute("SELECT wallet_balance FROM users WHERE id = ?", (user["user_id"],)).fetchone()
            return {"status": "registered", "message": f"Registered! Rs.{int(fee)} deducted from wallet.", "new_balance": new_bal["wallet_balance"] if new_bal else balance - fee}
        elif fee > 0 and payment_method == "cash":
            # Cash payment - status is waiting_verification, owner needs to verify
            db.execute("INSERT INTO tournament_registrations (tournament_id, user_id, team_name, status, payment_method) VALUES (?,?,?,?,?)",
                       (tournament_id, user["user_id"], team_name, "waiting_verification", "cash"))
            return {"status": "waiting_verification", "message": f"Registration submitted! Waiting for owner/organizer to verify your cash payment of Rs.{fee}."}
        elif fee > 0 and payment_method == "online":
            # Online payment - create Razorpay order
            try:
                gw = db.execute("SELECT * FROM payment_gateways WHERE name = 'razorpay' AND is_active = 1").fetchone()
                if gw:
                    import razorpay
                    client = razorpay.Client(auth=(gw["api_key"], gw["secret_key"]))
                    order = client.order.create({"amount": int(fee * 100), "currency": "INR", "receipt": f"tournament_{tournament_id}_{user['user_id']}"})
                    db.execute("INSERT INTO tournament_registrations (tournament_id, user_id, team_name, status, payment_method, razorpay_order_id) VALUES (?,?,?,?,?,?)",
                               (tournament_id, user["user_id"], team_name, "payment_pending", "online", order["id"]))
                    return {"status": "payment_pending", "order_id": order["id"], "amount": int(fee * 100), "key_id": gw["api_key"], "message": "Complete payment to confirm registration"}
                else:
                    # No gateway configured - register with wallet deduction
                    u = db.execute("SELECT wallet_balance FROM users WHERE id = ?", (user["user_id"],)).fetchone()
                    balance = u["wallet_balance"] if u else 0
                    if balance < fee:
                        raise HTTPException(400, f"Insufficient wallet balance. Need Rs.{fee}, have Rs.{balance}. Online payment gateway not configured.")
                    db.execute("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?", (fee, user["user_id"]))
                    db.execute("INSERT INTO tournament_registrations (tournament_id, user_id, team_name, status, payment_method) VALUES (?,?,?,?,?)",
                               (tournament_id, user["user_id"], team_name, "registered", "wallet"))
                    db.execute("INSERT INTO transactions (user_id, amount, type, description, status) VALUES (?,?,?,?,?)",
                               (user["user_id"], fee, "debit", f"Tournament registration: {tournament['name']}", "completed"))
                    return {"status": "registered", "message": f"Registered! Rs.{fee} deducted from wallet."}
            except ImportError:
                # Razorpay not installed - use wallet
                u = db.execute("SELECT wallet_balance FROM users WHERE id = ?", (user["user_id"],)).fetchone()
                balance = u["wallet_balance"] if u else 0
                if balance < fee:
                    raise HTTPException(400, f"Insufficient wallet balance. Need Rs.{fee}, have Rs.{balance}")
                db.execute("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?", (fee, user["user_id"]))
                db.execute("INSERT INTO tournament_registrations (tournament_id, user_id, team_name, status, payment_method) VALUES (?,?,?,?,?)",
                           (tournament_id, user["user_id"], team_name, "registered", "wallet"))
                return {"status": "registered", "message": f"Registered! Rs.{fee} deducted from wallet."}
        else:
            # Free tournament
            db.execute("INSERT INTO tournament_registrations (tournament_id, user_id, team_name, status, payment_method) VALUES (?,?,?,?,?)",
                       (tournament_id, user["user_id"], team_name, "registered", "free"))
            return {"status": "registered", "message": "Registered successfully!"}


@router.post("/tournaments/{tournament_id}/verify-payment")
async def verify_tournament_payment(tournament_id: int, data: dict, user: dict = Depends(get_current_user)):
    """Verify Razorpay payment for tournament registration"""
    razorpay_payment_id = data.get("razorpay_payment_id", "")
    razorpay_order_id = data.get("razorpay_order_id", "")
    razorpay_signature = data.get("razorpay_signature", "")
    with get_db() as db:
        reg = db.execute("SELECT * FROM tournament_registrations WHERE tournament_id = ? AND user_id = ? AND status = 'payment_pending'",
                         (tournament_id, user["user_id"])).fetchone()
        if not reg:
            raise HTTPException(404, "No pending registration found")
        try:
            gw = db.execute("SELECT * FROM payment_gateways WHERE name = 'razorpay' AND is_active = 1").fetchone()
            if gw:
                import razorpay, hmac, hashlib
                generated_signature = hmac.new(gw["secret_key"].encode(), (razorpay_order_id + "|" + razorpay_payment_id).encode(), hashlib.sha256).hexdigest()
                if generated_signature != razorpay_signature:
                    raise HTTPException(400, "Payment verification failed")
            db.execute("UPDATE tournament_registrations SET status = 'registered', razorpay_payment_id = ? WHERE id = ?",
                       (razorpay_payment_id, reg["id"]))
            tournament = db.execute("SELECT name, entry_fee FROM tournaments WHERE id = ?", (tournament_id,)).fetchone()
            fee = tournament["entry_fee"] if tournament else 0
            db.execute("INSERT INTO transactions (user_id, amount, type, description, status) VALUES (?,?,?,?,?)",
                       (user["user_id"], fee, "debit", f"Tournament registration: {tournament['name'] if tournament else ''}", "completed"))
            return {"status": "registered", "message": "Payment verified! Registration confirmed."}
        except ImportError:
            db.execute("UPDATE tournament_registrations SET status = 'registered' WHERE id = ?", (reg["id"],))
            return {"status": "registered", "message": "Registration confirmed."}


@router.post("/tournaments/register-with-payment")
async def register_tournament_with_payment(data: dict, user: dict = Depends(get_current_user)):
    """Legacy endpoint - redirects to new register endpoint"""
    tournament_id = data.get("tournament_id")
    team_name = data.get("team_name", "")
    payment_method = data.get("payment_method", "online")
    if not tournament_id:
        raise HTTPException(400, "tournament_id required")
    # Forward to new register endpoint
    return await register_tournament(tournament_id, {"team_name": team_name, "payment_method": payment_method}, user)

@router.get("/tournaments/my-registrations")
async def my_tournament_registrations(user: dict = Depends(get_current_user)):
    """Get user's tournament registrations"""
    with get_db() as db:
        rows = db.execute("""SELECT tr.*, t.name as tournament_name, t.sport_type, t.start_date, t.end_date,
            t.entry_fee, t.prize_pool, t.status as tournament_status, t.max_teams,
            (SELECT COUNT(*) FROM tournament_registrations WHERE tournament_id = t.id AND status != 'cancelled') as registered_teams,
            g.name as ground_name, u.name as organizer_name
            FROM tournament_registrations tr 
            JOIN tournaments t ON tr.tournament_id = t.id 
            LEFT JOIN grounds g ON t.ground_id = g.id
            JOIN users u ON t.organizer_id = u.id
            WHERE tr.user_id = ? ORDER BY tr.created_at DESC""", (user["user_id"],)).fetchall()
        return [dict(r) for r in rows]


@router.post("/tournaments/{tournament_id}/cancel")
async def cancel_tournament_registration(tournament_id: int, user: dict = Depends(get_current_user)):
    """Cancel tournament registration - 100% refund within 48hrs for users, anytime for admin/owner"""
    with get_db() as db:
        reg = db.execute("SELECT * FROM tournament_registrations WHERE tournament_id = ? AND user_id = ? AND status = 'registered'", (tournament_id, user["user_id"])).fetchone()
        if not reg:
            raise HTTPException(status_code=404, detail="Registration not found or already cancelled")
        
        tournament = db.execute("SELECT * FROM tournaments WHERE id = ?", (tournament_id,)).fetchone()
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
        
        # Check refund eligibility
        try:
            reg_str = str(reg["created_at"] or "").replace("Z", "").replace("+00:00", "").strip()
            reg_time = datetime.strptime(reg_str, "%Y-%m-%d %H:%M:%S") if reg_str else datetime.now()
        except Exception:
            reg_time = datetime.now()
        now = datetime.now()
        hours_since = (now - reg_time).total_seconds() / 3600
        
        refund_amount = 0
        if user["role"] in ["admin", "owner"]:
            refund_amount = tournament["entry_fee"] or 0  # 100% refund for admin/owner anytime
        elif hours_since <= 48:
            refund_amount = tournament["entry_fee"] or 0  # 100% refund within 48hrs for users
        else:
            refund_amount = 0  # No refund after 48hrs for users
        
        # Cancel the registration
        db.execute("UPDATE tournament_registrations SET status = 'cancelled' WHERE id = ?", (reg["id"],))
        
        # Process refund to wallet if applicable
        if refund_amount > 0:
            db.execute("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?", (refund_amount, user["user_id"]))
            db.execute("INSERT INTO transactions (user_id, amount, type, description, status) VALUES (?,?,?,?,?)",
                       (user["user_id"], refund_amount, "credit", f"Tournament cancellation refund - {tournament['name']}", "completed"))
        
        new_bal = db.execute("SELECT wallet_balance FROM users WHERE id = ?", (user["user_id"],)).fetchone()
        return {
            "status": "cancelled",
            "refund_amount": refund_amount,
            "new_balance": new_bal["wallet_balance"] if new_bal else 0,
            "tournament_name": tournament["name"],
            "team_name": reg["team_name"] if reg["team_name"] else "",
            "message": f"Registration cancelled. Rs.{refund_amount} refunded to wallet." if refund_amount > 0 else "Registration cancelled. No refund applicable (cancellation after 48 hours)."
        }


@router.post("/admin/tournaments/{tournament_id}/cancel-registration/{reg_id}")
async def admin_cancel_tournament_reg(tournament_id: int, reg_id: int, user: dict = Depends(get_current_user)):
    """Admin/Owner cancel a tournament registration - always 100% refund"""
    require_role(user, ["admin", "owner"])
    with get_db() as db:
        reg = db.execute("SELECT * FROM tournament_registrations WHERE id = ? AND tournament_id = ?", (reg_id, tournament_id)).fetchone()
        if not reg:
            raise HTTPException(status_code=404, detail="Registration not found")
        
        tournament = db.execute("SELECT * FROM tournaments WHERE id = ?", (tournament_id,)).fetchone()
        refund_amount = tournament["entry_fee"] or 0 if tournament else 0
        
        db.execute("UPDATE tournament_registrations SET status = 'cancelled' WHERE id = ?", (reg_id,))
        
        if refund_amount > 0 and reg["user_id"]:
            db.execute("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?", (refund_amount, reg["user_id"]))
            try:
                db.execute("INSERT INTO transactions (user_id, amount, type, description, status) VALUES (?,?,?,?,?)",
                           (reg["user_id"], refund_amount, "credit", f"Tournament registration cancelled by {'admin' if user['role'] == 'admin' else 'owner'} - 100% refund", "completed"))
            except Exception:
                pass  # transactions table may not exist
        
        return {"status": "cancelled", "refund_amount": refund_amount}


# ==================== MEMBERSHIP PLANS ====================

@router.get("/owner/tournaments/{tournament_id}/registrations")
async def owner_tournament_registrations(tournament_id: int, user: dict = Depends(get_current_user)):
    """Owner can view registrations for tournaments on their grounds"""
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        rows = db.execute("""
            SELECT tr.*, u.name as user_name, u.phone as user_phone, u.email as user_email
            FROM tournament_registrations tr LEFT JOIN users u ON tr.user_id = u.id
            WHERE tr.tournament_id = ?
        """, (tournament_id,)).fetchall()
        return [dict(r) for r in rows]

@router.post("/owner/tournaments/{tournament_id}/cancel-registration/{reg_id}")
async def owner_cancel_tournament_reg(tournament_id: int, reg_id: int, user: dict = Depends(get_current_user)):
    """Owner cancel a tournament registration - always 100% refund"""
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        reg = db.execute("SELECT * FROM tournament_registrations WHERE id = ? AND tournament_id = ?", (reg_id, tournament_id)).fetchone()
        if not reg:
            raise HTTPException(status_code=404, detail="Registration not found")
        if reg["status"] == "cancelled":
            raise HTTPException(status_code=400, detail="Already cancelled")
        tournament = db.execute("SELECT * FROM tournaments WHERE id = ?", (tournament_id,)).fetchone()
        refund_amount = tournament["entry_fee"] or 0 if tournament else 0
        db.execute("UPDATE tournament_registrations SET status = 'cancelled' WHERE id = ?", (reg_id,))
        if refund_amount > 0 and reg["user_id"]:
            db.execute("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?", (refund_amount, reg["user_id"]))
            try:
                db.execute("INSERT INTO transactions (user_id, amount, type, description, status) VALUES (?,?,?,?,?)",
                           (reg["user_id"], refund_amount, "credit", f"Tournament cancelled by owner - 100% refund", "completed"))
            except Exception:
                pass  # transactions table may not exist
        return {"status": "cancelled", "refund_amount": refund_amount, "message": f"Registration cancelled. Rs.{refund_amount} refunded to user."}

@router.post("/owner/tournaments/{tournament_id}/verify-registration/{reg_id}")
async def owner_verify_tournament_reg(tournament_id: int, reg_id: int, user: dict = Depends(get_current_user)):
    """Owner verifies cash payment for tournament registration"""
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        reg = db.execute("SELECT * FROM tournament_registrations WHERE id = ? AND tournament_id = ?", (reg_id, tournament_id)).fetchone()
        if not reg:
            raise HTTPException(404, "Registration not found")
        if reg["status"] != "waiting_verification":
            raise HTTPException(400, f"Registration is already {reg['status']}")
        db.execute("UPDATE tournament_registrations SET status = 'registered' WHERE id = ?", (reg_id,))
        tournament = db.execute("SELECT name, entry_fee FROM tournaments WHERE id = ?", (tournament_id,)).fetchone()
        fee = tournament["entry_fee"] if tournament else 0
        if fee > 0:
            try:
                db.execute("INSERT INTO transactions (user_id, amount, type, description, status) VALUES (?,?,?,?,?)",
                           (reg["user_id"], fee, "debit", f"Tournament cash payment verified: {tournament['name'] if tournament else ''}", "completed"))
            except Exception:
                pass
        return {"status": "registered", "message": "Cash payment verified! Registration confirmed."}

@router.post("/owner/tournaments")
async def owner_create_tournament(request: Request, user: dict = Depends(get_current_user)):
    """Owner creates a tournament"""
    require_role(user, ["owner", "admin"])
    data = await request.json()
    with get_db() as db:
        db.execute(
            """INSERT INTO tournaments (organizer_id, ground_id, name, sport_type, start_date, end_date,
               max_teams, entry_fee, prize_pool, description, status)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (user["user_id"], data.get("ground_id"), data.get("name", ""), data.get("sport_type", "cricket"),
             data.get("start_date"), data.get("end_date"), data.get("max_teams", 8),
             data.get("entry_fee", 0), data.get("prize_pool", 0), data.get("description", ""), "upcoming"))
        return {"status": "created"}

@router.put("/owner/tournaments/{tournament_id}")
async def owner_update_tournament(tournament_id: int, request: Request, user: dict = Depends(get_current_user)):
    """Owner updates their tournament"""
    require_role(user, ["owner", "admin"])
    data = await request.json()
    with get_db() as db:
        updates = []
        params = []
        for field in ["name", "sport_type", "start_date", "end_date", "max_teams", "entry_fee", "prize_pool", "description", "status", "ground_id"]:
            if field in data:
                updates.append(f"{field} = ?")
                params.append(data[field])
        if updates:
            params.append(tournament_id)
            db.execute(f"UPDATE tournaments SET {', '.join(updates)} WHERE id = ?", params)
        return {"status": "updated"}

@router.delete("/owner/tournaments/{tournament_id}")
async def owner_delete_tournament(tournament_id: int, user: dict = Depends(get_current_user)):
    """Owner deletes their tournament"""
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        db.execute("DELETE FROM tournament_registrations WHERE tournament_id = ?", (tournament_id,))
        db.execute("DELETE FROM tournaments WHERE id = ?", (tournament_id,))
        return {"status": "deleted"}

@router.get("/owner/tournaments")
async def owner_list_tournaments(user: dict = Depends(get_current_user)):
    """Owner lists their tournaments"""
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        rows = db.execute("""SELECT t.*, g.name as ground_name,
            (SELECT COUNT(*) FROM tournament_registrations WHERE tournament_id = t.id) as registered_teams
            FROM tournaments t LEFT JOIN grounds g ON t.ground_id = g.id
            WHERE t.organizer_id = ?
            ORDER BY t.start_date DESC""", (user["user_id"],)).fetchall()
        return [dict(r) for r in rows]


@router.get("/memberships")
async def list_memberships():
    with get_db() as db:
        rows = db.execute("SELECT mp.*, g.name as ground_name FROM membership_plans mp LEFT JOIN grounds g ON mp.ground_id = g.id WHERE mp.is_active = 1 ORDER BY mp.price").fetchall()
        return [dict(r) for r in rows]

@router.post("/memberships")
async def create_membership(data: dict, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        db.execute("""INSERT INTO membership_plans (ground_id, name, duration_days, price, benefits, max_bookings, discount_pct) 
                      VALUES (?,?,?,?,?,?,?)""",
                   (data.get("ground_id"), data["name"], data.get("duration_days", 30), data["price"],
                    data.get("benefits", ""), data.get("max_bookings", 10), data.get("discount_pct", 10)))
        return {"status": "created"}

@router.post("/memberships/{plan_id}/subscribe")
async def subscribe_membership(plan_id: int, user: dict = Depends(get_current_user)):
    with get_db() as db:
        plan = db.execute("SELECT * FROM membership_plans WHERE id = ?", (plan_id,)).fetchone()
        if not plan:
            raise HTTPException(404, "Plan not found")
        start = datetime.now(IST).strftime("%Y-%m-%d")
        from datetime import timedelta as td
        end = (datetime.now(IST) + td(days=plan["duration_days"])).strftime("%Y-%m-%d")
        db.execute("INSERT INTO user_memberships (user_id, plan_id, start_date, end_date) VALUES (?,?,?,?)",
                   (user["user_id"], plan_id, start, end))
        return {"status": "subscribed", "end_date": end}

@router.get("/users/me/memberships")
async def my_memberships(user: dict = Depends(get_current_user)):
    with get_db() as db:
        rows = db.execute("""SELECT um.*, mp.name as plan_name, mp.benefits, mp.discount_pct, g.name as ground_name
            FROM user_memberships um JOIN membership_plans mp ON um.plan_id = mp.id LEFT JOIN grounds g ON mp.ground_id = g.id
            WHERE um.user_id = ? ORDER BY um.created_at DESC""", (user["user_id"],)).fetchall()
        return [dict(r) for r in rows]


# ==================== WAITLIST ====================
@router.post("/waitlist")
async def join_waitlist(data: dict, user: dict = Depends(get_current_user)):
    with get_db() as db:
        db.execute("INSERT INTO waitlist (user_id, ground_id, slot_date, preferred_time) VALUES (?,?,?,?)",
                   (user["user_id"], data["ground_id"], data["slot_date"], data.get("preferred_time", "")))
        return {"status": "added to waitlist"}

@router.get("/waitlist")
async def my_waitlist(user: dict = Depends(get_current_user)):
    with get_db() as db:
        rows = db.execute("""SELECT w.*, g.name as ground_name FROM waitlist w JOIN grounds g ON w.ground_id = g.id
            WHERE w.user_id = ? ORDER BY w.created_at DESC""", (user["user_id"],)).fetchall()
        return [dict(r) for r in rows]

@router.delete("/waitlist/{waitlist_id}")
async def leave_waitlist(waitlist_id: int, user: dict = Depends(get_current_user)):
    with get_db() as db:
        db.execute("DELETE FROM waitlist WHERE id = ? AND user_id = ?", (waitlist_id, user["user_id"]))
        return {"status": "removed"}


# ==================== INVOICES ====================
@router.get("/invoices/{booking_id}")
async def get_invoice(booking_id: str, user: dict = Depends(get_current_user)):
    with get_db() as db:
        inv = db.execute("SELECT * FROM invoices WHERE booking_id = ?", (booking_id,)).fetchone()
        if inv:
            return dict(inv)
        # Auto-generate invoice
        booking = db.execute("""SELECT b.*, g.name as ground_name, g.address as ground_address, u.name as user_name, u.phone as user_phone, u.email as user_email
            FROM bookings b JOIN grounds g ON b.ground_id = g.id JOIN users u ON b.user_id = u.id WHERE b.booking_id = ?""", (booking_id,)).fetchone()
        if not booking:
            raise HTTPException(404, "Booking not found")
        inv_num = f"INV-{datetime.now(IST).strftime('%Y%m%d')}-{booking['id']}"
        subtotal = booking["total_amount"]
        tax = round(subtotal * 0.18, 2)
        total = subtotal + tax
        db.execute("INSERT OR IGNORE INTO invoices (booking_id, invoice_number, user_id, ground_id, subtotal, tax_amount, total) VALUES (?,?,?,?,?,?,?)",
                   (booking_id, inv_num, booking["user_id"], booking["ground_id"], subtotal, tax, total))
        return {
            "invoice_number": inv_num, "booking_id": booking_id, "user_name": booking["user_name"],
            "user_phone": booking["user_phone"], "user_email": booking["user_email"],
            "ground_name": booking["ground_name"], "ground_address": booking["ground_address"],
            "booking_date": booking["booking_date"], "start_time": booking["start_time"], "end_time": booking["end_time"],
            "subtotal": subtotal, "tax_amount": tax, "total": total, "status": "generated",
        }


# ==================== ADMIN: BLOG ====================
class BlogPost(BaseModel):
    title: str
    content: Optional[str] = None
    category: str = "general"
    tags: Optional[str] = None

@router.get("/blog")
async def list_blog_posts(published_only: bool = True):
    with get_db() as db:
        if published_only:
            rows = db.execute("SELECT bp.*, u.name as author_name FROM blog_posts bp LEFT JOIN users u ON bp.author_id = u.id WHERE bp.is_published = 1 ORDER BY bp.created_at DESC").fetchall()
        else:
            rows = db.execute("SELECT bp.*, u.name as author_name FROM blog_posts bp LEFT JOIN users u ON bp.author_id = u.id ORDER BY bp.created_at DESC").fetchall()
        return [dict(r) for r in rows]

@router.post("/admin/blog")
async def create_blog_post(post: BlogPost, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        slug = post.title.lower().replace(" ", "-").replace("'", "")[:100]
        db.execute("INSERT INTO blog_posts (title, slug, content, author_id, category, tags, is_published) VALUES (?,?,?,?,?,?,1)",
                   (post.title, slug, post.content, user["user_id"], post.category, post.tags))
        return {"status": "created"}

@router.put("/admin/blog/{post_id}")
async def update_blog_post(post_id: int, data: dict, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        sets = []
        params = []
        for k in ["title", "content", "category", "tags", "is_published"]:
            if k in data:
                sets.append(f"{k} = ?")
                params.append(data[k])
        if sets:
            params.append(post_id)
            db.execute(f"UPDATE blog_posts SET {', '.join(sets)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?", params)
        return {"status": "updated"}

@router.delete("/admin/blog/{post_id}")
async def delete_blog_post(post_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        db.execute("DELETE FROM blog_posts WHERE id = ?", (post_id,))
        return {"status": "deleted"}


# ==================== ADMIN: MARKETING CAMPAIGNS ====================
class CampaignCreate(BaseModel):
    name: str
    type: str = "email"
    subject: Optional[str] = None
    content: Optional[str] = None
    target_audience: str = "all"

@router.get("/admin/marketing")
async def list_campaigns(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        rows = db.execute("SELECT * FROM marketing_campaigns ORDER BY created_at DESC").fetchall()
        return [dict(r) for r in rows]

@router.post("/admin/marketing")
async def create_campaign(data: CampaignCreate, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        db.execute("INSERT INTO marketing_campaigns (name, type, subject, content, target_audience) VALUES (?,?,?,?,?)",
                   (data.name, data.type, data.subject, data.content, data.target_audience))
        return {"status": "created"}

@router.post("/admin/marketing/{campaign_id}/send")
async def send_campaign(campaign_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        campaign = db.execute("SELECT * FROM marketing_campaigns WHERE id = ?", (campaign_id,)).fetchone()
        if not campaign:
            raise HTTPException(404, "Campaign not found")
        # Count target users
        if campaign["target_audience"] == "all":
            count = db.execute("SELECT COUNT(*) as c FROM users").fetchone()["c"]
        elif campaign["target_audience"] == "owners":
            count = db.execute("SELECT COUNT(*) as c FROM users WHERE role = 'owner'").fetchone()["c"]
        else:
            count = db.execute("SELECT COUNT(*) as c FROM users WHERE role = 'user'").fetchone()["c"]
        db.execute("UPDATE marketing_campaigns SET status = 'sent', sent_count = ? WHERE id = ?", (count, campaign_id))
        # Try sending emails if type is email
        if campaign["type"] == "email" and campaign["subject"]:
            try:
                from app.services.email_service import send_email_notification
                users_with_email = db.execute("SELECT email FROM users WHERE email IS NOT NULL AND email != ''").fetchall()
                for u in users_with_email[:10]:  # Limit to 10 for demo
                    try:
                        send_email_notification(u["email"], campaign["subject"], campaign["content"] or "")
                    except Exception:
                        pass
            except Exception:
                pass
        return {"status": "sent", "sent_count": count}

@router.delete("/admin/marketing/{campaign_id}")
async def delete_campaign(campaign_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        db.execute("DELETE FROM marketing_campaigns WHERE id = ?", (campaign_id,))
        return {"status": "deleted"}


# ==================== ADMIN: AFFILIATES ====================
@router.get("/admin/affiliates")
async def list_affiliates(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        rows = db.execute("SELECT a.*, u.name, u.phone FROM affiliates a JOIN users u ON a.user_id = u.id ORDER BY a.total_earnings DESC").fetchall()
        return [dict(r) for r in rows]

@router.post("/admin/affiliates")
async def create_affiliate(data: dict, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        import random, string
        code = "AFF" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        db.execute("INSERT INTO affiliates (user_id, affiliate_code, commission_rate) VALUES (?,?,?)",
                   (data["user_id"], code, data.get("commission_rate", 5)))
        return {"status": "created", "code": code}


# ==================== ADMIN: PUSH NOTIFICATIONS ====================
@router.get("/admin/push-notifications")
async def list_push_notifications(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        rows = db.execute("SELECT * FROM push_notifications ORDER BY created_at DESC LIMIT 50").fetchall()
        return [dict(r) for r in rows]

@router.post("/admin/push-notifications")
async def send_push_notification(data: dict, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        target = data.get("target", "all")
        if target == "all":
            count = db.execute("SELECT COUNT(*) as c FROM users").fetchone()["c"]
        elif target == "owners":
            count = db.execute("SELECT COUNT(*) as c FROM users WHERE role = 'owner'").fetchone()["c"]
        else:
            count = db.execute("SELECT COUNT(*) as c FROM users WHERE role = 'user'").fetchone()["c"]
        db.execute("INSERT INTO push_notifications (title, body, target, sent_count) VALUES (?,?,?,?)",
                   (data["title"], data.get("body", ""), target, count))
        return {"status": "sent", "sent_count": count}


# ==================== ADMIN: CITY REPORTS ====================
@router.get("/admin/reports/city")
async def city_reports(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        rows = db.execute("""
            SELECT g.city, COUNT(DISTINCT g.id) as grounds, COUNT(DISTINCT b.id) as bookings,
            COALESCE(SUM(b.total_amount), 0) as revenue, COUNT(DISTINCT b.user_id) as unique_users
            FROM grounds g LEFT JOIN bookings b ON g.id = b.ground_id AND b.status != 'cancelled'
            GROUP BY g.city ORDER BY revenue DESC
        """).fetchall()
        return [dict(r) for r in rows]


# ==================== RECURRING BOOKINGS ====================
@router.post("/bookings/recurring")
async def create_recurring(data: dict, user: dict = Depends(get_current_user)):
    with get_db() as db:
        db.execute("""INSERT INTO recurring_bookings (user_id, ground_id, slot_time, day_of_week, frequency, start_date, end_date) 
                      VALUES (?,?,?,?,?,?,?)""",
                   (user["user_id"], data["ground_id"], data.get("slot_time", ""), data.get("day_of_week", 0),
                    data.get("frequency", "weekly"), data.get("start_date"), data.get("end_date")))
        return {"status": "created"}

@router.get("/bookings/recurring")
async def my_recurring(user: dict = Depends(get_current_user)):
    with get_db() as db:
        rows = db.execute("""SELECT rb.*, g.name as ground_name FROM recurring_bookings rb 
            JOIN grounds g ON rb.ground_id = g.id WHERE rb.user_id = ? ORDER BY rb.created_at DESC""", (user["user_id"],)).fetchall()
        return [dict(r) for r in rows]

@router.delete("/bookings/recurring/{recurring_id}")
async def cancel_recurring(recurring_id: int, user: dict = Depends(get_current_user)):
    with get_db() as db:
        db.execute("UPDATE recurring_bookings SET is_active = 0 WHERE id = ? AND user_id = ?", (recurring_id, user["user_id"]))
        return {"status": "cancelled"}


# ==================== FAVOURITES / WISHLIST ====================
@router.get("/users/me/favourites")
async def get_favourites(user: dict = Depends(get_current_user)):
    with get_db() as db:
        rows = db.execute("""SELECT f.*, g.name, g.address, g.city, g.weekday_price, g.weekend_price, g.rating, g.ground_type, g.sport_type, g.amenities
            FROM favourites f JOIN grounds g ON f.ground_id = g.id WHERE f.user_id = ? ORDER BY f.created_at DESC""", (user["user_id"],)).fetchall()
        return [dict(r) for r in rows]


# ==================== WEATHER (public API proxy) ====================
@router.get("/weather/{city}")
async def get_weather(city: str):
    # Return demo weather data (real integration needs API key)
    import random
    conditions = ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain", "Clear"]
    return {
        "city": city,
        "temperature": random.randint(22, 38),
        "condition": random.choice(conditions),
        "humidity": random.randint(30, 80),
        "wind_speed": random.randint(5, 25),
        "forecast": [
            {"day": "Today", "temp": random.randint(25, 38), "condition": random.choice(conditions)},
            {"day": "Tomorrow", "temp": random.randint(25, 38), "condition": random.choice(conditions)},
            {"day": "Day 3", "temp": random.randint(25, 38), "condition": random.choice(conditions)},
        ]
    }


# ==================== ADMIN: AUTO SETTLEMENTS ====================
@router.post("/admin/auto-settle")
async def auto_settle(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        owners = db.execute("SELECT DISTINCT g.owner_id, u.name FROM grounds g JOIN users u ON g.owner_id = u.id WHERE g.is_active = 1").fetchall()
        settled = 0
        for owner in owners:
            oid = owner["owner_id"]
            commission_rate = 10
            cr = db.execute("SELECT value FROM settings WHERE key = 'standard_commission'").fetchone()
            if cr:
                commission_rate = float(cr["value"])
            rev = db.execute("""SELECT COALESCE(SUM(total_amount), 0) as total FROM bookings 
                WHERE ground_id IN (SELECT id FROM grounds WHERE owner_id = ?) AND status = 'confirmed' 
                AND COALESCE(booking_type, 'online') != 'owner_self'
                AND booking_date >= date('now', '-7 days')""", (oid,)).fetchone()["total"]
            if rev > 0:
                commission = round(rev * commission_rate / 100, 2)
                payout = rev - commission
                db.execute("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?", (payout, oid))
                settled += 1
        return {"status": "done", "owners_settled": settled}


# ==================== ADMIN: APP VERSION ====================
@router.get("/admin/app-version")
async def get_app_version(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        ver = db.execute("SELECT value FROM settings WHERE key = 'app_version'").fetchone()
        min_ver = db.execute("SELECT value FROM settings WHERE key = 'min_app_version'").fetchone()
        return {
            "current_version": ver["value"] if ver else "1.0.0",
            "min_version": min_ver["value"] if min_ver else "1.0.0",
            "force_update": False,
        }

@router.put("/admin/app-version")
async def update_app_version(data: dict, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        if "current_version" in data:
            db.execute("INSERT OR REPLACE INTO settings (key, value, description) VALUES ('app_version', ?, 'Current app version')", (data["current_version"],))
        if "min_version" in data:
            db.execute("INSERT OR REPLACE INTO settings (key, value, description) VALUES ('min_app_version', ?, 'Minimum required app version')", (data["min_version"],))
        return {"status": "updated"}


# --- PUBLIC PAGES ---
@router.get("/pages/{slug}")
async def get_public_page(slug: str):
    with get_db() as db:
        try:
            page = db.execute("SELECT * FROM pages WHERE slug = ? AND is_published = 1", (slug,)).fetchone()
            if not page:
                raise HTTPException(status_code=404, detail="Page not found")
            return dict(page)
        except Exception as e:
            if "no such table" in str(e):
                return {"slug": slug, "title": slug.replace("-", " ").title(), "content": "<p>Coming soon</p>"}
            raise HTTPException(status_code=404, detail="Page not found")

# --- PUBLIC EQUIPMENT LIST ---
@router.get("/equipment/{ground_id}")
async def get_ground_equipment(ground_id: int):
    with get_db() as db:
        try:
            rows = db.execute("SELECT * FROM equipment_rental WHERE ground_id = ? AND is_active = 1", (ground_id,)).fetchall()
            return [dict(r) for r in rows]
        except Exception:
            return []

# --- LOYALTY POINTS (user) ---
@router.get("/loyalty/my-points")
async def get_my_loyalty_points(user: dict = Depends(get_current_user)):
    with get_db() as db:
        try:
            points = db.execute("SELECT * FROM loyalty_points WHERE user_id = ?", (user["id"],)).fetchone()
            txns = db.execute("SELECT * FROM loyalty_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20", (user["id"],)).fetchall()
            return {"points": dict(points) if points else {"points": 0, "total_earned": 0, "total_redeemed": 0, "tier": "bronze"}, "transactions": [dict(t) for t in txns]}
        except Exception:
            return {"points": {"points": 0, "total_earned": 0, "total_redeemed": 0, "tier": "bronze"}, "transactions": []}

@router.post("/loyalty/redeem")
async def redeem_loyalty_points(request: Request, user: dict = Depends(get_current_user)):
    body = await request.json()
    points_to_redeem = body.get("points", 0)
    with get_db() as db:
        try:
            lp = db.execute("SELECT * FROM loyalty_points WHERE user_id = ?", (user["id"],)).fetchone()
            if not lp or lp["points"] < points_to_redeem:
                raise HTTPException(status_code=400, detail="Insufficient points")
            min_redeem = db.execute("SELECT value FROM settings WHERE key='loyalty_min_redeem'").fetchone()
            min_val = int(min_redeem["value"]) if min_redeem else 100
            if points_to_redeem < min_val:
                raise HTTPException(status_code=400, detail=f"Minimum {min_val} points required")
            point_value = db.execute("SELECT value FROM settings WHERE key='loyalty_points_value'").fetchone()
            val = float(point_value["value"]) if point_value else 1.0
            amount = points_to_redeem * val
            db.execute("UPDATE loyalty_points SET points = points - ?, total_redeemed = total_redeemed + ? WHERE user_id = ?", (points_to_redeem, points_to_redeem, user["id"]))
            db.execute("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?", (amount, user["id"]))
            db.execute("INSERT INTO loyalty_transactions (user_id, points, type, description) VALUES (?, ?, 'redeem', ?)",
                       (user["id"], -points_to_redeem, f"Redeemed {points_to_redeem} points for Rs.{amount}"))
            return {"message": f"Redeemed {points_to_redeem} points for Rs.{amount}"}
        except HTTPException:
            raise
        except Exception:
            return {"message": "Redemption failed"}

# --- SITEMAP ---
@router.get("/sitemap.xml")
async def get_sitemap():
    from fastapi.responses import Response
    with get_db() as db:
        try:
            grounds = db.execute("SELECT id, name, city FROM grounds WHERE is_active = 1").fetchall()
        except Exception:
            grounds = []
        try:
            pages = db.execute("SELECT slug FROM pages WHERE is_published = 1").fetchall()
        except Exception:
            pages = []
    
    base_url = "https://bookaground.com"
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    # Static pages
    for path in ["/", "/login", "/tournaments", "/memberships"]:
        xml += f'  <url><loc>{base_url}{path}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n'
    # CMS pages
    for p in pages:
        xml += f'  <url><loc>{base_url}/page/{p["slug"]}</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>\n'
    # Grounds
    for g in grounds:
        xml += f'  <url><loc>{base_url}/ground/{g["id"]}</loc><changefreq>daily</changefreq><priority>0.9</priority></url>\n'
    xml += '</urlset>'
    return Response(content=xml, media_type="application/xml")

@router.get("/robots.txt")
async def get_robots():
    from fastapi.responses import Response
    robots = """User-agent: *
Allow: /
Disallow: /admin/
Disallow: /owner/
Disallow: /api/
Sitemap: https://bookaground.com/api/sitemap.xml
"""
    return Response(content=robots, media_type="text/plain")


# ==================== CONTACT FORM ====================
class ContactFormSubmission(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    subject: str
    message: str

@router.post("/contact")
async def submit_contact_form(data: ContactFormSubmission):
    """Public endpoint - no auth required"""
    with get_db() as db:
        db.execute(
            "INSERT INTO contact_submissions (name, email, phone, subject, message) VALUES (?,?,?,?,?)",
            (data.name, data.email, data.phone, data.subject, data.message)
        )
        return {"status": "success", "message": "Your message has been sent successfully. We will get back to you soon!"}


# ==================== SPLIT PAYMENTS ====================
class SplitMember(BaseModel):
    name: str
    phone: str = ""
    amount: float = 0
    paid: bool = False

class SplitPaymentCreate(BaseModel):
    booking_id: str = ""
    ground_name: str = ""
    booking_date: str = ""
    total_amount: float
    my_share: float = 0
    split_type: str = "equal"
    members: List[SplitMember]

@router.post("/split-payments")
async def create_split_payment(data: SplitPaymentCreate, user: dict = Depends(get_current_user)):
    """Save a split payment with members"""
    with get_db() as db:
        u = db.execute("SELECT name, phone FROM users WHERE id = ?", (user["user_id"],)).fetchone()
        cursor = db.execute(
            "INSERT INTO split_payments (user_id, user_name, user_phone, booking_id, ground_name, booking_date, total_amount, my_share, split_type) VALUES (?,?,?,?,?,?,?,?,?)",
            (user["user_id"], u["name"] if u else "", u["phone"] if u else "", data.booking_id, data.ground_name, data.booking_date, data.total_amount, data.my_share, data.split_type)
        )
        split_id = cursor.lastrowid
        for m in data.members:
            db.execute(
                "INSERT INTO split_payment_members (split_id, name, phone, amount, paid) VALUES (?,?,?,?,?)",
                (split_id, m.name, m.phone, m.amount, 1 if m.paid else 0)
            )
        return {"status": "success", "split_id": split_id, "message": "Split payment saved!"}

@router.get("/split-payments")
async def get_my_split_payments(user: dict = Depends(get_current_user)):
    """Get user's split payment history"""
    with get_db() as db:
        splits = db.execute("SELECT * FROM split_payments WHERE user_id = ? ORDER BY created_at DESC", (user["user_id"],)).fetchall()
        result = []
        for s in splits:
            sp = dict(s)
            members = db.execute("SELECT * FROM split_payment_members WHERE split_id = ?", (s["id"],)).fetchall()
            sp["members"] = [dict(m) for m in members]
            result.append(sp)
        return result

@router.put("/split-payments/{split_id}/member/{member_id}/paid")
async def mark_member_paid(split_id: int, member_id: int, user: dict = Depends(get_current_user)):
    """Mark a split member as paid"""
    with get_db() as db:
        sp = db.execute("SELECT * FROM split_payments WHERE id = ? AND user_id = ?", (split_id, user["user_id"])).fetchone()
        if not sp:
            raise HTTPException(404, "Split payment not found")
        db.execute("UPDATE split_payment_members SET paid = 1 WHERE id = ? AND split_id = ?", (member_id, split_id))
        return {"status": "success"}

@router.get("/admin/split-payments")
async def admin_get_split_payments(user: dict = Depends(get_current_user)):
    """Admin: Get all split payments with customer data for marketing"""
    require_role(user, ["admin"])
    with get_db() as db:
        splits = db.execute("""
            SELECT sp.*, u.name as creator_name, u.phone as creator_phone, u.email as creator_email
            FROM split_payments sp
            LEFT JOIN users u ON sp.user_id = u.id
            ORDER BY sp.created_at DESC
        """).fetchall()
        result = []
        for s in splits:
            sp = dict(s)
            members = db.execute("SELECT * FROM split_payment_members WHERE split_id = ?", (s["id"],)).fetchall()
            sp["members"] = [dict(m) for m in members]
            result.append(sp)
        return result
