import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.environ.get("DB_PATH", "/data/app.db")

def get_db():
    """Get database connection - tenant-aware via contextvars."""
    from app.tenant import current_tenant_db_path
    tenant_db = current_tenant_db_path.get()
    db_path = tenant_db if tenant_db else DB_PATH
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL DEFAULT 'student',
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")
    
    # Universities table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS universities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE,
        logo TEXT,
        description TEXT,
        website TEXT,
        address TEXT,
        status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")
    
    # Categories (Courses) table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        university_id INTEGER,
        name TEXT NOT NULL,
        slug TEXT,
        description TEXT,
        eligibility TEXT,
        duration TEXT,
        fee TEXT,
        mode TEXT DEFAULT 'Regular',
        image TEXT,
        status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (university_id) REFERENCES universities(id)
    )""")
    
    # Form fields table (custom form builder)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS form_fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        university_id INTEGER,
        field_name TEXT NOT NULL,
        field_label TEXT NOT NULL,
        field_type TEXT NOT NULL DEFAULT 'text',
        is_mandatory INTEGER DEFAULT 0,
        field_order INTEGER DEFAULT 0,
        options TEXT,
        placeholder TEXT,
        section TEXT DEFAULT 'Personal Details',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (university_id) REFERENCES universities(id)
    )""")
    
    # Students table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        enrollment_no TEXT UNIQUE,
        university_id INTEGER,
        category_id INTEGER,
        branch_id INTEGER,
        session_name TEXT,
        admission_type TEXT DEFAULT 'FRESH_ADMISSION',
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        photo TEXT,
        date_of_birth TEXT,
        gender TEXT,
        category_type TEXT,
        nationality TEXT DEFAULT 'Indian',
        aadhar_no TEXT,
        marital_status TEXT,
        father_name TEXT,
        mother_name TEXT,
        guardian_name TEXT,
        father_occupation TEXT,
        parent_phone TEXT,
        parent_email TEXT,
        current_address TEXT,
        current_city TEXT,
        current_state TEXT,
        current_pincode TEXT,
        permanent_address TEXT,
        permanent_city TEXT,
        permanent_state TEXT,
        permanent_pincode TEXT,
        tenth_board TEXT,
        tenth_year TEXT,
        tenth_percentage TEXT,
        tenth_school TEXT,
        twelfth_board TEXT,
        twelfth_year TEXT,
        twelfth_percentage TEXT,
        twelfth_school TEXT,
        graduation_university TEXT,
        graduation_year TEXT,
        graduation_percentage TEXT,
        graduation_degree TEXT,
        post_graduation_university TEXT,
        post_graduation_year TEXT,
        post_graduation_percentage TEXT,
        post_graduation_degree TEXT,
        blood_group TEXT,
        disability TEXT DEFAULT 'No',
        disability_type TEXT,
        hostel_required TEXT DEFAULT 'No',
        transport_required TEXT DEFAULT 'No',
        pickup_location TEXT,
        extra_curricular TEXT,
        achievements TEXT,
        status TEXT DEFAULT 'active',
        form_data TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (university_id) REFERENCES universities(id),
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (branch_id) REFERENCES branches(id)
    )""")
    
    # Add new columns to existing students table if they don't exist
    new_columns = [
        ("photo", "TEXT"), ("date_of_birth", "TEXT"), ("gender", "TEXT"),
        ("category_type", "TEXT"), ("nationality", "TEXT"), ("aadhar_no", "TEXT"),
        ("marital_status", "TEXT"), ("father_name", "TEXT"), ("mother_name", "TEXT"),
        ("guardian_name", "TEXT"), ("father_occupation", "TEXT"),
        ("parent_phone", "TEXT"), ("parent_email", "TEXT"),
        ("current_address", "TEXT"), ("current_city", "TEXT"),
        ("current_state", "TEXT"), ("current_pincode", "TEXT"),
        ("permanent_address", "TEXT"), ("permanent_city", "TEXT"),
        ("permanent_state", "TEXT"), ("permanent_pincode", "TEXT"),
        ("tenth_board", "TEXT"), ("tenth_year", "TEXT"),
        ("tenth_percentage", "TEXT"), ("tenth_school", "TEXT"),
        ("twelfth_board", "TEXT"), ("twelfth_year", "TEXT"),
        ("twelfth_percentage", "TEXT"), ("twelfth_school", "TEXT"),
        ("graduation_university", "TEXT"), ("graduation_year", "TEXT"),
        ("graduation_percentage", "TEXT"), ("graduation_degree", "TEXT"),
        ("post_graduation_university", "TEXT"), ("post_graduation_year", "TEXT"),
        ("post_graduation_percentage", "TEXT"), ("post_graduation_degree", "TEXT"),
        ("blood_group", "TEXT"), ("disability", "TEXT"), ("disability_type", "TEXT"),
        ("hostel_required", "TEXT"), ("transport_required", "TEXT"),
        ("pickup_location", "TEXT"), ("extra_curricular", "TEXT"),
        ("achievements", "TEXT"),
    ]
    for col_name, col_type in new_columns:
        try:
            cursor.execute(f"ALTER TABLE students ADD COLUMN {col_name} {col_type}")
        except:
            pass
    
    # Branches table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS branches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE,
        address TEXT,
        contact TEXT,
        email TEXT,
        admin_user_id INTEGER,
        share_percentage REAL DEFAULT 0,
        status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_user_id) REFERENCES users(id)
    )""")
    
    # Sessions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        start_date TEXT,
        end_date TEXT,
        status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")
    
    # Exams table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS exams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        category_id INTEGER,
        name TEXT NOT NULL,
        exam_date TEXT,
        exam_time TEXT,
        venue TEXT,
        exam_type TEXT DEFAULT 'regular',
        status TEXT DEFAULT 'scheduled',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id),
        FOREIGN KEY (category_id) REFERENCES categories(id)
    )""")
    
    # Exam results
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS exam_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exam_id INTEGER,
        student_id INTEGER,
        marks TEXT,
        grade TEXT,
        status TEXT DEFAULT 'appeared',
        is_mark_back INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (exam_id) REFERENCES exams(id),
        FOREIGN KEY (student_id) REFERENCES students(id)
    )""")
    
    # Transactions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        amount REAL NOT NULL,
        transaction_type TEXT DEFAULT 'credit',
        utr_number TEXT,
        account_name TEXT,
        payment_mode TEXT,
        description TEXT,
        status TEXT DEFAULT 'completed',
        date TEXT DEFAULT CURRENT_TIMESTAMP,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id)
    )""")
    
    # Receipts table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id INTEGER,
        student_id INTEGER,
        receipt_no TEXT UNIQUE,
        amount REAL,
        date TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id),
        FOREIGN KEY (student_id) REFERENCES students(id)
    )""")
    
    # Fee records table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS fee_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        total_fee REAL DEFAULT 0,
        paid_amount REAL DEFAULT 0,
        pending_amount REAL DEFAULT 0,
        account_name TEXT,
        last_utr TEXT,
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id)
    )""")
    
    # Tickets table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        category TEXT NOT NULL,
        subject TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'open',
        priority TEXT DEFAULT 'medium',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id)
    )""")
    
    # Ticket messages
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ticket_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id INTEGER,
        sender_id INTEGER,
        message TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id),
        FOREIGN KEY (sender_id) REFERENCES users(id)
    )""")
    
    # Documents table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        doc_type TEXT NOT NULL,
        file_path TEXT,
        status TEXT DEFAULT 'pending',
        received_date TEXT,
        dispatched_date TEXT,
        branch_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id)
    )""")
    
    # Targets table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS targets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER,
        month INTEGER,
        year INTEGER,
        target_count INTEGER DEFAULT 0,
        achieved_count INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES users(id)
    )""")
    
    # Settings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")
    
    # Enquiries table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS enquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        state TEXT,
        city TEXT,
        university_id INTEGER,
        category_id INTEGER,
        message TEXT,
        status TEXT DEFAULT 'new',
        source TEXT DEFAULT 'website',
        assigned_to INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (university_id) REFERENCES universities(id),
        FOREIGN KEY (category_id) REFERENCES categories(id)
    )""")
    
    # Team members table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        position TEXT NOT NULL,
        role_type TEXT DEFAULT 'staff',
        photo TEXT,
        bio TEXT,
        email TEXT,
        phone TEXT,
        linkedin TEXT,
        display_order INTEGER DEFAULT 99,
        status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")

    # Testimonials table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS testimonials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        course TEXT,
        university TEXT,
        text TEXT NOT NULL,
        rating INTEGER DEFAULT 5,
        photo TEXT,
        status TEXT DEFAULT 'active',
        display_order INTEGER DEFAULT 99,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")

    # Roles table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        permissions TEXT DEFAULT '{}',
        status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")

    # Add proof_url to transactions if not exists
    try:
        cursor.execute("ALTER TABLE transactions ADD COLUMN proof_url TEXT")
    except:
        pass

    # Add notes column to documents if not exists
    try:
        cursor.execute("ALTER TABLE documents ADD COLUMN notes TEXT")
    except:
        pass

    # Add status_date column to documents if not exists
    try:
        cursor.execute("ALTER TABLE documents ADD COLUMN status_date TEXT")
    except:
        pass

    # Add fee_access columns to documents (without_fees / after_fees + required percentage)
    for col_name, col_type in [("fee_access", "TEXT DEFAULT 'without_fees'"), ("fee_percent_required", "REAL DEFAULT 0")]:
        try:
            cursor.execute(f"ALTER TABLE documents ADD COLUMN {col_name} {col_type}")
        except:
            pass

    # Notifications table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT NOT NULL,
        message TEXT,
        type TEXT DEFAULT 'info',
        is_read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )""")

    # Blog posts table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS blog_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT,
        content TEXT,
        excerpt TEXT,
        image TEXT,
        category TEXT DEFAULT 'General',
        author TEXT DEFAULT 'Admin',
        status TEXT DEFAULT 'published',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")

    # Gallery table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS gallery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        image TEXT NOT NULL,
        category TEXT DEFAULT 'General',
        description TEXT,
        university TEXT,
        display_order INTEGER DEFAULT 99,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")

    # Add university column to gallery if not exists
    try:
        cursor.execute("ALTER TABLE gallery ADD COLUMN university TEXT")
    except:
        pass

    # Careers table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS careers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        department TEXT,
        location TEXT,
        type TEXT DEFAULT 'Full-time',
        experience TEXT,
        salary_range TEXT,
        description TEXT,
        requirements TEXT,
        status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")

    # Career applications table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS career_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        career_id INTEGER,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        resume_url TEXT,
        cover_letter TEXT,
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (career_id) REFERENCES careers(id)
    )""")

    # Leads table (CRM)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        source TEXT DEFAULT 'website',
        status TEXT DEFAULT 'new',
        university_interest TEXT,
        course_interest TEXT,
        notes TEXT,
        assigned_to INTEGER,
        follow_up_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_to) REFERENCES users(id)
    )""")

    # Lead follow-ups table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS lead_follow_ups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER,
        note TEXT,
        follow_up_type TEXT DEFAULT 'call',
        next_follow_up TEXT,
        created_by INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
    )""")

    # Message templates table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS message_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        channel TEXT DEFAULT 'email',
        subject TEXT,
        body TEXT,
        variables TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")

    # Student status categories table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS student_status_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        color TEXT DEFAULT '#6B7280',
        description TEXT,
        display_order INTEGER DEFAULT 99,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")

    # Career application form fields table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS career_form_fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        career_id INTEGER,
        field_name TEXT NOT NULL,
        field_label TEXT NOT NULL,
        field_type TEXT NOT NULL DEFAULT 'text',
        is_required INTEGER DEFAULT 0,
        field_order INTEGER DEFAULT 0,
        options TEXT,
        placeholder TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (career_id) REFERENCES careers(id)
    )""")

    # Password reset tokens table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        used INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )""")

    # Lead history table (transfer & status change tracking)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS lead_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        from_user_id INTEGER,
        to_user_id INTEGER,
        old_status TEXT,
        new_status TEXT,
        note TEXT,
        performed_by INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id),
        FOREIGN KEY (from_user_id) REFERENCES users(id),
        FOREIGN KEY (to_user_id) REFERENCES users(id),
        FOREIGN KEY (performed_by) REFERENCES users(id)
    )""")

    # Campaigns table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        channel TEXT DEFAULT 'email',
        template_id INTEGER,
        target_audience TEXT DEFAULT 'all_students',
        filters TEXT,
        status TEXT DEFAULT 'draft',
        scheduled_at TEXT,
        sent_at TEXT,
        sent_count INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (template_id) REFERENCES message_templates(id)
    )""")

    # Notices / Announcements table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        category TEXT DEFAULT 'General',
        priority TEXT DEFAULT 'normal',
        is_pinned INTEGER DEFAULT 0,
        attachment_url TEXT,
        status TEXT DEFAULT 'published',
        created_by INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
    )""")

    # Chat conversations table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_user_id INTEGER NOT NULL,
        admin_user_id INTEGER NOT NULL,
        subject TEXT DEFAULT 'New Conversation',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_user_id) REFERENCES users(id),
        FOREIGN KEY (admin_user_id) REFERENCES users(id)
    )""")

    # Chat messages table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id),
        FOREIGN KEY (sender_id) REFERENCES users(id)
    )""")

    # Placement jobs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS placement_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT NOT NULL,
        company_logo TEXT,
        title TEXT NOT NULL,
        description TEXT,
        location TEXT,
        job_type TEXT DEFAULT 'Full-time',
        salary_range TEXT,
        eligibility TEXT,
        last_date TEXT,
        status TEXT DEFAULT 'active',
        created_by INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
    )""")

    # Placement applications table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS placement_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        resume_url TEXT,
        cover_letter TEXT,
        status TEXT DEFAULT 'applied',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES placement_jobs(id),
        FOREIGN KEY (student_id) REFERENCES students(id)
    )""")

    # Company visits table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS company_visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT NOT NULL,
        visit_date TEXT,
        visit_time TEXT,
        venue TEXT,
        description TEXT,
        contact_person TEXT,
        status TEXT DEFAULT 'upcoming',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")

    # Centers table (Center Management System)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS centers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        mobile TEXT UNIQUE NOT NULL,
        owner_name TEXT NOT NULL,
        email TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        parent_center_id INTEGER,
        level TEXT DEFAULT 'center',
        user_id INTEGER,
        status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_center_id) REFERENCES centers(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )""")

    # Commission slabs table (university-wise slab rates)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS commission_slabs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        university_id INTEGER NOT NULL,
        center_id INTEGER,
        min_admissions INTEGER NOT NULL DEFAULT 1,
        max_admissions INTEGER NOT NULL DEFAULT 999,
        commission_amount REAL NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (university_id) REFERENCES universities(id),
        FOREIGN KEY (center_id) REFERENCES centers(id)
    )""")

    # Center commissions table (per student commission tracking)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS center_commissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        center_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        university_id INTEGER,
        amount REAL NOT NULL DEFAULT 0,
        commission_type TEXT DEFAULT 'slab',
        status TEXT DEFAULT 'pending',
        paid_date TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (center_id) REFERENCES centers(id),
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (university_id) REFERENCES universities(id)
    )""")

    # Add center_id and admission_source to students table
    for col_name, col_type in [("center_id", "INTEGER"), ("admission_source", "TEXT DEFAULT 'self'")]:
        try:
            cursor.execute(f"ALTER TABLE students ADD COLUMN {col_name} {col_type}")
        except:
            pass

    # Add center_id to notices table for center-scoped announcements
    try:
        cursor.execute("ALTER TABLE notices ADD COLUMN center_id INTEGER")
    except:
        pass

    # Add target_audience to notices for admin announcements targeting
    try:
        cursor.execute("ALTER TABLE notices ADD COLUMN target_audience TEXT DEFAULT 'all'")
    except:
        pass

    # Add center_id and visibility to exams table for center-created exams
    for col_name, col_type in [("center_id", "INTEGER"), ("visibility", "TEXT DEFAULT 'all'")]:
        try:
            cursor.execute(f"ALTER TABLE exams ADD COLUMN {col_name} {col_type}")
        except:
            pass

    # Pop-ups table (admin notification pop-ups with target selection)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS popups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        popup_type TEXT DEFAULT 'info',
        target_audience TEXT DEFAULT 'all',
        image_url TEXT,
        link_url TEXT,
        link_text TEXT,
        is_active INTEGER DEFAULT 1,
        start_date TEXT,
        end_date TEXT,
        created_by INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
    )""")

    # Pop-up dismissals (track which users dismissed which pop-ups)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS popup_dismissals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        popup_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        dismissed_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (popup_id) REFERENCES popups(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(popup_id, user_id)
    )""")

    # Center settings table (for receipt/invoice customization)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS center_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        center_id INTEGER NOT NULL UNIQUE,
        receipt_company_name TEXT,
        receipt_address TEXT,
        receipt_phone TEXT,
        receipt_email TEXT,
        receipt_logo_url TEXT,
        receipt_footer TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (center_id) REFERENCES centers(id)
    )""")

    conn.commit()
    
    # Seed default admin
    from app.utils.auth import hash_password
    try:
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?, ?)",
            ("admin", "admin@asffeducationhub.com", hash_password("Admin@123"), "Super Admin", "+91-9999999999", "super_admin")
        )
        conn.commit()
    except sqlite3.IntegrityError:
        pass
    
    # Seed default settings
    default_settings = {
        "company_name": "Education Hub",
        "tagline": "Empowering Education Through Technology",
        "phone": "+91-9999999999",
        "email": "info@asffeducationhub.com",
        "address": "Jaipur, Rajasthan, India",
        "whatsapp": "+91-9999999999",
        "facebook": "https://facebook.com/asffeducationhub",
        "instagram": "https://instagram.com/asffeducationhub",
        "linkedin": "https://linkedin.com/company/asffeducationhub",
        "youtube": "https://youtube.com/asffeducationhub",
        "twitter": "https://twitter.com/asffeducationhub",
        "theme_primary": "#8B1A1A",
        "theme_secondary": "#D4A843",
        "about_us": "Education Hub is India's fastest-growing multi-university admission management platform. We partner with 100+ universities and 500+ consultants to deliver seamless admissions, technology solutions, and student support services.",
        "why_choose_us": "750+ education consultants across India|End-to-end admissions support|Trusted by 25+ universities|Backed by years of experience in education",
        "directors": json.dumps([{"name": "Dr. Rajesh Kumar", "designation": "Director", "image": ""}, {"name": "Mrs. Priya Sharma", "designation": "Co-Director", "image": ""}]),
        "counselors": json.dumps([{"name": "Amit Singh", "phone": "+91-9876543210", "email": "amit@asffeducationhub.com"}, {"name": "Neha Gupta", "phone": "+91-9876543211", "email": "neha@asffeducationhub.com"}]),
    }
    for key, value in default_settings.items():
        try:
            cursor.execute("INSERT INTO settings (key, value) VALUES (?, ?)", (key, value))
        except sqlite3.IntegrityError:
            pass
    conn.commit()
    
    # Seed default student status categories
    default_statuses = [
        ("active", "#22C55E", "Student is currently active", 1),
        ("pending", "#F59E0B", "Awaiting admin approval", 2),
        ("approved", "#3B82F6", "Student approved by admin", 3),
        ("rejected", "#EF4444", "Student application rejected", 4),
        ("completed", "#8B5CF6", "Student has completed their course", 5),
        ("deregistered", "#6B7280", "Student has been deregistered", 6),
        ("problem", "#F97316", "Student has some issue/problem", 7),
        ("transferred", "#06B6D4", "Student transferred to another branch", 8),
        ("re-registered", "#10B981", "Student re-registered for new session", 9),
    ]
    for name, color, desc, order in default_statuses:
        try:
            cursor.execute("INSERT INTO student_status_categories (name, color, description, display_order) VALUES (?, ?, ?, ?)", (name, color, desc, order))
        except:
            pass
    conn.commit()

    # Add form_fields column to career_applications if not exists
    try:
        cursor.execute("ALTER TABLE career_applications ADD COLUMN form_data TEXT")
    except:
        pass

    # Add solution column to tickets if not exists
    try:
        cursor.execute("ALTER TABLE tickets ADD COLUMN solution TEXT")
    except:
        pass

    # Fee payments table (student-initiated online payments needing approval)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS fee_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        payment_mode TEXT DEFAULT 'upi',
        utr_number TEXT,
        proof_url TEXT,
        remarks TEXT,
        status TEXT DEFAULT 'pending',
        approved_by INTEGER,
        approved_at TEXT,
        rejection_reason TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
    )""")

    # Center payment settings table (QR code + bank details per center)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS center_payment_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        center_id INTEGER NOT NULL UNIQUE,
        upi_id TEXT,
        upi_qr_url TEXT,
        bank_name TEXT,
        account_number TEXT,
        ifsc_code TEXT,
        account_holder_name TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (center_id) REFERENCES centers(id)
    )""")

    # Center fee payments table (student payments to center, center approves)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS center_fee_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        center_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        payment_mode TEXT DEFAULT 'upi',
        utr_number TEXT,
        proof_url TEXT,
        remarks TEXT,
        status TEXT DEFAULT 'pending',
        approved_by INTEGER,
        approved_at TEXT,
        rejection_reason TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (center_id) REFERENCES centers(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
    )""")

    # Add total_fees column to students if not exists
    try:
        cursor.execute("ALTER TABLE students ADD COLUMN total_fees REAL DEFAULT 0")
    except:
        pass

    # Add soft delete columns to transactions and fee_payments
    for col in [("transactions", "deleted_by_admin"), ("transactions", "deleted_at"), ("fee_payments", "deleted_by_admin"), ("fee_payments", "deleted_at")]:
        try:
            cursor.execute(f"ALTER TABLE {col[0]} ADD COLUMN {col[1]} {'INTEGER DEFAULT 0' if 'deleted_by' in col[1] else 'TEXT'}")
        except:
            pass

    # Seed default sessions
    try:
        cursor.execute("INSERT INTO sessions (name, start_date, end_date) VALUES (?, ?, ?)", ("February-2026", "2026-02-01", "2026-07-31"))
        cursor.execute("INSERT INTO sessions (name, start_date, end_date) VALUES (?, ?, ?)", ("July-2026", "2026-07-01", "2026-12-31"))
    except:
        pass
    conn.commit()
    
    # Seed team members
    existing_team = conn.execute("SELECT COUNT(*) FROM team_members").fetchone()[0]
    if existing_team == 0:
        team_members = [
            ("Dr. Rajesh Kumar Sharma", "Founder & Director", "director", "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop&crop=face", "Visionary leader with 20+ years in education sector. PhD in Education Management from JNU.", "rajesh@asffeducationhub.com", "+91-9876543201", "", 1),
            ("Mrs. Priya Agarwal", "Co-Director & Head of Operations", "director", "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face", "Expert in university partnerships and student counseling. MBA from IIM Ahmedabad.", "priya@asffeducationhub.com", "+91-9876543202", "", 2),
            ("Amit Singh Rathore", "Senior Counselor", "staff", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face", "8+ years of experience in student counseling and admissions.", "amit@asffeducationhub.com", "+91-9876543203", "", 3),
            ("Neha Gupta", "Admission Manager", "staff", "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&crop=face", "Manages end-to-end admission process for 10+ universities.", "neha@asffeducationhub.com", "+91-9876543204", "", 4),
            ("Vikram Joshi", "University Relations Manager", "staff", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face", "Handles partnerships with top universities across India.", "vikram@asffeducationhub.com", "+91-9876543205", "", 5),
            ("Anjali Verma", "Student Support Lead", "staff", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face", "Dedicated to providing best-in-class student support services.", "anjali@asffeducationhub.com", "+91-9876543206", "", 6),
            ("Rahul Meena", "Finance & Accounts", "staff", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face", "CA qualified. Manages all financial operations and fee tracking.", "rahul@asffeducationhub.com", "+91-9876543207", "", 7),
            ("Kavita Sharma", "Marketing Head", "staff", "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=300&h=300&fit=crop&crop=face", "Leads digital marketing and brand awareness campaigns.", "kavita@asffeducationhub.com", "+91-9876543208", "", 8),
            ("Deepak Yadav", "Technical Lead", "staff", "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop&crop=face", "Manages all technology platforms and software development.", "deepak@asffeducationhub.com", "+91-9876543209", "", 9),
            ("Sunita Devi", "Branch Coordinator", "staff", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face", "Coordinates between main office and all branch offices.", "sunita@asffeducationhub.com", "+91-9876543210", "", 10),
            ("Mohit Tanwar", "Counselor", "staff", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face", "Specializes in engineering and technology course counseling.", "mohit@asffeducationhub.com", "+91-9876543211", "", 11),
            ("Pooja Kumari", "Documentation Executive", "staff", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=face", "Handles all student documentation and verification processes.", "pooja@asffeducationhub.com", "+91-9876543212", "", 12),
        ]
        for name, position, role_type, photo, bio, email, phone, linkedin, order in team_members:
            conn.execute(
                "INSERT INTO team_members (name, position, role_type, photo, bio, email, phone, linkedin, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (name, position, role_type, photo, bio, email, phone, linkedin, order)
            )
        conn.commit()

    # Seed NIOS Board as university with 10th and 12th courses
    existing_nios = conn.execute("SELECT id FROM universities WHERE name = 'NIOS Board'").fetchone()
    if not existing_nios:
        cursor.execute(
            "INSERT INTO universities (name, description, website, status) VALUES (?, ?, ?, ?)",
            ("NIOS Board", "National Institute of Open Schooling - 10th and 12th Board Examinations", "https://www.nios.ac.in", "active")
        )
        nios_id = cursor.lastrowid
        # Add 10th and 12th as categories under NIOS
        cursor.execute("INSERT INTO categories (name, university_id, description) VALUES (?, ?, ?)",
                       ("10th (Secondary)", nios_id, "NIOS 10th Class - Secondary Education"))
        cursor.execute("INSERT INTO categories (name, university_id, description) VALUES (?, ?, ?)",
                       ("12th (Senior Secondary)", nios_id, "NIOS 12th Class - Senior Secondary Education"))
        conn.commit()

    # Seed testimonials
    existing_testimonials = conn.execute("SELECT COUNT(*) FROM testimonials").fetchone()[0]
    if existing_testimonials == 0:
        testimonial_data = [
            ("Priya Sharma", "B.Tech CSE", "DKNMU", "Education Hub made my admission process so smooth. The counselors guided me at every step and helped me choose the right university.", 5, "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face", 1),
            ("Rahul Verma", "MBA", "Amity University", "I was confused about which university to choose. The team provided detailed comparisons and helped me get admission in my dream college.", 5, "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face", 2),
            ("Anjali Singh", "B.Sc Nursing", "Manipal University", "The entire process from enquiry to enrollment was handled professionally. I highly recommend Education Hub to all students.", 4, "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face", 3),
            ("Vikash Kumar", "BBA", "Chandigarh University", "Best education consultancy! They have tie-ups with top universities and the fee structure they offered was very reasonable.", 5, "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face", 4),
        ]
        for name, course, uni, text, rating, photo, order in testimonial_data:
            conn.execute("INSERT INTO testimonials (name, course, university, text, rating, photo, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)", (name, course, uni, text, rating, photo, order))
        conn.commit()

    conn.close()
