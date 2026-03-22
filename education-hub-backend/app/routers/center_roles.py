"""Center/Sub-center Role Management System
Each center can create roles, assign permissions, and manage employee users.
Employees only see their own data (e.g., counselors see only their leads).
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import json
from app.database import get_db
from app.utils.auth import get_current_user, hash_password
from app.routers.centers import get_current_center

router = APIRouter(prefix="/api/center-roles", tags=["Center Roles"])

CENTER_MODULES = [
    "dashboard", "students", "documents", "fees", "payment_settings",
    "sub_centers", "commission", "deal_fees", "counselor_leads",
    "announcements", "exam_timetable", "support", "settings", "roles"
]


class CenterRoleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: Optional[str] = "{}"
    status: str = "active"


class CenterRoleUserCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    username: str
    password: str
    role_id: int


def _require_center_user(user: dict):
    """Ensure user is a center user and return center info."""
    role = user.get("role", "")
    if role not in ("center",):
        raise HTTPException(status_code=403, detail="Only center users can manage center roles")
    return get_current_center(user)


# ══════════════════════════════════════════════════════════════════
#  MODULE LIST
# ══════════════════════════════════════════════════════════════════

@router.get("/modules")
async def get_center_modules(user: dict = Depends(get_current_user)):
    """Get available modules for center role permissions."""
    return CENTER_MODULES


# ══════════════════════════════════════════════════════════════════
#  ROLES CRUD
# ══════════════════════════════════════════════════════════════════

@router.get("/roles")
async def list_center_roles(user: dict = Depends(get_current_user)):
    """List roles for the current center."""
    center = _require_center_user(user)
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM center_roles WHERE center_id = ? ORDER BY created_at DESC",
        (center["id"],)
    ).fetchall()
    result = []
    for r in rows:
        d = dict(r)
        # Parse permissions safely
        try:
            d["permissions_obj"] = json.loads(d.get("permissions", "{}") or "{}")
        except (json.JSONDecodeError, TypeError):
            d["permissions_obj"] = {}
        # Count users with this role
        d["user_count"] = conn.execute(
            "SELECT COUNT(*) FROM center_role_users WHERE role_id = ? AND center_id = ?",
            (d["id"], center["id"])
        ).fetchone()[0]
        result.append(d)
    conn.close()
    return result


@router.post("/roles")
async def create_center_role(data: CenterRoleCreate, user: dict = Depends(get_current_user)):
    """Create a new role for the current center."""
    center = _require_center_user(user)
    conn = get_db()

    # Check duplicate name within this center
    existing = conn.execute(
        "SELECT id FROM center_roles WHERE center_id = ? AND name = ?",
        (center["id"], data.name)
    ).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Role '{data.name}' already exists for this center")

    perms = data.permissions if data.permissions else "{}"
    cursor = conn.execute(
        "INSERT INTO center_roles (center_id, name, description, permissions, status) VALUES (?, ?, ?, ?, ?)",
        (center["id"], data.name, data.description, perms, data.status)
    )
    rid = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"id": rid, "message": "Role created"}


@router.put("/roles/{role_id}")
async def update_center_role(role_id: int, data: CenterRoleCreate, user: dict = Depends(get_current_user)):
    """Update a center role."""
    center = _require_center_user(user)
    conn = get_db()

    role = conn.execute(
        "SELECT * FROM center_roles WHERE id = ? AND center_id = ?",
        (role_id, center["id"])
    ).fetchone()
    if not role:
        conn.close()
        raise HTTPException(status_code=404, detail="Role not found")

    perms = data.permissions if data.permissions else "{}"
    conn.execute(
        "UPDATE center_roles SET name=?, description=?, permissions=?, status=? WHERE id=?",
        (data.name, data.description, perms, data.status, role_id)
    )
    conn.commit()
    conn.close()
    return {"message": "Role updated"}


@router.delete("/roles/{role_id}")
async def delete_center_role(role_id: int, user: dict = Depends(get_current_user)):
    """Delete a center role."""
    center = _require_center_user(user)
    conn = get_db()

    # Check if any users are assigned to this role
    user_count = conn.execute(
        "SELECT COUNT(*) FROM center_role_users WHERE role_id = ? AND center_id = ?",
        (role_id, center["id"])
    ).fetchone()[0]
    if user_count > 0:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Cannot delete role with {user_count} users assigned. Remove users first.")

    conn.execute("DELETE FROM center_roles WHERE id = ? AND center_id = ?", (role_id, center["id"]))
    conn.commit()
    conn.close()
    return {"message": "Role deleted"}


# ══════════════════════════════════════════════════════════════════
#  ROLE USERS (employees assigned to roles)
# ══════════════════════════════════════════════════════════════════

@router.get("/users")
async def list_center_role_users(user: dict = Depends(get_current_user)):
    """List all users (employees) for the current center."""
    center = _require_center_user(user)
    conn = get_db()
    rows = conn.execute(
        """SELECT u.id, u.username, u.name, u.email, u.phone, u.role, u.is_active, u.created_at,
                  cr.name as role_name, cr.id as role_id, cr.permissions as role_permissions
           FROM center_role_users cru
           JOIN users u ON cru.user_id = u.id
           LEFT JOIN center_roles cr ON cru.role_id = cr.id
           WHERE cru.center_id = ?
           ORDER BY u.created_at DESC""",
        (center["id"],)
    ).fetchall()
    result = []
    for r in rows:
        d = dict(r)
        try:
            d["permissions_obj"] = json.loads(d.get("role_permissions", "{}") or "{}")
        except (json.JSONDecodeError, TypeError):
            d["permissions_obj"] = {}
        result.append(d)
    conn.close()
    return result


@router.post("/users")
async def create_center_role_user(data: CenterRoleUserCreate, user: dict = Depends(get_current_user)):
    """Create a new employee user for the current center and assign a role."""
    center = _require_center_user(user)
    conn = get_db()

    # Check username uniqueness
    existing = conn.execute("SELECT id FROM users WHERE username = ?", (data.username,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Username already exists")

    # Verify role belongs to this center
    role = conn.execute(
        "SELECT * FROM center_roles WHERE id = ? AND center_id = ?",
        (data.role_id, center["id"])
    ).fetchone()
    if not role:
        conn.close()
        raise HTTPException(status_code=400, detail="Role not found for this center")

    # Create user with role name as their role
    role_name = f"center_employee_{center['id']}"
    try:
        cursor = conn.execute(
            "INSERT INTO users (username, email, password_hash, name, phone, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (data.username, data.email, hash_password(data.password), data.name, data.phone, role_name, 1)
        )
        uid = cursor.lastrowid
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"User creation failed: {str(e)}")

    # Link user to center role
    conn.execute(
        "INSERT INTO center_role_users (center_id, user_id, role_id) VALUES (?, ?, ?)",
        (center["id"], uid, data.role_id)
    )
    conn.commit()
    conn.close()
    return {"id": uid, "message": "Employee created and role assigned"}


@router.put("/users/{uid}")
async def update_center_role_user(uid: int, data: dict, user: dict = Depends(get_current_user)):
    """Update a center employee's details."""
    center = _require_center_user(user)
    conn = get_db()

    # Verify user belongs to this center
    cru = conn.execute(
        "SELECT * FROM center_role_users WHERE user_id = ? AND center_id = ?",
        (uid, center["id"])
    ).fetchone()
    if not cru:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found in this center")

    if data.get("name"):
        conn.execute("UPDATE users SET name=?, email=?, phone=? WHERE id=?",
                     (data.get("name"), data.get("email", ""), data.get("phone", ""), uid))
    if data.get("password"):
        conn.execute("UPDATE users SET password_hash=? WHERE id=?", (hash_password(data["password"]), uid))
    if data.get("username"):
        existing = conn.execute("SELECT id FROM users WHERE username = ? AND id != ?", (data["username"], uid)).fetchone()
        if existing:
            conn.close()
            raise HTTPException(status_code=400, detail="Username already taken")
        conn.execute("UPDATE users SET username=? WHERE id=?", (data["username"], uid))
    if data.get("role_id"):
        # Verify new role belongs to this center
        role = conn.execute(
            "SELECT id FROM center_roles WHERE id = ? AND center_id = ?",
            (data["role_id"], center["id"])
        ).fetchone()
        if role:
            conn.execute(
                "UPDATE center_role_users SET role_id = ? WHERE user_id = ? AND center_id = ?",
                (data["role_id"], uid, center["id"])
            )
    conn.commit()
    conn.close()
    return {"message": "User updated"}


