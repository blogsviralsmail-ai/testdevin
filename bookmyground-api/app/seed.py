import random
import string
from datetime import datetime, timedelta, timezone
from app.database import get_db

IST = timezone(timedelta(hours=5, minutes=30))


def generate_ref_code():
    return "BMG" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


def generate_booking_id():
    return "BK" + "".join(random.choices(string.digits, k=8))


def seed_data():
    with get_db() as db:
        # Check if already seeded
        existing = db.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        if existing > 0:
            return

        # ---- SETTINGS ----
        settings = [
            ("cashback_amount", "100", "First booking cashback amount (INR)"),
            ("cashback_min_booking", "500", "Minimum booking amount for cashback eligibility"),
            ("cashback_max", "200", "Maximum cashback limit"),
            ("cashback_enabled", "1", "Enable/disable cashback"),
            ("standard_commission", "10", "Standard commission percentage"),
            ("offline_commission", "0", "Offline booking commission percentage"),
            ("token_percentage", "30", "Token advance payment percentage"),
            ("user_referral_reward", "50", "User referral reward amount"),
            ("referee_discount", "25", "Discount for referred new user"),
            ("owner_referral_bonus", "1000", "Ground owner referral bonus"),
            ("affiliate_commission", "5", "Affiliate commission percentage"),
            ("admin_cancel_charge", "0", "Admin cancellation charge"),
            ("owner_cancel_penalty", "500", "Owner cancellation penalty"),
            ("user_cancel_24h_charge", "5", "User cancel >24h charge percentage"),
            ("user_cancel_lt24h_charge", "25", "User cancel <24h charge percentage"),
        ]
        db.executemany("INSERT INTO settings (key, value, description) VALUES (?, ?, ?)", settings)

        # ---- PAYMENT GATEWAYS ----
        gateways = [
            ("razorpay", "Razorpay", 1, 1, 1),
            ("phonepe", "PhonePe", 1, 1, 2),
            ("paytm", "Paytm", 1, 1, 3),
            ("cashfree", "Cashfree", 0, 1, 4),
            ("stripe", "Stripe", 0, 1, 5),
            ("instamojo", "Instamojo", 0, 1, 6),
        ]
        db.executemany(
            "INSERT INTO payment_gateways (name, display_name, is_active, is_test_mode, priority) VALUES (?, ?, ?, ?, ?)",
            gateways,
        )

        # ---- ADMIN USER ----
        admin_ref = generate_ref_code()
        db.execute(
            "INSERT INTO users (name, phone, email, role, referral_code, city) VALUES (?, ?, ?, ?, ?, ?)",
            ("Admin", "9999999999", "admin@bookaground.com", "admin", admin_ref, "Jaipur"),
        )

        # ---- GROUND OWNERS ----
        owners = [
            ("Rajesh Kumar", "9876543210", "rajesh@example.com", "owner", "Jaipur"),
            ("Sunil Sharma", "9876543211", "sunil@example.com", "owner", "Jaipur"),
            ("Vikram Singh", "9876543212", "vikram@example.com", "owner", "Jaipur"),
            ("Mahesh Verma", "9876543213", "mahesh@example.com", "owner", "Jaipur"),
            ("Deepak Joshi", "9876543214", "deepak@example.com", "owner", "Jaipur"),
        ]
        for name, phone, email, role, city in owners:
            ref = generate_ref_code()
            db.execute(
                "INSERT INTO users (name, phone, email, role, referral_code, city) VALUES (?, ?, ?, ?, ?, ?)",
                (name, phone, email, role, ref, city),
            )

        # ---- REGULAR USERS ----
        users = [
            ("Amit Patel", "9898989898", "amit@example.com", "Jaipur"),
            ("Rohit Meena", "9898989899", "rohit@example.com", "Jaipur"),
            ("Karan Agarwal", "9898989800", "karan@example.com", "Jaipur"),
            ("Priya Singh", "9898989801", "priya@example.com", "Jaipur"),
            ("Vijay Rathore", "9898989802", "vijay@example.com", "Jaipur"),
        ]
        for name, phone, email, city in users:
            ref = generate_ref_code()
            db.execute(
                "INSERT INTO users (name, phone, email, role, referral_code, city, wallet_balance, rating, rating_count) VALUES (?, ?, ?, 'user', ?, ?, ?, ?, ?)",
                (name, phone, email, ref, city, random.randint(0, 500), round(random.uniform(3.5, 5.0), 1), random.randint(5, 30)),
            )

        # ---- GROUNDS (Jaipur - Multi-Sport) ----
        grounds_data = [
            # Cricket Grounds
            (2, "Champions Cricket Arena", "Malviya Nagar, Jaipur", "Jaipur", 26.8636, 75.8100, "cricket", "box",
             "Premium box cricket ground with international-standard turf, floodlights and full amenities. Perfect for evening matches.",
             "Floodlights,Parking,Washroom,Water,Changing Room,Canteen,WiFi,CCTV", 800, 1200, 200, 4.5, 128, 520),
            (3, "Royal Cricket Club", "C-Scheme, Jaipur", "Jaipur", 26.9124, 75.7873, "cricket", "open",
             "Open ground with natural turf, well-maintained pitch. Great for weekend cricket tournaments.",
             "Parking,Washroom,Water,Canteen,Scoreboard", 1500, 2000, 300, 4.2, 85, 340),
            (4, "Victory Sports Complex", "Vaishali Nagar, Jaipur", "Jaipur", 26.9154, 75.7390, "cricket", "box",
             "Multi-sport complex with dedicated box cricket area. Affordable rates for students.",
             "Floodlights,Parking,Washroom,Water,WiFi,CCTV,First Aid", 600, 900, 150, 4.7, 210, 890),
            (5, "Striker Box Cricket", "Mansarovar, Jaipur", "Jaipur", 26.8574, 75.7625, "cricket", "box",
             "Budget-friendly box cricket with well-maintained nets and good lighting.",
             "Floodlights,Parking,Washroom,Water", 500, 700, 100, 4.0, 65, 280),
            (6, "Pink City Cricket Ground", "Tonk Road, Jaipur", "Jaipur", 26.8467, 75.7999, "cricket", "turf",
             "Turf cricket ground with professional coaching facilities. Best for serious players.",
             "Floodlights,Parking,Washroom,Water,Changing Room,Canteen,WiFi,CCTV,Coaching", 1000, 1500, 250, 4.8, 156, 650),
            (2, "Rajesh Cricket Academy", "Jagatpura, Jaipur", "Jaipur", 26.8234, 75.8456, "cricket", "box",
             "Academy-level box cricket with professional coaching and net practice facilities.",
             "Floodlights,Parking,Washroom,Coaching,Nets,Equipment", 700, 1000, 200, 4.3, 92, 410),
            (3, "Jaipur Sports Hub", "Ajmer Road, Jaipur", "Jaipur", 26.8901, 75.7234, "cricket", "box",
             "Modern sports hub with multiple box cricket pitches. Group discounts available.",
             "Floodlights,Parking,Washroom,Water,WiFi,Multiple Pitches", 650, 950, 150, 4.1, 78, 320),
            (4, "Green Park Cricket", "Sitapura, Jaipur", "Jaipur", 26.7912, 75.8234, "cricket", "open",
             "Spacious open ground surrounded by greenery. Ideal for morning cricket sessions.",
             "Parking,Washroom,Water,Canteen,Garden", 900, 1300, 200, 4.4, 105, 450),
            # Football Grounds
            (5, "Jaipur Football Arena", "Vaishali Nagar, Jaipur", "Jaipur", 26.9160, 75.7400, "football", "turf",
             "Professional 5-a-side and 7-a-side football turf with FIFA-standard artificial grass. Floodlit for night games.",
             "Floodlights,Parking,Washroom,Water,Changing Room,First Aid", 1200, 1800, 300, 4.6, 95, 380),
            (6, "Kick Off Sports Club", "Mansarovar, Jaipur", "Jaipur", 26.8580, 75.7630, "football", "open",
             "Open football ground with natural grass and goal posts. Perfect for weekend football matches.",
             "Parking,Washroom,Water,Canteen", 800, 1200, 200, 4.3, 72, 290),
            # Swimming Pools
            (2, "Jaipur Aqua Center", "Malviya Nagar, Jaipur", "Jaipur", 26.8640, 75.8110, "swimming", "indoor",
             "Olympic-size indoor swimming pool with trained lifeguards. Coaching available for all age groups.",
             "Parking,Washroom,Changing Room,Locker,Shower,Coaching", 500, 700, 100, 4.7, 180, 720),
            (3, "Blue Wave Swimming Pool", "C-Scheme, Jaipur", "Jaipur", 26.9130, 75.7880, "swimming", "outdoor",
             "Beautiful outdoor pool with kids area. Clean water, regular maintenance. Morning and evening batches.",
             "Parking,Washroom,Changing Room,Locker,Shower,Canteen", 400, 600, 0, 4.4, 110, 450),
            # Tennis Courts
            (4, "Jaipur Tennis Academy", "Tonk Road, Jaipur", "Jaipur", 26.8470, 75.8000, "tennis", "hard_court",
             "Professional hard court tennis facility with coaching. AITA-affiliated academy with tournaments.",
             "Floodlights,Parking,Washroom,Coaching,Equipment,Pro Shop", 600, 900, 200, 4.5, 85, 340),
            # Table Tennis
            (5, "TT Zone Jaipur", "Vaishali Nagar, Jaipur", "Jaipur", 26.9155, 75.7395, "table_tennis", "indoor",
             "Air-conditioned indoor table tennis hall with 6 professional tables. Equipment provided.",
             "AC,Parking,Washroom,Equipment,Coaching,WiFi", 300, 400, 50, 4.6, 120, 480),
            # Badminton Courts
            (6, "Smash Badminton Arena", "Sitapura, Jaipur", "Jaipur", 26.7915, 75.8240, "badminton", "indoor",
             "Indoor badminton arena with 4 synthetic courts. BWF-approved flooring. Coaching available.",
             "AC,Floodlights,Parking,Washroom,Equipment,Coaching,Canteen", 500, 700, 100, 4.8, 150, 600),
            (2, "Pink City Badminton Club", "Raja Park, Jaipur", "Jaipur", 26.8900, 75.8100, "badminton", "indoor",
             "Well-maintained indoor courts with wooden flooring. Shuttle cocks available for rent.",
             "Floodlights,Parking,Washroom,Equipment,Water", 400, 600, 100, 4.3, 88, 350),
            # Basketball Courts
            (3, "Hoop Dreams Basketball Court", "Jagatpura, Jaipur", "Jaipur", 26.8240, 75.8460, "basketball", "outdoor",
             "Full-size outdoor basketball court with NBA-standard hoops. 3v3 and 5v5 games. Evening floodlights.",
             "Floodlights,Parking,Washroom,Water,Scoreboard", 600, 800, 150, 4.4, 65, 260),
            # Volleyball Courts
            (4, "Jaipur Volleyball Club", "Mansarovar, Jaipur", "Jaipur", 26.8575, 75.7620, "volleyball", "outdoor",
             "Sand and hard court volleyball facility. Net and ball provided. Great for weekend tournaments.",
             "Parking,Washroom,Water,Equipment,Canteen", 400, 600, 100, 4.2, 55, 220),
            # Kabaddi Grounds
            (5, "Rajasthan Kabaddi Arena", "Ajmer Road, Jaipur", "Jaipur", 26.8905, 75.7240, "kabaddi", "indoor",
             "Professional kabaddi mat with proper markings. Pro Kabaddi League standard facility. Coaching available.",
             "Floodlights,Parking,Washroom,Water,First Aid,Coaching", 500, 700, 100, 4.5, 70, 280),
        ]
        for g in grounds_data:
            db.execute(
                """INSERT INTO grounds (owner_id, name, address, city, latitude, longitude, sport_type, ground_type,
                description, amenities, weekday_price, weekend_price, evening_extra, rating, rating_count, total_bookings)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                g,
            )

        # ---- SLOTS (next 7 days for all grounds) ----
        total_grounds = db.execute("SELECT COUNT(*) FROM grounds").fetchone()[0]
        today = datetime.now(IST)
        for ground_id in range(1, total_grounds + 1):
            g = db.execute("SELECT weekday_price, weekend_price, evening_extra FROM grounds WHERE id=?", (ground_id,)).fetchone()
            for day_offset in range(7):
                date = today + timedelta(days=day_offset)
                date_str = date.strftime("%Y-%m-%d")
                is_weekend = date.weekday() >= 5
                base_price = g["weekend_price"] if is_weekend else g["weekday_price"]
                for hour in range(6, 23):
                    price = base_price
                    if hour >= 17:
                        price += g["evening_extra"]
                    status = "available"
                    if day_offset == 0 and hour < datetime.now(IST).hour + 1:
                        status = "booked" if random.random() < 0.7 else "available"
                    elif random.random() < 0.15:
                        status = "booked"
                    db.execute(
                        "INSERT INTO slots (ground_id, date, start_time, end_time, price, status) VALUES (?, ?, ?, ?, ?, ?)",
                        (ground_id, date_str, f"{hour:02d}:00", f"{hour+1:02d}:00", price, status),
                    )

        # ---- PROMO CODES ----
        promos = [
            ("CRICKET20", "percentage", 20, 500, 200, 100, 0, "2026-01-01", "2026-12-31", 1),
            ("WELCOME100", "flat", 100, 300, 100, 50, 0, "2026-01-01", "2026-12-31", 1),
            ("WEEKEND50", "flat", 50, 500, 50, 200, 0, "2026-01-01", "2026-12-31", 1),
            ("JAIPUR25", "percentage", 25, 400, 250, 150, 0, "2026-01-01", "2026-12-31", 1),
            ("SUPER500", "flat", 500, 2000, 500, 20, 0, "2026-03-01", "2026-04-30", 1),
        ]
        db.executemany(
            """INSERT INTO promo_codes (code, discount_type, discount_value, min_booking, max_discount,
            usage_limit, used_count, valid_from, valid_to, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            promos,
        )

        # ---- SAMPLE BOOKINGS ----
        for i in range(15):
            user_id = random.randint(7, 11)
            ground_id = random.randint(1, 8)
            day_offset = random.randint(-5, -1)
            date = today + timedelta(days=day_offset)
            date_str = date.strftime("%Y-%m-%d")
            hour = random.randint(6, 20)
            slot = db.execute(
                "SELECT id, price FROM slots WHERE ground_id=? AND date=? AND start_time=? LIMIT 1",
                (ground_id, date_str, f"{hour:02d}:00"),
            ).fetchone()
            if not slot:
                continue
            bid = generate_booking_id()
            total = slot["price"]
            token = total * 0.3
            status = random.choice(["completed", "completed", "completed", "cancelled"])
            db.execute(
                """INSERT INTO bookings (booking_id, user_id, ground_id, slot_id, booking_date, start_time, end_time,
                total_amount, token_amount, remaining_amount, payment_mode, payment_gateway, payment_status, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'online', 'razorpay', 'success', ?, ?)""",
                (bid, user_id, ground_id, slot["id"], date_str, f"{hour:02d}:00", f"{hour+1:02d}:00",
                 total, token, total - token, status, date.strftime("%Y-%m-%d %H:%M:%S")),
            )

        # ---- SAMPLE REVIEWS ----
        bookings = db.execute("SELECT id, user_id, ground_id FROM bookings WHERE status='completed'").fetchall()
        for b in bookings[:8]:
            db.execute(
                """INSERT INTO reviews (booking_id, reviewer_id, target_type, target_id, rating, review_text,
                ground_quality, facilities, staff, value_for_money)
                VALUES (?, ?, 'ground', ?, ?, ?, ?, ?, ?, ?)""",
                (b["id"], b["user_id"], b["ground_id"],
                 round(random.uniform(3.5, 5.0), 1),
                 random.choice(["Great ground!", "Excellent facilities", "Good pitch, nice lighting",
                                "Loved the experience", "Well maintained ground", "Best cricket ground in Jaipur"]),
                 round(random.uniform(3.5, 5.0), 1), round(random.uniform(3.5, 5.0), 1),
                 round(random.uniform(3.5, 5.0), 1), round(random.uniform(3.5, 5.0), 1)),
            )

        print("Database seeded successfully with Jaipur demo data!")
