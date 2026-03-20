import sqlite3
import os
from contextlib import contextmanager

# Use /data for persistent storage in production, local for dev
DB_PATH = os.environ.get("DB_PATH", "/data/app.db") if os.path.exists("/data") else os.environ.get("DB_PATH", "app.db")


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


def _init_v17_tables():
    """Initialize V17 feature tables - called from init_db"""
    conn = get_connection()
    # V17 - New feature tables
    v17_tables = [
        """CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            entity_type TEXT,
            entity_id TEXT,
            details TEXT,
            ip_address TEXT,
            user_agent TEXT,
            location TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""",
        """CREATE TABLE IF NOT EXISTS equipment_rental (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ground_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            category TEXT DEFAULT 'cricket',
            price_per_hour REAL NOT NULL,
            quantity INTEGER DEFAULT 1,
            available INTEGER DEFAULT 1,
            description TEXT,
            image_url TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""",
        """CREATE TABLE IF NOT EXISTS equipment_bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id TEXT,
            equipment_id INTEGER NOT NULL,
            quantity INTEGER DEFAULT 1,
            total_price REAL NOT NULL,
            status TEXT DEFAULT 'confirmed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""",
        """CREATE TABLE IF NOT EXISTS loyalty_points (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            points INTEGER DEFAULT 0,
            total_earned INTEGER DEFAULT 0,
            total_redeemed INTEGER DEFAULT 0,
            tier TEXT DEFAULT 'bronze',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""",
        """CREATE TABLE IF NOT EXISTS loyalty_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            points INTEGER NOT NULL,
            type TEXT NOT NULL,
            description TEXT,
            reference_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""",
        """CREATE TABLE IF NOT EXISTS auto_settlements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id INTEGER NOT NULL,
            frequency TEXT DEFAULT 'weekly',
            next_settlement_date TEXT,
            last_settlement_date TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""",
        """CREATE TABLE IF NOT EXISTS email_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            subject TEXT NOT NULL,
            body TEXT NOT NULL,
            variables TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""",
        """CREATE TABLE IF NOT EXISTS pages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            meta_description TEXT,
            is_published INTEGER DEFAULT 1,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""",
    ]
    for sql in v17_tables:
        try:
            conn.execute(sql)
            conn.commit()
        except Exception:
            pass

    # V17 - New settings
    v17_settings = [
        ("google_analytics_id", "", "Google Analytics Measurement ID (G-XXXXXXX)"),
        ("google_adsense_id", "", "Google AdSense Publisher ID (ca-pub-XXXXX)"),
        ("firebase_api_key", "", "Firebase API Key for Push Notifications"),
        ("firebase_project_id", "", "Firebase Project ID"),
        ("firebase_messaging_sender_id", "", "Firebase Messaging Sender ID"),
        ("loyalty_points_per_booking", "10", "Points earned per booking"),
        ("loyalty_points_value", "1", "Value of 1 point in Rs"),
        ("loyalty_min_redeem", "100", "Minimum points to redeem"),
        ("auto_settlement_enabled", "0", "Enable auto settlement for owners"),
        ("auto_settlement_frequency", "weekly", "Auto settlement frequency (weekly/monthly)"),
        ("equipment_rental_enabled", "1", "Enable equipment rental feature"),
        ("ad_header_code", "", "Custom ad code for header"),
        ("ad_sidebar_code", "", "Custom ad code for sidebar"),
        ("ad_footer_code", "", "Custom ad code for footer"),
    ]
    for key, value, desc in v17_settings:
        try:
            conn.execute("INSERT OR IGNORE INTO settings (key, value, description) VALUES (?, ?, ?)", (key, value, desc))
            conn.commit()
        except Exception:
            pass

    # V17 - Default email templates
    default_templates = [
        ("booking_confirmation", "Booking Confirmed - {{booking_id}}", "<h2>Booking Confirmed!</h2><p>Dear {{customer_name}},</p><p>Your booking <b>{{booking_id}}</b> at <b>{{ground_name}}</b> on <b>{{date}}</b> from <b>{{time}}</b> has been confirmed.</p><p>Amount: Rs.{{amount}}</p><p>Thank you for choosing BookAGround!</p>", "customer_name,booking_id,ground_name,date,time,amount"),
        ("booking_cancellation", "Booking Cancelled - {{booking_id}}", "<h2>Booking Cancelled</h2><p>Dear {{customer_name}},</p><p>Your booking <b>{{booking_id}}</b> at <b>{{ground_name}}</b> has been cancelled.</p><p>Refund: Rs.{{refund_amount}} (credited to wallet)</p>", "customer_name,booking_id,ground_name,refund_amount"),
        ("welcome_email", "Welcome to BookAGround!", "<h2>Welcome {{name}}!</h2><p>Thank you for joining BookAGround - India\'s leading cricket ground booking platform.</p><p>Start exploring grounds near you and book your first session!</p>", "name"),
        ("payment_receipt", "Payment Receipt - Rs.{{amount}}", "<h2>Payment Receipt</h2><p>Dear {{customer_name}},</p><p>Payment of Rs.{{amount}} received for booking {{booking_id}}.</p><p>Gateway: {{gateway}}</p><p>Transaction ID: {{txn_id}}</p>", "customer_name,amount,booking_id,gateway,txn_id"),
        ("kyc_approved", "KYC Verified Successfully", "<h2>KYC Approved!</h2><p>Dear {{name}},</p><p>Your KYC documents have been verified successfully. You can now receive payouts.</p>", "name"),
        ("withdrawal_processed", "Withdrawal Processed - Rs.{{amount}}", "<h2>Withdrawal Processed</h2><p>Dear {{name}},</p><p>Your withdrawal of Rs.{{amount}} has been processed. Transaction ID: {{txn_id}}</p>", "name,amount,txn_id"),
    ]
    for name, subject, body, variables in default_templates:
        try:
            conn.execute("INSERT OR IGNORE INTO email_templates (name, subject, body, variables) VALUES (?, ?, ?, ?)", (name, subject, body, variables))
            conn.commit()
        except Exception:
            pass

    # V17 - Default pages
    default_pages = [
        ("privacy-policy", "Privacy Policy", "<h1>Privacy Policy</h1><p>Last updated: March 2026</p><h2>1. Information We Collect</h2><p>We collect personal information such as name, phone number, email address when you register on BookAGround.</p><h2>2. How We Use Your Information</h2><p>Your information is used to provide booking services, process payments, and improve our platform.</p><h2>3. Data Security</h2><p>We implement appropriate security measures to protect your personal information.</p><h2>4. Third Party Services</h2><p>We may use third-party payment gateways and analytics services.</p><h2>5. Contact Us</h2><p>For any privacy concerns, contact us at info@bookaground.com</p>", "BookAGround Privacy Policy - How we collect, use, and protect your data"),
        ("about-us", "About Us", "<h1>About BookAGround</h1><p>BookAGround is India\'s leading cricket ground booking platform that connects players with ground owners.</p><h2>Our Mission</h2><p>To make cricket ground booking easy, transparent, and accessible for everyone.</p><h2>What We Offer</h2><ul><li>Easy online ground booking</li><li>Multiple payment options</li><li>Ground owner dashboard</li><li>Team management</li><li>Tournament organization</li></ul><h2>Our Team</h2><p>We are a passionate team of cricket lovers and tech enthusiasts working to revolutionize how cricket is played in India.</p>", "About BookAGround - India leading cricket ground booking platform"),
        ("contact-us", "Contact Us", "<h1>Contact Us</h1><p>We would love to hear from you! Reach out to us through any of the following channels:</p><h2>Email</h2><p>info@bookaground.com</p><h2>Phone</h2><p>+91 9782005500</p><h2>Address</h2><p>Jaipur, Rajasthan, India</p><h2>Business Hours</h2><p>Monday - Saturday: 9:00 AM - 6:00 PM</p><p>Sunday: 10:00 AM - 2:00 PM</p>", "Contact BookAGround - Get in touch with us for support and inquiries"),
        ("terms", "Terms & Conditions", "<h1>Terms & Conditions</h1><p>Last updated: March 2026</p><h2>1. Acceptance of Terms</h2><p>By using BookAGround, you agree to these terms and conditions.</p><h2>2. Booking Policy</h2><p>All bookings are subject to availability. Cancellation charges may apply as per our cancellation policy.</p><h2>3. Payment Terms</h2><p>Payments are processed securely through our payment partners. Refunds are processed within 5-7 business days.</p><h2>4. User Responsibilities</h2><p>Users must provide accurate information and follow ground rules.</p><h2>5. Limitation of Liability</h2><p>BookAGround is not liable for any injuries or damages during ground usage.</p>", "BookAGround Terms and Conditions - Rules and policies for using our platform"),
        ("refund-policy", "Refund Policy", "<h1>Refund Policy</h1><p>Last updated: March 2026</p><h2>Cancellation & Refund</h2><p>Cancellation before 24 hours: Full refund to wallet</p><p>Cancellation within 24 hours: 50% refund</p><p>No-show: Token amount forfeited</p><h2>Processing Time</h2><p>Refunds are processed within 24 hours to your BookAGround wallet.</p>", "BookAGround Refund Policy - Cancellation and refund terms"),
    ]
    for slug, title, content, meta_desc in default_pages:
        try:
            conn.execute("INSERT OR IGNORE INTO pages (slug, title, content, meta_description) VALUES (?, ?, ?, ?)", (slug, title, content, meta_desc))
            conn.commit()
        except Exception:
            pass

    conn.close()


