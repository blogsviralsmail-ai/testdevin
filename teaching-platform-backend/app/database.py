import sqlite3
import os
from contextlib import contextmanager

DB_PATH = os.getenv("DB_PATH", "/data/app.db")
# For local dev, use local path
if not os.path.exists("/data"):
    DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "app.db")


def get_db_path():
    return DB_PATH


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'admin')),
        avatar TEXT,
        city TEXT,
        state TEXT,
        is_active INTEGER DEFAULT 1,
        is_verified INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teacher_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        bio TEXT,
        experience_years INTEGER DEFAULT 0,
        hourly_rate REAL DEFAULT 0,
        languages TEXT DEFAULT '[]',
        qualification TEXT,
        is_approved INTEGER DEFAULT 0,
        rating REAL DEFAULT 0,
        total_reviews INTEGER DEFAULT 0,
        total_classes INTEGER DEFAULT 0,
        total_earnings REAL DEFAULT 0,
        bank_name TEXT,
        bank_account TEXT,
        bank_ifsc TEXT,
        upi_id TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS teacher_subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id INTEGER NOT NULL,
        subject_id INTEGER NOT NULL,
        class_levels TEXT DEFAULT '[]',
        FOREIGN KEY (teacher_id) REFERENCES teacher_profiles(id),
        FOREIGN KEY (subject_id) REFERENCES subjects(id),
        UNIQUE(teacher_id, subject_id)
    );

    CREATE TABLE IF NOT EXISTS teacher_availability (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        FOREIGN KEY (teacher_id) REFERENCES teacher_profiles(id)
    );

    CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id INTEGER NOT NULL,
        student_id INTEGER,
        subject_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        class_type TEXT DEFAULT 'one-on-one' CHECK(class_type IN ('one-on-one', 'group', 'demo')),
        scheduled_at TIMESTAMP NOT NULL,
        duration_minutes INTEGER DEFAULT 60,
        meeting_link TEXT,
        status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
        max_students INTEGER DEFAULT 1,
        price REAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        status TEXT DEFAULT 'booked' CHECK(status IN ('booked', 'attended', 'missed', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes(id),
        FOREIGN KEY (student_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        teacher_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        platform_fee REAL DEFAULT 0,
        teacher_amount REAL DEFAULT 0,
        status TEXT DEFAULT 'escrow' CHECK(status IN ('escrow', 'released', 'refunded')),
        payment_method TEXT DEFAULT 'wallet',
        transaction_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        released_at TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id),
        FOREIGN KEY (student_id) REFERENCES users(id),
        FOREIGN KEY (teacher_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        teacher_id INTEGER NOT NULL,
        class_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id),
        FOREIGN KEY (teacher_id) REFERENCES teacher_profiles(id),
        FOREIGN KEY (class_id) REFERENCES classes(id)
    );

    CREATE TABLE IF NOT EXISTS favourites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        teacher_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id),
        FOREIGN KEY (teacher_id) REFERENCES teacher_profiles(id),
        UNIQUE(student_id, teacher_id)
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT DEFAULT 'general' CHECK(category IN ('general', 'payment', 'class', 'technical', 'other')),
        status TEXT DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')),
        priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS ticket_replies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES support_tickets(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS email_config (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        smtp_host TEXT DEFAULT '',
        smtp_port INTEGER DEFAULT 587,
        smtp_username TEXT DEFAULT '',
        smtp_password TEXT DEFAULT '',
        sender_name TEXT DEFAULT 'GuruConnect',
        sender_email TEXT DEFAULT '',
        is_enabled INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS email_notification_settings (
        key TEXT PRIMARY KEY,
        is_enabled INTEGER DEFAULT 1,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payment_gateways (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        gateway_type TEXT NOT NULL CHECK(gateway_type IN ('razorpay', 'phonepe', 'cashfree', 'payu', 'instamojo', 'custom_upi', 'cash')),
        display_name TEXT NOT NULL,
        api_key TEXT DEFAULT '',
        api_secret TEXT DEFAULT '',
        merchant_id TEXT DEFAULT '',
        extra_config TEXT DEFAULT '{}',
        is_enabled INTEGER DEFAULT 0,
        is_primary INTEGER DEFAULT 0,
        supports_upi INTEGER DEFAULT 1,
        supports_cards INTEGER DEFAULT 0,
        supports_netbanking INTEGER DEFAULT 0,
        upi_intent INTEGER DEFAULT 0,
        custom_upi_id TEXT DEFAULT '',
        custom_qr_data TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Migration: add bank details columns if they don't exist
    try:
        cursor.execute("ALTER TABLE teacher_profiles ADD COLUMN bank_name TEXT")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE teacher_profiles ADD COLUMN bank_account TEXT")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE teacher_profiles ADD COLUMN bank_ifsc TEXT")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE teacher_profiles ADD COLUMN upi_id TEXT")
    except Exception:
        pass

    # Migration: add payment_type and payout columns to payments
    try:
        cursor.execute("ALTER TABLE payments ADD COLUMN payment_type TEXT DEFAULT 'pay_in'")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE payments ADD COLUMN card_last4 TEXT")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE payments ADD COLUMN card_brand TEXT")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE payments ADD COLUMN payout_method TEXT")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE payments ADD COLUMN payout_reference TEXT")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE payments ADD COLUMN payout_at TIMESTAMP")
    except Exception:
        pass

    # Seed default subjects
    default_subjects = [
        'Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology',
        'English', 'Hindi', 'Social Studies', 'History', 'Geography',
        'Computer Science', 'Economics', 'Accounting', 'Business Studies',
        'Art', 'Music', 'Physical Education', 'Sanskrit', 'French',
        'German', 'Spanish', 'Python', 'Java', 'Web Development',
        'Data Science', 'Machine Learning', 'IELTS', 'TOEFL', 'GRE', 'GMAT'
    ]
    for subj in default_subjects:
        cursor.execute("INSERT OR IGNORE INTO subjects (name) VALUES (?)", (subj,))

    # Seed default site settings
    default_settings = [
        ('platform_name', 'GuruConnect'),
        ('support_email', 'support@guruplatform.com'),
        ('commission_rate', '10'),
        ('currency', 'INR (Rs)'),
        ('platform_description', "India's premier online teaching platform connecting students with expert teachers"),
    ]
    for key, value in default_settings:
        cursor.execute("INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)", (key, value))

    # Seed default email config
    cursor.execute("INSERT OR IGNORE INTO email_config (id, smtp_host, smtp_port, sender_name) VALUES (1, '', 587, 'GuruConnect')")

    # Seed default email notification settings
    default_notif_settings = [
        'new_student_registration', 'new_teacher_registration', 'teacher_approval',
        'new_booking', 'payment_received', 'payment_released', 'payment_refunded',
        'class_reminder', 'class_completed', 'support_ticket_update', 'payout_processed'
    ]
    for key in default_notif_settings:
        cursor.execute("INSERT OR IGNORE INTO email_notification_settings (key, is_enabled) VALUES (?, 1)", (key,))
    # Class reminder off by default
    cursor.execute("UPDATE email_notification_settings SET is_enabled = 0 WHERE key = 'class_reminder' AND is_enabled = 1")

    # Migration: add gateway columns to payments table
    try:
        cursor.execute("ALTER TABLE payments ADD COLUMN gateway_id INTEGER")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE payments ADD COLUMN gateway_name TEXT")
    except Exception:
        pass

    # Seed default payment gateways
    existing_gateways = cursor.execute("SELECT COUNT(*) FROM payment_gateways").fetchone()[0]
    if existing_gateways == 0:
        default_gateways = [
            ('RazorPay', 'razorpay', 'RazorPay (UPI + Cards)', '', '', '', '{"upi_mode": "intent"}', 0, 0, 1, 1, 1, 1, '', ''),
            ('PhonePe', 'phonepe', 'PhonePe Payment Gateway', '', '', '', '{}', 0, 0, 1, 0, 0, 0, '', ''),
            ('Cashfree', 'cashfree', 'Cashfree Payments', '', '', '', '{}', 0, 0, 1, 1, 1, 0, '', ''),
            ('PayU', 'payu', 'PayU Money', '', '', '', '{}', 0, 0, 1, 1, 1, 0, '', ''),
            ('Instamojo', 'instamojo', 'Instamojo', '', '', '', '{}', 0, 0, 1, 0, 0, 0, '', ''),
            ('Custom UPI', 'custom_upi', 'Custom UPI QR / VPA', '', '', '', '{}', 0, 0, 1, 0, 0, 0, '', ''),
        ]
        for g in default_gateways:
            cursor.execute(
                """INSERT INTO payment_gateways (name, gateway_type, display_name, api_key, api_secret, merchant_id, extra_config, is_enabled, is_primary, supports_upi, supports_cards, supports_netbanking, upi_intent, custom_upi_id, custom_qr_data)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", g
            )

    # Seed admin user
    from app.auth import hash_password
    admin_hash = hash_password("admin123")
    cursor.execute("""
        INSERT OR IGNORE INTO users (email, password_hash, full_name, phone, role, is_active, is_verified)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, ("admin@guruplatform.com", admin_hash, "Platform Admin", "9999999999", "admin", 1, 1))

    conn.commit()
    conn.close()