@router.put("/users/{uid}/reset-password")
async def reset_center_user_password(uid: int, data: dict, user: dict = Depends(get_current_user)):
    """Reset password for a center employee."""
    center = _require_center_user(user)
    new_password = data.get("new_password") or data.get("password")
    if not new_password:
        raise HTTPException(status_code=400, detail="New password is required")
    conn = get_db()
    cru = conn.execute(
        "SELECT * FROM center_role_users WHERE user_id = ? AND center_id = ?",
        (uid, center["id"])
    ).fetchone()
    if not cru:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found in this center")
    conn.execute("UPDATE users SET password_hash=? WHERE id=?", (hash_password(new_password), uid))
    conn.commit()
    conn.close()
    return {"message": "Password reset successfully"}


@router.delete("/users/{uid}")
async def delete_center_role_user(uid: int, user: dict = Depends(get_current_user)):
    """Delete a center employee."""
    center = _require_center_user(user)
    conn = get_db()
    # Verify user belongs to this center
    cru = conn.execute(
        "SELECT * FROM center_role_users WHERE user_id = ? AND center_id = ?",
        (uid, center["id"])
    ).fetchone()
    if not cru:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found in this center")

    # Don't allow deleting yourself
    if str(uid) == user.get("sub"):
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    conn.execute("DELETE FROM center_role_users WHERE user_id = ? AND center_id = ?", (uid, center["id"]))
    conn.execute("DELETE FROM users WHERE id = ?", (uid,))
    conn.commit()
    conn.close()
    return {"message": "Employee deleted"}
