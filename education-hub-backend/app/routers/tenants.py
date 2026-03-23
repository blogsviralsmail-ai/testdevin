"""
Platform/Super Admin API for tenant management.
These endpoints are only accessible from the main domain (no subdomain).
"""
from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel
from typing import Optional
import re
import jwt
import os
import hashlib
import hmac
from datetime import datetime

router = APIRouter(prefix="/api/platform", tags=["Platform Admin"])

SECRET_KEY = os.environ.get("JWT_SECRET", "education-hub-secret-key-2026")
ALGORITHM = "HS256"
# Shared secret for remote installation registration
REGISTRATION_SECRET = os.environ.get("REGISTRATION_SECRET", "eduhub-remote-reg-2026")


def get_platform_admin(authorization: str = Header(None)):
    """Verify platform admin JWT token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("role") != "platform_admin":
            raise HTTPException(status_code=403, detail="Platform admin access required")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


class PlatformLoginRequest(BaseModel):
    username: str
    password: str


class CreateTenantRequest(BaseModel):
    name: str
    slug: str
    admin_name: str
    admin_email: Optional[str] = ""
    admin_phone: Optional[str] = ""
    admin_password: str
    company_name: Optional[str] = ""
    tagline: Optional[str] = ""
    plan: Optional[str] = "trial"


class UpdateTenantRequest(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    tagline: Optional[str] = None
    plan: Optional[str] = None
    is_active: Optional[int] = None
    max_students: Optional[int] = None
    max_users: Optional[int] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None


@router.post("/login")
async def platform_login(req: PlatformLoginRequest):
    """Login as platform super admin."""
    from app.tenant import get_master_db
    from app.utils.auth import verify_password, create_access_token

    conn = get_master_db()
    user = conn.execute(
        "SELECT * FROM platform_admins WHERE username = ? AND is_active = 1",
        (req.username,),
    ).fetchone()
    conn.close()

    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({
        "sub": str(user["id"]),
        "username": user["username"],
        "role": "platform_admin",
        "name": user["name"],
    })

    return {
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "name": user["name"],
            "role": "platform_admin",
        },
    }


@router.get("/me")
async def platform_me(authorization: str = Header(None)):
    """Get current platform admin info."""
    admin = get_platform_admin(authorization)
    return {"user": admin}


@router.get("/tenants")
async def list_tenants(authorization: str = Header(None)):
    """List all tenants."""
    get_platform_admin(authorization)
    from app.tenant import get_all_tenants
    tenants = get_all_tenants()
    return {"tenants": tenants, "total": len(tenants)}


@router.post("/tenants")
async def create_tenant(req: CreateTenantRequest, authorization: str = Header(None)):
    """Create a new tenant (franchise)."""
    get_platform_admin(authorization)

    # Validate slug (single clear regex: alphanumeric start/end, hyphens allowed in middle)
    if not re.match(r'^[a-z0-9]([a-z0-9-]*[a-z0-9])?$', req.slug):
        raise HTTPException(
            status_code=400,
            detail="Slug must contain only lowercase letters, numbers, and hyphens. Must start and end with letter/number.",
        )

    if len(req.slug) < 2 or len(req.slug) > 50:
        raise HTTPException(status_code=400, detail="Slug must be 2-50 characters")

    # Reserved slugs
    reserved = ["www", "api", "admin", "app", "mail", "ftp", "ssh", "cpanel", "webmail", "ns1", "ns2"]
    if req.slug in reserved:
        raise HTTPException(status_code=400, detail=f"'{req.slug}' is a reserved subdomain")

    from app.tenant import provision_tenant

    try:
        result = provision_tenant(
            name=req.name,
            slug=req.slug,
            admin_name=req.admin_name,
            admin_email=req.admin_email,
            admin_phone=req.admin_phone,
            admin_password=req.admin_password,
            company_name=req.company_name,
            tagline=req.tagline,
            plan=req.plan,
        )
        return {"message": "Tenant created successfully", "tenant": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create tenant: {str(e)}")


@router.get("/tenants/{slug}")
async def get_tenant(slug: str, authorization: str = Header(None)):
    """Get tenant details with stats."""
    get_platform_admin(authorization)
    from app.tenant import lookup_tenant, get_tenant_stats, get_master_db

    # Get tenant from master DB (even inactive ones)
    conn = get_master_db()
    tenant = conn.execute("SELECT * FROM tenants WHERE slug = ?", (slug,)).fetchone()
    conn.close()

    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    tenant_dict = dict(tenant)
    tenant_dict["stats"] = get_tenant_stats(slug)
    tenant_dict["url"] = f"https://{slug}.eduhub.kkhsmedia.com"

    return {"tenant": tenant_dict}


@router.put("/tenants/{slug}")
async def update_tenant(slug: str, req: UpdateTenantRequest, authorization: str = Header(None)):
    """Update tenant details."""
    get_platform_admin(authorization)
    from app.tenant import get_master_db
    from datetime import datetime

    conn = get_master_db()
    tenant = conn.execute("SELECT * FROM tenants WHERE slug = ?", (slug,)).fetchone()
    if not tenant:
        conn.close()
        raise HTTPException(status_code=404, detail="Tenant not found")

    updates = []
    params = []
    for field in ["name", "company_name", "tagline", "plan", "is_active", "max_students", "max_users", "primary_color", "secondary_color"]:
        value = getattr(req, field, None)
        if value is not None:
            updates.append(f"{field} = ?")
            params.append(value)

    if updates:
        updates.append("updated_at = ?")
        params.append(datetime.utcnow().isoformat())
        params.append(slug)
        conn.execute(f"UPDATE tenants SET {', '.join(updates)} WHERE slug = ?", params)
        conn.commit()

    conn.close()
    return {"message": "Tenant updated successfully"}


@router.delete("/tenants/{slug}")
async def deactivate_tenant(slug: str, authorization: str = Header(None)):
    """Deactivate (soft delete) a tenant."""
    get_platform_admin(authorization)
    from app.tenant import delete_tenant

    delete_tenant(slug)
    return {"message": f"Tenant '{slug}' deactivated"}


@router.get("/dashboard")
async def platform_dashboard(authorization: str = Header(None)):
    """Get platform dashboard stats."""
    get_platform_admin(authorization)
    from app.tenant import get_master_db, get_all_tenants, get_tenant_stats

    conn = get_master_db()
    total_tenants = conn.execute("SELECT COUNT(*) FROM tenants").fetchone()[0]
    active_tenants = conn.execute("SELECT COUNT(*) FROM tenants WHERE is_active = 1").fetchone()[0]
    trial_tenants = conn.execute("SELECT COUNT(*) FROM tenants WHERE plan = 'trial'").fetchone()[0]
    paid_tenants = conn.execute("SELECT COUNT(*) FROM tenants WHERE plan != 'trial'").fetchone()[0]

    # Recent tenants
    recent = conn.execute(
        "SELECT * FROM tenants ORDER BY created_at DESC LIMIT 5"
    ).fetchall()
    conn.close()

    # Aggregate stats across all active tenants
    total_students = 0
    total_enquiries = 0
    total_leads = 0
    tenants = get_all_tenants()
    for t in tenants:
        if t["is_active"]:
            stats = get_tenant_stats(t["slug"])
            total_students += stats.get("students", 0)
            total_enquiries += stats.get("enquiries", 0)
            total_leads += stats.get("leads", 0)

    # Remote installations stats
    conn2 = None
    try:
        conn2 = get_master_db()
        remote_installations = conn2.execute("SELECT * FROM remote_installations WHERE status = 'active'").fetchall()
        remote_count = len(remote_installations)
        remote_students = sum(r["total_students"] for r in remote_installations)
        remote_enquiries = sum(r["total_enquiries"] for r in remote_installations)
        remote_leads = sum(r["total_leads"] for r in remote_installations)
    except Exception:
        remote_count = 0
        remote_students = 0
        remote_enquiries = 0
        remote_leads = 0
    finally:
        if conn2:
            conn2.close()

    return {
        "total_tenants": total_tenants,
        "active_tenants": active_tenants,
        "trial_tenants": trial_tenants,
        "paid_tenants": paid_tenants,
        "total_students": total_students + remote_students,
        "total_enquiries": total_enquiries + remote_enquiries,
        "total_leads": total_leads + remote_leads,
        "recent_tenants": [dict(r) for r in recent],
        "remote_installations": remote_count,
        "remote_students": remote_students,
    }


# Public endpoint - get tenant info by subdomain (for frontend branding)
@router.get("/tenant-info/{slug}")
async def get_tenant_public_info(slug: str):
    """Get public tenant info for frontend branding (no auth needed)."""
    from app.tenant import lookup_tenant

    tenant = lookup_tenant(slug)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    return {
        "name": tenant["name"],
        "slug": tenant["slug"],
        "company_name": tenant["company_name"],
        "tagline": tenant["tagline"],
        "logo": tenant["logo"],
        "primary_color": tenant["primary_color"],
        "secondary_color": tenant["secondary_color"],
    }


# ============================================================
# Remote Installation Registration & Sync APIs
# These are called by client servers to register and sync stats
# ============================================================

class RemoteRegistrationRequest(BaseModel):
    instance_id: str
    name: str
    domain: str
    server_ip: Optional[str] = ""
    admin_name: Optional[str] = ""
    admin_email: Optional[str] = ""
    admin_phone: Optional[str] = ""
    company_name: Optional[str] = ""
    reg_token: str  # HMAC signature for auth


class RemoteSyncRequest(BaseModel):
    instance_id: str
    total_students: int = 0
    total_enquiries: int = 0
    total_leads: int = 0
    total_universities: int = 0
    total_users: int = 0
    version: Optional[str] = "1.0.0"
    sync_token: str  # HMAC signature for auth


def verify_registration_token(instance_id: str, token: str) -> bool:
    """Verify HMAC token for remote installation auth."""
    expected = hmac.new(
        REGISTRATION_SECRET.encode(),
        instance_id.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, token)


@router.post("/remote/register")
async def register_remote_installation(req: RemoteRegistrationRequest):
    """Register a new remote installation (called by client server on first boot)."""
    if not verify_registration_token(req.instance_id, req.reg_token):
        raise HTTPException(status_code=403, detail="Invalid registration token")

    from app.tenant import get_master_db
    conn = get_master_db()
    try:
        conn.execute(
            """INSERT INTO remote_installations
               (instance_id, name, domain, server_ip, admin_name, admin_email, admin_phone, company_name, last_sync_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (req.instance_id, req.name, req.domain, req.server_ip,
             req.admin_name, req.admin_email, req.admin_phone, req.company_name,
             datetime.utcnow().isoformat()),
        )
        conn.commit()
    except Exception:
        # Already registered - update info
        conn.execute(
            """UPDATE remote_installations
               SET name=?, domain=?, server_ip=?, admin_name=?, admin_email=?, admin_phone=?,
                   company_name=?, status='active', updated_at=?
               WHERE instance_id=?""",
            (req.name, req.domain, req.server_ip, req.admin_name, req.admin_email,
             req.admin_phone, req.company_name, datetime.utcnow().isoformat(), req.instance_id),
        )
        conn.commit()
    finally:
        conn.close()

    return {"status": "registered", "instance_id": req.instance_id}


