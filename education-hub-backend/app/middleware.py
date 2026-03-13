"""
Tenant detection middleware.
Extracts subdomain from Host header and sets tenant context for the request.
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.tenant import (
    extract_subdomain,
    lookup_tenant,
    current_tenant_db_path,
    current_tenant_upload_dir,
    current_tenant_info,
    get_tenant_db_path,
    get_tenant_upload_dir,
)


class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        host = request.headers.get("host", "")
        subdomain = extract_subdomain(host)

        # Reset context vars for each request
        token_db = current_tenant_db_path.set(None)
        token_upload = current_tenant_upload_dir.set(None)
        token_info = current_tenant_info.set(None)

        try:
            if subdomain:
                # This is a tenant subdomain request
                tenant = lookup_tenant(subdomain)
                if not tenant:
                    # Check if it's a platform API call (e.g., /api/platform/*)
                    if request.url.path.startswith("/api/platform"):
                        # Allow platform API calls without tenant
                        pass
                    else:
                        return JSONResponse(
                            status_code=404,
                            content={"detail": f"Tenant '{subdomain}' not found or inactive"},
                        )
                else:
                    # Set tenant context
                    current_tenant_db_path.set(get_tenant_db_path(tenant["slug"]))
                    current_tenant_upload_dir.set(get_tenant_upload_dir(tenant["slug"]))
                    current_tenant_info.set(tenant)

                    # Store tenant info in request state for easy access
                    request.state.tenant = tenant
                    request.state.tenant_slug = tenant["slug"]

            # For main domain (no subdomain), no tenant context is set
            # The default DB_PATH will be used (original database)
            # Platform/super-admin APIs are available on the main domain

            response = await call_next(request)
            return response
        finally:
            # Reset context vars
            current_tenant_db_path.reset(token_db)
            current_tenant_upload_dir.reset(token_upload)
            current_tenant_info.reset(token_info)
