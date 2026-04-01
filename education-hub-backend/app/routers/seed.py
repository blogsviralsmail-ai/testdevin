from fastapi import APIRouter, Depends
from app.database import get_db
from app.utils.auth import require_admin
import json

router = APIRouter(prefix="/api/seed", tags=["Seed"])

@router.post("/universities")
async def seed_universities(user: dict = Depends(require_admin)):
    conn = get_db()
    universities = [
        {"name": "Vivekananda Global University", "code": "VGU", "description": "NAAC Accredited University in Jaipur, Rajasthan. Offers UG, PG and PhD programs.", "website": "https://onlinevgu.com", "address": "VGU Campus, Sec-36, NRI, Jagatpura, Jaipur"},
        {"name": "Dr. K.N. Modi University", "code": "DKNMU", "description": "Established by Act 2010, recognized by UGC. Located in Newai, near Jaipur.", "website": "https://dknmu.org", "address": "INS-1, RIICO Industrial Area Phase-II, Newai, Dist. Tonk, Rajasthan"},
        {"name": "Amity University Jaipur", "code": "AMITY-JP", "description": "Part of Amity Education Group. Offers diverse programs.", "website": "https://amity.edu", "address": "Jaipur, Rajasthan"},
        {"name": "Bennett University", "code": "BENNETT", "description": "Established by Times Group. Known for engineering and management.", "website": "https://bennett.edu.in", "address": "Greater Noida, UP"},
        {"name": "Chandigarh University", "code": "CU", "description": "One of India's top private universities with global recognition.", "website": "https://cu.edu.in", "address": "Chandigarh, Punjab"},
        {"name": "UPES Dehradun", "code": "UPES", "description": "University of Petroleum and Energy Studies. Specialized in energy sector education.", "website": "https://upes.ac.in", "address": "Dehradun, Uttarakhand"},
        {"name": "LPU - Lovely Professional University", "code": "LPU", "description": "One of the largest private universities in India.", "website": "https://lpu.in", "address": "Phagwara, Punjab"},
        {"name": "Sharda University", "code": "SHARDA", "description": "Known for diverse programs and international collaborations.", "website": "https://sharda.ac.in", "address": "Greater Noida, UP"},
        {"name": "SGVU - Suresh Gyan Vihar University", "code": "SGVU", "description": "UGC recognized university offering online and regular programs.", "website": "https://gyanvihar.org", "address": "Jaipur, Rajasthan"},
        {"name": "APEX University", "code": "APEX", "description": "Modern university with industry-aligned programs.", "website": "https://apexuniversity.co.in", "address": "Jaipur, Rajasthan"},
        {"name": "Jagannath University Jaipur", "code": "JNU-JP", "description": "Private university in Jaipur offering multiple programs.", "website": "https://jagannathuniversityncr.ac.in", "address": "Jaipur, Rajasthan"},
        {"name": "JECRC University", "code": "JECRC", "description": "Known for engineering and technology programs.", "website": "https://jecrcuniversity.edu.in", "address": "Jaipur, Rajasthan"},
        {"name": "JK Lakshmipat University", "code": "JKLU", "description": "Premier university focused on innovation and entrepreneurship.", "website": "https://jklu.edu.in", "address": "Jaipur, Rajasthan"},
        {"name": "NIMS University", "code": "NIMS", "description": "National Institute of Medical Sciences. Multi-disciplinary university.", "website": "https://nimsuniversity.org", "address": "Jaipur, Rajasthan"},
        {"name": "Manipal University Online", "code": "MANIPAL-OL", "description": "Online programs from the prestigious Manipal group.", "website": "https://manipal.edu", "address": "Manipal, Karnataka"},
    ]
    created = 0
    for u in universities:
        existing = conn.execute("SELECT id FROM universities WHERE code = ?", (u["code"],)).fetchone()
        if not existing:
            conn.execute("INSERT INTO universities (name, code, description, website, address) VALUES (?, ?, ?, ?, ?)",
                        (u["name"], u["code"], u["description"], u["website"], u["address"]))
            created += 1
    conn.commit()
    conn.close()
    return {"message": f"{created} universities seeded"}