def init_db():
    with get_db() as db:
        db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT UNIQUE NOT NULL,
            email TEXT,
            photo_url TEXT,
            role TEXT DEFAULT 'user',
            rating REAL DEFAULT 0,
            rating_count INTEGER DEFAULT 0,
            wallet_balance REAL DEFAULT 0,
            referral_code TEXT UNIQUE,
            referred_by TEXT,
            city TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS grounds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            address TEXT NOT NULL,
            city TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            sport_type TEXT DEFAULT 'cricket',
            ground_type TEXT DEFAULT 'box',
            description TEXT,
            photos TEXT,
            amenities TEXT,
            weekday_price REAL NOT NULL,
            weekend_price REAL NOT NULL,
            evening_extra REAL DEFAULT 0,
            rating REAL DEFAULT 0,
            rating_count INTEGER DEFAULT 0,
            total_bookings INTEGER DEFAULT 0,
            commission_rate REAL,
            is_active INTEGER DEFAULT 1,
            is_featured INTEGER DEFAULT 0,
            opening_time TEXT DEFAULT '06:00',
            closing_time TEXT DEFAULT '23:00',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS slots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ground_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            price REAL NOT NULL,
            status TEXT DEFAULT 'available',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ground_id) REFERENCES grounds(id)
        );

        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id TEXT UNIQUE NOT NULL,
            user_id INTEGER NOT NULL,
            ground_id INTEGER NOT NULL,
            slot_id INTEGER NOT NULL,
            booking_date TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            total_amount REAL NOT NULL,
            token_amount REAL NOT NULL,
            remaining_amount REAL DEFAULT 0,
            discount_amount REAL DEFAULT 0,
            cashback_amount REAL DEFAULT 0,
            payment_mode TEXT DEFAULT 'online',
            payment_gateway TEXT,
            payment_status TEXT DEFAULT 'pending',
            remaining_paid_mode TEXT,
            promo_code TEXT,
            status TEXT DEFAULT 'confirmed',
            cancelled_by TEXT,
            cancel_reason TEXT,
            cancel_charge REAL DEFAULT 0,
            refund_amount REAL DEFAULT 0,
            rated INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (ground_id) REFERENCES grounds(id),
            FOREIGN KEY (slot_id) REFERENCES slots(id)
        );

        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            gateway TEXT,
            transaction_id TEXT,
            payment_type TEXT NOT NULL,
            status TEXT DEFAULT 'success',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings(id)
        );

        CREATE TABLE IF NOT EXISTS promo_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            discount_type TEXT NOT NULL,
            discount_value REAL NOT NULL,
            min_booking REAL DEFAULT 0,
            max_discount REAL,
            usage_limit INTEGER DEFAULT 100,
            used_count INTEGER DEFAULT 0,
            valid_from TEXT,
            valid_to TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER NOT NULL,
            reviewer_id INTEGER NOT NULL,
            target_type TEXT NOT NULL,
            target_id INTEGER NOT NULL,
            rating REAL NOT NULL,
            review_text TEXT,
            ground_quality REAL,
            facilities REAL,
            staff REAL,
            value_for_money REAL,
            punctuality REAL,
            behavior REAL,
            ground_care REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings(id),
            FOREIGN KEY (reviewer_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            captain_id INTEGER NOT NULL,
            logo_url TEXT,
            members TEXT,
            wins INTEGER DEFAULT 0,
            losses INTEGER DEFAULT 0,
            matches_played INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (captain_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS challenges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            challenger_team_id INTEGER NOT NULL,
            opponent_team_id INTEGER NOT NULL,
            ground_id INTEGER,
            match_date TEXT,
            match_time TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (challenger_team_id) REFERENCES teams(id),
            FOREIGN KEY (opponent_team_id) REFERENCES teams(id)
        );

        CREATE TABLE IF NOT EXISTS otp_store (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT NOT NULL,
            otp TEXT NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS favourites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            ground_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, ground_id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (ground_id) REFERENCES grounds(id)
        );

        CREATE TABLE IF NOT EXISTS promo_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            promo_id INTEGER NOT NULL,
            promo_code TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (promo_id) REFERENCES promo_codes(id)
        );

        CREATE TABLE IF NOT EXISTS affiliates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            code TEXT UNIQUE NOT NULL,
            commission_rate REAL DEFAULT 5,
            total_earnings REAL DEFAULT 0,
            total_clicks INTEGER DEFAULT 0,
            total_conversions INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS referrals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            referrer_id INTEGER NOT NULL,
            referee_id INTEGER NOT NULL,
            referral_type TEXT NOT NULL,
            reward_amount REAL DEFAULT 0,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (referrer_id) REFERENCES users(id),
            FOREIGN KEY (referee_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS settlements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id INTEGER NOT NULL,
            period TEXT NOT NULL,
            online_amount REAL DEFAULT 0,
            cash_amount REAL DEFAULT 0,
            commission_amount REAL DEFAULT 0,
            net_payable REAL DEFAULT 0,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT NOT NULL,
            description TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS payment_gateways (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            display_name TEXT NOT NULL,
            api_key TEXT,
            secret_key TEXT,
            is_active INTEGER DEFAULT 0,
            is_test_mode INTEGER DEFAULT 1,
            priority INTEGER DEFAULT 0,
            transaction_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
    # Contact submissions table
    with get_db() as db2:
        db2.execute("""CREATE TABLE IF NOT EXISTS contact_submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            subject TEXT,
            message TEXT,
            status TEXT DEFAULT 'new',
            admin_reply TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""")
    # Split payments table
    with get_db() as db3:
        db3.execute("""CREATE TABLE IF NOT EXISTS split_payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            user_name TEXT,
            user_phone TEXT,
            booking_id TEXT,
            ground_name TEXT,
            booking_date TEXT,
            total_amount REAL NOT NULL,
            my_share REAL DEFAULT 0,
            split_type TEXT DEFAULT 'equal',
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )""")
        db3.execute("""CREATE TABLE IF NOT EXISTS split_payment_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            split_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            phone TEXT,
            amount REAL DEFAULT 0,
            paid INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (split_id) REFERENCES split_payments(id)
        )""")
    # Initialize V17 tables
    _init_v17_tables()


def add_missing_columns():
    import os as _os
    db_path = _os.environ.get("DB_PATH", "/data/app.db") if _os.path.exists("/data") else _os.environ.get("DB_PATH", "app.db")
    conn = sqlite3.connect(db_path)
    columns_to_add = [
        ("users", "password_hash", "TEXT"),
        ("users", "kyc_status", "TEXT DEFAULT 'none'"),
        ("users", "bank_name", "TEXT"),
        ("users", "bank_account", "TEXT"),
        ("users", "bank_ifsc", "TEXT"),
        ("users", "kyc_doc_type", "TEXT"),
        ("users", "kyc_doc_url", "TEXT"),
        ("users", "is_banned", "INTEGER DEFAULT 0"),
        ("users", "is_suspended", "INTEGER DEFAULT 0"),
        ("bookings", "attendance", "TEXT"),
        ("bookings", "cash_verified", "INTEGER DEFAULT 0"),
        ("bookings", "cash_verified_by", "INTEGER"),
        ("grounds", "approval_required", "INTEGER DEFAULT 0"),
        ("users", "upi_id", "TEXT"),
        ("withdraw_requests", "transaction_id", "TEXT"),
        ("withdraw_requests", "proof_url", "TEXT"),
        ("users", "sub_role", "TEXT DEFAULT 'admin'"),
        ("users", "permissions", "TEXT"),
        ("grounds", "slug", "TEXT"),
        ("bookings", "razorpay_order_id", "TEXT"),
        ("bookings", "razorpay_payment_id", "TEXT"),
        ("bookings", "user_latitude", "REAL"),
        ("bookings", "user_longitude", "REAL"),
        # Re-KYC: Store old bank details while new ones are pending verification
        ("users", "old_bank_name", "TEXT"),
        ("users", "old_bank_account", "TEXT"),
        ("users", "old_bank_ifsc", "TEXT"),
        ("users", "old_upi_id", "TEXT"),
        ("users", "old_kyc_doc_type", "TEXT"),
        ("users", "old_kyc_doc_url", "TEXT"),
        ("users", "kyc_reject_reason", "TEXT"),
        # Token money percentage per ground (30%, 50%, 100%)
        ("grounds", "token_money_percent", "REAL DEFAULT 100"),
    
    ]
    for table, column, col_type in columns_to_add:
        try:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
            conn.commit()
        except Exception:
            pass
    # Create withdraw_requests table
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS withdraw_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                charge REAL DEFAULT 0,
                net_amount REAL NOT NULL,
                status TEXT DEFAULT 'pending',
                processed_by INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed_at TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        conn.commit()
    except Exception:
        pass

    # Create new tables for bug fixes
    new_tables = [
        """CREATE TABLE IF NOT EXISTS otp_store (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT NOT NULL,
            otp TEXT NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""",
        """CREATE TABLE IF NOT EXISTS favourites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            ground_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, ground_id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (ground_id) REFERENCES grounds(id)
        )""",
        """CREATE TABLE IF NOT EXISTS promo_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            promo_id INTEGER NOT NULL,
            promo_code TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (promo_id) REFERENCES promo_codes(id)
        )
        CREATE TABLE IF NOT EXISTS wallet_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            amount REAL NOT NULL,
            balance_after REAL DEFAULT 0,
            description TEXT,
            reference_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
""",
    ]
    for sql in new_tables:
        try:
            conn.execute(sql)
            conn.commit()
        except Exception:
            pass

    # Add booking_ids column to settlements for tracking
    try:
        conn.execute("ALTER TABLE settlements ADD COLUMN booking_ids TEXT")
        conn.commit()
    except Exception:
        pass

    # Create tickets table
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                ground_id INTEGER,
                subject TEXT NOT NULL,
                message TEXT NOT NULL,
                status TEXT DEFAULT 'open',
                priority TEXT DEFAULT 'normal',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        conn.commit()
    except Exception:
        pass

    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS ticket_replies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ticket_id) REFERENCES tickets(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        conn.commit()
    except Exception:
        pass

    new_settings = [
        ("booking_approval_required", "0", "If enabled, bookings need owner confirmation"),
        ("telegram_bot_token", "", "Telegram Bot Token for notifications"),
        ("telegram_chat_id", "", "Telegram Chat ID for notifications"),
        ("invoice_email_enabled", "1", "Send invoice email on booking confirmation"),
        ("sms_api_key", "", "SMS Gateway API Key"),
        ("sms_provider", "MSG91", "SMS Provider Name"),
        ("sms_sender_id", "BAGND", "SMS Sender ID"),
        ("whatsapp_api_key", "", "WhatsApp API Key"),
        ("whatsapp_provider", "Twilio", "WhatsApp Provider Name"),
        ("whatsapp_phone", "", "WhatsApp Phone Number"),
        ("email_api_key", "", "Email Service API Key (SendGrid/etc)"),
        ("email_provider", "SendGrid", "Email Provider Name"),
        ("email_from", "noreply@bookaground.com", "Email From Address"),
        ("cash_payment_enabled", "1", "Enable cash payment option"),
        ("no_show_wait_minutes", "15", "Minutes to wait before marking no-show"),
        ("no_show_token_forfeit", "1", "Forfeit token on no-show"),
        ("platform_forfeit_revenue", "0", "Total revenue from forfeited tokens"),
        ("customer_care_number", "9782005500", "Customer care number shown before booking"),
        ("wallet_cash_add_enabled", "1", "Allow users to add money via cash (admin approves)"),
        # V11 new settings
        ("site_name", "BookAGround", "Website name"),
        ("site_tagline", "Book Your Perfect Cricket Ground", "Website tagline"),
        ("site_logo_url", "", "Website logo URL"),
        ("site_primary_color", "#1a5f2a", "Primary brand color"),
        ("site_secondary_color", "#2d8f4e", "Secondary brand color"),
        ("site_contact_email", "info@bookaground.com", "Contact email"),
        ("site_contact_phone", "9782005500", "Contact phone"),
        ("site_address", "", "Office address"),
        ("site_about", "BookAGround is Indias leading cricket ground booking platform.", "About text"),
        ("site_terms_url", "", "Terms & Conditions URL"),
        ("site_privacy_url", "", "Privacy Policy URL"),
        ("smtp_email", "info@bookaground.com", "SMTP email for sending"),
        ("smtp_password", "", "SMTP app password"),
        ("smtp_host", "smtp.gmail.com", "SMTP host"),
        ("smtp_port", "587", "SMTP port"),
        ("cod_enabled", "1", "Cash on Delivery/Ground enabled"),
        ("email_on_booking", "1", "Send email on new booking"),
        ("email_on_cancel", "1", "Send email on cancellation"),
        ("email_on_registration", "1", "Send email on registration"),
        ("email_on_password_reset", "1", "Send email on password reset"),
        ("email_on_payment_pending", "1", "Send email on payment pending"),
        # WhatsApp floating button settings
        ("whatsapp_button_number", "919782005500", "WhatsApp button number with country code"),
        ("whatsapp_button_message", "Hi! I want to book a sports ground on BookAGround. Please help me.", "Default WhatsApp message"),
        # Social media links
        ("social_facebook", "", "Facebook page URL"),
        ("social_instagram", "", "Instagram page URL"),
        ("social_twitter", "", "Twitter/X page URL"),
        ("social_youtube", "", "YouTube channel URL"),
        ("social_whatsapp", "919782005500", "WhatsApp number for social link"),
    ]
    for key, value, desc in new_settings:
        try:
            conn.execute("INSERT OR IGNORE INTO settings (key, value, description) VALUES (?, ?, ?)", (key, value, desc))
            conn.commit()
        except Exception:
            pass

    # Create admin_roles table
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS admin_roles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                label TEXT NOT NULL,
                permissions TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        # Insert default roles
        for role_name, label, perms in [
            ("super_admin", "Super Admin", "all"),
            ("admin", "Admin", "dashboard,grounds,bookings,users,payments,settlements,promos,kyc,teamdata,tickets,settings,reports"),
            ("manager", "Manager", "dashboard,bookings,users,reports"),
            ("support", "Support", "dashboard,bookings,tickets"),
        ]:
            try:
                conn.execute("INSERT OR IGNORE INTO admin_roles (name, label, permissions) VALUES (?, ?, ?)", (role_name, label, perms))
                conn.commit()
            except Exception:
                pass
    except Exception:
        pass

    # V13 - New feature tables
    v13_tables = [
        """CREATE TABLE IF NOT EXISTS favourites (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, ground_id INTEGER NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, ground_id))""",
        """CREATE TABLE IF NOT EXISTS recurring_bookings (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, ground_id INTEGER NOT NULL, slot_time TEXT, day_of_week INTEGER, frequency TEXT DEFAULT 'weekly', start_date TEXT, end_date TEXT, is_active INTEGER DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""",
        """CREATE TABLE IF NOT EXISTS chat_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, sender_id INTEGER NOT NULL, receiver_id INTEGER NOT NULL, ground_id INTEGER, message TEXT NOT NULL, is_read INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""",
        """CREATE TABLE IF NOT EXISTS dynamic_pricing (id INTEGER PRIMARY KEY AUTOINCREMENT, ground_id INTEGER NOT NULL, day_type TEXT DEFAULT 'weekday', time_slot TEXT, price_multiplier REAL DEFAULT 1.0, is_active INTEGER DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""",
        """CREATE TABLE IF NOT EXISTS maintenance_schedule (id INTEGER PRIMARY KEY AUTOINCREMENT, ground_id INTEGER NOT NULL, title TEXT NOT NULL, description TEXT, start_date TEXT NOT NULL, end_date TEXT, status TEXT DEFAULT 'scheduled', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""",
        """CREATE TABLE IF NOT EXISTS staff_members (id INTEGER PRIMARY KEY AUTOINCREMENT, owner_id INTEGER NOT NULL, name TEXT NOT NULL, phone TEXT, role TEXT DEFAULT 'staff', ground_id INTEGER, is_active INTEGER DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""",
        """CREATE TABLE IF NOT EXISTS owner_coupons (id INTEGER PRIMARY KEY AUTOINCREMENT, owner_id INTEGER NOT NULL, ground_id INTEGER, code TEXT NOT NULL, discount_type TEXT DEFAULT 'percentage', discount_value REAL DEFAULT 10, max_uses INTEGER DEFAULT 100, used_count INTEGER DEFAULT 0, valid_from TEXT, valid_to TEXT, is_active INTEGER DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""",
        """CREATE TABLE IF NOT EXISTS expenses (id INTEGER PRIMARY KEY AUTOINCREMENT, owner_id INTEGER NOT NULL, ground_id INTEGER, category TEXT NOT NULL, amount REAL NOT NULL, description TEXT, expense_date TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""",
        """CREATE TABLE IF NOT EXISTS gallery_images (id INTEGER PRIMARY KEY AUTOINCREMENT, ground_id INTEGER NOT NULL, image_url TEXT NOT NULL, caption TEXT, display_order INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""",
        """CREATE TABLE IF NOT EXISTS tournaments (id INTEGER PRIMARY KEY AUTOINCREMENT, organizer_id INTEGER NOT NULL, ground_id INTEGER, name TEXT NOT NULL, sport_type TEXT DEFAULT 'cricket', start_date TEXT, end_date TEXT, max_teams INTEGER DEFAULT 8, entry_fee REAL DEFAULT 0, prize_pool REAL DEFAULT 0, status TEXT DEFAULT 'upcoming', description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""",
        """CREATE TABLE IF NOT EXISTS tournament_registrations (id INTEGER PRIMARY KEY AUTOINCREMENT, tournament_id INTEGER NOT NULL, team_id INTEGER, user_id INTEGER NOT NULL, team_name TEXT, status TEXT DEFAULT 'registered', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""",
        """CREATE TABLE IF NOT EXISTS membership_plans (id INTEGER PRIMARY KEY AUTOINCREMENT, ground_id INTEGER, name TEXT NOT NULL, duration_days INTEGER DEFAULT 30, price REAL NOT NULL, benefits TEXT, max_bookings INTEGER DEFAULT 10, discount_pct REAL DEFAULT 10, is_active INTEGER DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""",
        """CREATE TABLE IF NOT EXISTS user_memberships (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, plan_id INTEGER NOT NULL, start_date TEXT, end_date TEXT, bookings_used INTEGER DEFAULT 0, status TEXT DEFAULT 'active', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""",
        """CREATE TABLE IF NOT EXISTS waitlist (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, ground_id INTEGER NOT NULL, slot_date TEXT NOT NULL, preferred_time TEXT, status TEXT DEFAULT 'waiting', notified INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""",
        """CREATE TABLE IF NOT EXISTS invoices (id INTEGER PRIMARY KEY AUTOINCREMENT, booking_id TEXT NOT NULL, invoice_number TEXT UNIQUE, user_id INTEGER NOT NULL, ground_id INTEGER NOT NULL, subtotal REAL, tax_amount REAL DEFAULT 0, total REAL, gst_number TEXT, status TEXT DEFAULT 'generated', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""",
        """CREATE TABLE IF NOT EXISTS blog_posts (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, slug TEXT UNIQUE, content TEXT, author_id INTEGER, category TEXT DEFAULT 'general', tags TEXT, is_published INTEGER DEFAULT 0, views INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""",
        """CREATE TABLE IF NOT EXISTS marketing_campaigns (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT DEFAULT 'email', subject TEXT, content TEXT, target_audience TEXT DEFAULT 'all', sent_count INTEGER DEFAULT 0, status TEXT DEFAULT 'draft', scheduled_at TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""",
        """CREATE TABLE IF NOT EXISTS affiliates (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, affiliate_code TEXT UNIQUE, commission_rate REAL DEFAULT 5, total_earnings REAL DEFAULT 0, total_referrals INTEGER DEFAULT 0, payout_balance REAL DEFAULT 0, status TEXT DEFAULT 'active', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""",
        """CREATE TABLE IF NOT EXISTS push_notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, body TEXT, target TEXT DEFAULT 'all', target_id INTEGER, sent_count INTEGER DEFAULT 0, status TEXT DEFAULT 'sent', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""",
        """CREATE TABLE IF NOT EXISTS auto_replies (id INTEGER PRIMARY KEY AUTOINCREMENT, owner_id INTEGER NOT NULL, trigger_type TEXT DEFAULT 'booking_confirm', message TEXT NOT NULL, is_active INTEGER DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""",
    ]
    for sql in v13_tables:
        try:
            conn.execute(sql)
            conn.commit()
        except Exception:
            pass


    # V17 - New feature tables
    v17_tables = [
        """CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            entity_type TEXT,
            entity_id TEXT,
            details TEXT,
            ip_address TEXT,
            user_agent TEXT,
            location TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""",
        """CREATE TABLE IF NOT EXISTS equipment_rental (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ground_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            category TEXT DEFAULT 'cricket',
            price_per_hour REAL NOT NULL,
            quantity INTEGER DEFAULT 1,
            available INTEGER DEFAULT 1,
            description TEXT,
            image_url TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""",
        """CREATE TABLE IF NOT EXISTS equipment_bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id TEXT,
            equipment_id INTEGER NOT NULL,
            quantity INTEGER DEFAULT 1,
            total_price REAL NOT NULL,
            status TEXT DEFAULT 'confirmed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""",
        """CREATE TABLE IF NOT EXISTS loyalty_points (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            points INTEGER DEFAULT 0,
            total_earned INTEGER DEFAULT 0,
            total_redeemed INTEGER DEFAULT 0,
            tier TEXT DEFAULT 'bronze',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""",
        """CREATE TABLE IF NOT EXISTS loyalty_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            points INTEGER NOT NULL,
            type TEXT NOT NULL,
            description TEXT,
            reference_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""",
        """CREATE TABLE IF NOT EXISTS auto_settlements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id INTEGER NOT NULL,
            frequency TEXT DEFAULT 'weekly',
            next_settlement_date TEXT,
            last_settlement_date TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""",
        """CREATE TABLE IF NOT EXISTS email_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            subject TEXT NOT NULL,
            body TEXT NOT NULL,
            variables TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""",
        """CREATE TABLE IF NOT EXISTS pages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            meta_description TEXT,
            is_published INTEGER DEFAULT 1,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""",
    ]
    for sql in v17_tables:
        try:
            conn.execute(sql)
            conn.commit()
        except Exception:
            pass

    # V17 - New settings
    v17_settings = [
        ("google_analytics_id", "", "Google Analytics Measurement ID (G-XXXXXXX)"),
        ("google_adsense_id", "", "Google AdSense Publisher ID (ca-pub-XXXXX)"),
        ("firebase_api_key", "", "Firebase API Key for Push Notifications"),
        ("firebase_project_id", "", "Firebase Project ID"),
        ("firebase_messaging_sender_id", "", "Firebase Messaging Sender ID"),
        ("loyalty_points_per_booking", "10", "Points earned per booking"),
        ("loyalty_points_value", "1", "Value of 1 point in Rs"),
        ("loyalty_min_redeem", "100", "Minimum points to redeem"),
        ("auto_settlement_enabled", "0", "Enable auto settlement for owners"),
        ("auto_settlement_frequency", "weekly", "Auto settlement frequency (weekly/monthly)"),
        ("equipment_rental_enabled", "1", "Enable equipment rental feature"),
        ("ad_header_code", "", "Custom ad code for header"),
        ("ad_sidebar_code", "", "Custom ad code for sidebar"),
        ("ad_footer_code", "", "Custom ad code for footer"),
    ]
    for key, value, desc in v17_settings:
        try:
            conn.execute("INSERT OR IGNORE INTO settings (key, value, description) VALUES (?, ?, ?)", (key, value, desc))
            conn.commit()
        except Exception:
            pass

    # V17 - Default email templates
    default_templates = [
        ("booking_confirmation", "Booking Confirmed - {{booking_id}}", "<h2>Booking Confirmed!</h2><p>Dear {{customer_name}},</p><p>Your booking <b>{{booking_id}}</b> at <b>{{ground_name}}</b> on <b>{{date}}</b> from <b>{{time}}</b> has been confirmed.</p><p>Amount: Rs.{{amount}}</p><p>Thank you for choosing BookAGround!</p>", "customer_name,booking_id,ground_name,date,time,amount"),
        ("booking_cancellation", "Booking Cancelled - {{booking_id}}", "<h2>Booking Cancelled</h2><p>Dear {{customer_name}},</p><p>Your booking <b>{{booking_id}}</b> at <b>{{ground_name}}</b> has been cancelled.</p><p>Refund: Rs.{{refund_amount}} (credited to wallet)</p>", "customer_name,booking_id,ground_name,refund_amount"),
        ("welcome_email", "Welcome to BookAGround!", "<h2>Welcome {{name}}!</h2><p>Thank you for joining BookAGround - India\'s leading cricket ground booking platform.</p><p>Start exploring grounds near you and book your first session!</p>", "name"),
        ("payment_receipt", "Payment Receipt - Rs.{{amount}}", "<h2>Payment Receipt</h2><p>Dear {{customer_name}},</p><p>Payment of Rs.{{amount}} received for booking {{booking_id}}.</p><p>Gateway: {{gateway}}</p><p>Transaction ID: {{txn_id}}</p>", "customer_name,amount,booking_id,gateway,txn_id"),
        ("kyc_approved", "KYC Verified Successfully", "<h2>KYC Approved!</h2><p>Dear {{name}},</p><p>Your KYC documents have been verified successfully. You can now receive payouts.</p>", "name"),
        ("withdrawal_processed", "Withdrawal Processed - Rs.{{amount}}", "<h2>Withdrawal Processed</h2><p>Dear {{name}},</p><p>Your withdrawal of Rs.{{amount}} has been processed. Transaction ID: {{txn_id}}</p>", "name,amount,txn_id"),
    ]
    for name, subject, body, variables in default_templates:
        try:
            conn.execute("INSERT OR IGNORE INTO email_templates (name, subject, body, variables) VALUES (?, ?, ?, ?)", (name, subject, body, variables))
            conn.commit()
        except Exception:
            pass

    # V17 - Default pages
    default_pages = [
        ("privacy-policy", "Privacy Policy", "<h1>Privacy Policy</h1><p>Last updated: March 2026</p><h2>1. Information We Collect</h2><p>We collect personal information such as name, phone number, email address when you register on BookAGround.</p><h2>2. How We Use Your Information</h2><p>Your information is used to provide booking services, process payments, and improve our platform.</p><h2>3. Data Security</h2><p>We implement appropriate security measures to protect your personal information.</p><h2>4. Third Party Services</h2><p>We may use third-party payment gateways and analytics services.</p><h2>5. Contact Us</h2><p>For any privacy concerns, contact us at info@bookaground.com</p>", "BookAGround Privacy Policy - How we collect, use, and protect your data"),
        ("about-us", "About Us", "<h1>About BookAGround</h1><p>BookAGround is India\'s leading cricket ground booking platform that connects players with ground owners.</p><h2>Our Mission</h2><p>To make cricket ground booking easy, transparent, and accessible for everyone.</p><h2>What We Offer</h2><ul><li>Easy online ground booking</li><li>Multiple payment options</li><li>Ground owner dashboard</li><li>Team management</li><li>Tournament organization</li></ul><h2>Our Team</h2><p>We are a passionate team of cricket lovers and tech enthusiasts working to revolutionize how cricket is played in India.</p>", "About BookAGround - India leading cricket ground booking platform"),
        ("contact-us", "Contact Us", "<h1>Contact Us</h1><p>We would love to hear from you! Reach out to us through any of the following channels:</p><h2>Email</h2><p>info@bookaground.com</p><h2>Phone</h2><p>+91 9782005500</p><h2>Address</h2><p>Jaipur, Rajasthan, India</p><h2>Business Hours</h2><p>Monday - Saturday: 9:00 AM - 6:00 PM</p><p>Sunday: 10:00 AM - 2:00 PM</p>", "Contact BookAGround - Get in touch with us for support and inquiries"),
        ("terms", "Terms & Conditions", "<h1>Terms & Conditions</h1><p>Last updated: March 2026</p><h2>1. Acceptance of Terms</h2><p>By using BookAGround, you agree to these terms and conditions.</p><h2>2. Booking Policy</h2><p>All bookings are subject to availability. Cancellation charges may apply as per our cancellation policy.</p><h2>3. Payment Terms</h2><p>Payments are processed securely through our payment partners. Refunds are processed within 5-7 business days.</p><h2>4. User Responsibilities</h2><p>Users must provide accurate information and follow ground rules.</p><h2>5. Limitation of Liability</h2><p>BookAGround is not liable for any injuries or damages during ground usage.</p>", "BookAGround Terms and Conditions - Rules and policies for using our platform"),
        ("refund-policy", "Refund Policy", "<h1>Refund Policy</h1><p>Last updated: March 2026</p><h2>Cancellation & Refund</h2><p>Cancellation before 24 hours: Full refund to wallet</p><p>Cancellation within 24 hours: 50% refund</p><p>No-show: Token amount forfeited</p><h2>Processing Time</h2><p>Refunds are processed within 24 hours to your BookAGround wallet.</p>", "BookAGround Refund Policy - Cancellation and refund terms"),
    ]
    for slug, title, content, meta_desc in default_pages:
        try:
            conn.execute("INSERT OR IGNORE INTO pages (slug, title, content, meta_description) VALUES (?, ?, ?, ?)", (slug, title, content, meta_desc))
            conn.commit()
        except Exception:
            pass


    # Payout API settings (separate from payment collection)
    payout_settings = [
        ("auto_payout_enabled", "0", "Enable auto-payout for withdrawals (1=auto via API, 0=manual admin)"),
        ("payout_api_key", "", "Payout API Key (RazorpayX Key ID)"),
        ("payout_api_secret", "", "Payout API Secret (RazorpayX Key Secret)"),
        ("payout_account_number", "", "Payout Account Number (RazorpayX Account Number)"),
        ("withdrawal_charge_percent", "3", "Withdrawal charge percentage"),
    ]
    for key, value, desc in payout_settings:
        try:
            conn.execute("INSERT OR IGNORE INTO settings (key, value, description) VALUES (?, ?, ?)", (key, value, desc))
            conn.commit()
        except Exception:
            pass

    conn.close()
