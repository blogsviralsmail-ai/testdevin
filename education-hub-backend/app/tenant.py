"""
Multi-tenant SaaS support using contextvars.
Each tenant gets their own SQLite database and uploads directory.
"""
import contextvars
import sqlite3
import os
import shutil
from datetime import datetime

# Context variables for current request's tenant
current_tenant_db_path = contextvars.ContextVar('current_tenant_db_path', default=None)
current_tenant_upload_dir = contextvars.ContextVar('current_tenant_upload_dir', default=None)
current_tenant_info = contextvars.ContextVar('current_tenant_info', default=None)

# Base data directory
BASE_DATA_DIR = os.environ.get("BASE_DATA_DIR", os.environ.get("DB_PATH", "/data/app.db").rsplit("/", 1)[0] if os.environ.get("DB_PATH") else "/home/asffeduc/data")
MASTER_DB_PATH = os.path.join(BASE_DATA_DIR, "master.db")
TENANTS_DIR = os.path.join(BASE_DATA_DIR, "tenants")

# Allowed base domains for subdomain extraction
BASE_DOMAINS = ["eduhub.kkhsmedia.com", "localhost"]


def get_master_db():
    """Get connection to the master database (tenant registry)."""
    os.makedirs(os.path.dirname(MASTER_DB_PATH), exist_ok=True)
    conn = sqlite3.connect(MASTER_DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_master_db():
    """Initialize the master database with tenant registry table."""
    conn = get_master_db()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tenants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        domain TEXT,
        admin_name TEXT NOT NULL,
        admin_email TEXT,
        admin_phone TEXT,
        logo TEXT,
        company_name TEXT,
        tagline TEXT,
        primary_color TEXT DEFAULT '#1E40AF',
        secondary_color TEXT DEFAULT '#F59E0B',
        plan TEXT DEFAULT 'trial',
        max_students INTEGER DEFAULT 100,
        max_users INTEGER DEFAULT 10,
        is_active INTEGER DEFAULT 1,
        expires_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")

    # Super admin users table (for the main platform)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS platform_admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'platform_admin',
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")

    # Tenant activity log
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tenant_activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER,
        action TEXT NOT NULL,
        details TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )""")

    # Remote installations table (client servers connected to this master)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS remote_installations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        instance_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        domain TEXT NOT NULL,
        server_ip TEXT,
        admin_name TEXT,
        admin_email TEXT,
        admin_phone TEXT,
        company_name TEXT,
        version TEXT DEFAULT '1.0.0',
        total_students INTEGER DEFAULT 0,
        total_enquiries INTEGER DEFAULT 0,
        total_leads INTEGER DEFAULT 0,
        total_universities INTEGER DEFAULT 0,
        total_users INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        last_sync_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")

    conn.commit()

    # Seed default platform super admin
    from app.utils.auth import hash_password
    try:
        cursor.execute(
            "INSERT INTO platform_admins (username, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)",
            ("superadmin", "admin@eduhub.kkhsmedia.com", hash_password("admin@123"), "Platform Super Admin", "platform_admin")
        )
        conn.commit()
    except sqlite3.IntegrityError:
        pass

    conn.close()


def extract_subdomain(host: str) -> str:
    """Extract subdomain from the Host header."""
    if not host:
        return ""

    # Remove port if present
    host = host.split(":")[0].lower().strip()

    for base_domain in BASE_DOMAINS:
        if host == base_domain or host == f"www.{base_domain}":
            return ""  # Main domain, no subdomain
        if host.endswith(f".{base_domain}"):
            subdomain = host[: -(len(base_domain) + 1)]
            # Skip www prefix
            if subdomain == "www":
                return ""
            return subdomain

    return ""


def lookup_tenant(slug: str) -> dict:
    """Look up a tenant by their subdomain slug."""
    if not slug:
        return None
    conn = get_master_db()
    tenant = conn.execute(
        "SELECT * FROM tenants WHERE slug = ? AND is_active = 1", (slug,)
    ).fetchone()
    conn.close()
    if tenant:
        return dict(tenant)
    return None


def get_tenant_db_path(slug: str) -> str:
    """Get the database path for a tenant."""
    return os.path.join(TENANTS_DIR, slug, "app.db")


def get_tenant_upload_dir(slug: str) -> str:
    """Get the uploads directory for a tenant."""
    return os.path.join(TENANTS_DIR, slug, "uploads")


def provision_tenant(
    name: str,
    slug: str,
    admin_name: str,
    admin_email: str,
    admin_phone: str,
    admin_password: str,
    company_name: str = "",
    tagline: str = "",
    plan: str = "trial",
) -> dict:
    """
    Provision a new tenant:
    1. Create record in master DB
    2. Create directory structure
    3. Initialize tenant database with schema
    4. Create admin user in tenant DB
    5. Set default settings
    """
    from app.utils.auth import hash_password
    from app.database import init_db

    # 1. Create tenant record in master DB
    conn = get_master_db()
    try:
        cursor = conn.execute(
            """INSERT INTO tenants (name, slug, admin_name, admin_email, admin_phone, company_name, tagline, plan)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (name, slug, admin_name, admin_email, admin_phone,
             company_name or name, tagline or f"{name} - Education Hub", plan),
        )
        tenant_id = cursor.lastrowid
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise ValueError(f"Tenant with slug '{slug}' already exists")
    conn.close()

    # 2. Create directory structure
    tenant_dir = os.path.join(TENANTS_DIR, slug)
    os.makedirs(tenant_dir, exist_ok=True)
    os.makedirs(os.path.join(tenant_dir, "uploads"), exist_ok=True)

    # 3. Initialize tenant database
    tenant_db_path = get_tenant_db_path(slug)
    # Set context vars so init_db uses the tenant's paths
    old_db = current_tenant_db_path.get()
    old_upload = current_tenant_upload_dir.get()
    current_tenant_db_path.set(tenant_db_path)
    current_tenant_upload_dir.set(os.path.join(tenant_dir, "uploads"))

    try:
        init_db()
    finally:
        current_tenant_db_path.set(old_db)
        current_tenant_upload_dir.set(old_upload)

    # 4. Update tenant admin credentials in tenant DB
    tenant_conn = sqlite3.connect(tenant_db_path)
    tenant_conn.row_factory = sqlite3.Row
    # Update the default seeded admin with tenant-specific info
    admin_username = admin_email or admin_phone
    if not admin_username:
        raise ValueError("Either admin_email or admin_phone must be provided for tenant admin login")
    tenant_conn.execute(
        "UPDATE users SET username = ?, email = ?, password_hash = ?, name = ?, phone = ? WHERE username = 'admin'",
        (admin_username, admin_email, hash_password(admin_password), admin_name, admin_phone),
    )

    # 5. Set tenant-specific settings
    settings_updates = {
        "company_name": company_name or name,
        "tagline": tagline or f"{name} - Education Hub",
        "email": admin_email or "info@eduhub.kkhsmedia.com",
        "phone": admin_phone or "+91-9999999999",
    }
    for key, value in settings_updates.items():
        tenant_conn.execute(
            "UPDATE settings SET value = ? WHERE key = ?", (value, key)
        )

    tenant_conn.commit()
    tenant_conn.close()

    # Log activity
    log_conn = get_master_db()
    log_conn.execute(
        "INSERT INTO tenant_activity_log (tenant_id, action, details) VALUES (?, ?, ?)",
        (tenant_id, "created", f"Tenant '{name}' provisioned with slug '{slug}'"),
    )
    log_conn.commit()
    log_conn.close()

    return {
        "id": tenant_id,
        "name": name,
        "slug": slug,
        "url": f"https://{slug}.eduhub.kkhsmedia.com",
        "admin_email": admin_email,
        "status": "active",
    }


