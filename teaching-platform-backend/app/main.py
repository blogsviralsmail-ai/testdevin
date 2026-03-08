from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db, get_db
from app.routers import auth_router, teacher_router, student_router, class_router, payment_router, admin_router, support_router, notification_router, settings_router

app = FastAPI(title="Guru Platform API", version="1.0.0")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(auth_router.router)
app.include_router(teacher_router.router)
app.include_router(student_router.router)
app.include_router(class_router.router)
app.include_router(payment_router.router)
app.include_router(admin_router.router)
app.include_router(support_router.router)
app.include_router(notification_router.router)
app.include_router(settings_router.router)


@app.on_event("startup")
def startup():
    init_db()


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/api/subjects")
def list_subjects():
    with get_db() as conn:
        subjects = conn.execute("SELECT * FROM subjects ORDER BY name").fetchall()
        return [{"id": s["id"], "name": s["name"]} for s in subjects]


@app.post("/api/seed-teachers")
def seed_teachers():
    """Seed 100 dummy teachers from Rajasthan (only if no teachers exist)"""
    import json
    import random
    import bcrypt
    from app.database import get_connection

    conn = get_connection()
    cursor = conn.cursor()

    existing = cursor.execute("SELECT COUNT(*) FROM teacher_profiles").fetchone()[0]
    if existing > 0:
        conn.close()
        return {"message": f"Already have {existing} teachers, skipping seed"}

    cities = [
        "Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner",
        "Bhilwara", "Alwar", "Sikar", "Pali", "Bharatpur", "Sri Ganganagar",
        "Tonk", "Kishangarh", "Beawar", "Hanumangarh", "Dhaulpur",
        "Gangapur City", "Sawai Madhopur", "Churu", "Jhunjhunu",
        "Banswara", "Chittorgarh", "Baran", "Rajsamand", "Mount Abu",
        "Nagaur", "Barmer", "Dungarpur", "Bundi", "Jaisalmer", "Pushkar"
    ]
    first_names_male = ["Rajesh", "Suresh", "Mahesh", "Ramesh", "Dinesh", "Mukesh",
        "Anil", "Sunil", "Vikas", "Deepak", "Amit", "Sumit",
        "Rakesh", "Naresh", "Yogesh", "Ganesh", "Vikram", "Ashok",
        "Sanjay", "Ravi", "Mohan", "Gopal", "Krishna", "Shyam",
        "Hari", "Pramod", "Manoj", "Vinod", "Kamal", "Rahul",
        "Pankaj", "Ajay", "Vijay", "Hemant", "Lalit", "Naveen",
        "Sandeep", "Pradeep", "Devendra", "Surendra"]
    first_names_female = ["Sunita", "Anita", "Kavita", "Savita", "Neeta", "Geeta",
        "Priya", "Pooja", "Neha", "Ritu", "Meena", "Seema",
        "Rekha", "Shobha", "Kiran", "Anjali", "Deepa", "Suman",
        "Lata", "Asha", "Manju", "Saroj", "Usha", "Radha",
        "Durga", "Lakshmi", "Sarita", "Mamta", "Pushpa", "Kamla"]
    last_names = ["Sharma", "Verma", "Gupta", "Jain", "Agarwal", "Singh",
        "Meena", "Choudhary", "Rathore", "Shekhawat", "Rajput",
        "Mathur", "Saxena", "Patel", "Yadav", "Kumawat", "Soni",
        "Joshi", "Purohit", "Vyas", "Pareek", "Bansal", "Goyal",
        "Khandelwal", "Maheshwari"]
    languages_pool = ["Hindi", "English", "Rajasthani", "Sanskrit"]
    qualifications = ["B.Ed", "M.Ed", "B.Sc + B.Ed", "M.Sc + B.Ed", "M.A + B.Ed",
        "Ph.D", "MBA", "B.Tech + M.Tech", "M.Com", "B.A + B.Ed",
        "PGDCA", "MCA", "B.Tech", "M.Sc", "M.A"]
    class_levels_pool = ["Class 1-5", "Class 6-8", "Class 9-10", "Class 11-12",
        "College", "Professional", "Competitive Exams"]
    bios = [
        "Passionate educator with {exp} years of experience in teaching.",
        "Dedicated teacher from {city} with {exp} years of experience.",
        "Professional tutor with {exp} years of teaching experience.",
        "Experienced online tutor from {city}. {exp} years of expertise.",
        "Result-oriented teacher. {exp} years of experience in teaching.",
        "Senior educator with {exp} years of experience."
    ]

    subjects = cursor.execute("SELECT id, name FROM subjects").fetchall()
    actual_subject_ids = [s[0] for s in subjects]
    password_hash = bcrypt.hashpw("teacher123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    for i in range(100):
        first_name = random.choice(first_names_male if random.random() < 0.5 else first_names_female)
        last_name = random.choice(last_names)
        full_name = f"{first_name} {last_name}"
        city = random.choice(cities)
        email = f"{first_name.lower()}.{last_name.lower()}{i+1}@guru.com"
        phone = f"9{random.randint(100000000, 999999999)}"
        experience = random.randint(1, 20)
        hourly_rate = random.choice([100, 120, 130, 150, 170, 180, 200, 220, 230, 250])
        qualification = random.choice(qualifications)
        languages = json.dumps(random.sample(languages_pool, random.randint(1, 3)))
        rating = round(random.uniform(3.5, 5.0), 1)
        total_reviews = random.randint(5, 100)
        total_classes = random.randint(10, 500)
        bio = random.choice(bios).format(exp=experience, city=city)

        cursor.execute(
            "INSERT INTO users (email, password_hash, full_name, phone, role, city, state, is_active, is_verified) VALUES (?, ?, ?, ?, 'teacher', ?, 'Rajasthan', 1, 1)",
            (email, password_hash, full_name, phone, city))
        user_id = cursor.lastrowid
        cursor.execute(
            "INSERT INTO teacher_profiles (user_id, bio, experience_years, hourly_rate, languages, qualification, is_approved, rating, total_reviews, total_classes) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)",
            (user_id, bio, experience, hourly_rate, languages, qualification, rating, total_reviews, total_classes))
        teacher_id = cursor.lastrowid

        for subj_id in random.sample(actual_subject_ids, random.randint(2, 4)):
            levels = json.dumps(random.sample(class_levels_pool, random.randint(1, 3)))
            cursor.execute("INSERT OR IGNORE INTO teacher_subjects (teacher_id, subject_id, class_levels) VALUES (?, ?, ?)", (teacher_id, subj_id, levels))

        for day in random.sample(range(7), random.randint(2, 5)):
            start_hour = random.choice([8, 9, 10])
            end_hour = random.choice([17, 18, 19, 20])
            cursor.execute("INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)",
                (teacher_id, day, f"{start_hour:02d}:00", f"{end_hour:02d}:00"))

    conn.commit()
    conn.close()
    return {"message": "100 teachers seeded successfully"}
