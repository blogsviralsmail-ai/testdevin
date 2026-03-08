from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional
from app.auth import require_role, hash_password
from app.database import get_db
from app.email_service import notify_teacher_approval
import json
import random

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/dashboard")
def dashboard(current_user: dict = Depends(require_role("admin"))):
    with get_db() as conn:
        total_students = conn.execute("SELECT COUNT(*) as cnt FROM users WHERE role = 'student'").fetchone()["cnt"]
        total_teachers = conn.execute("SELECT COUNT(*) as cnt FROM users WHERE role = 'teacher'").fetchone()["cnt"]
        pending_teachers = conn.execute(
            """SELECT COUNT(*) as cnt FROM users u
               JOIN teacher_profiles tp ON tp.user_id = u.id
               WHERE u.role = 'teacher' AND tp.is_approved = 0"""
        ).fetchone()["cnt"]
        total_classes = conn.execute("SELECT COUNT(*) as cnt FROM classes").fetchone()["cnt"]
        active_classes = conn.execute("SELECT COUNT(*) as cnt FROM classes WHERE status = 'scheduled'").fetchone()["cnt"]
        completed_classes = conn.execute("SELECT COUNT(*) as cnt FROM classes WHERE status = 'completed'").fetchone()["cnt"]
        total_bookings = conn.execute("SELECT COUNT(*) as cnt FROM bookings").fetchone()["cnt"]
        total_revenue = conn.execute(
            "SELECT COALESCE(SUM(platform_fee), 0) as total FROM payments WHERE status = 'released'"
        ).fetchone()["total"]
        escrow_amount = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'escrow'"
        ).fetchone()["total"]
        open_tickets = conn.execute(
            "SELECT COUNT(*) as cnt FROM support_tickets WHERE status IN ('open', 'in_progress')"
        ).fetchone()["cnt"]

        # Recent activities
        recent_bookings = conn.execute(
            """SELECT b.*, c.title, u.full_name as student_name
               FROM bookings b JOIN classes c ON c.id = b.class_id
               JOIN users u ON u.id = b.student_id
               ORDER BY b.created_at DESC LIMIT 5"""
        ).fetchall()

        return {
            "total_students": total_students,
            "total_teachers": total_teachers,
            "pending_teachers": pending_teachers,
            "total_classes": total_classes,
            "active_classes": active_classes,
            "completed_classes": completed_classes,
            "total_bookings": total_bookings,
            "total_revenue": total_revenue,
            "escrow_amount": escrow_amount,
            "open_tickets": open_tickets,
            "recent_bookings": [
                {
                    "id": b["id"],
                    "class_title": b["title"],
                    "student_name": b["student_name"],
                    "status": b["status"],
                    "created_at": b["created_at"]
                } for b in recent_bookings
            ]
        }


@router.get("/users")
def list_users(
    role: str = Query(None),
    search: str = Query(None),
    page: int = Query(1),
    per_page: int = Query(20),
    current_user: dict = Depends(require_role("admin"))
):
    with get_db() as conn:
        query = "SELECT u.* FROM users u WHERE 1=1"
        params = []

        if role:
            query += " AND u.role = ?"
            params.append(role)
        if search:
            query += " AND (LOWER(u.full_name) LIKE LOWER(?) OR LOWER(u.email) LIKE LOWER(?))"
            params.extend([f"%{search}%", f"%{search}%"])

        count_query = f"SELECT COUNT(*) as total FROM ({query})"
        total = conn.execute(count_query, params).fetchone()["total"]

        offset = (page - 1) * per_page
        query += " ORDER BY u.created_at DESC LIMIT ? OFFSET ?"
        params.extend([per_page, offset])

        users = conn.execute(query, params).fetchall()

        result = []
        for u in users:
            user_data = {
                "id": u["id"],
                "email": u["email"],
                "full_name": u["full_name"],
                "phone": u["phone"],
                "role": u["role"],
                "city": u["city"],
                "state": u["state"],
                "is_active": bool(u["is_active"]),
                "is_verified": bool(u["is_verified"]),
                "created_at": u["created_at"]
            }
            if u["role"] == "teacher":
                profile = conn.execute(
                    "SELECT * FROM teacher_profiles WHERE user_id = ?", (u["id"],)
                ).fetchone()
                if profile:
                    user_data["teacher_profile"] = {
                        "id": profile["id"],
                        "is_approved": bool(profile["is_approved"]),
                        "rating": profile["rating"],
                        "total_classes": profile["total_classes"],
                        "hourly_rate": profile["hourly_rate"],
                        "total_earnings": profile["total_earnings"],
                        "bank_name": profile["bank_name"] if "bank_name" in profile.keys() else None,
                        "bank_account": profile["bank_account"] if "bank_account" in profile.keys() else None,
                        "bank_ifsc": profile["bank_ifsc"] if "bank_ifsc" in profile.keys() else None,
                        "upi_id": profile["upi_id"] if "upi_id" in profile.keys() else None
                    }
            result.append(user_data)

        return {"users": result, "total": total, "page": page, "per_page": per_page}


