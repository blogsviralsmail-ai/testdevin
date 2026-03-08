from fastapi import APIRouter, HTTPException, Depends, Query
from app.models import CreateClass, UpdateClassStatus
from app.auth import get_current_user, require_role
from app.database import get_db
from app.email_service import notify_class_completed

router = APIRouter(prefix="/api/classes", tags=["Classes"])


@router.post("/")
def create_class(req: CreateClass, current_user: dict = Depends(require_role("teacher"))):
    with get_db() as conn:
        profile = conn.execute(
            "SELECT id, is_approved FROM teacher_profiles WHERE user_id = ?", (current_user["user_id"],)
        ).fetchone()
        if not profile:
            raise HTTPException(status_code=404, detail="Teacher profile not found")
        if not profile["is_approved"]:
            raise HTTPException(status_code=403, detail="Your profile is not yet approved by admin")

        subject = conn.execute("SELECT id FROM subjects WHERE id = ?", (req.subject_id,)).fetchone()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")

        # Generate Jitsi meet link if not provided
        meeting_link = req.meeting_link
        if not meeting_link:
            import uuid
            room_id = str(uuid.uuid4())[:8]
            meeting_link = f"https://meet.jit.si/GuruClass-{room_id}"

        cursor = conn.execute(
            """INSERT INTO classes (teacher_id, subject_id, title, description, class_type,
                                   scheduled_at, duration_minutes, meeting_link, max_students, price)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (profile["id"], req.subject_id, req.title, req.description, req.class_type,
             req.scheduled_at, req.duration_minutes, meeting_link, req.max_students, req.price)
        )

        return {"message": "Class created successfully", "class_id": cursor.lastrowid, "meeting_link": meeting_link}


@router.get("/")
def list_classes(
    subject_id: int = Query(None),
    class_type: str = Query(None),
    status: str = Query(None),
    teacher_id: int = Query(None),
    page: int = Query(1),
    per_page: int = Query(10)
):
    with get_db() as conn:
        query = """
            SELECT c.*, s.name as subject_name, u.full_name as teacher_name, u.city, u.state,
                   tp.rating as teacher_rating,
                   (SELECT COUNT(*) FROM bookings b WHERE b.class_id = c.id AND b.status != 'cancelled') as booked_count
            FROM classes c
            JOIN subjects s ON s.id = c.subject_id
            JOIN teacher_profiles tp ON tp.id = c.teacher_id
            JOIN users u ON u.id = tp.user_id
            WHERE 1=1
        """
        params = []

        if subject_id:
            query += " AND c.subject_id = ?"
            params.append(subject_id)
        if class_type:
            query += " AND c.class_type = ?"
            params.append(class_type)
        if status:
            query += " AND c.status = ?"
            params.append(status)
        if teacher_id:
            query += " AND c.teacher_id = ?"
            params.append(teacher_id)

        count_query = f"SELECT COUNT(*) as total FROM ({query})"
        total = conn.execute(count_query, params).fetchone()["total"]

        offset = (page - 1) * per_page
        query += " ORDER BY c.scheduled_at ASC LIMIT ? OFFSET ?"
        params.extend([per_page, offset])

        classes = conn.execute(query, params).fetchall()
        return {
            "classes": [
                {
                    "id": c["id"],
                    "teacher_id": c["teacher_id"],
                    "teacher_name": c["teacher_name"],
                    "teacher_city": c["city"],
                    "teacher_state": c["state"],
                    "teacher_rating": c["teacher_rating"],
                    "subject_name": c["subject_name"],
                    "title": c["title"],
                    "description": c["description"],
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
            ],
            "total": total,
            "page": page,
            "per_page": per_page
        }


@router.get("/{class_id}")
def get_class(class_id: int):
    with get_db() as conn:
        cls = conn.execute(
            """SELECT c.*, s.name as subject_name, u.full_name as teacher_name,
                      u.city, u.state, tp.rating as teacher_rating, tp.id as tp_id
               FROM classes c
               JOIN subjects s ON s.id = c.subject_id
               JOIN teacher_profiles tp ON tp.id = c.teacher_id
               JOIN users u ON u.id = tp.user_id
               WHERE c.id = ?""",
            (class_id,)
        ).fetchone()
        if not cls:
            raise HTTPException(status_code=404, detail="Class not found")

        bookings = conn.execute(
            """SELECT b.*, u.full_name as student_name
               FROM bookings b JOIN users u ON u.id = b.student_id
               WHERE b.class_id = ?""",
            (class_id,)
        ).fetchall()

        return {
            "id": cls["id"],
            "teacher_id": cls["teacher_id"],
            "teacher_profile_id": cls["tp_id"],
            "teacher_name": cls["teacher_name"],
            "teacher_city": cls["city"],
            "teacher_state": cls["state"],
            "teacher_rating": cls["teacher_rating"],
            "subject_name": cls["subject_name"],
            "title": cls["title"],
            "description": cls["description"],
            "class_type": cls["class_type"],
            "scheduled_at": cls["scheduled_at"],
            "duration_minutes": cls["duration_minutes"],
            "meeting_link": cls["meeting_link"],
            "status": cls["status"],
            "max_students": cls["max_students"],
            "price": cls["price"],
            "bookings": [
                {
                    "id": b["id"],
                    "student_name": b["student_name"],
                    "status": b["status"],
                    "created_at": b["created_at"]
                } for b in bookings
            ]
        }


@router.put("/{class_id}/status")
def update_class_status(class_id: int, req: UpdateClassStatus, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cls = conn.execute("SELECT * FROM classes WHERE id = ?", (class_id,)).fetchone()
        if not cls:
            raise HTTPException(status_code=404, detail="Class not found")

        if current_user["role"] == "teacher":
            profile = conn.execute(
                "SELECT id FROM teacher_profiles WHERE user_id = ?", (current_user["user_id"],)
            ).fetchone()
            if not profile or profile["id"] != cls["teacher_id"]:
                raise HTTPException(status_code=403, detail="Not your class")

        conn.execute("UPDATE classes SET status = ? WHERE id = ?", (req.status, class_id))

        if req.status == "in_progress":
            # Notify all booked students that teacher has started the class
            booked_students = conn.execute(
                """SELECT b.student_id FROM bookings b
                   WHERE b.class_id = ? AND b.status = 'booked'""",
                (class_id,)
            ).fetchall()
            for student in booked_students:
                conn.execute(
                    "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
                    (student["student_id"],
                     "Class Started! Join Now",
                     f"Your teacher has started the class: {cls['title']}. Join the meeting now!",
                     "class_started")
                )

        if req.status == "completed":
            # Update teacher stats
            conn.execute(
                "UPDATE teacher_profiles SET total_classes = total_classes + 1 WHERE id = ?",
                (cls["teacher_id"],)
            )
            # Update booking status
            conn.execute(
                "UPDATE bookings SET status = 'attended' WHERE class_id = ? AND status = 'booked'",
                (class_id,)
            )
            # Send email notifications for class completion
            try:
                teacher_user = conn.execute(
                    "SELECT u.email, u.full_name FROM users u JOIN teacher_profiles tp ON tp.user_id = u.id WHERE tp.id = ?",
                    (cls["teacher_id"],)
                ).fetchone()
                booked = conn.execute(
                    "SELECT b.student_id, u.email, u.full_name FROM bookings b JOIN users u ON u.id = b.student_id WHERE b.class_id = ? AND b.status = 'attended'",
                    (class_id,)
                ).fetchall()
                if teacher_user:
                    for student in booked:
                        notify_class_completed(student["email"], student["full_name"], teacher_user["email"], teacher_user["full_name"], cls["title"])
            except Exception:
                pass

        return {"message": f"Class status updated to {req.status}"}
