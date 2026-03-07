"""Seed 100 dummy teachers from Rajasthan with multiple subjects and rates 100-250/hr"""
import sqlite3
import json
import random
import os
import bcrypt

DB_PATH = os.path.join(os.path.dirname(__file__), "app.db")
if os.path.exists("/data"):
    DB_PATH = "/data/app.db"

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# Rajasthan cities
cities = [
    "Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner",
    "Bhilwara", "Alwar", "Sikar", "Pali", "Bharatpur", "Sri Ganganagar",
    "Tonk", "Kishangarh", "Beawar", "Hanumangarh", "Dhaulpur",
    "Gangapur City", "Sawai Madhopur", "Churu", "Jhunjhunu",
    "Banswara", "Chittorgarh", "Baran", "Rajsamand", "Mount Abu",
    "Nagaur", "Barmer", "Dungarpur", "Bundi", "Jaisalmer", "Pushkar"
]

# First names
first_names_male = [
    "Rajesh", "Suresh", "Mahesh", "Ramesh", "Dinesh", "Mukesh",
    "Anil", "Sunil", "Vikas", "Deepak", "Amit", "Sumit",
    "Rakesh", "Naresh", "Yogesh", "Ganesh", "Vikram", "Ashok",
    "Sanjay", "Ravi", "Mohan", "Gopal", "Krishna", "Shyam",
    "Hari", "Pramod", "Manoj", "Vinod", "Kamal", "Rahul",
    "Pankaj", "Ajay", "Vijay", "Hemant", "Lalit", "Naveen",
    "Sandeep", "Pradeep", "Devendra", "Surendra"
]

first_names_female = [
    "Sunita", "Anita", "Kavita", "Savita", "Neeta", "Geeta",
    "Priya", "Pooja", "Neha", "Ritu", "Meena", "Seema",
    "Rekha", "Shobha", "Kiran", "Anjali", "Deepa", "Suman",
    "Lata", "Asha", "Manju", "Saroj", "Usha", "Radha",
    "Durga", "Lakshmi", "Sarita", "Mamta", "Pushpa", "Kamla"
]

last_names = [
    "Sharma", "Verma", "Gupta", "Jain", "Agarwal", "Singh",
    "Meena", "Choudhary", "Rathore", "Shekhawat", "Rajput",
    "Mathur", "Saxena", "Patel", "Yadav", "Kumawat", "Soni",
    "Joshi", "Purohit", "Vyas", "Pareek", "Bansal", "Goyal",
    "Khandelwal", "Maheshwari"
]

# Subjects mapping (id -> name)
subjects = cursor.execute("SELECT id, name FROM subjects").fetchall()
subject_map = {s["id"]: s["name"] for s in subjects}
subject_ids = list(subject_map.keys())

# Teaching subjects grouped by expertise
subject_groups = [
    [1, 3, 4],   # Maths, Physics, Chemistry
    [3, 4, 5],   # Physics, Chemistry, Biology
    [1, 12],     # Maths, Economics
    [7, 9, 10],  # English (assuming), History, Geography
    [22, 23, 24],# Python, Java, Web Dev
    [25, 26],    # Data Science, ML
    [6, 18],     # Hindi, Sanskrit
    [14, 12, 13],# Business Studies, Economics, Accounting
    [15, 16],    # Art, Music
    [27, 28],    # IELTS, TOEFL
]

# Get actual subject IDs
actual_subject_ids = [s["id"] for s in subjects]

languages_pool = ["Hindi", "English", "Rajasthani", "Sanskrit"]
qualifications = [
    "B.Ed", "M.Ed", "B.Sc + B.Ed", "M.Sc + B.Ed", "M.A + B.Ed",
    "Ph.D", "MBA", "B.Tech + M.Tech", "M.Com", "B.A + B.Ed",
    "PGDCA", "MCA", "B.Tech", "M.Sc", "M.A"
]

class_levels_pool = [
    "Class 1-5", "Class 6-8", "Class 9-10", "Class 11-12",
    "College", "Professional", "Competitive Exams"
]