@router.post("/categories")
async def seed_categories(user: dict = Depends(require_admin)):
    conn = get_db()
    # Get university IDs
    vgu = conn.execute("SELECT id FROM universities WHERE code = 'VGU'").fetchone()
    vgu_id = vgu["id"] if vgu else None
    dknmu = conn.execute("SELECT id FROM universities WHERE code = 'DKNMU'").fetchone()
    dknmu_id = dknmu["id"] if dknmu else None
    
    categories = [
        # VGU Online Courses
        {"name": "Online BA", "slug": "online-ba", "description": "Bachelor of Arts - A comprehensive program covering humanities, social sciences, and languages. Develop critical thinking and communication skills.", "eligibility": "10+2 from any recognized board", "duration": "36 months", "fee": "INR 72,000", "mode": "Online", "university_id": vgu_id},
        {"name": "Online BBA", "slug": "online-bba", "description": "Bachelor of Business Administration - Learn management fundamentals, marketing, finance, and entrepreneurship.", "eligibility": "10+2 from any recognized board", "duration": "36 months", "fee": "INR 1,32,000", "mode": "Online", "university_id": vgu_id},
        {"name": "Online BCA", "slug": "online-bca", "description": "Bachelor of Computer Application - Master programming, databases, web development, and software engineering.", "eligibility": "10+2 with Mathematics", "duration": "36 months", "fee": "INR 1,32,000", "mode": "Online", "university_id": vgu_id},
        {"name": "Online MBA", "slug": "online-mba", "description": "Master of Business Administration - Advanced management program with specializations in Finance, Marketing, HR, and more.", "eligibility": "Graduation in any discipline", "duration": "24 months", "fee": "INR 1,80,000", "mode": "Online", "university_id": vgu_id},
        {"name": "Online MCA", "slug": "online-mca", "description": "Master of Computer Application - Advanced computing, AI, cloud computing, and software development.", "eligibility": "BCA/B.Sc(CS)/B.Tech or equivalent", "duration": "24 months", "fee": "INR 1,80,000", "mode": "Online", "university_id": vgu_id},
        {"name": "Online M.Sc Mathematics", "slug": "online-msc-maths", "description": "Master of Science in Mathematics - Advanced mathematical concepts and research.", "eligibility": "B.Sc with Mathematics", "duration": "24 months", "fee": "INR 1,20,000", "mode": "Online", "university_id": vgu_id},
        {"name": "Online MA English", "slug": "online-ma-english", "description": "Master of Arts in English - Literature, linguistics, and communication studies.", "eligibility": "Graduation in any discipline", "duration": "24 months", "fee": "INR 1,20,000", "mode": "Online", "university_id": vgu_id},
        {"name": "Online MA JMC", "slug": "online-ma-jmc", "description": "Master of Arts in Journalism & Mass Communication - Media, journalism, and digital communication.", "eligibility": "Graduation in any discipline", "duration": "24 months", "fee": "INR 1,20,000", "mode": "Online", "university_id": vgu_id},

        # DKNMU Regular Courses (2025-2026) - from official fee structure
        {"name": "BA (English/Hindi/Geography/Political Science/History/Economics/Psychology/Sociology/Public Administration/Urdu/Sanskrit)", "slug": "dknmu-ba", "description": "Bachelor of Arts with multiple specialization options. NAAC Accredited.", "eligibility": "10+2 from any recognized board", "duration": "36 months", "fee": "Without AD: ₹7,200 | Ad-50k: ₹4,800 | Ad-1 Lac: ₹6,600 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "MA (Hindi/History/Urdu/Sociology/Pol.Science/Geography/Public Administration)", "slug": "dknmu-ma", "description": "Master of Arts - Postgraduate program with various specializations.", "eligibility": "Graduation in relevant discipline", "duration": "24 months", "fee": "Without AD: ₹8,500 | Ad-50k: ₹8,000 | Ad-1 Lac: ₹7,000 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "B.Com (Taxation/Finance/Accounting/Banking and Insurance)", "slug": "dknmu-bcom", "description": "Bachelor of Commerce with specializations in Taxation, Finance, Accounting, Banking & Insurance.", "eligibility": "10+2 from any recognized board", "duration": "36 months", "fee": "Without AD: ₹7,500 | Ad-50k: ₹7,000 | Ad-1 Lac: ₹6,500 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "M.Com (Taxation/Finance/Accounting/Banking and Insurance)", "slug": "dknmu-mcom", "description": "Master of Commerce with specializations.", "eligibility": "B.Com or equivalent", "duration": "24 months", "fee": "Without AD: ₹12,500 | Ad-50k: ₹12,000 | Ad-1 Lac: ₹11,000 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "B.Sc (Physics/Chemistry/Biology/Maths)", "slug": "dknmu-bsc", "description": "Bachelor of Science with PCB/PCM options.", "eligibility": "10+2 with Science", "duration": "36 months", "fee": "Without AD: ₹12,000 | Ad-50k: ₹11,500 | Ad-1 Lac: ₹10,500 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "M.Sc (Botany/Zoology/Chemistry/Physics/Maths/Life Science/Microbiology)", "slug": "dknmu-msc", "description": "Master of Science in various disciplines.", "eligibility": "B.Sc in relevant discipline", "duration": "24 months", "fee": "Without AD: ₹14,000 | Ad-50k: ₹13,500 | Ad-1 Lac: ₹12,500 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "BBA", "slug": "dknmu-bba", "description": "Bachelor of Business Administration - DKNMU.", "eligibility": "10+2 from any recognized board", "duration": "36 months", "fee": "Without AD: ₹25,000 | Ad-50k: ₹20,000 | Ad-1 Lac: ₹20,000 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "BA LLB (Hons)", "slug": "dknmu-ba-llb", "description": "Integrated BA LLB Honours program.", "eligibility": "10+2 from any recognized board", "duration": "60 months", "fee": "Without AD: ₹30,500 | Ad-50k: ₹20,000 | Ad-1 Lac: ₹24,500 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "LLB", "slug": "dknmu-llb", "description": "Bachelor of Laws - 3 year program.", "eligibility": "Graduation in any discipline", "duration": "36 months", "fee": "Without AD: ₹30,500 | Ad-50k: ₹20,100 | Ad-1 Lac: ₹28,600 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "BA Yoga", "slug": "dknmu-ba-yoga", "description": "Bachelor of Arts in Yoga.", "eligibility": "10+2 from any recognized board", "duration": "36 months", "fee": "Without AD: ₹11,500 | Ad-50k: ₹11,000 | Ad-1 Lac: ₹10,000 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "MA Yoga", "slug": "dknmu-ma-yoga", "description": "Master of Arts in Yoga.", "eligibility": "Graduation in Yoga or equivalent", "duration": "24 months", "fee": "Without AD: ₹11,000 | Ad-50k: ₹11,500 | Ad-1 Lac: ₹11,500 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "Diploma in Yoga", "slug": "dknmu-diploma-yoga", "description": "Diploma program in Yoga.", "eligibility": "10+2 from any recognized board", "duration": "12 months", "fee": "Without AD: ₹13,000 | Ad-50k: ₹12,500 | Ad-1 Lac: ₹12,000 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "BA (Music)", "slug": "dknmu-ba-music", "description": "Bachelor of Arts in Music.", "eligibility": "10+2 from any recognized board", "duration": "36 months", "fee": "Without AD: ₹7,000 | Ad-50k: ₹7,500 | Ad-1 Lac: ₹4,000 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "MA (Music)", "slug": "dknmu-ma-music", "description": "Master of Arts in Music.", "eligibility": "Graduation in Music or equivalent", "duration": "24 months", "fee": "Without AD: ₹10,500 | Ad-50k: ₹10,000 | Ad-1 Lac: ₹9,500 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "BA Fine Art", "slug": "dknmu-ba-fine-art", "description": "Bachelor of Arts in Fine Art.", "eligibility": "10+2 from any recognized board", "duration": "36 months", "fee": "Without AD: ₹15,000 | Ad-50k: ₹11,500 | Ad-1 Lac: ₹10,900 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "MA Fine Art", "slug": "dknmu-ma-fine-art", "description": "Master of Arts in Fine Art.", "eligibility": "BA Fine Art or equivalent", "duration": "24 months", "fee": "Without AD: ₹10,500 | Ad-50k: ₹10,000 | Ad-1 Lac: ₹9,500 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "D.Lib", "slug": "dknmu-dlib", "description": "Diploma in Library Science.", "eligibility": "10+2 from any recognized board", "duration": "12 months", "fee": "Without AD: ₹11,500 | Ad-50k: ₹11,000 | Ad-1 Lac: ₹10,500 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "B.Lib", "slug": "dknmu-blib", "description": "Bachelor of Library & Information Science.", "eligibility": "Graduation in any discipline", "duration": "12 months", "fee": "Without AD: ₹14,000 | Ad-50k: ₹12,500 | Ad-1 Lac: ₹12,000 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "M.Lib", "slug": "dknmu-mlib", "description": "Master of Library & Information Science.", "eligibility": "B.Lib", "duration": "12 months", "fee": "Without AD: ₹14,000 | Ad-50k: ₹12,500 | Ad-1 Lac: ₹12,500 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "PGDCA", "slug": "dknmu-pgdca", "description": "Post Graduate Diploma in Computer Application.", "eligibility": "Graduation in any discipline", "duration": "12 months", "fee": "Without AD: ₹14,000 | Ad-50k: ₹13,500 | Ad-1 Lac: ₹13,000 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "BBA/BBA in Supply Chain & Logistics/Family Business", "slug": "dknmu-bba-spl", "description": "BBA with specializations including Marketing, Supply Chain & Logistics, Family Business.", "eligibility": "10+2 from any recognized board", "duration": "36 months", "fee": "Without AD: ₹35,000 | Ad-50k: ₹31,500 | Ad-1 Lac: ₹24,500 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "MBA (Marketing/International Business/Finance/Logistics & Supply Chain/Data Analytics)", "slug": "dknmu-mba", "description": "MBA with multiple specializations.", "eligibility": "Graduation in any discipline", "duration": "24 months", "fee": "Without AD: ₹48,500 | Ad-50k: ₹48,000 | Ad-1 Lac: ₹47,500 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "Diploma (Civil/ME/EE/CSE - Auto Mobile Engg)", "slug": "dknmu-diploma-engg", "description": "Engineering Diploma programs in Civil, Mechanical, Electrical, CSE, Automobile.", "eligibility": "10th pass", "duration": "36 months", "fee": "Without AD: ₹22,500 | Ad-50k: ₹22,000 | Ad-1 Lac: ₹22,000 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "B.TECH (Computer Science/AI&ML/Data Science/Cyber Security)", "slug": "dknmu-btech", "description": "B.Tech in CS, AI&ML, Data Science, Cyber Security.", "eligibility": "10+2 with PCM", "duration": "48 months", "fee": "Without AD: ₹90,500 | Ad-50k: ₹58,500 | Ad-1 Lac: ₹97,600 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "B.TECH (EE/ME/Civil/Automobile Engg)", "slug": "dknmu-btech-core", "description": "B.Tech in Electrical, Mechanical, Civil, Automobile Engineering.", "eligibility": "10+2 with PCM", "duration": "48 months", "fee": "Without AD: ₹47,000 | Ad-50k: ₹46,500 | Ad-1 Lac: ₹45,000 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "Lateral B.TECH (CSE/EE/ME/Civil/Automobile Engg)", "slug": "dknmu-btech-lateral", "description": "Lateral entry B.Tech programs.", "eligibility": "Diploma in relevant discipline", "duration": "36 months", "fee": "Without AD: ₹35,500 | Ad-50k: ₹35,000 | Ad-1 Lac: ₹23,500 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "M.Tech (Communication Technology & Management/Transportation Eng/Environmental Eng/Electrical Eng/Geo Technical Eng/Power Electronics/Industrial Eng)", "slug": "dknmu-mtech", "description": "M.Tech with multiple specializations.", "eligibility": "B.Tech or equivalent", "duration": "24 months", "fee": "Without AD: ₹48,000 | Ad-50k: ₹47,500 | Ad-1 Lac: ₹44,500 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "B.Sc (Forensic Science)", "slug": "dknmu-bsc-forensic", "description": "B.Sc in Forensic Science.", "eligibility": "10+2 with Science", "duration": "36 months", "fee": "Without AD: ₹23,000 | Ad-50k: ₹24,500 | Ad-1 Lac: ₹14,000 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "BPE (Data Analytics)", "slug": "dknmu-bpe-da", "description": "BPE in Data Analytics.", "eligibility": "10+2 from any recognized board", "duration": "36 months", "fee": "Without AD: ₹35,000 | Ad-50k: ₹14,000 | Ad-1 Lac: ₹14,000 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "MSc (Statistics and Data Science)", "slug": "dknmu-msc-data", "description": "M.Sc in Statistics and Data Science.", "eligibility": "B.Sc with relevant subject", "duration": "24 months", "fee": "Without AD: ₹30,000 | Ad-50k: ₹21,500 | Ad-1 Lac: ₹25,000 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "B.Voc", "slug": "dknmu-bvoc", "description": "Bachelor of Vocation.", "eligibility": "10+2 from any recognized board", "duration": "36 months", "fee": "Without AD: ₹14,500 | Ad-50k: ₹14,000 | Ad-1 Lac: ₹14,000 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "BCA (Cyber Security/Animation and Gaming)", "slug": "dknmu-bca", "description": "BCA with specializations in Cyber Security, Animation & Gaming.", "eligibility": "10+2 from any recognized board", "duration": "36 months", "fee": "Without AD: ₹32,500 | Ad-50k: ₹25,500 | Ad-1 Lac: ₹31,000 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "Integrated BCA+MCA (Cyber Security/Animation & Gaming)", "slug": "dknmu-bca-mca", "description": "Integrated BCA+MCA program.", "eligibility": "10+2 from any recognized board", "duration": "60 months", "fee": "Without AD: ₹14,000 | Ad-50k: ₹34,000 | Ad-1 Lac: ₹13,000 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "MCA", "slug": "dknmu-mca", "description": "Master of Computer Application.", "eligibility": "BCA/B.Sc(CS)/Graduation with Mathematics", "duration": "24 months", "fee": "Without AD: ₹30,500 | Ad-50k: ₹30,000 | Ad-1 Lac: ₹27,000 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "MBA (Online MpB & Cyber Security)", "slug": "dknmu-mba-online", "description": "MBA with Online MpB & Cyber Security.", "eligibility": "Graduation in any discipline", "duration": "24 months", "fee": "Without AD: ₹23,500 | Ad-50k: ₹25,000 | Ad-1 Lac: ₹18,000 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "MA (Mass Communication)", "slug": "dknmu-ma-masscomm", "description": "MA in Mass Communication.", "eligibility": "Graduation in any discipline", "duration": "24 months", "fee": "Without AD: ₹29,500 | Ad-50k: ₹25,000 | Ad-1 Lac: ₹18,000 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "BSc Bio Technology", "slug": "dknmu-bsc-biotech", "description": "B.Sc in Bio Technology.", "eligibility": "10+2 with Science (Biology)", "duration": "36 months", "fee": "Without AD: ₹24,500 | Ad-50k: ₹24,000 | Ad-1 Lac: ₹22,000 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
        {"name": "BSc Microbiology", "slug": "dknmu-bsc-micro", "description": "B.Sc in Microbiology.", "eligibility": "10+2 with Science (Biology)", "duration": "36 months", "fee": "Without AD: ₹24,500 | Ad-50k: ₹30,000 | Ad-1 Lac: ₹24,500 (Yearly)", "mode": "Regular", "university_id": dknmu_id},
    ]
    created = 0
    for c in categories:
        existing = conn.execute("SELECT id FROM categories WHERE slug = ?", (c["slug"],)).fetchone()
        if not existing:
            conn.execute("INSERT INTO categories (university_id, name, slug, description, eligibility, duration, fee, mode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                        (c.get("university_id"), c["name"], c["slug"], c["description"], c["eligibility"], c["duration"], c["fee"], c["mode"]))
            created += 1
    conn.commit()
    conn.close()
    return {"message": f"{created} categories seeded"}

@router.post("/form-fields")
async def seed_form_fields(user: dict = Depends(require_admin)):
    conn = get_db()
    # Get DKNMU ID for the sample form
    dknmu = conn.execute("SELECT id FROM universities WHERE code = 'DKNMU'").fetchone()
    if not dknmu:
        conn.close()
        return {"message": "Seed universities first"}
    uid = dknmu["id"]
    
    # Delete existing
    conn.execute("DELETE FROM form_fields WHERE university_id = ?", (uid,))
    
    fields = [
        {"field_name": "session", "field_label": "Session", "field_type": "select", "is_mandatory": 1, "field_order": 1, "options": "2025-2026|2026-2027", "section": "Admission Details"},
        {"field_name": "admission_type", "field_label": "Admission Type", "field_type": "select", "is_mandatory": 1, "field_order": 2, "options": "Fresh Admission|Lateral Entry|Credit Transfer", "section": "Admission Details"},
        {"field_name": "fee_category", "field_label": "Fee Category", "field_type": "select", "is_mandatory": 1, "field_order": 3, "options": "Self Sponsored|Government Sponsored|Others", "section": "Admission Details"},
        {"field_name": "programme", "field_label": "Programme Applied For", "field_type": "text", "is_mandatory": 1, "field_order": 4, "section": "Admission Details"},
        {"field_name": "branch", "field_label": "Branch/Specialization", "field_type": "text", "is_mandatory": 0, "field_order": 5, "section": "Admission Details"},
        {"field_name": "semester", "field_label": "Semester", "field_type": "text", "is_mandatory": 0, "field_order": 6, "section": "Admission Details"},
        {"field_name": "category_type", "field_label": "Category", "field_type": "select", "is_mandatory": 1, "field_order": 7, "options": "National|Foreign|NRI|NRI Sponsored", "section": "Admission Details"},
        {"field_name": "first_name", "field_label": "First Name", "field_type": "text", "is_mandatory": 1, "field_order": 10, "section": "Personal Details"},
        {"field_name": "middle_name", "field_label": "Middle Name", "field_type": "text", "is_mandatory": 0, "field_order": 11, "section": "Personal Details"},
        {"field_name": "last_name", "field_label": "Last Name", "field_type": "text", "is_mandatory": 1, "field_order": 12, "section": "Personal Details"},
        {"field_name": "dob", "field_label": "Date of Birth", "field_type": "date", "is_mandatory": 1, "field_order": 13, "section": "Personal Details"},
        {"field_name": "aadhar_no", "field_label": "Aadhar No", "field_type": "text", "is_mandatory": 0, "field_order": 14, "section": "Personal Details"},
        {"field_name": "gender", "field_label": "Gender", "field_type": "select", "is_mandatory": 1, "field_order": 15, "options": "Male|Female|Transgender", "section": "Personal Details"},
        {"field_name": "caste_category", "field_label": "Category (Caste)", "field_type": "select", "is_mandatory": 1, "field_order": 16, "options": "General|OBC|SC|ST|EWS", "section": "Personal Details"},
        {"field_name": "nationality", "field_label": "Nationality", "field_type": "text", "is_mandatory": 1, "field_order": 17, "section": "Personal Details", "placeholder": "Indian"},
        {"field_name": "marital_status", "field_label": "Marital Status", "field_type": "select", "is_mandatory": 0, "field_order": 18, "options": "Single|Married|Divorced|Widowed", "section": "Personal Details"},
        {"field_name": "mother_name", "field_label": "Mother's Name", "field_type": "text", "is_mandatory": 1, "field_order": 19, "section": "Personal Details"},
        {"field_name": "father_name", "field_label": "Father's Name", "field_type": "text", "is_mandatory": 1, "field_order": 20, "section": "Personal Details"},
        {"field_name": "father_occupation", "field_label": "Father's Occupation", "field_type": "text", "is_mandatory": 0, "field_order": 21, "section": "Personal Details"},
        {"field_name": "place_of_birth_city", "field_label": "Place of Birth - City", "field_type": "text", "is_mandatory": 0, "field_order": 22, "section": "Personal Details"},
        {"field_name": "place_of_birth_state", "field_label": "Place of Birth - State", "field_type": "text", "is_mandatory": 0, "field_order": 23, "section": "Personal Details"},
        {"field_name": "photo", "field_label": "Passport Size Photo", "field_type": "file", "is_mandatory": 0, "field_order": 24, "section": "Personal Details"},
        {"field_name": "tenth_school", "field_label": "10th - School Name", "field_type": "text", "is_mandatory": 1, "field_order": 30, "section": "Educational Details"},
        {"field_name": "tenth_board", "field_label": "10th - Board", "field_type": "text", "is_mandatory": 1, "field_order": 31, "section": "Educational Details"},
        {"field_name": "tenth_year", "field_label": "10th - Year of Passing", "field_type": "text", "is_mandatory": 1, "field_order": 32, "section": "Educational Details"},
        {"field_name": "tenth_subjects", "field_label": "10th - Subjects", "field_type": "text", "is_mandatory": 0, "field_order": 33, "section": "Educational Details"},
        {"field_name": "tenth_marks", "field_label": "10th - Marks Obtained", "field_type": "text", "is_mandatory": 1, "field_order": 34, "section": "Educational Details"},
        {"field_name": "tenth_percentage", "field_label": "10th - % / Grade", "field_type": "text", "is_mandatory": 1, "field_order": 35, "section": "Educational Details"},
        {"field_name": "twelfth_school", "field_label": "12th - School Name", "field_type": "text", "is_mandatory": 1, "field_order": 36, "section": "Educational Details"},
        {"field_name": "twelfth_board", "field_label": "12th - Board", "field_type": "text", "is_mandatory": 1, "field_order": 37, "section": "Educational Details"},
        {"field_name": "twelfth_year", "field_label": "12th - Year of Passing", "field_type": "text", "is_mandatory": 1, "field_order": 38, "section": "Educational Details"},
        {"field_name": "twelfth_subjects", "field_label": "12th - Subjects", "field_type": "text", "is_mandatory": 0, "field_order": 39, "section": "Educational Details"},
        {"field_name": "twelfth_marks", "field_label": "12th - Marks Obtained", "field_type": "text", "is_mandatory": 1, "field_order": 40, "section": "Educational Details"},
        {"field_name": "twelfth_percentage", "field_label": "12th - % / Grade", "field_type": "text", "is_mandatory": 1, "field_order": 41, "section": "Educational Details"},
        {"field_name": "graduation_college", "field_label": "Graduation - College", "field_type": "text", "is_mandatory": 0, "field_order": 42, "section": "Educational Details"},
        {"field_name": "graduation_university", "field_label": "Graduation - University", "field_type": "text", "is_mandatory": 0, "field_order": 43, "section": "Educational Details"},
        {"field_name": "graduation_year", "field_label": "Graduation - Year", "field_type": "text", "is_mandatory": 0, "field_order": 44, "section": "Educational Details"},
        {"field_name": "graduation_percentage", "field_label": "Graduation - % / Grade", "field_type": "text", "is_mandatory": 0, "field_order": 45, "section": "Educational Details"},
        {"field_name": "correspondence_address", "field_label": "Correspondence Address", "field_type": "textarea", "is_mandatory": 1, "field_order": 50, "section": "Contact Details"},
        {"field_name": "correspondence_pincode", "field_label": "Pin Code", "field_type": "text", "is_mandatory": 1, "field_order": 51, "section": "Contact Details"},
        {"field_name": "mobile", "field_label": "Mobile No", "field_type": "text", "is_mandatory": 1, "field_order": 52, "section": "Contact Details"},
        {"field_name": "email_address", "field_label": "Email ID", "field_type": "email", "is_mandatory": 1, "field_order": 53, "section": "Contact Details"},
        {"field_name": "permanent_address", "field_label": "Permanent Address", "field_type": "textarea", "is_mandatory": 0, "field_order": 54, "section": "Contact Details"},
        {"field_name": "permanent_pincode", "field_label": "Permanent Pin Code", "field_type": "text", "is_mandatory": 0, "field_order": 55, "section": "Contact Details"},
        {"field_name": "hostel_required", "field_label": "Hostel Required?", "field_type": "select", "is_mandatory": 0, "field_order": 60, "options": "Yes|No", "section": "Additional Details"},
        {"field_name": "transport_required", "field_label": "Transport Required?", "field_type": "select", "is_mandatory": 0, "field_order": 61, "options": "Yes|No", "section": "Additional Details"},
        {"field_name": "awards", "field_label": "Awards & Achievements", "field_type": "textarea", "is_mandatory": 0, "field_order": 62, "section": "Additional Details"},
        {"field_name": "extracurricular", "field_label": "Extracurricular Activities", "field_type": "textarea", "is_mandatory": 0, "field_order": 63, "section": "Additional Details"},
        {"field_name": "info_source", "field_label": "Source of Information", "field_type": "select", "is_mandatory": 0, "field_order": 64, "options": "Newspaper|Magazine|Radio|TV|Internet|Friends/Relatives|Consultant", "section": "Additional Details"},
    ]
    for f in fields:
        conn.execute(
            "INSERT INTO form_fields (university_id, field_name, field_label, field_type, is_mandatory, field_order, options, placeholder, section) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (uid, f["field_name"], f["field_label"], f["field_type"], f["is_mandatory"], f["field_order"], f.get("options"), f.get("placeholder"), f["section"])
        )
    conn.commit()
    conn.close()
    return {"message": f"{len(fields)} form fields seeded for DKNMU"}

@router.post("/branches")
async def seed_branches(user: dict = Depends(require_admin)):
    conn = get_db()
    branches = [
        {"name": "Jaipur Main Office", "code": "JPR-MAIN", "address": "Jaipur, Rajasthan", "contact": "+91-9999999999", "email": "jaipur@asffeducationhub.com", "share_percentage": 30},
        {"name": "Delhi Branch", "code": "DEL-01", "address": "New Delhi", "contact": "+91-9888888888", "email": "delhi@asffeducationhub.com", "share_percentage": 25},
        {"name": "Mumbai Branch", "code": "MUM-01", "address": "Mumbai, Maharashtra", "contact": "+91-9777777777", "email": "mumbai@asffeducationhub.com", "share_percentage": 25},
    ]
    created = 0
    for b in branches:
        existing = conn.execute("SELECT id FROM branches WHERE code = ?", (b["code"],)).fetchone()
        if not existing:
            conn.execute("INSERT INTO branches (name, code, address, contact, email, share_percentage) VALUES (?, ?, ?, ?, ?, ?)",
                        (b["name"], b["code"], b["address"], b["contact"], b["email"], b["share_percentage"]))
            created += 1
    conn.commit()
    conn.close()
    return {"message": f"{created} branches seeded"}

@router.post("/logos")
async def seed_logos(user: dict = Depends(require_admin)):
    conn = get_db()
    logos = {
        "VGU": "https://onlinevgu.com/wp-content/uploads/2023/06/VGU-Logo.png",
        "DKNMU": "https://dknmu.org/images/unilogo.png",
        "AMITY-JP": "https://www.amity.edu/jaipur/images/amity-logo.png",
        "BENNETT": "https://www.bennett.edu.in/wp-content/uploads/2020/10/bennett-logo.png",
        "CU": "https://cu.edu.in/assets/images/cu-logo.png",
        "UPES": "https://www.upes.ac.in/Assets/images/upes-logo.png",
        "LPU": "https://www.lpu.in/images/lpu-logo.png",
        "SHARDA": "https://www.sharda.ac.in/assets/images/logo.png",
        "SGVU": "https://gyanvihar.org/images/logo.png",
        "APEX": "https://apexuniversity.co.in/images/logo.png",
        "JNU-JP": "https://jagannathuniversityncr.ac.in/images/logo.png",
        "JECRC": "https://jecrcuniversity.edu.in/images/logo.png",
        "JKLU": "https://jklu.edu.in/wp-content/uploads/2021/07/jklu-logo.png",
        "NIMS": "https://nimsuniversity.org/images/logo.png",
        "MANIPAL-OL": "https://manipal.edu/content/dam/manipal/mu/images/manipal-logo.png",
    }
    updated = 0
    for code, logo_url in logos.items():
        result = conn.execute("UPDATE universities SET logo = ? WHERE code = ?", (logo_url, code))
        if result.rowcount > 0:
            updated += 1
    conn.commit()
    conn.close()
    return {"message": f"{updated} university logos updated"}

@router.post("/all")
async def seed_all(user: dict = Depends(require_admin)):
    r1 = await seed_universities(user)
    r2 = await seed_categories(user)
    r3 = await seed_form_fields(user)
    r4 = await seed_branches(user)
    r5 = await seed_logos(user)
    return {"universities": r1, "categories": r2, "form_fields": r3, "branches": r4, "logos": r5}

@router.post("/dummy-data")
async def seed_dummy_data(user: dict = Depends(require_admin)):
    """Seed 5 dummy entries in each section for testing."""
    conn = get_db()
    results = {}

    # 1. Seed 5 dummy leads
    lead_count = 0
    dummy_leads = [
        ("Rahul Sharma", "rahul@test.com", "9876543210", "website", "new", "VGU", "BCA", "2026-03-01"),
        ("Priya Verma", "priya@test.com", "9876543211", "referral", "contacted", "DKNMU", "MBA", "2026-03-02"),
        ("Amit Kumar", "amit@test.com", "9876543212", "social_media", "qualified", "Amity", "B.Tech", "2026-03-03"),
        ("Sneha Patel", "sneha@test.com", "9876543213", "walk_in", "new", "CU", "BBA", "2026-02-28"),
        ("Vikash Singh", "vikash@test.com", "9876543214", "website", "negotiation", "LPU", "MCA", "2026-03-05"),
    ]
    for name, email, phone, source, status, uni, course, fud in dummy_leads:
        existing = conn.execute("SELECT id FROM leads WHERE email = ?", (email,)).fetchone()
        if not existing:
            conn.execute("INSERT INTO leads (name, email, phone, source, status, university_interest, course_interest, follow_up_date) VALUES (?,?,?,?,?,?,?,?)",
                        (name, email, phone, source, status, uni, course, fud))
            lead_count += 1
    results["leads"] = f"{lead_count} leads seeded"

    # 2. Seed 5 dummy enquiries
    enq_count = 0
    dummy_enquiries = [
        ("Ravi Joshi", "ravi@test.com", "8765432100", "Interested in MBA program"),
        ("Meena Kumari", "meena@test.com", "8765432101", "Need info about BCA fees"),
        ("Suresh Yadav", "suresh@test.com", "8765432102", "Want to know about hostel facility"),
        ("Deepika Raj", "deepika@test.com", "8765432103", "Looking for distance learning"),
        ("Karan Malhotra", "karan@test.com", "8765432104", "Scholarship enquiry for B.Tech"),
    ]
    for name, email, phone, msg in dummy_enquiries:
        existing = conn.execute("SELECT id FROM enquiries WHERE email = ?", (email,)).fetchone()
        if not existing:
            conn.execute("INSERT INTO enquiries (name, email, phone, message, status) VALUES (?,?,?,?,?)",
                        (name, email, phone, msg, "new"))
            enq_count += 1
    results["enquiries"] = f"{enq_count} enquiries seeded"

    # 3. Seed 5 dummy blog posts
    blog_count = 0
    dummy_blogs = [
        ("Top 10 Universities in Rajasthan 2026", "top-10-universities-rajasthan", "A comprehensive guide to the best universities in Rajasthan for 2026 admissions.", "Education", "published"),
        ("How to Choose the Right Course", "how-to-choose-right-course", "Tips and tricks to help you select the perfect course for your career.", "Career Guidance", "published"),
        ("Online vs Offline Education", "online-vs-offline-education", "Comparing the benefits and challenges of online and offline learning modes.", "Education", "published"),
        ("Scholarship Guide for Students", "scholarship-guide-students", "Complete guide to scholarships available for Indian students in 2026.", "Finance", "draft"),
        ("Career After MBA", "career-after-mba", "Explore the top career paths and salary expectations after completing MBA.", "Career Guidance", "published"),
    ]
    for title, slug, content, category, status in dummy_blogs:
        existing = conn.execute("SELECT id FROM blog_posts WHERE slug = ?", (slug,)).fetchone()
        if not existing:
            conn.execute("INSERT INTO blog_posts (title, slug, content, category, status, author) VALUES (?,?,?,?,?,?)",
                        (title, slug, content, category, status, "Admin"))
            blog_count += 1
    results["blogs"] = f"{blog_count} blog posts seeded"

    # 4. Seed 5 dummy careers/jobs
    job_count = 0
    dummy_jobs = [
        ("Academic Counselor", "Counseling", "Jaipur", "Full-time", "1-3 years", "3-5 LPA", "Guide students in course selection and admission process.", "active"),
        ("Marketing Executive", "Marketing", "Delhi", "Full-time", "2-4 years", "4-6 LPA", "Handle digital marketing and student outreach campaigns.", "active"),
        ("Data Entry Operator", "Admin", "Remote", "Part-time", "0-1 years", "1.5-2.5 LPA", "Manage student data and maintain records.", "active"),
        ("Frontend Developer", "IT", "Jaipur", "Full-time", "2-5 years", "6-10 LPA", "Build and maintain web applications using React.", "active"),
        ("Content Writer", "Marketing", "Remote", "Contract", "1-2 years", "2-4 LPA", "Create educational content for blog and social media.", "draft"),
    ]
    for title, dept, loc, typ, exp, sal, desc, status in dummy_jobs:
        existing = conn.execute("SELECT id FROM careers WHERE title = ? AND department = ?", (title, dept)).fetchone()
        if not existing:
            conn.execute("INSERT INTO careers (title, department, location, type, experience, salary_range, description, status) VALUES (?,?,?,?,?,?,?,?)",
                        (title, dept, loc, typ, exp, sal, desc, status))
            job_count += 1
    results["careers"] = f"{job_count} jobs seeded"

    # 5. Seed 5 dummy testimonials
    test_count = 0
    dummy_testimonials = [
        ("Ankit Sharma", "BCA", "VGU", "Education Hub helped me find the perfect course. The counselors were very supportive!", 5),
        ("Pooja Meena", "MBA", "Amity University", "Got admission in my dream university through Education Hub. Highly recommended!", 5),
        ("Rohit Verma", "B.Tech", "DKNMU", "Excellent guidance and support throughout the admission process.", 4),
        ("Kavita Singh", "BBA", "Chandigarh University", "My admission was processed smoothly. Thank you Education Hub team!", 5),
        ("Manish Jain", "MCA", "LPU", "The online process was very simple and the team was always available.", 4),
    ]
    for name, course, uni, text, rating in dummy_testimonials:
        existing = conn.execute("SELECT id FROM testimonials WHERE name = ? AND course = ?", (name, course)).fetchone()
        if not existing:
            conn.execute("INSERT INTO testimonials (name, course, university, text, rating, status) VALUES (?,?,?,?,?,?)",
                        (name, course, uni, text, rating, "active"))
            test_count += 1
    results["testimonials"] = f"{test_count} testimonials seeded"

    # 6. Seed 5 dummy gallery items
    gal_count = 0
    dummy_gallery = [
        ("Campus Tour 2026", "https://images.unsplash.com/photo-1562774053-701939374585?w=600", "campus", "Virtual tour of our partner university campuses"),
        ("Convocation Ceremony", "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600", "events", "Annual convocation ceremony highlights"),
        ("Student Workshop", "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600", "events", "Skill development workshop for students"),
        ("Office Interior", "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600", "campus", "Our modern counseling center"),
        ("Team Outing", "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600", "team", "Annual team building event"),
    ]
    for title, image, cat, desc in dummy_gallery:
        existing = conn.execute("SELECT id FROM gallery WHERE title = ?", (title,)).fetchone()
        if not existing:
            conn.execute("INSERT INTO gallery (title, image, category, description) VALUES (?,?,?,?)",
                        (title, image, cat, desc))
            gal_count += 1
    results["gallery"] = f"{gal_count} gallery items seeded"

    # 7. Seed 5 dummy support tickets
    tick_count = 0
    dummy_tickets = [
        ("Login Issue", "Cannot access student portal", "high", "I am unable to login to my student portal. Getting error."),
        ("Fee Issue", "Fee receipt not generated", "medium", "I paid the fee but receipt is not showing in my panel."),
        ("Course Change", "Course change request", "low", "I want to change my course from BCA to BBA."),
        ("Document Issue", "Document upload issue", "high", "PDF upload is failing. Please help."),
        ("Hostel Query", "Hostel allocation query", "medium", "When will hostel rooms be allocated for new students?"),
    ]
    # Get a student_id if exists
    student_rec = conn.execute("SELECT id FROM students LIMIT 1").fetchone()
    s_id = student_rec["id"] if student_rec else None
    for cat, subject, priority, desc in dummy_tickets:
        existing = conn.execute("SELECT id FROM tickets WHERE subject = ?", (subject,)).fetchone()
        if not existing:
            conn.execute("INSERT INTO tickets (student_id, category, subject, description, priority, status) VALUES (?,?,?,?,?,?)",
                        (s_id, cat, subject, desc, priority, "open"))
            tick_count += 1
    results["tickets"] = f"{tick_count} tickets seeded"

    conn.commit()
    conn.close()
    return {"message": "Dummy data seeded successfully", "details": results}
