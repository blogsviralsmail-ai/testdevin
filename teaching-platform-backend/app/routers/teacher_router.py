from fastapi import APIRouter, HTTPException, Depends, Query
from app.models import TeacherProfileUpdate, AddSubject, AvailabilitySlot, CreateClass, UpdateClassStatus
from app.auth import get_current_user, require_role
from app.database import get_db
import json

router = APIRouter(prefix="/api/teachers", tags=["Teachers"])


@router.get("/search")
def search_teachers(
    subject: str = Query(None),
    city: str = Query(None),
    state: str = Query(None),
    class_level: str = Query(None),
    min_price: float = Query(None),
    max_price: float = Query(None),
    min_rating: float = Query(None),
    language: str = Query(None),
    page: int = Query(1),
    per_page: int = Query(10)
):
    with get_db() as conn:
        query = """
            SELECT DISTINCT u.id as user_id, u.full_name, u.email, u.city, u.state, u.avatar, u.is_verified,
                   tp.id as teacher_id, tp.bio, tp.experience_years, tp.hourly_rate, tp.languages,
                   tp.qualification, tp.is_approved, tp.rating, tp.total_reviews, tp.total_classes
            FROM users u
            JOIN teacher_profiles tp ON tp.user_id = u.id
            LEFT JOIN teacher_subjects ts ON ts.teacher_id = tp.id
            LEFT JOIN subjects s ON s.id = ts.subject_id
            WHERE u.role = 'teacher' AND u.is_active = 1 AND tp.is_approved = 1
        """
        params = []

        if subject:
            query += " AND LOWER(s.name) LIKE LOWER(?)"
            params.append(f"%{subject}%")
        if city:
            query += " AND LOWER(u.city) LIKE LOWER(?)"
            params.append(f"%{city}%")
        if state:
            query += " AND LOWER(u.state) LIKE LOWER(?)"
            params.append(f"%{state}%")
        if min_price is not None:
            query += " AND tp.hourly_rate >= ?"
            params.append(min_price)
        if max_price is not None:
            query += " AND tp.hourly_rate <= ?"
            params.append(max_price)
        if min_rating is not None:
            query += " AND tp.rating >= ?"
            params.append(min_rating)
        if language:
            query += " AND tp.languages LIKE ?"
            params.append(f'%"{language}"%')
        if class_level:
            query += " AND ts.class_levels LIKE ?"
            params.append(f'%"{class_level}"%')

        # Count total
        count_query = f"SELECT COUNT(*) as total FROM ({query})"
        total = conn.execute(count_query, params).fetchone()["total"]

        # Paginate
        offset = (page - 1) * per_page
        query += " ORDER BY tp.rating DESC, tp.total_reviews DESC LIMIT ? OFFSET ?"
        params.extend([per_page, offset])

        teachers = conn.execute(query, params).fetchall()

        results = []
        for t in teachers:
            # Get subjects for this teacher
            subjects = conn.execute(
                """SELECT s.name, ts.class_levels FROM teacher_subjects ts
                   JOIN subjects s ON s.id = ts.subject_id
                   WHERE ts.teacher_id = ?""",
                (t["teacher_id"],)
            ).fetchall()

            results.append({
                "user_id": t["user_id"],
                "teacher_id": t["teacher_id"],
                "full_name": t["full_name"],
                "email": t["email"],
                "city": t["city"],
                "state": t["state"],
                "avatar": t["avatar"],
                "is_verified": bool(t["is_verified"]),
                "bio": t["bio"],
                "experience_years": t["experience_years"],
                "hourly_rate": t["hourly_rate"],
                "languages": json.loads(t["languages"]) if t["languages"] else [],
                "qualification": t["qualification"],
                "rating": t["rating"],
                "total_reviews": t["total_reviews"],
                "total_classes": t["total_classes"],
                "subjects": [
                    {
                        "name": s["name"],
                        "class_levels": json.loads(s["class_levels"]) if s["class_levels"] else []
                    } for s in subjects
                ]
            })

        return {
            "teachers": results,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page
        }