bios = [
    "Passionate educator with {exp} years of experience in teaching. Specializing in making complex concepts simple and understandable.",
    "Dedicated teacher from {city} with {exp} years of experience. I believe in interactive and practical learning approaches.",
    "Experienced {qual} qualified teacher. Have taught over 500+ students successfully. Focus on concept clarity and problem solving.",
    "Professional tutor with {exp} years of teaching experience. Expert in exam preparation and result-oriented teaching methodology.",
    "I am a {qual} qualified teacher from {city}. My teaching style focuses on building strong fundamentals and critical thinking.",
    "Award-winning teacher with {exp}+ years in education. Known for excellent results and student-friendly approach.",
    "Certified educator passionate about transforming education. Interactive sessions, regular assessments, and personalized attention.",
    "Experienced online tutor from {city}. {exp} years of expertise in delivering engaging and effective live classes.",
    "Result-oriented teacher with proven track record. {exp} years of experience in both offline and online teaching.",
    "Senior educator with {exp} years of experience. Specialized in competitive exam coaching and academic excellence."
]

password_hash = bcrypt.hashpw("teacher123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

print("Seeding 100 dummy teachers from Rajasthan...")

for i in range(100):
    # Generate name
    if random.random() < 0.5:
        first_name = random.choice(first_names_male)
    else:
        first_name = random.choice(first_names_female)
    last_name = random.choice(last_names)
    full_name = f"{first_name} {last_name}"

    city = random.choice(cities)
    email = f"{first_name.lower()}.{last_name.lower()}{i+1}@guru.com"
    phone = f"9{random.randint(100000000, 999999999)}"
    experience = random.randint(1, 20)
    hourly_rate = random.choice([100, 120, 130, 150, 170, 180, 200, 220, 230, 250])
    qualification = random.choice(qualifications)
    num_languages = random.randint(1, 3)
    languages = json.dumps(random.sample(languages_pool, min(num_languages, len(languages_pool))))
    rating = round(random.uniform(3.5, 5.0), 1)
    total_reviews = random.randint(5, 100)
    total_classes = random.randint(10, 500)

    bio_template = random.choice(bios)
    bio = bio_template.format(exp=experience, city=city, qual=qualification)

    # Insert user
    cursor.execute(
        """INSERT INTO users (email, password_hash, full_name, phone, role, city, state, is_active, is_verified)
           VALUES (?, ?, ?, ?, 'teacher', ?, 'Rajasthan', 1, 1)""",
        (email, password_hash, full_name, phone, city)
    )
    user_id = cursor.lastrowid

    # Insert teacher profile
    cursor.execute(
        """INSERT INTO teacher_profiles (user_id, bio, experience_years, hourly_rate, languages,
                                         qualification, is_approved, rating, total_reviews, total_classes)
           VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)""",
        (user_id, bio, experience, hourly_rate, languages, qualification, rating, total_reviews, total_classes)
    )
    teacher_id = cursor.lastrowid

    # Add 2-4 random subjects with class levels
    num_subjects = random.randint(2, 4)
    chosen_subjects = random.sample(actual_subject_ids, min(num_subjects, len(actual_subject_ids)))
    for subj_id in chosen_subjects:
        num_levels = random.randint(1, 3)
        levels = json.dumps(random.sample(class_levels_pool, num_levels))
        cursor.execute(
            "INSERT OR IGNORE INTO teacher_subjects (teacher_id, subject_id, class_levels) VALUES (?, ?, ?)",
            (teacher_id, subj_id, levels)
        )

    # Add availability (2-5 days)
    num_days = random.randint(2, 5)
    days = random.sample(range(7), num_days)
    for day in days:
        start_hour = random.choice([8, 9, 10])
        end_hour = random.choice([17, 18, 19, 20])
        cursor.execute(
            "INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)",
            (teacher_id, day, f"{start_hour:02d}:00", f"{end_hour:02d}:00")
        )

    if (i + 1) % 10 == 0:
        print(f"  Created {i + 1}/100 teachers...")

conn.commit()
conn.close()
print("Done! 100 teachers seeded successfully.")
