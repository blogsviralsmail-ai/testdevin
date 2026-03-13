from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import json
from app.database import get_db
from app.utils.auth import require_admin, hash_password

router = APIRouter(prefix="/api/roles", tags=["Roles"])

MODULES = [
    "dashboard", "universities", "categories", "students", "form_builder",
    "exams", "accounts", "support", "documents", "branches", "enquiries",
    "team", "testimonials", "settings", "roles"
]

class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: Optional[str] = "{}"
    status: str = "active"

class UserWithRole(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    username: str
    password: str
    role_id: Optional[int] = None
    role_name: Optional[str] = None

@router.get("/modules")
async def get_modules(user: dict = Depends(require_admin)):
    return MODULES

@router.get("")
async def list_roles(user: dict = Depends(require_admin)):
    conn = get_db()
    rows = conn.execute("SELECT * FROM roles ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("")
async def create_role(data: RoleCreate, user: dict = Depends(require_admin)):
    conn = get_db()
    perms = data.permissions if data.permissions else "{}"
    cursor = conn.execute(
        "INSERT INTO roles (name, description, permissions, status) VALUES (?, ?, ?, ?)",
        (data.name, data.description, perms, data.status)
    )
    rid = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"id": rid, "message": "Role created"}

@router.put("/{rid}")
async def update_role(rid: int, data: RoleCreate, user: dict = Depends(require_admin)):
    conn = get_db()
    perms = data.permissions if data.permissions else "{}"
    conn.execute(
        "UPDATE roles SET name=?, description=?, permissions=?, status=? WHERE id=?",
        (data.name, data.description, perms, data.status, rid)
    )
    conn.commit()
    conn.close()
    return {"message": "Role updated"}

@router.delete("/{rid}")
async def delete_role(rid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("DELETE FROM roles WHERE id = ?", (rid,))
    conn.commit()
    conn.close()
    return {"message": "Role deleted"}

@router.get("/users")
async def list_role_users(user: dict = Depends(require_admin)):
    """List all non-student users (admins, staff, etc.)"""
    conn = get_db()
    rows = conn.execute(
        "SELECT u.id, u.username, u.name, u.email, u.phone, u.role, u.is_active, u.created_at, "
        "COALESCE(r.name, u.role) as role_name, r.id as role_id "
        "FROM users u LEFT JOIN roles r ON r.name = u.role "
        "WHERE u.role != 'student' ORDER BY u.created_at DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/users")
async def create_role_user(data: UserWithRole, user: dict = Depends(require_admin)):
    """Create a new admin/staff user with a role."""
    conn = get_db()
    existing = conn.execute("SELECT id FROM users WHERE username = ?", (data.username,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Username already exists")
    # Resolve role name from role_id if provided
    role_name = data.role_name or "admin"
    if data.role_id:
        role_row = conn.execute("SELECT name FROM roles WHERE id = ?", (data.role_id,)).fetchone()
        if role_row:
            role_name = role_row["name"]
    cursor = conn.execute(
        "INSERT INTO users (username, email, password_hash, name, phone, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (data.username, data.email, hash_password(data.password), data.name, data.phone, role_name, 1)
    )
    uid = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"id": uid, "message": "User created"}

@router.put("/users/{uid}")
async def update_role_user(uid: int, data: dict, user: dict = Depends(require_admin)):
    """Update a user's details and/or password."""
    conn = get_db()
    # Resolve role name from role_id if provided
    role_name = data.get("role_name", "admin")
    if data.get("role_id"):
        role_row = conn.execute("SELECT name FROM roles WHERE id = ?", (data["role_id"],)).fetchone()
        if role_row:
            role_name = role_row["name"]
    if data.get("name"):
        conn.execute("UPDATE users SET name=?, email=?, phone=?, role=? WHERE id=?",
                     (data.get("name"), data.get("email", ""), data.get("phone", ""), role_name, uid))
    if data.get("password"):
        conn.execute("UPDATE users SET password_hash=? WHERE id=?", (hash_password(data["password"]), uid))
    if data.get("username"):
        existing = conn.execute("SELECT id FROM users WHERE username = ? AND id != ?", (data["username"], uid)).fetchone()
        if existing:
            conn.close()
            raise HTTPException(status_code=400, detail="Username already taken")
        conn.execute("UPDATE users SET username=? WHERE id=?", (data["username"], uid))
    conn.commit()
    conn.close()
    return {"message": "User updated"}

@router.put("/users/{uid}/reset-password")
async def reset_user_password(uid: int, data: dict, user: dict = Depends(require_admin)):
    """Admin can reset any user's password."""
    new_password = data.get("new_password")
    if not new_password:
        raise HTTPException(status_code=400, detail="New password is required")
    conn = get_db()
    target = conn.execute("SELECT id FROM users WHERE id = ?", (uid,)).fetchone()
    if not target:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    conn.execute("UPDATE users SET password_hash=? WHERE id=?", (hash_password(new_password), uid))
    conn.commit()
    conn.close()
    return {"message": "Password reset successfully"}

@router.delete("/users/{uid}")
async def delete_role_user(uid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    # Don't allow deleting self
    if str(uid) == user.get("sub"):
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    conn.execute("DELETE FROM users WHERE id = ? AND role != 'student'", (uid,))
    conn.commit()
    conn.close()
    return {"message": "User deleted"}