@router.get("/{teacher_id}")
def get_teacher_profile(teacher_id: int):
    with get_db() as conn:
        teacher = conn.execute(
            """SELECT u.*, tp.id as teacher_id, tp.bio, tp.experience_years, tp.hourly_rate,
                      tp.languages, tp.qualification, tp.is_approved, tp.rating,
                      tp.total_reviews, tp.total_classes
               FROM users u
               JOIN teacher_profiles tp ON tp.user_id = u.id
               WHERE tp.id = ?""",
            (teacher_id,)
        ).fetchone()

        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")

        subjects = conn.execute(
            """SELECT s.id, s.name, ts.class_levels FROM teacher_subjects ts
               JOIN subjects s ON s.id = ts.subject_id
               WHERE ts.teacher_id = ?""",
            (teacher_id,)
        ).fetchall()

        availability = conn.execute(
            "SELECT * FROM teacher_availability WHERE teacher_id = ?",
            (teacher_id,)
        ).fetchall()

        reviews = conn.execute(
            """SELECT r.*, u.full_name as student_name
               FROM reviews r JOIN users u ON u.id = r.student_id
               WHERE r.teacher_id = ? ORDER BY r.created_at DESC LIMIT 10""",
            (teacher_id,)
        ).fetchall()

        return {
            "user_id": teacher["id"],
            "teacher_id": teacher["teacher_id"],
            "full_name": teacher["full_name"],
            "email": teacher["email"],
            "phone": teacher["phone"],
            "city": teacher["city"],
            "state": teacher["state"],
            "avatar": teacher["avatar"],
            "is_verified": bool(teacher["is_verified"]),
            "bio": teacher["bio"],
            "experience_years": teacher["experience_years"],
            "hourly_rate": teacher["hourly_rate"],
            "languages": json.loads(teacher["languages"]) if teacher["languages"] else [],
            "qualification": teacher["qualification"],
            "is_approved": bool(teacher["is_approved"]),
            "rating": teacher["rating"],
            "total_reviews": teacher["total_reviews"],
            "total_classes": teacher["total_classes"],
            "subjects": [
                {
                    "id": s["id"],
                    "name": s["name"],
                    "class_levels": json.loads(s["class_levels"]) if s["class_levels"] else []
                } for s in subjects
            ],
            "availability": [
                {
                    "id": a["id"],
                    "day_of_week": a["day_of_week"],
                    "start_time": a["start_time"],
                    "end_time": a["end_time"]
                } for a in availability
            ],
            "reviews": [
                {
                    "id": r["id"],
                    "student_name": r["student_name"],
                    "rating": r["rating"],
                    "comment": r["comment"],
                    "created_at": r["created_at"]
                } for r in reviews
            ]
        }


@router.put("/profile")
def update_teacher_profile(req: TeacherProfileUpdate, current_user: dict = Depends(require_role("teacher"))):
    with get_db() as conn:
        profile = conn.execute(
            "SELECT id FROM teacher_profiles WHERE user_id = ?", (current_user["user_id"],)
        ).fetchone()
        if not profile:
            raise HTTPException(status_code=404, detail="Teacher profile not found")

        if req.full_name or req.phone or req.city or req.state:
            updates = []
            params = []
            if req.full_name:
                updates.append("full_name = ?")
                params.append(req.full_name)
            if req.phone:
                updates.append("phone = ?")
                params.append(req.phone)
            if req.city:
                updates.append("city = ?")
                params.append(req.city)
            if req.state:
                updates.append("state = ?")
                params.append(req.state)
            if updates:
                params.append(current_user["user_id"])
                conn.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)

        profile_updates = []
        profile_params = []
        if req.bio is not None:
            profile_updates.append("bio = ?")
            profile_params.append(req.bio)
        if req.experience_years is not None:
            profile_updates.append("experience_years = ?")
            profile_params.append(req.experience_years)
        if req.hourly_rate is not None:
            profile_updates.append("hourly_rate = ?")
            profile_params.append(req.hourly_rate)
        if req.languages is not None:
            profile_updates.append("languages = ?")
            profile_params.append(json.dumps(req.languages))
        if req.qualification is not None:
            profile_updates.append("qualification = ?")
            profile_params.append(req.qualification)

        if profile_updates:
            profile_params.append(profile["id"])
            conn.execute(
                f"UPDATE teacher_profiles SET {', '.join(profile_updates)} WHERE id = ?",
                profile_params
            )

        return {"message": "Profile updated successfully"}


@router.post("/subjects")
def add_subject(req: AddSubject, current_user: dict = Depends(require_role("teacher"))):
    with get_db() as conn:
        profile = conn.execute(
            "SELECT id FROM teacher_profiles WHERE user_id = ?", (current_user["user_id"],)
        ).fetchone()
        if not profile:
            raise HTTPException(status_code=404, detail="Teacher profile not found")

        subject = conn.execute("SELECT id FROM subjects WHERE id = ?", (req.subject_id,)).fetchone()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")

        try:
            conn.execute(
                "INSERT INTO teacher_subjects (teacher_id, subject_id, class_levels) VALUES (?, ?, ?)",
                (profile["id"], req.subject_id, json.dumps(req.class_levels))
            )
        except Exception:
            conn.execute(
                "UPDATE teacher_subjects SET class_levels = ? WHERE teacher_id = ? AND subject_id = ?",
                (json.dumps(req.class_levels), profile["id"], req.subject_id)
            )

        return {"message": "Subject added successfully"}