def get_all_tenants() -> list:
    """Get all tenants from the master database."""
    conn = get_master_db()
    tenants = conn.execute(
        "SELECT * FROM tenants ORDER BY created_at DESC"
    ).fetchall()
    conn.close()
    return [dict(t) for t in tenants]


def get_tenant_stats(slug: str) -> dict:
    """Get statistics for a specific tenant."""
    db_path = get_tenant_db_path(slug)
    if not os.path.exists(db_path):
        return {"error": "Tenant database not found"}

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    stats = {}
    try:
        stats["students"] = conn.execute("SELECT COUNT(*) FROM students").fetchone()[0]
        stats["enquiries"] = conn.execute("SELECT COUNT(*) FROM enquiries").fetchone()[0]
        stats["leads"] = conn.execute("SELECT COUNT(*) FROM leads").fetchone()[0]
        stats["universities"] = conn.execute("SELECT COUNT(*) FROM universities").fetchone()[0]
        stats["categories"] = conn.execute("SELECT COUNT(*) FROM categories").fetchone()[0]
        stats["gallery"] = conn.execute("SELECT COUNT(*) FROM gallery").fetchone()[0]
        stats["users"] = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        stats["team_members"] = conn.execute("SELECT COUNT(*) FROM team_members").fetchone()[0]
        stats["blog_posts"] = conn.execute("SELECT COUNT(*) FROM blog_posts").fetchone()[0]
    except Exception as e:
        stats["error"] = str(e)

    conn.close()
    return stats


def delete_tenant(slug: str) -> bool:
    """Deactivate a tenant (soft delete)."""
    conn = get_master_db()
    conn.execute(
        "UPDATE tenants SET is_active = 0, updated_at = ? WHERE slug = ?",
        (datetime.utcnow().isoformat(), slug),
    )
    conn.commit()
    conn.close()
    return True
