from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from contextlib import asynccontextmanager
from app.database import init_db
from app.tenant import init_master_db, current_tenant_upload_dir, current_tenant_info
import os

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/data/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    init_master_db()
    yield

app = FastAPI(title="Education Hub SaaS API", lifespan=lifespan)

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Add tenant detection middleware
from app.middleware import TenantMiddleware
app.add_middleware(TenantMiddleware)

from app.routers import auth, universities, categories, form_fields, students, exams, accounts, support, documents, branches, settings, enquiries, seed, team, testimonials, roles, blog, gallery, careers, leads, analytics, communication, student_status, notices, chat, placements, centers
from app.routers import tenants as tenants_router

app.include_router(auth.router)
app.include_router(universities.router)
app.include_router(categories.router)
app.include_router(form_fields.router)
app.include_router(students.router)
app.include_router(exams.router)
app.include_router(accounts.router)
app.include_router(support.router)
app.include_router(documents.router)
app.include_router(branches.router)
app.include_router(settings.router)
app.include_router(enquiries.router)
app.include_router(seed.router)
app.include_router(team.router)
app.include_router(testimonials.router)
app.include_router(roles.router)
app.include_router(blog.router)
app.include_router(gallery.router)
app.include_router(careers.router)
app.include_router(leads.router)
app.include_router(analytics.router)
app.include_router(communication.router)
app.include_router(student_status.router)
app.include_router(notices.router)
app.include_router(chat.router)
app.include_router(placements.router)
app.include_router(centers.router)

# Platform admin routes (tenant management)
app.include_router(tenants_router.router)

# Dynamic uploads endpoint - serves from tenant or default uploads dir
@app.get("/uploads/{file_path:path}")
async def serve_upload(file_path: str):
    """Serve uploaded files - tenant-aware."""
    tenant_upload = current_tenant_upload_dir.get()
    if tenant_upload:
        full_path = os.path.realpath(os.path.join(tenant_upload, file_path))
        if not full_path.startswith(os.path.realpath(tenant_upload)):
            return JSONResponse(status_code=403, content={"detail": "Access denied"})
        if os.path.exists(full_path) and os.path.isfile(full_path):
            return FileResponse(full_path, headers={"Cache-Control": "public, max-age=31536000, immutable"})
    
    # Fallback to default uploads dir
    default_path = os.path.realpath(os.path.join(UPLOAD_DIR, file_path))
    if not default_path.startswith(os.path.realpath(UPLOAD_DIR)):
        return JSONResponse(status_code=403, content={"detail": "Access denied"})
    if os.path.exists(default_path) and os.path.isfile(default_path):
        return FileResponse(default_path, headers={"Cache-Control": "public, max-age=31536000, immutable"})
    
    return JSONResponse(status_code=404, content={"detail": "File not found"})

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

# Tenant info endpoint (public, for frontend to detect tenant)
@app.get("/api/tenant-info")
async def get_current_tenant_info():
    """Get current tenant info based on subdomain."""
    tenant = current_tenant_info.get()
    if tenant:
        return {
            "is_tenant": True,
            "name": tenant["name"],
            "slug": tenant["slug"],
            "company_name": tenant["company_name"],
            "tagline": tenant["tagline"],
            "logo": tenant["logo"],
            "primary_color": tenant["primary_color"],
            "secondary_color": tenant["secondary_color"],
        }
    return {"is_tenant": False}