@router.delete("/subjects/{subject_id}")
def remove_subject(subject_id: int, current_user: dict = Depends(require_role("teacher"))):
    with get_db() as conn:
        profile = conn.execute(
            "SELECT id FROM teacher_profiles WHERE user_id = ?", (current_user["user_id"],)
        ).fetchone()
        if not profile:
            raise HTTPException(status_code=404, detail="Teacher profile not found")

        conn.execute(
            "DELETE FROM teacher_subjects WHERE teacher_id = ? AND subject_id = ?",
            (profile["id"], subject_id)
        )
        return {"message": "Subject removed"}


@router.post("/availability")
def set_availability(slots: list[AvailabilitySlot], current_user: dict = Depends(require_role("teacher"))):
    with get_db() as conn:
        profile = conn.execute(
            "SELECT id FROM teacher_profiles WHERE user_id = ?", (current_user["user_id"],)
        ).fetchone()
        if not profile:
            raise HTTPException(status_code=404, detail="Teacher profile not found")

        conn.execute("DELETE FROM teacher_availability WHERE teacher_id = ?", (profile["id"],))
        for slot in slots:
            conn.execute(
                "INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)",
                (profile["id"], slot.day_of_week, slot.start_time, slot.end_time)
            )

        return {"message": "Availability updated"}


@router.get("/my/classes")
def get_my_classes(
    status: str = Query(None),
    current_user: dict = Depends(require_role("teacher"))
):
    with get_db() as conn:
        profile = conn.execute(
            "SELECT id FROM teacher_profiles WHERE user_id = ?", (current_user["user_id"],)
        ).fetchone()
        if not profile:
            raise HTTPException(status_code=404, detail="Teacher profile not found")

        query = """
            SELECT c.*, s.name as subject_name,
                   (SELECT COUNT(*) FROM bookings b WHERE b.class_id = c.id AND b.status != 'cancelled') as booked_count
            FROM classes c
            JOIN subjects s ON s.id = c.subject_id
            WHERE c.teacher_id = ?
        """
        params = [profile["id"]]
        if status:
            query += " AND c.status = ?"
            params.append(status)
        query += " ORDER BY c.scheduled_at DESC"

        classes = conn.execute(query, params).fetchall()
        return [
            {
                "id": c["id"],
                "title": c["title"],
                "description": c["description"],
                "subject_name": c["subject_name"],
                "class_type": c["class_type"],
                "scheduled_at": c["scheduled_at"],
                "duration_minutes": c["duration_minutes"],
                "meeting_link": c["meeting_link"],
                "status": c["status"],
                "max_students": c["max_students"],
                "booked_count": c["booked_count"],
                "price": c["price"],
                "created_at": c["created_at"]
            } for c in classes
        ]


@router.get("/my/earnings")
def get_my_earnings(current_user: dict = Depends(require_role("teacher"))):
    with get_db() as conn:
        profile = conn.execute(
            "SELECT * FROM teacher_profiles WHERE user_id = ?", (current_user["user_id"],)
        ).fetchone()
        if not profile:
            raise HTTPException(status_code=404, detail="Teacher profile not found")

        payments = conn.execute(
            """SELECT p.*, c.title as class_title, u.full_name as student_name
               FROM payments p
               JOIN bookings b ON b.id = p.booking_id
               JOIN classes c ON c.id = b.class_id
               JOIN users u ON u.id = p.student_id
               WHERE p.teacher_id = ?
               ORDER BY p.created_at DESC""",
            (profile["id"],)
        ).fetchall()

        total_earned = sum(p["teacher_amount"] for p in payments if p["status"] == "released")
        pending = sum(p["teacher_amount"] for p in payments if p["status"] == "escrow")

        return {
            "total_earned": total_earned,
            "pending_amount": pending,
            "total_classes": profile["total_classes"],
            "transactions": [
                {
                    "id": p["id"],
                    "class_title": p["class_title"],
                    "student_name": p["student_name"],
                    "amount": p["amount"],
                    "teacher_amount": p["teacher_amount"],
                    "platform_fee": p["platform_fee"],
                    "status": p["status"],
                    "created_at": p["created_at"],
                    "released_at": p["released_at"]
                } for p in payments
            ]
        }
