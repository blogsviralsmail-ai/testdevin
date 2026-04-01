from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from app.database import get_db
from app.utils.auth import require_admin, get_current_user

router = APIRouter(prefix="/api/chat", tags=["Chat"])

@router.get("/conversations")
async def list_conversations(user: dict = Depends(get_current_user)):
    conn = get_db()
    uid = int(user["sub"])
    role = user.get("role", "")
    
    if role == "student":
        # Student sees their conversations
        rows = conn.execute("""
            SELECT c.*, u.name as other_name, u.role as other_role,
                   (SELECT message FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                   (SELECT created_at FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
                   (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = 0) as unread_count
            FROM conversations c
            JOIN users u ON (CASE WHEN c.student_user_id = ? THEN c.admin_user_id ELSE c.student_user_id END) = u.id
            WHERE c.student_user_id = ?
            ORDER BY last_message_at DESC NULLS LAST
        """, (uid, uid, uid)).fetchall()
    else:
        # Admin/staff sees all conversations
        rows = conn.execute("""
            SELECT c.*, s.name as student_name, s.enrollment_no,
                   (SELECT message FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                   (SELECT created_at FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
                   (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = 0) as unread_count
            FROM conversations c
            LEFT JOIN users su ON c.student_user_id = su.id
            LEFT JOIN students s ON s.user_id = c.student_user_id
            ORDER BY last_message_at DESC NULLS LAST
        """, (uid,)).fetchall()
    
    conn.close()
    return [dict(r) for r in rows]

@router.get("/conversations/{cid}/messages")
async def get_messages(cid: int, user: dict = Depends(get_current_user)):
    conn = get_db()
    uid = int(user["sub"])
    role = user.get("role", "")
    
    # Authorization: verify user is a participant
    conv = conn.execute("SELECT student_user_id, admin_user_id FROM conversations WHERE id = ?", (cid,)).fetchone()
    if not conv:
        conn.close()
        raise HTTPException(status_code=404, detail="Conversation not found")
    if role == "student" and uid != conv["student_user_id"] and uid != conv["admin_user_id"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized to access this conversation")
    
    # Mark messages as read
    conn.execute("UPDATE chat_messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?", (cid, uid))
    conn.commit()
    
    messages = conn.execute("""
        SELECT m.*, u.name as sender_name, u.role as sender_role
        FROM chat_messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
        ORDER BY m.created_at ASC
    """, (cid,)).fetchall()
    conn.close()
    return [dict(m) for m in messages]

@router.post("/conversations")
async def create_conversation(data: dict, user: dict = Depends(get_current_user)):
    conn = get_db()
    uid = int(user["sub"])
    role = user.get("role", "")
    
    if role == "student":
        student_user_id = uid
        # Default admin user (first admin)
        admin = conn.execute("SELECT id FROM users WHERE role IN ('admin', 'super_admin') LIMIT 1").fetchone()
        admin_user_id = admin["id"] if admin else 1
    else:
        admin_user_id = uid
        student_user_id = data.get("student_user_id")
        if not student_user_id:
            conn.close()
            raise HTTPException(status_code=400, detail="student_user_id required")
    
    # Check if conversation already exists
    existing = conn.execute(
        "SELECT id FROM conversations WHERE student_user_id = ? AND admin_user_id = ?",
        (student_user_id, admin_user_id)
    ).fetchone()
    
    if existing:
        cid = existing["id"]
    else:
        subject = data.get("subject", "New Conversation")
        cursor = conn.execute(
            "INSERT INTO conversations (student_user_id, admin_user_id, subject) VALUES (?, ?, ?)",
            (student_user_id, admin_user_id, subject)
        )
        cid = cursor.lastrowid
    
    # Send first message if provided
    msg = data.get("message", "")
    if msg:
        conn.execute(
            "INSERT INTO chat_messages (conversation_id, sender_id, message) VALUES (?, ?, ?)",
            (cid, uid, msg)
        )
    
    conn.commit()
    conn.close()
    return {"id": cid, "message": "Conversation created"}

@router.post("/conversations/{cid}/messages")
async def send_message(cid: int, data: dict, user: dict = Depends(get_current_user)):
    conn = get_db()
    uid = int(user["sub"])
    role = user.get("role", "")
    msg = data.get("message", "")
    if not msg:
        conn.close()
        raise HTTPException(status_code=400, detail="Message required")
    
    # Authorization: verify user is a participant
    conv = conn.execute("SELECT student_user_id, admin_user_id FROM conversations WHERE id = ?", (cid,)).fetchone()
    if not conv:
        conn.close()
        raise HTTPException(status_code=404, detail="Conversation not found")
    if role == "student" and uid != conv["student_user_id"] and uid != conv["admin_user_id"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized to send messages in this conversation")
    
    conn.execute(
        "INSERT INTO chat_messages (conversation_id, sender_id, message) VALUES (?, ?, ?)",
        (cid, uid, msg)
    )
    conn.execute("UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", (cid,))
    conn.commit()
    conn.close()
    return {"message": "Message sent"}

@router.get("/unread-count")
async def get_unread_count(user: dict = Depends(get_current_user)):
    conn = get_db()
    uid = int(user["sub"])
    role = user.get("role", "")
    
    if role == "student":
        row = conn.execute("""
            SELECT COUNT(*) as count FROM chat_messages m
            JOIN conversations c ON m.conversation_id = c.id
            WHERE c.student_user_id = ? AND m.sender_id != ? AND m.is_read = 0
        """, (uid, uid)).fetchone()
    else:
        row = conn.execute("""
            SELECT COUNT(*) as count FROM chat_messages m
            JOIN conversations c ON m.conversation_id = c.id
            WHERE m.sender_id != ? AND m.is_read = 0
        """, (uid,)).fetchone()
    
    conn.close()
    return {"unread": row["count"] if row else 0}

@router.delete("/conversations/{cid}")
async def delete_conversation(cid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("DELETE FROM chat_messages WHERE conversation_id = ?", (cid,))
    conn.execute("DELETE FROM conversations WHERE id = ?", (cid,))
    conn.commit()
    conn.close()
    return {"message": "Conversation deleted"}