@router.put("/users/{user_id}/status")
def update_user_status(
    user_id: int,
    action: str = Query(..., description="approve, suspend, activate, verify"),
    current_user: dict = Depends(require_role("admin"))
):
    with get_db() as conn:
        user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if action == "approve":
            conn.execute("UPDATE teacher_profiles SET is_approved = 1 WHERE user_id = ?", (user_id,))
            conn.execute(
                "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
                (user_id, "Profile Approved!", "Your teacher profile has been approved. You can now create classes.", "system")
            )
            # Send email notification
            try:
                notify_teacher_approval(user["email"], user["full_name"])
            except Exception:
                pass
        elif action == "suspend":
            conn.execute("UPDATE users SET is_active = 0 WHERE id = ?", (user_id,))
        elif action == "activate":
            conn.execute("UPDATE users SET is_active = 1 WHERE id = ?", (user_id,))
        elif action == "verify":
            conn.execute("UPDATE users SET is_verified = 1 WHERE id = ?", (user_id,))
        else:
            raise HTTPException(status_code=400, detail="Invalid action")

        return {"message": f"User {action}d successfully"}


class AdminAddTeacher(BaseModel):
    email: str
    full_name: str
    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = "Rajasthan"
    password: str = "teacher123"
    bio: Optional[str] = None
    experience_years: int = 1
    hourly_rate: float = 150
    languages: list[str] = ["Hindi", "English"]
    qualification: Optional[str] = "B.Ed"
    subject_ids: list[int] = []
    auto_approve: bool = True
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    bank_ifsc: Optional[str] = None
    upi_id: Optional[str] = None


