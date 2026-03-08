from fastapi import APIRouter, HTTPException, Depends, Query
from app.models import BookClassRequest, BookTeacherRequest, CreateReview
from app.auth import get_current_user, require_role
from app.database import get_db
from app.email_service import notify_new_booking, notify_payment_received

router = APIRouter(prefix="/api/students", tags=["Students"])


@router.post("/book-teacher")
def book_teacher(req: BookTeacherRequest, current_user: dict = Depends(require_role("student"))):
    """Direct booking: student books a teacher by selecting subject, date, time"""
    import uuid
    with get_db() as conn:
        # Verify teacher exists and is approved
        teacher = conn.execute(
            """SELECT tp.id, tp.hourly_rate, tp.user_id, u.full_name as teacher_name
               FROM teacher_profiles tp JOIN users u ON u.id = tp.user_id
               WHERE tp.id = ? AND tp.is_approved = 1""",
            (req.teacher_id,)
        ).fetchone()
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found or not approved")

        # Verify subject exists and teacher teaches it
        ts = conn.execute(
            "SELECT id FROM teacher_subjects WHERE teacher_id = ? AND subject_id = ?",
            (req.teacher_id, req.subject_id)
        ).fetchone()
        if not ts:
            raise HTTPException(status_code=400, detail="Teacher does not teach this subject")

        subject = conn.execute("SELECT name FROM subjects WHERE id = ?", (req.subject_id,)).fetchone()

        # Check teacher availability for the selected day
        from datetime import datetime as dt
        selected_date = dt.strptime(req.scheduled_date, "%Y-%m-%d")
        day_of_week = selected_date.weekday()  # 0=Monday, 6=Sunday
        availability = conn.execute(
            "SELECT start_time, end_time FROM teacher_availability WHERE teacher_id = ? AND day_of_week = ?",
            (req.teacher_id, day_of_week)
        ).fetchone()
        if not availability:
            raise HTTPException(status_code=400, detail=f"Teacher is not available on {selected_date.strftime('%A')}")

        # Check if selected time is within available hours
        req_hour = int(req.scheduled_time.split(':')[0])
        avail_start = int(availability['start_time'].split(':')[0])
        avail_end = int(availability['end_time'].split(':')[0])
        if req_hour < avail_start or req_hour >= avail_end:
            raise HTTPException(status_code=400, detail=f"Teacher is only available from {availability['start_time']} to {availability['end_time']} on this day")

        # Check for double booking - same teacher, same date/time
        scheduled_at_check = f"{req.scheduled_date} {req.scheduled_time}:00"
        existing_class = conn.execute(
            """SELECT c.id FROM classes c
               WHERE c.teacher_id = ? AND c.scheduled_at = ? AND c.status != 'cancelled'""",
            (req.teacher_id, scheduled_at_check)
        ).fetchone()
        if existing_class:
            raise HTTPException(status_code=400, detail="This time slot is already booked. Please choose a different time.")

        # Calculate price based on teacher's hourly rate and duration
        price = round(teacher["hourly_rate"] * (req.duration_minutes / 60), 2)

        # Generate Jitsi meeting link
        room_id = str(uuid.uuid4())[:8]
        meeting_link = f"https://meet.jit.si/GuruClass-{room_id}"

        scheduled_at = f"{req.scheduled_date} {req.scheduled_time}:00"
        title = f"{subject['name']} Class with {teacher['teacher_name']}"
        description = req.message or f"One-on-one {subject['name']} class"

        # Create the class
        cursor = conn.execute(
            """INSERT INTO classes (teacher_id, student_id, subject_id, title, description,
                                   class_type, scheduled_at, duration_minutes, meeting_link, max_students, price)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (req.teacher_id, current_user["user_id"], req.subject_id, title, description,
             req.class_type, scheduled_at, req.duration_minutes, meeting_link,
             1 if req.class_type == "one-on-one" else 10, price)
        )
        class_id = cursor.lastrowid

        # Create the booking
        cursor = conn.execute(
            "INSERT INTO bookings (class_id, student_id) VALUES (?, ?)",
            (class_id, current_user["user_id"])
        )
        booking_id = cursor.lastrowid

        # Create escrow payment with card details
        platform_fee = round(price * 0.10, 2)
        teacher_amount = round(price - platform_fee, 2)
        card_last4 = req.card_number[-4:] if req.card_number and len(req.card_number) >= 4 else None
        card_brand = "Visa" if req.card_number and req.card_number.startswith("4") else "Mastercard" if req.card_number and req.card_number.startswith("5") else "RuPay" if req.card_number else None
        import uuid as uuid_mod
        txn_id = f"TXN-{uuid_mod.uuid4().hex[:12].upper()}"
        conn.execute(
            """INSERT INTO payments (booking_id, student_id, teacher_id, amount, platform_fee, teacher_amount, status, payment_method, transaction_id, card_last4, card_brand, payment_type)
               VALUES (?, ?, ?, ?, ?, ?, 'escrow', ?, ?, ?, ?, 'pay_in')""",
            (booking_id, current_user["user_id"], req.teacher_id, price, platform_fee, teacher_amount,
             'card' if req.card_number else 'wallet', txn_id, card_last4, card_brand)
        )

        # Notify teacher
        student = conn.execute("SELECT full_name, email FROM users WHERE id = ?", (current_user["user_id"],)).fetchone()
        conn.execute(
            "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
            (teacher["user_id"], "New Booking!",
             f"{student['full_name']} has booked a {subject['name']} class on {req.scheduled_date} at {req.scheduled_time}",
             "booking")
        )

        # Send email notifications
        try:
            teacher_email_row = conn.execute("SELECT email FROM users WHERE id = ?", (teacher["user_id"],)).fetchone()
            if teacher_email_row and student:
                notify_new_booking(student["email"], student["full_name"], teacher_email_row["email"], teacher["teacher_name"], title, scheduled_at)
                notify_payment_received(student["email"], student["full_name"], price, title)
        except Exception:
            pass

        return {
            "message": "Class booked successfully!",
            "booking_id": booking_id,
            "class_id": class_id,
            "meeting_link": meeting_link,
            "price": price,
            "scheduled_at": scheduled_at
        }


@router.post("/book")
def book_class(req: BookClassRequest, current_user: dict = Depends(require_role("student"))):
    with get_db() as conn:
        cls = conn.execute("SELECT * FROM classes WHERE id = ?", (req.class_id,)).fetchone()
        if not cls:
            raise HTTPException(status_code=404, detail="Class not found")
        if cls["status"] != "scheduled":
            raise HTTPException(status_code=400, detail="Class is not available for booking")

        existing = conn.execute(
            "SELECT id FROM bookings WHERE class_id = ? AND student_id = ? AND status != 'cancelled'",
            (req.class_id, current_user["user_id"])
        ).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Already booked this class")

        booked_count = conn.execute(
            "SELECT COUNT(*) as cnt FROM bookings WHERE class_id = ? AND status != 'cancelled'",
            (req.class_id,)
        ).fetchone()["cnt"]
        if booked_count >= cls["max_students"]:
            raise HTTPException(status_code=400, detail="Class is fully booked")

        cursor = conn.execute(
            "INSERT INTO bookings (class_id, student_id) VALUES (?, ?)",
            (req.class_id, current_user["user_id"])
        )
        booking_id = cursor.lastrowid

        # Auto-create escrow payment
        amount = cls["price"]
        platform_fee = round(amount * 0.10, 2)
        teacher_amount = round(amount - platform_fee, 2)

        conn.execute(
            """INSERT INTO payments (booking_id, student_id, teacher_id, amount, platform_fee, teacher_amount, status)
               VALUES (?, ?, ?, ?, ?, ?, 'escrow')""",
            (booking_id, current_user["user_id"], cls["teacher_id"], amount, platform_fee, teacher_amount)
        )

        # Create notification for teacher
        teacher_user = conn.execute(
            "SELECT user_id FROM teacher_profiles WHERE id = ?", (cls["teacher_id"],)
        ).fetchone()
        if teacher_user:
            student = conn.execute("SELECT full_name FROM users WHERE id = ?", (current_user["user_id"],)).fetchone()
            conn.execute(
                "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
                (teacher_user["user_id"], "New Booking!",
                 f"{student['full_name']} has booked your class: {cls['title']}", "booking")
            )

        return {"message": "Class booked successfully", "booking_id": booking_id}


@router.get("/bookings")
def get_my_bookings(
    status: str = Query(None),
    current_user: dict = Depends(require_role("student"))
):
    with get_db() as conn:
        query = """
            SELECT b.*, c.title, c.description, c.scheduled_at, c.duration_minutes,
                   c.meeting_link, c.status as class_status, c.class_type, c.price,
                   s.name as subject_name, u.full_name as teacher_name,
                   p.status as payment_status, p.amount as payment_amount
            FROM bookings b
            JOIN classes c ON c.id = b.class_id
            JOIN subjects s ON s.id = c.subject_id
            JOIN teacher_profiles tp ON tp.id = c.teacher_id
            JOIN users u ON u.id = tp.user_id
            LEFT JOIN payments p ON p.booking_id = b.id
            WHERE b.student_id = ?
        """
        params = [current_user["user_id"]]
        if status:
            query += " AND b.status = ?"
            params.append(status)
        query += " ORDER BY c.scheduled_at DESC"

        bookings = conn.execute(query, params).fetchall()
        return [
            {
                "id": b["id"],
                "class_id": b["class_id"],
                "title": b["title"],
                "description": b["description"],
                "subject_name": b["subject_name"],
                "teacher_name": b["teacher_name"],
                "class_type": b["class_type"],
                "scheduled_at": b["scheduled_at"],
                "duration_minutes": b["duration_minutes"],
                "meeting_link": b["meeting_link"],
                "class_status": b["class_status"],
                "booking_status": b["status"],
                "price": b["price"],
                "payment_status": b["payment_status"],
                "payment_amount": b["payment_amount"],
                "created_at": b["created_at"]
            } for b in bookings
        ]


@router.post("/review")
def create_review(req: CreateReview, current_user: dict = Depends(require_role("student"))):
    with get_db() as conn:
        # Check if student attended this class
        booking = conn.execute(
            """SELECT b.id FROM bookings b
               JOIN classes c ON c.id = b.class_id
               WHERE b.student_id = ? AND c.teacher_id = ? AND b.class_id = ?""",
            (current_user["user_id"], req.teacher_id, req.class_id)
        ).fetchone()
        if not booking:
            raise HTTPException(status_code=400, detail="You can only review teachers whose classes you've attended")

        existing = conn.execute(
            "SELECT id FROM reviews WHERE student_id = ? AND teacher_id = ? AND class_id = ?",
            (current_user["user_id"], req.teacher_id, req.class_id)
        ).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="You already reviewed this class")

        conn.execute(
            "INSERT INTO reviews (student_id, teacher_id, class_id, rating, comment) VALUES (?, ?, ?, ?, ?)",
            (current_user["user_id"], req.teacher_id, req.class_id, req.rating, req.comment)
        )

        # Update teacher rating
        avg = conn.execute(
            "SELECT AVG(rating) as avg_rating, COUNT(*) as cnt FROM reviews WHERE teacher_id = ?",
            (req.teacher_id,)
        ).fetchone()
        conn.execute(
            "UPDATE teacher_profiles SET rating = ?, total_reviews = ? WHERE id = ?",
            (round(avg["avg_rating"], 1), avg["cnt"], req.teacher_id)
        )

        return {"message": "Review submitted successfully"}


@router.post("/favourites/{teacher_id}")
def add_favourite(teacher_id: int, current_user: dict = Depends(require_role("student"))):
    with get_db() as conn:
        teacher = conn.execute("SELECT id FROM teacher_profiles WHERE id = ?", (teacher_id,)).fetchone()
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")
        try:
            conn.execute(
                "INSERT INTO favourites (student_id, teacher_id) VALUES (?, ?)",
                (current_user["user_id"], teacher_id)
            )
        except Exception:
            raise HTTPException(status_code=400, detail="Already in favourites")
        return {"message": "Added to favourites"}


@router.delete("/favourites/{teacher_id}")
def remove_favourite(teacher_id: int, current_user: dict = Depends(require_role("student"))):
    with get_db() as conn:
        conn.execute(
            "DELETE FROM favourites WHERE student_id = ? AND teacher_id = ?",
            (current_user["user_id"], teacher_id)
        )
        return {"message": "Removed from favourites"}


@router.get("/favourites")
def get_favourites(current_user: dict = Depends(require_role("student"))):
    with get_db() as conn:
        favs = conn.execute(
            """SELECT f.*, u.full_name, u.city, u.state, u.avatar,
                      tp.bio, tp.hourly_rate, tp.rating, tp.total_reviews, tp.languages
               FROM favourites f
               JOIN teacher_profiles tp ON tp.id = f.teacher_id
               JOIN users u ON u.id = tp.user_id
               WHERE f.student_id = ?""",
            (current_user["user_id"],)
        ).fetchall()
        return [
            {
                "teacher_id": f["teacher_id"],
                "full_name": f["full_name"],
                "city": f["city"],
                "state": f["state"],
                "avatar": f["avatar"],
                "bio": f["bio"],
                "hourly_rate": f["hourly_rate"],
                "rating": f["rating"],
                "total_reviews": f["total_reviews"],
                "languages": f["languages"],
                "added_at": f["created_at"]
            } for f in favs
        ]
