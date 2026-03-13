"""
Tenant-aware upload directory helper.
Returns the correct upload directory based on current tenant context.
"""
import os
from app.tenant import current_tenant_upload_dir

DEFAULT_UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/data/uploads")


def get_upload_dir() -> str:
    """Get the correct upload directory for the current tenant or default."""
    tenant_dir = current_tenant_upload_dir.get()
    if tenant_dir:
        os.makedirs(tenant_dir, exist_ok=True)
        return tenant_dir
    os.makedirs(DEFAULT_UPLOAD_DIR, exist_ok=True)
    return DEFAULT_UPLOAD_DIR