@router.post("/remote/sync")
async def sync_remote_installation(req: RemoteSyncRequest):
    """Sync stats from a remote installation (called periodically by client cron)."""
    if not verify_registration_token(req.instance_id, req.sync_token):
        raise HTTPException(status_code=403, detail="Invalid sync token")

    from app.tenant import get_master_db
    conn = get_master_db()
    conn.execute(
        """UPDATE remote_installations
           SET total_students=?, total_enquiries=?, total_leads=?,
               total_universities=?, total_users=?, version=?,
               last_sync_at=?, updated_at=?, status='active'
           WHERE instance_id=?""",
        (req.total_students, req.total_enquiries, req.total_leads,
         req.total_universities, req.total_users, req.version,
         datetime.utcnow().isoformat(), datetime.utcnow().isoformat(),
         req.instance_id),
    )
    conn.commit()
    conn.close()

    return {"status": "synced", "instance_id": req.instance_id}


@router.get("/remote/installations")
async def list_remote_installations(authorization: str = Header(None)):
    """List all remote installations (platform admin only)."""
    get_platform_admin(authorization)
    from app.tenant import get_master_db

    conn = get_master_db()
    installations = conn.execute(
        "SELECT * FROM remote_installations ORDER BY created_at DESC"
    ).fetchall()
    conn.close()

    return {"installations": [dict(i) for i in installations], "total": len(installations)}


@router.get("/remote/installations/{instance_id}")
async def get_remote_installation(instance_id: str, authorization: str = Header(None)):
    """Get details of a specific remote installation."""
    get_platform_admin(authorization)
    from app.tenant import get_master_db

    conn = get_master_db()
    inst = conn.execute(
        "SELECT * FROM remote_installations WHERE instance_id = ?", (instance_id,)
    ).fetchone()
    conn.close()

    if not inst:
        raise HTTPException(status_code=404, detail="Installation not found")

    return {"installation": dict(inst)}


@router.delete("/remote/installations/{instance_id}")
async def deactivate_remote_installation(instance_id: str, authorization: str = Header(None)):
    """Deactivate a remote installation."""
    get_platform_admin(authorization)
    from app.tenant import get_master_db

    conn = get_master_db()
    conn.execute(
        "UPDATE remote_installations SET status='inactive', updated_at=? WHERE instance_id=?",
        (datetime.utcnow().isoformat(), instance_id),
    )
    conn.commit()
    conn.close()

    return {"message": f"Installation '{instance_id}' deactivated"}
