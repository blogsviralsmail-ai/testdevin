from fastapi import APIRouter, HTTPException, Depends, Query
from app.models import CreateTicket, TicketReply, UpdateTicketStatus
from app.auth import get_current_user, require_role
from app.database import get_db
from app.email_service import notify_support_ticket_update

router = APIRouter(prefix="/api/support", tags=["Support"])


@router.post("/tickets")
def create_ticket(req: CreateTicket, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.execute(
            """INSERT INTO support_tickets (user_id, subject, description, category, priority)
               VALUES (?, ?, ?, ?, ?)""",
            (current_user["user_id"], req.subject, req.description, req.category, req.priority)
        )
        return {"message": "Ticket created successfully", "ticket_id": cursor.lastrowid}


@router.get("/tickets")
def list_tickets(
    status: str = Query(None),
    current_user: dict = Depends(get_current_user)
):
    with get_db() as conn:
        query = """
            SELECT st.*, u.full_name as user_name, u.role as user_role,
                   (SELECT COUNT(*) FROM ticket_replies tr WHERE tr.ticket_id = st.id) as reply_count
            FROM support_tickets st
            JOIN users u ON u.id = st.user_id
            WHERE 1=1
        """
        params = []

        if current_user["role"] != "admin":
            query += " AND st.user_id = ?"
            params.append(current_user["user_id"])

        if status:
            query += " AND st.status = ?"
            params.append(status)

        query += " ORDER BY st.created_at DESC"
        tickets = conn.execute(query, params).fetchall()

        return [
            {
                "id": t["id"],
                "user_name": t["user_name"],
                "user_role": t["user_role"],
                "subject": t["subject"],
                "description": t["description"],
                "category": t["category"],
                "status": t["status"],
                "priority": t["priority"],
                "reply_count": t["reply_count"],
                "created_at": t["created_at"],
                "updated_at": t["updated_at"]
            } for t in tickets
        ]


@router.get("/tickets/{ticket_id}")
def get_ticket(ticket_id: int, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        ticket = conn.execute(
            """SELECT st.*, u.full_name as user_name, u.role as user_role
               FROM support_tickets st JOIN users u ON u.id = st.user_id
               WHERE st.id = ?""",
            (ticket_id,)
        ).fetchone()

        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")

        if current_user["role"] != "admin" and ticket["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")

        replies = conn.execute(
            """SELECT tr.*, u.full_name as user_name, u.role as user_role
               FROM ticket_replies tr JOIN users u ON u.id = tr.user_id
               WHERE tr.ticket_id = ? ORDER BY tr.created_at ASC""",
            (ticket_id,)
        ).fetchall()

        return {
            "id": ticket["id"],
            "user_id": ticket["user_id"],
            "user_name": ticket["user_name"],
            "user_role": ticket["user_role"],
            "subject": ticket["subject"],
            "description": ticket["description"],
            "category": ticket["category"],
            "status": ticket["status"],
            "priority": ticket["priority"],
            "created_at": ticket["created_at"],
            "updated_at": ticket["updated_at"],
            "replies": [
                {
                    "id": r["id"],
                    "user_name": r["user_name"],
                    "user_role": r["user_role"],
                    "message": r["message"],
                    "created_at": r["created_at"]
                } for r in replies
            ]
        }


@router.post("/tickets/{ticket_id}/reply")
def reply_to_ticket(ticket_id: int, req: TicketReply, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        ticket = conn.execute("SELECT * FROM support_tickets WHERE id = ?", (ticket_id,)).fetchone()
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")

        if current_user["role"] != "admin" and ticket["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")

        conn.execute(
            "INSERT INTO ticket_replies (ticket_id, user_id, message) VALUES (?, ?, ?)",
            (ticket_id, current_user["user_id"], req.message)
        )

        # Update ticket status
        if current_user["role"] == "admin" and ticket["status"] == "open":
            conn.execute(
                "UPDATE support_tickets SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (ticket_id,)
            )

        return {"message": "Reply added successfully"}


@router.put("/tickets/{ticket_id}/status")
def update_ticket_status(ticket_id: int, req: UpdateTicketStatus, current_user: dict = Depends(require_role("admin"))):
    with get_db() as conn:
        ticket = conn.execute("SELECT * FROM support_tickets WHERE id = ?", (ticket_id,)).fetchone()
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")

        conn.execute(
            "UPDATE support_tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (req.status, ticket_id)
        )

        # Notify user
        conn.execute(
            "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
            (ticket["user_id"], "Ticket Updated",
             f"Your support ticket #{ticket_id} has been marked as {req.status}.", "support")
        )

        # Send email notification
        try:
            user = conn.execute("SELECT email, full_name FROM users WHERE id = ?", (ticket["user_id"],)).fetchone()
            if user:
                notify_support_ticket_update(user["email"], user["full_name"], ticket["subject"], req.status)
        except Exception:
            pass

        return {"message": f"Ticket status updated to {req.status}"}
