from fastapi import APIRouter, HTTPException, Depends
from app.models import RegisterRequest, LoginRequest, TokenResponse
from app.auth import hash_password, verify_password, create_access_token, get_current_user
from app.database import get_db
from app.email_service import notify_student_registration, notify_teacher_registration
import json

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register")
def register(req: RegisterRequest):
    if req.role not in ("student", "teacher"):
        raise HTTPException(status_code=400, detail="Role must be 'student' or 'teacher'")

    with get_db() as conn:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (req.email,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

        password_hash = hash_password(req.password)
        cursor = conn.execute(
            """INSERT INTO users (email, password_hash, full_name, phone, role, city, state)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (req.email, password_hash, req.full_name, req.phone, req.role, req.city, req.state)
        )
        user_id = cursor.lastrowid

        # If teacher, create teacher profile
        if req.role == "teacher":
            conn.execute(
                "INSERT INTO teacher_profiles (user_id) VALUES (?)",
                (user_id,)
            )

        user = {
            "id": user_id,
            "email": req.email,
            "full_name": req.full_name,
            "role": req.role,
            "city": req.city,
            "state": req.state
        }
        token = create_access_token({"user_id": user_id, "email": req.email, "role": req.role})

        # Send welcome email
        try:
            if req.role == "student":
                notify_student_registration(req.email, req.full_name)
            elif req.role == "teacher":
                notify_teacher_registration(req.email, req.full_name)
        except Exception:
            pass  # Don't block registration if email fails

        return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/login")
def login(req: LoginRequest):
    with get_db() as conn:
        user = conn.execute("SELECT * FROM users WHERE email = ?", (req.email,)).fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        if not verify_password(req.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        if not user["is_active"]:
            raise HTTPException(status_code=403, detail="Account is suspended")

        token = create_access_token({
            "user_id": user["id"],
            "email": user["email"],
            "role": user["role"]
        })
        user_data = {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "phone": user["phone"],
            "city": user["city"],
            "state": user["state"],
            "is_verified": bool(user["is_verified"]),
            "avatar": user["avatar"]
        }
        return {"access_token": token, "token_type": "bearer", "user": user_data}


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        user = conn.execute("SELECT * FROM users WHERE id = ?", (current_user["user_id"],)).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_data = {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "phone": user["phone"],
            "city": user["city"],
            "state": user["state"],
            "is_verified": bool(user["is_verified"]),
            "avatar": user["avatar"],
            "created_at": user["created_at"]
        }

        if user["role"] == "teacher":
            profile = conn.execute(
                "SELECT * FROM teacher_profiles WHERE user_id = ?", (user["id"],)
            ).fetchone()
            if profile:
                subjects = conn.execute(
                    """SELECT ts.*, s.name as subject_name FROM teacher_subjects ts
                       JOIN subjects s ON s.id = ts.subject_id
                       WHERE ts.teacher_id = ?""",
                    (profile["id"],)
                ).fetchall()
                user_data["teacher_profile"] = {
                    "id": profile["id"],
                    "bio": profile["bio"],
                    "experience_years": profile["experience_years"],
                    "hourly_rate": profile["hourly_rate"],
                    "languages": json.loads(profile["languages"]) if profile["languages"] else [],
                    "qualification": profile["qualification"],
                    "is_approved": bool(profile["is_approved"]),
                    "rating": profile["rating"],
                    "total_reviews": profile["total_reviews"],
                    "total_classes": profile["total_classes"],
                    "total_earnings": profile["total_earnings"],
                    "subjects": [
                        {
                            "id": s["id"],
                            "subject_id": s["subject_id"],
                            "subject_name": s["subject_name"],
                            "class_levels": json.loads(s["class_levels"]) if s["class_levels"] else []
                        } for s in subjects
                    ]
                }

        return user_data