@router.post("/add-teacher")
def add_teacher(req: AdminAddTeacher, current_user: dict = Depends(require_role("admin"))):
    with get_db() as conn:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (req.email,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Email already exists")

        password_hash = hash_password(req.password)
        cursor = conn.execute(
            """INSERT INTO users (email, password_hash, full_name, phone, role, city, state, is_active, is_verified)
               VALUES (?, ?, ?, ?, 'teacher', ?, ?, 1, 1)""",
            (req.email, password_hash, req.full_name, req.phone, req.city, req.state)
        )
        user_id = cursor.lastrowid

        cursor = conn.execute(
            """INSERT INTO teacher_profiles (user_id, bio, experience_years, hourly_rate, languages, qualification, is_approved, bank_name, bank_account, bank_ifsc, upi_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (user_id, req.bio or f"Teacher from {req.city or 'India'}",
             req.experience_years, req.hourly_rate,
             json.dumps(req.languages), req.qualification,
             1 if req.auto_approve else 0,
             req.bank_name, req.bank_account, req.bank_ifsc, req.upi_id)
        )
        teacher_id = cursor.lastrowid

        for sid in req.subject_ids:
            conn.execute(
                "INSERT OR IGNORE INTO teacher_subjects (teacher_id, subject_id, class_levels) VALUES (?, ?, ?)",
                (teacher_id, sid, json.dumps(["Class 9-10", "Class 11-12"]))
            )

        return {"message": "Teacher added successfully", "user_id": user_id, "teacher_id": teacher_id}


class AdminAddStudent(BaseModel):
    email: str
    full_name: str
    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = "Rajasthan"
    password: str = "student123"


@router.post("/add-student")
def add_student(req: AdminAddStudent, current_user: dict = Depends(require_role("admin"))):
    with get_db() as conn:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (req.email,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Email already exists")

        password_hash = hash_password(req.password)
        cursor = conn.execute(
            """INSERT INTO users (email, password_hash, full_name, phone, role, city, state, is_active, is_verified)
               VALUES (?, ?, ?, ?, 'student', ?, ?, 1, 1)""",
            (req.email, password_hash, req.full_name, req.phone, req.city, req.state)
        )
        return {"message": "Student added successfully", "user_id": cursor.lastrowid}


@router.post("/seed-bulk")
def seed_bulk(current_user: dict = Depends(require_role("admin"))):
    """Seed 2000 teachers and 5000 students with Gmail emails"""
    cities = [
        "Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner",
        "Bhilwara", "Alwar", "Sikar", "Pali", "Bharatpur", "Sri Ganganagar",
        "Tonk", "Kishangarh", "Beawar", "Hanumangarh", "Dhaulpur",
        "Gangapur City", "Sawai Madhopur", "Churu", "Jhunjhunu",
        "Banswara", "Chittorgarh", "Baran", "Rajsamand", "Mount Abu",
        "Nagaur", "Barmer", "Dungarpur", "Bundi", "Jaisalmer", "Pushkar"
    ]
    first_names_male = [
        "Rajesh", "Suresh", "Mahesh", "Ramesh", "Dinesh", "Mukesh",
        "Anil", "Sunil", "Vikas", "Deepak", "Amit", "Sumit",
        "Rakesh", "Naresh", "Yogesh", "Ganesh", "Vikram", "Ashok",
        "Sanjay", "Ravi", "Mohan", "Gopal", "Krishna", "Shyam",
        "Hari", "Pramod", "Manoj", "Vinod", "Kamal", "Rahul",
        "Pankaj", "Ajay", "Vijay", "Hemant", "Lalit", "Naveen",
        "Sandeep", "Pradeep", "Devendra", "Surendra", "Rohit", "Nitin",
        "Gaurav", "Tushar", "Manish", "Sachin", "Vivek", "Ankur",
        "Abhishek", "Arjun", "Karan", "Varun", "Tarun", "Dhruv",
        "Kunal", "Harsh", "Sahil", "Mohit", "Neeraj", "Lokesh"
    ]
    first_names_female = [
        "Sunita", "Anita", "Kavita", "Savita", "Neeta", "Geeta",
        "Priya", "Pooja", "Neha", "Ritu", "Meena", "Seema",
        "Rekha", "Shobha", "Kiran", "Anjali", "Deepa", "Suman",
        "Lata", "Asha", "Manju", "Saroj", "Usha", "Radha",
        "Durga", "Lakshmi", "Sarita", "Mamta", "Pushpa", "Kamla",
        "Nisha", "Divya", "Swati", "Pallavi", "Shruti", "Megha",
        "Komal", "Jyoti", "Sonal", "Tanvi", "Riya", "Aishwarya",
        "Bhavna", "Chhaya", "Garima", "Harsha", "Isha", "Juhi",
        "Khushboo", "Leela", "Madhuri", "Namrata", "Payal", "Radhika"
    ]
    last_names = [
        "Sharma", "Verma", "Gupta", "Jain", "Agarwal", "Singh",
        "Meena", "Choudhary", "Rathore", "Shekhawat", "Rajput",
        "Mathur", "Saxena", "Patel", "Yadav", "Kumawat", "Soni",
        "Joshi", "Purohit", "Vyas", "Pareek", "Bansal", "Goyal",
        "Khandelwal", "Maheshwari", "Chauhan", "Tiwari", "Pandey",
        "Mishra", "Dubey", "Shukla", "Thakur", "Bhatia", "Kapoor",
        "Malhotra", "Chopra", "Arora", "Sethi", "Grover", "Dhawan"
    ]
    qualifications = [
        "B.Ed", "M.Ed", "B.Sc + B.Ed", "M.Sc + B.Ed", "M.A + B.Ed",
        "Ph.D", "MBA", "B.Tech + M.Tech", "M.Com", "B.A + B.Ed",
        "PGDCA", "MCA", "B.Tech", "M.Sc", "M.A"
    ]
    languages_pool = ["Hindi", "English", "Rajasthani", "Sanskrit"]
    class_levels_pool = [
        "Class 1-5", "Class 6-8", "Class 9-10", "Class 11-12",
        "College", "Professional", "Competitive Exams"
    ]
    bios = [
        "Passionate educator with {exp} years of experience from {city}.",
        "Dedicated teacher with {exp} years experience. Specializing in practical learning.",
        "Experienced {qual} qualified teacher from {city}. Focus on concept clarity.",
        "Professional tutor with {exp} years. Expert in exam preparation.",
        "{qual} qualified teacher from {city}. Building strong fundamentals.",
        "Senior educator with {exp}+ years. Known for excellent results.",
        "Certified educator from {city}. Interactive sessions and personalized attention.",
        "Online tutor with {exp} years expertise in engaging live classes.",
        "Result-oriented teacher from {city}. {exp} years of proven track record.",
        "Experienced teacher with passion for transforming education from {city}."
    ]

    pw_hash = hash_password("teacher123")
    student_pw_hash = hash_password("student123")

    with get_db() as conn:
        # Get existing subjects
        subjects = conn.execute("SELECT id FROM subjects").fetchall()
        subject_ids = [s["id"] for s in subjects]
        if not subject_ids:
            raise HTTPException(status_code=400, detail="No subjects found. Seed subjects first.")

        # Check how many teachers/students already exist
        existing_teachers = conn.execute("SELECT COUNT(*) as cnt FROM users WHERE role='teacher'").fetchone()["cnt"]
        existing_students = conn.execute("SELECT COUNT(*) as cnt FROM users WHERE role='student'").fetchone()["cnt"]

        teachers_added = 0
        students_added = 0

        # Seed teachers (2000 new)
        for i in range(2000):
            idx = existing_teachers + i + 1
            if random.random() < 0.5:
                first = random.choice(first_names_male)
            else:
                first = random.choice(first_names_female)
            last = random.choice(last_names)
            full_name = f"{first} {last}"
            city = random.choice(cities)
            email = f"{first.lower()}.{last.lower()}{idx}@gmail.com"
            phone = f"9{random.randint(100000000, 999999999)}"
            exp = random.randint(1, 20)
            rate = random.choice([100, 120, 130, 150, 170, 180, 200, 220, 230, 250])
            qual = random.choice(qualifications)
            langs = json.dumps(random.sample(languages_pool, random.randint(1, 3)))
            rating = round(random.uniform(3.5, 5.0), 1)
            total_reviews = random.randint(5, 200)
            total_classes = random.randint(10, 500)
            bio = random.choice(bios).format(exp=exp, city=city, qual=qual)

            try:
                cur = conn.execute(
                    """INSERT INTO users (email, password_hash, full_name, phone, role, city, state, is_active, is_verified)
                       VALUES (?, ?, ?, ?, 'teacher', ?, 'Rajasthan', 1, 1)""",
                    (email, pw_hash, full_name, phone, city)
                )
                uid = cur.lastrowid
                cur2 = conn.execute(
                    """INSERT INTO teacher_profiles (user_id, bio, experience_years, hourly_rate, languages,
                       qualification, is_approved, rating, total_reviews, total_classes)
                       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)""",
                    (uid, bio, exp, rate, langs, qual, rating, total_reviews, total_classes)
                )
                tid = cur2.lastrowid

                # Add 2-4 subjects
                for sid in random.sample(subject_ids, min(random.randint(2, 4), len(subject_ids))):
                    levels = json.dumps(random.sample(class_levels_pool, random.randint(1, 3)))
                    conn.execute(
                        "INSERT OR IGNORE INTO teacher_subjects (teacher_id, subject_id, class_levels) VALUES (?, ?, ?)",
                        (tid, sid, levels)
                    )

                # Add availability 2-5 days
                for day in random.sample(range(7), random.randint(2, 5)):
                    sh = random.choice([8, 9, 10])
                    eh = random.choice([17, 18, 19, 20])
                    conn.execute(
                        "INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)",
                        (tid, day, f"{sh:02d}:00", f"{eh:02d}:00")
                    )

                teachers_added += 1
            except Exception:
                pass

        # Seed students (5000 new)
        student_cities = cities + [
            "Delhi", "Mumbai", "Bangalore", "Hyderabad", "Chennai",
            "Pune", "Ahmedabad", "Kolkata", "Lucknow", "Chandigarh",
            "Indore", "Bhopal", "Patna", "Noida", "Gurgaon",
            "Nagpur", "Surat", "Vadodara", "Coimbatore", "Mysore"
        ]
        student_states = {
            "Delhi": "Delhi", "Mumbai": "Maharashtra", "Bangalore": "Karnataka",
            "Hyderabad": "Telangana", "Chennai": "Tamil Nadu", "Pune": "Maharashtra",
            "Ahmedabad": "Gujarat", "Kolkata": "West Bengal", "Lucknow": "Uttar Pradesh",
            "Chandigarh": "Chandigarh", "Indore": "Madhya Pradesh", "Bhopal": "Madhya Pradesh",
            "Patna": "Bihar", "Noida": "Uttar Pradesh", "Gurgaon": "Haryana",
            "Nagpur": "Maharashtra", "Surat": "Gujarat", "Vadodara": "Gujarat",
            "Coimbatore": "Tamil Nadu", "Mysore": "Karnataka"
        }

        for i in range(5000):
            idx = existing_students + i + 1
            if random.random() < 0.5:
                first = random.choice(first_names_male)
            else:
                first = random.choice(first_names_female)
            last = random.choice(last_names)
            full_name = f"{first} {last}"
            city = random.choice(student_cities)
            state = student_states.get(city, "Rajasthan")
            email = f"{first.lower()}.{last.lower()}.student{idx}@gmail.com"
            phone = f"9{random.randint(100000000, 999999999)}"

            try:
                conn.execute(
                    """INSERT INTO users (email, password_hash, full_name, phone, role, city, state, is_active, is_verified)
                       VALUES (?, ?, ?, ?, 'student', ?, ?, 1, 1)""",
                    (email, student_pw_hash, full_name, phone, city, state)
                )
                students_added += 1
            except Exception:
                pass

        return {
            "message": f"Seeded {teachers_added} teachers and {students_added} students",
            "teachers_added": teachers_added,
            "students_added": students_added,
            "total_teachers": existing_teachers + teachers_added,
            "total_students": existing_students + students_added
        }


class AdminEditUser(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None


class AdminEditTeacher(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    bio: Optional[str] = None
    experience_years: Optional[int] = None
    hourly_rate: Optional[float] = None
    qualification: Optional[str] = None
    languages: Optional[list[str]] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    bank_ifsc: Optional[str] = None
    upi_id: Optional[str] = None


@router.put("/users/{user_id}/edit")
def edit_user(user_id: int, req: AdminEditUser, current_user: dict = Depends(require_role("admin"))):
    with get_db() as conn:
        user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        updates = []
        params = []
        for field in ["full_name", "email", "phone", "city", "state"]:
            val = getattr(req, field)
            if val is not None:
                updates.append(f"{field} = ?")
                params.append(val)

        if updates:
            params.append(user_id)
            conn.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)

        return {"message": "User updated successfully"}


@router.put("/teachers/{user_id}/edit")
def edit_teacher(user_id: int, req: AdminEditTeacher, current_user: dict = Depends(require_role("admin"))):
    with get_db() as conn:
        user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Update user fields
        user_updates = []
        user_params = []
        for field in ["full_name", "email", "phone", "city", "state"]:
            val = getattr(req, field)
            if val is not None:
                user_updates.append(f"{field} = ?")
                user_params.append(val)
        if user_updates:
            user_params.append(user_id)
            conn.execute(f"UPDATE users SET {', '.join(user_updates)} WHERE id = ?", user_params)

        # Update teacher profile fields
        profile = conn.execute("SELECT id FROM teacher_profiles WHERE user_id = ?", (user_id,)).fetchone()
        if profile:
            prof_updates = []
            prof_params = []
            for field in ["bio", "experience_years", "hourly_rate", "qualification", "bank_name", "bank_account", "bank_ifsc", "upi_id"]:
                val = getattr(req, field)
                if val is not None:
                    prof_updates.append(f"{field} = ?")
                    prof_params.append(val)
            if req.languages is not None:
                prof_updates.append("languages = ?")
                prof_params.append(json.dumps(req.languages))
            if prof_updates:
                prof_params.append(profile["id"])
                conn.execute(f"UPDATE teacher_profiles SET {', '.join(prof_updates)} WHERE id = ?", prof_params)

        return {"message": "Teacher updated successfully"}


@router.get("/classes")
def list_all_classes(
    status: str = Query(None),
    page: int = Query(1),
    per_page: int = Query(20),
    current_user: dict = Depends(require_role("admin"))
):
    with get_db() as conn:
        query = """
            SELECT c.*, s.name as subject_name, u.full_name as teacher_name,
                   (SELECT COUNT(*) FROM bookings b WHERE b.class_id = c.id) as booking_count
            FROM classes c
            JOIN subjects s ON s.id = c.subject_id
            JOIN teacher_profiles tp ON tp.id = c.teacher_id
            JOIN users u ON u.id = tp.user_id
            WHERE 1=1
        """
        params = []
        if status:
            query += " AND c.status = ?"
            params.append(status)

        count_query = f"SELECT COUNT(*) as total FROM ({query})"
        total = conn.execute(count_query, params).fetchone()["total"]

        offset = (page - 1) * per_page
        query += " ORDER BY c.scheduled_at DESC LIMIT ? OFFSET ?"
        params.extend([per_page, offset])

        classes = conn.execute(query, params).fetchall()
        return {
            "classes": [
                {
                    "id": c["id"],
                    "title": c["title"],
                    "subject_name": c["subject_name"],
                    "teacher_name": c["teacher_name"],
                    "class_type": c["class_type"],
                    "scheduled_at": c["scheduled_at"],
                    "duration_minutes": c["duration_minutes"],
                    "status": c["status"],
                    "price": c["price"],
                    "booking_count": c["booking_count"]
                } for c in classes
            ],
            "total": total,
            "page": page,
            "per_page": per_page
        }
