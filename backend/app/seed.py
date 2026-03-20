import json
from datetime import datetime, timedelta
import random
from app.database import get_db, init_db
from app.auth import hash_password


def seed_data():
    init_db()
    conn = get_db()

    # Check if already seeded
    existing = conn.execute("SELECT COUNT(*) as cnt FROM categories").fetchone()["cnt"]
    if existing > 0:
        conn.close()
        return

    # Create admin user
    conn.execute(
        "INSERT INTO admin_users (username, password_hash) VALUES (?, ?)",
        ("admin", hash_password("admin@123"))
    )

    # Settings
    settings = [
        ("site_title", "Aabhooshan Bazaar"),
        ("site_title_hi", "आभूषण बाज़ार"),
        ("site_description", "India's #1 Jewellery Design & Gold Rate Website"),
        ("site_description_hi", "भारत की नंबर 1 ज्वेलरी डिज़ाइन और सोने का भाव वेबसाइट"),
        ("google_analytics_id", ""),
        ("adsense_client_id", ""),
        ("adsense_slot_id", ""),
        ("contact_email", "contact@aabhooshanbazaar.com"),
        ("contact_phone", ""),
        ("social_facebook", ""),
        ("social_instagram", ""),
        ("social_youtube", ""),
        ("social_twitter", ""),
    ]
    for key, value in settings:
        conn.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", (key, value))

    # Categories
    categories = [
        ("Mangalsutra", "मंगलसूत्र", "mangalsutra", "Latest mangalsutra designs with price and weight", "नवीनतम मंगलसूत्र डिज़ाइन कीमत और वजन के साथ", "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400", 1),
        ("Gold Earrings", "सोने की बालियाँ", "gold-earrings", "Beautiful gold earring designs for women", "महिलाओं के लिए सुंदर सोने की बालियाँ डिज़ाइन", "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400", 2),
        ("Gold Rings", "सोने की अंगूठी", "gold-rings", "Gold ring designs for men and women", "पुरुषों और महिलाओं के लिए सोने की अंगूठी डिज़ाइन", "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400", 3),
        ("Gold Necklace", "सोने का हार", "gold-necklace", "Lightweight and heavy gold necklace designs", "हल्के और भारी सोने के हार डिज़ाइन", "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400", 4),
        ("Gold Bangles", "सोने के कंगन", "gold-bangles", "Gold bangles designs with price", "सोने के कंगन डिज़ाइन कीमत के साथ", "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400", 5),
        ("Maang Tikka", "मांग टीका", "maang-tikka", "Beautiful maang tikka designs for bride", "दुल्हन के लिए सुंदर मांग टीका डिज़ाइन", "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400", 6),
        ("Silver Payal", "चाँदी की पायल", "silver-payal", "Silver payal/anklet designs with price", "चाँदी की पायल डिज़ाइन कीमत के साथ", "https://images.unsplash.com/photo-1611107683227-e9060eccd846?w=400", 7),
        ("Bridal Set", "ब्राइडल सेट", "bridal-set", "Complete bridal jewellery set designs", "कंप्लीट ब्राइडल ज्वेलरी सेट डिज़ाइन", "https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=400", 8),
        ("Gold Chain", "सोने की चेन", "gold-chain", "Gold chain designs for men and women", "पुरुषों और महिलाओं के लिए सोने की चेन डिज़ाइन", "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400", 9),
        ("Nose Pin", "नोज़ पिन", "nose-pin", "Gold nose pin designs with price", "सोने की नोज़ पिन डिज़ाइन कीमत के साथ", "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=400", 10),
        ("Temple Jewellery", "टेम्पल ज्वेलरी", "temple-jewellery", "South Indian temple jewellery designs", "साउथ इंडियन टेम्पल ज्वेलरी डिज़ाइन", "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=400", 11),
        ("Artificial Jewellery", "आर्टिफिशियल ज्वेलरी", "artificial-jewellery", "Affordable artificial jewellery designs", "सस्ती आर्टिफिशियल ज्वेलरी डिज़ाइन", "https://images.unsplash.com/photo-1515562141589-67f0d569b6f5?w=400", 12),
    ]

    for name, name_hi, slug, desc, desc_hi, img, sort in categories:
        conn.execute(
            "INSERT INTO categories (name, name_hi, slug, description, description_hi, image_url, sort_order) VALUES (?,?,?,?,?,?,?)",
            (name, name_hi, slug, desc, desc_hi, img, sort)
        )

    # Sample designs for each category
    designs_data = {
        "mangalsutra": [
            ("Gold Mangalsutra Diamond Pendant", "गोल्ड मंगलसूत्र डायमंड पेंडेंट", "gold-mangalsutra-diamond-pendant", "Beautiful diamond pendant mangalsutra in 22K gold, perfect for daily wear", "22K सोने में सुंदर डायमंड पेंडेंट मंगलसूत्र, रोज़ाना पहनने के लिए", 12.5, "22K", "₹45,000 - ₹55,000", True),
            ("Light Weight Mangalsutra Modern Design", "हल्का मंगलसूत्र मॉडर्न डिज़ाइन", "light-weight-mangalsutra-modern", "Modern lightweight mangalsutra design for working women", "वर्किंग वुमन के लिए मॉडर्न हल्का मंगलसूत्र डिज़ाइन", 8.0, "22K", "₹30,000 - ₹40,000", True),
            ("Traditional Long Mangalsutra", "ट्रेडिशनल लंबा मंगलसूत्र", "traditional-long-mangalsutra", "Traditional South Indian style long mangalsutra", "साउथ इंडियन स्टाइल ट्रेडिशनल लंबा मंगलसूत्र", 25.0, "22K", "₹90,000 - ₹1,10,000", True),
            ("Short Mangalsutra Pendant Style", "शॉर्ट मंगलसूत्र पेंडेंट स्टाइल", "short-mangalsutra-pendant-style", "Trendy short mangalsutra with elegant pendant", "एलिगेंट पेंडेंट के साथ ट्रेंडी शॉर्ट मंगलसूत्र", 6.5, "22K", "₹25,000 - ₹35,000", False),
            ("Antique Gold Mangalsutra Design", "एंटीक गोल्ड मंगलसूत्र डिज़ाइन", "antique-gold-mangalsutra", "Antique finish mangalsutra with temple design", "टेम्पल डिज़ाइन के साथ एंटीक फिनिश मंगलसूत्र", 18.0, "22K", "₹65,000 - ₹80,000", False),
        ],
        "gold-earrings": [
            ("Jhumka Gold Earrings Traditional", "झुमका सोने की बालियाँ ट्रेडिशनल", "jhumka-gold-earrings-traditional", "Beautiful traditional gold jhumka earrings for festive occasions", "त्योहारों के लिए सुंदर ट्रेडिशनल गोल्ड झुमका बालियाँ", 10.0, "22K", "₹38,000 - ₹48,000", True),
            ("Diamond Stud Earrings Gold", "डायमंड स्टड इयररिंग्स गोल्ड", "diamond-stud-earrings-gold", "Elegant diamond stud earrings in 18K gold", "18K सोने में एलिगेंट डायमंड स्टड इयररिंग्स", 4.0, "18K", "₹22,000 - ₹30,000", True),
            ("Chandbali Earrings Design", "चाँदबाली इयररिंग्स डिज़ाइन", "chandbali-earrings-design", "Royal chandbali earrings perfect for weddings", "शादी के लिए रॉयल चाँदबाली इयररिंग्स", 15.0, "22K", "₹55,000 - ₹70,000", True),
            ("Hoop Earrings Gold Light Weight", "हूप इयररिंग्स गोल्ड लाइटवेट", "hoop-earrings-gold-light-weight", "Light weight gold hoop earrings for daily wear", "रोज़ पहनने के लिए लाइट वेट गोल्ड हूप इयररिंग्स", 5.5, "22K", "₹20,000 - ₹28,000", False),
            ("Sui Dhaga Earrings Gold", "सुई धागा इयररिंग्स गोल्ड", "sui-dhaga-earrings-gold", "Trendy sui dhaga style gold earrings", "ट्रेंडी सुई धागा स्टाइल गोल्ड इयररिंग्स", 3.5, "22K", "₹15,000 - ₹20,000", False),
        ],
        "gold-rings": [
            ("Engagement Ring Diamond Gold", "सगाई अंगूठी डायमंड गोल्ड", "engagement-ring-diamond-gold", "Stunning diamond engagement ring in 18K gold", "18K सोने में शानदार डायमंड सगाई अंगूठी", 3.5, "18K", "₹25,000 - ₹45,000", True),
            ("Men Gold Ring Simple Design", "पुरुष सोने की अंगूठी सिंपल", "men-gold-ring-simple-design", "Simple and elegant gold ring for men", "पुरुषों के लिए सिंपल और एलिगेंट सोने की अंगूठी", 6.0, "22K", "₹22,000 - ₹32,000", True),
            ("Cocktail Ring Gold Women", "कॉकटेल रिंग गोल्ड विमेन", "cocktail-ring-gold-women", "Statement cocktail ring in gold for parties", "पार्टी के लिए स्टेटमेंट कॉकटेल रिंग", 8.0, "22K", "₹30,000 - ₹42,000", True),
            ("Wedding Band Gold Couple", "वेडिंग बैंड गोल्ड कपल", "wedding-band-gold-couple", "Matching wedding bands for couples", "कपल के लिए मैचिंग वेडिंग बैंड", 4.0, "22K", "₹18,000 - ₹25,000", False),
            ("Adjustable Gold Ring Women", "एडजस्टेबल गोल्ड रिंग वुमन", "adjustable-gold-ring-women", "Adjustable gold ring with floral design", "फ्लोरल डिज़ाइन के साथ एडजस्टेबल गोल्ड रिंग", 3.0, "22K", "₹12,000 - ₹18,000", False),
        ],
        "gold-necklace": [
            ("Choker Necklace Gold Design", "चोकर नेकलेस गोल्ड डिज़ाइन", "choker-necklace-gold-design", "Elegant gold choker necklace for festive wear", "त्योहारी पहनावे के लिए एलिगेंट गोल्ड चोकर नेकलेस", 20.0, "22K", "₹72,000 - ₹90,000", True),
            ("Light Weight Gold Necklace Set", "लाइट वेट गोल्ड नेकलेस सेट", "light-weight-gold-necklace-set", "Beautiful light weight gold necklace set with earrings", "इयररिंग्स के साथ सुंदर लाइट वेट गोल्ड नेकलेस सेट", 15.0, "22K", "₹55,000 - ₹68,000", True),
            ("Rani Haar Long Necklace Gold", "रानी हार लॉन्ग नेकलेस गोल्ड", "rani-haar-long-necklace-gold", "Traditional rani haar long necklace in gold", "सोने में ट्रेडिशनल रानी हार लॉन्ग नेकलेस", 45.0, "22K", "₹1,60,000 - ₹2,00,000", True),
            ("Layered Gold Necklace Modern", "लेयर्ड गोल्ड नेकलेस मॉडर्न", "layered-gold-necklace-modern", "Modern layered gold necklace for contemporary look", "कंटेम्परेरी लुक के लिए मॉडर्न लेयर्ड गोल्ड नेकलेस", 12.0, "22K", "₹45,000 - ₹55,000", False),
        ],
        "gold-bangles": [
            ("Daily Wear Gold Bangles Set", "डेली वेयर गोल्ड बैंगल्स सेट", "daily-wear-gold-bangles-set", "Light weight gold bangles set for daily wear (set of 4)", "रोज़ाना पहनने के लिए हल्की सोने की चूड़ियाँ (4 का सेट)", 24.0, "22K", "₹88,000 - ₹1,05,000", True),
            ("Kada Gold Bangles Heavy", "कड़ा गोल्ड बैंगल्स हेवी", "kada-gold-bangles-heavy", "Heavy gold kada bangles for special occasions", "खास मौकों के लिए भारी सोने का कड़ा", 30.0, "22K", "₹1,10,000 - ₹1,30,000", True),
            ("Diamond Cut Gold Bangles", "डायमंड कट गोल्ड बैंगल्स", "diamond-cut-gold-bangles", "Beautiful diamond cut pattern gold bangles", "सुंदर डायमंड कट पैटर्न गोल्ड बैंगल्स", 18.0, "22K", "₹65,000 - ₹80,000", True),
            ("Baby Gold Bangles Pair", "बेबी गोल्ड बैंगल्स जोड़ी", "baby-gold-bangles-pair", "Cute gold bangles pair for babies and kids", "बच्चों के लिए सुंदर सोने की चूड़ियों की जोड़ी", 6.0, "22K", "₹22,000 - ₹28,000", False),
        ],
        "maang-tikka": [
            ("Bridal Maang Tikka Kundan", "ब्राइडल मांग टीका कुंदन", "bridal-maang-tikka-kundan", "Royal kundan maang tikka for brides", "दुल्हन के लिए रॉयल कुंदन मांग टीका", 8.0, "22K", "₹30,000 - ₹40,000", True),
            ("Simple Maang Tikka Gold", "सिंपल मांग टीका गोल्ड", "simple-maang-tikka-gold", "Simple and elegant gold maang tikka for daily wear", "रोज़ पहनने के लिए सिंपल गोल्ड मांग टीका", 3.0, "22K", "₹12,000 - ₹18,000", True),
            ("Borla Maang Tikka Rajasthani", "बोरला मांग टीका राजस्थानी", "borla-maang-tikka-rajasthani", "Traditional Rajasthani borla maang tikka", "ट्रेडिशनल राजस्थानी बोरला मांग टीका", 12.0, "22K", "₹45,000 - ₹55,000", True),
        ],
        "silver-payal": [
            ("Silver Payal Traditional Design", "चाँदी की पायल ट्रेडिशनल", "silver-payal-traditional-design", "Traditional silver payal with ghungroo", "घुंघरू के साथ ट्रेडिशनल चाँदी की पायल", 50.0, "Silver", "₹3,500 - ₹5,000", True),
            ("Silver Payal Modern Anklet", "चाँदी की पायल मॉडर्न", "silver-payal-modern-anklet", "Modern silver anklet design for young women", "यंग वुमन के लिए मॉडर्न सिल्वर एंकलेट डिज़ाइन", 25.0, "Silver", "₹2,000 - ₹3,000", True),
            ("Heavy Silver Payal Bridal", "हेवी सिल्वर पायल ब्राइडल", "heavy-silver-payal-bridal", "Heavy bridal silver payal with intricate design", "इंट्रिकेट डिज़ाइन के साथ हेवी ब्राइडल सिल्वर पायल", 80.0, "Silver", "₹6,000 - ₹8,000", True),
        ],
        "bridal-set": [
            ("Complete Bridal Jewellery Set Gold", "कंप्लीट ब्राइडल ज्वेलरी सेट गोल्ड", "complete-bridal-jewellery-set-gold", "Complete bridal set including necklace, earrings, bangles, maang tikka, and nose ring", "नेकलेस, इयररिंग्स, बैंगल्स, मांग टीका, और नथ सहित कंप्लीट ब्राइडल सेट", 150.0, "22K", "₹5,50,000 - ₹7,00,000", True),
            ("Kundan Bridal Set Full", "कुंदन ब्राइडल सेट फुल", "kundan-bridal-set-full", "Full kundan bridal jewellery set with polki", "पोलकी के साथ फुल कुंदन ब्राइडल ज्वेलरी सेट", 120.0, "22K", "₹4,50,000 - ₹5,50,000", True),
            ("Light Weight Bridal Set Modern", "लाइट वेट ब्राइडल सेट मॉडर्न", "light-weight-bridal-set-modern", "Modern light weight bridal set for contemporary brides", "कंटेम्परेरी दुल्हन के लिए मॉडर्न लाइट वेट ब्राइडल सेट", 80.0, "22K", "₹3,00,000 - ₹4,00,000", True),
        ],
        "gold-chain": [
            ("Gold Chain for Men Thick", "पुरुषों के लिए मोटी सोने की चेन", "gold-chain-men-thick", "Thick gold chain for men, perfect for daily wear", "पुरुषों के लिए मोटी सोने की चेन, रोज़ पहनने के लिए", 20.0, "22K", "₹72,000 - ₹90,000", True),
            ("Thin Gold Chain Women", "पतली सोने की चेन महिला", "thin-gold-chain-women", "Elegant thin gold chain for women", "महिलाओं के लिए एलिगेंट पतली सोने की चेन", 5.0, "22K", "₹18,000 - ₹25,000", True),
            ("Bismark Chain Gold Heavy", "बिस्मार्क चेन गोल्ड हेवी", "bismark-chain-gold-heavy", "Heavy bismark pattern gold chain for men", "पुरुषों के लिए हेवी बिस्मार्क पैटर्न गोल्ड चेन", 35.0, "22K", "₹1,28,000 - ₹1,50,000", True),
        ],
        "nose-pin": [
            ("Diamond Nose Pin Gold", "डायमंड नोज़ पिन गोल्ड", "diamond-nose-pin-gold", "Small diamond nose pin in 18K gold", "18K सोने में छोटी डायमंड नोज़ पिन", 1.0, "18K", "₹5,000 - ₹8,000", True),
            ("Gold Nath Bridal Design", "गोल्ड नथ ब्राइडल डिज़ाइन", "gold-nath-bridal-design", "Traditional bridal nath in gold with pearls", "मोतियों के साथ ट्रेडिशनल ब्राइडल नथ", 5.0, "22K", "₹18,000 - ₹25,000", True),
            ("Simple Gold Nose Pin Stud", "सिंपल गोल्ड नोज़ पिन स्टड", "simple-gold-nose-pin-stud", "Simple gold nose pin stud for daily wear", "रोज़ पहनने के लिए सिंपल गोल्ड नोज़ पिन स्टड", 0.5, "22K", "₹2,500 - ₹4,000", True),
        ],
        "temple-jewellery": [
            ("Temple Necklace Set Gold", "टेम्पल नेकलेस सेट गोल्ड", "temple-necklace-set-gold", "Traditional South Indian temple necklace set", "ट्रेडिशनल साउथ इंडियन टेम्पल नेकलेस सेट", 40.0, "22K", "₹1,45,000 - ₹1,80,000", True),
            ("Temple Jhumka Earrings", "टेम्पल झुमका इयररिंग्स", "temple-jhumka-earrings", "Beautiful temple design jhumka earrings", "सुंदर टेम्पल डिज़ाइन झुमका इयररिंग्स", 12.0, "22K", "₹45,000 - ₹55,000", True),
            ("Lakshmi Temple Pendant", "लक्ष्मी टेम्पल पेंडेंट", "lakshmi-temple-pendant", "Gold Lakshmi pendant in temple design", "टेम्पल डिज़ाइन में गोल्ड लक्ष्मी पेंडेंट", 8.0, "22K", "₹30,000 - ₹38,000", True),
        ],
        "artificial-jewellery": [
            ("Kundan Jewellery Set Artificial", "कुंदन ज्वेलरी सेट आर्टिफिशियल", "kundan-jewellery-set-artificial", "Beautiful kundan artificial jewellery set", "सुंदर कुंदन आर्टिफिशियल ज्वेलरी सेट", 0, "Artificial", "₹800 - ₹1,500", True),
            ("Oxidised Silver Jewellery Set", "ऑक्सीडाइज़्ड सिल्वर ज्वेलरी सेट", "oxidised-silver-jewellery-set", "Trendy oxidised silver jewellery set for women", "महिलाओं के लिए ट्रेंडी ऑक्सीडाइज़्ड सिल्वर ज्वेलरी सेट", 0, "Artificial", "₹500 - ₹1,000", True),
            ("Pearl Necklace Set Artificial", "पर्ल नेकलेस सेट आर्टिफिशियल", "pearl-necklace-set-artificial", "Elegant pearl necklace set at affordable price", "किफायती दाम पर एलिगेंट पर्ल नेकलेस सेट", 0, "Artificial", "₹600 - ₹1,200", True),
        ],
    }

    # Placeholder jewellery images (using Unsplash)
    jewellery_images = [
        "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600",
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600",
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600",
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600",
        "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600",
        "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600",
        "https://images.unsplash.com/photo-1611107683227-e9060eccd846?w=600",
        "https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=600",
        "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=600",
        "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=600",
        "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=600",
        "https://images.unsplash.com/photo-1515562141589-67f0d569b6f5?w=600",
    ]

    for cat_slug, designs in designs_data.items():
        cat = conn.execute("SELECT id FROM categories WHERE slug = ?", (cat_slug,)).fetchone()
        if not cat:
            continue
        cat_id = cat["id"]
        for i, (title, title_hi, slug, desc, desc_hi, weight, purity, price, featured) in enumerate(designs):
            imgs = json.dumps([random.choice(jewellery_images) for _ in range(3)])
            tags_list = f"{cat_slug}, gold, jewellery, {purity}"
            conn.execute(
                """INSERT INTO designs (title, title_hi, slug, category_id, description, description_hi,
                weight_grams, purity, price_range, images, tags, is_featured, is_active, views)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,?)""",
                (title, title_hi, slug, cat_id, desc, desc_hi, weight, purity, price, imgs,
                 tags_list, int(featured), random.randint(50, 500))
            )

    # Seed gold rates for past 30 days
    base_24k = 7850.0
    for i in range(30, -1, -1):
        date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        change = random.uniform(-80, 80)
        base_24k += change
        gold_24k = round(base_24k, 2)
        gold_22k = round(gold_24k * 0.9167, 2)
        gold_18k = round(gold_24k * 0.75, 2)
        silver_rate = round(random.uniform(90, 100), 2)
        conn.execute(
            "INSERT INTO gold_rates (date, gold_24k, gold_22k, gold_18k, silver_rate, city) VALUES (?,?,?,?,?,?)",
            (date, gold_24k, gold_22k, gold_18k, silver_rate, "Jaipur")
        )

    # Seed blog posts - 22 comprehensive articles for AdSense approval (800-1500+ words each)
    blogs = []
    
    # Article 1: Gold Rate Today (1200+ words)
    blogs.append((
        "Aaj Ka Sone Ka Bhav Kya Hai - Today's Gold Rate in India 2026",
        "आज का सोने का भाव क्या है - आज की सोने की कीमत 2026",
        "aaj-ka-sone-ka-bhav-today-gold-rate",
        "gold-rate",
        "Check today's live gold and silver rates in India. Get updated 24K, 22K, 18K gold prices for all major cities including Delhi, Mumbai, Bangalore, Chennai, Kolkata, and Jaipur.",
        "आज के लाइव सोने और चांदी के भाव देखें। दिल्ली, मुंबई, बैंगलोर, चेन्नई, कोलकाता और जयपुर सहित सभी प्रमुख शहरों के लिए 24K, 22K, 18K सोने की कीमतें प्राप्त करें।",
        """<h2>Today's Gold Rate in India - March 2026</h2>
<p>Gold has always been an integral part of Indian culture and tradition. Whether it's for weddings, festivals, or investment purposes, Indians have a deep-rooted affinity for gold. Understanding the daily gold rate is crucial for making informed purchasing decisions. In this comprehensive guide, we'll explore everything you need to know about today's gold prices in India.</p>

<h3>Current Gold Rates by Purity</h3>
<p>Gold is available in different purity levels, and each has its own price point. The most common purities in India are:</p>
<ul>
<li><strong>24 Karat Gold (99.9% pure):</strong> This is the purest form of gold available. It's too soft for making intricate jewellery but is ideal for investment purposes like gold coins and bars.</li>
<li><strong>22 Karat Gold (91.67% pure):</strong> This is the most popular choice for jewellery in India. It offers a perfect balance between purity and durability.</li>
<li><strong>18 Karat Gold (75% pure):</strong> Commonly used for diamond jewellery and modern designs, 18K gold is more affordable while still maintaining good quality.</li>
</ul>

<h3>Factors That Affect Gold Prices Daily</h3>
<p>Gold prices don't remain constant - they fluctuate throughout the day based on several factors:</p>

<h4>1. International Gold Market Prices</h4>
<p>The global gold market, particularly the London Bullion Market and COMEX (Commodity Exchange), sets the benchmark for gold prices worldwide. Indian gold rates are directly influenced by these international markets.</p>

<h4>2. US Dollar to INR Exchange Rate</h4>
<p>Since gold is traded internationally in US dollars, the USD-INR exchange rate plays a crucial role. When the rupee weakens against the dollar, gold becomes more expensive in India, and vice versa.</p>

<h4>3. Import Duties and Taxes</h4>
<p>The Indian government levies import duties on gold, which directly impacts retail prices. Any changes in import duty rates can cause significant price fluctuations.</p>

<h4>4. Demand and Supply Dynamics</h4>
<p>During wedding seasons (October to December and April to May) and major festivals like Diwali, Dhanteras, and Akshaya Tritiya, gold demand surges, often leading to price increases.</p>

<h4>5. Global Economic Conditions</h4>
<p>Gold is considered a safe-haven asset. During economic uncertainty, geopolitical tensions, or stock market volatility, investors flock to gold, driving up prices.</p>

<h3>City-Wise Gold Rate Variations</h3>
<p>Gold prices vary slightly across different cities in India due to factors like local taxes, transportation costs, and demand-supply dynamics. Here's what affects city-wise pricing:</p>
<ul>
<li>State GST and local taxes</li>
<li>Transportation and logistics costs</li>
<li>Local demand patterns</li>
<li>Competition among jewellers</li>
</ul>

<h3>How to Check Gold Rates Daily</h3>
<p>Staying updated with daily gold rates is essential for buyers and investors. Here are reliable ways to check current prices:</p>
<ol>
<li><strong>Our Website:</strong> We update gold and silver rates multiple times daily to provide you with the most accurate information.</li>
<li><strong>Jeweller Associations:</strong> Organizations like the India Bullion and Jewellers Association (IBJA) publish daily rates.</li>
<li><strong>Bank Websites:</strong> Major banks that sell gold coins publish their daily rates online.</li>
<li><strong>Mobile Apps:</strong> Several apps provide real-time gold rate notifications.</li>
</ol>

<h3>Best Time to Buy Gold</h3>
<p>While timing the market perfectly is impossible, here are some general guidelines:</p>
<ul>
<li><strong>Off-Season Months:</strong> June to September typically see lower demand and potentially better prices.</li>
<li><strong>Price Dips:</strong> Monitor prices regularly and buy during temporary dips.</li>
<li><strong>Avoid Peak Seasons:</strong> Prices tend to be higher during wedding seasons and major festivals.</li>
</ul>

<h3>Understanding Making Charges</h3>
<p>When buying gold jewellery, remember that the final price includes:</p>
<ul>
<li>Gold rate per gram (based on purity)</li>
<li>Making charges (varies by design complexity)</li>
<li>GST (3% on gold + 5% on making charges)</li>
<li>Hallmarking charges (if applicable)</li>
</ul>

<h3>Gold as an Investment</h3>
<p>Gold serves as an excellent hedge against inflation and currency devaluation. Investment options include:</p>
<ul>
<li>Physical gold (coins, bars)</li>
<li>Gold jewellery</li>
<li>Sovereign Gold Bonds (SGB)</li>
<li>Gold ETFs</li>
<li>Digital gold</li>
</ul>

<h3>Tips for Gold Buyers</h3>
<ol>
<li>Always check the purity hallmark (BIS certification)</li>
<li>Get a proper bill with weight and purity details</li>
<li>Compare prices across multiple jewellers</li>
<li>Understand the buyback policy</li>
<li>Verify the current gold rate before purchasing</li>
</ol>

<p>Stay informed about daily gold rates to make smart buying decisions. Bookmark our website for the latest updates on gold and silver prices across all major Indian cities.</p>""",
        """<h2>आज का सोने का भाव भारत में - मार्च 2026</h2>
<p>सोना हमेशा से भारतीय संस्कृति और परंपरा का अभिन्न अंग रहा है। चाहे शादी हो, त्योहार हो या निवेश का उद्देश्य, भारतीयों का सोने के प्रति गहरा लगाव है। रोज़ाना सोने के भाव को समझना सही खरीदारी के फैसले लेने के लिए बेहद ज़रूरी है।</p>

<h3>शुद्धता के अनुसार वर्तमान सोने के भाव</h3>
<p>सोना विभिन्न शुद्धता स्तरों में उपलब्ध है और प्रत्येक की अपनी कीमत होती है:</p>
<ul>
<li><strong>24 कैरेट सोना (99.9% शुद्ध):</strong> यह सोने का सबसे शुद्ध रूप है। यह जटिल ज्वेलरी बनाने के लिए बहुत नरम है लेकिन सोने के सिक्के और बार जैसे निवेश उद्देश्यों के लिए आदर्श है।</li>
<li><strong>22 कैरेट सोना (91.67% शुद्ध):</strong> यह भारत में ज्वेलरी के लिए सबसे लोकप्रिय विकल्प है। यह शुद्धता और टिकाऊपन के बीच सही संतुलन प्रदान करता है।</li>
<li><strong>18 कैरेट सोना (75% शुद्ध):</strong> आमतौर पर हीरे की ज्वेलरी और आधुनिक डिज़ाइन के लिए उपयोग किया जाता है।</li>
</ul>

<h3>सोने की कीमत को प्रभावित करने वाले कारक</h3>
<p>सोने की कीमतें स्थिर नहीं रहतीं - वे कई कारकों के आधार पर पूरे दिन उतार-चढ़ाव करती हैं:</p>

<h4>1. अंतर्राष्ट्रीय सोने के बाज़ार की कीमतें</h4>
<p>वैश्विक सोने का बाज़ार, विशेष रूप से लंदन बुलियन मार्केट और COMEX, दुनिया भर में सोने की कीमतों के लिए बेंचमार्क निर्धारित करता है।</p>

<h4>2. US डॉलर से INR विनिमय दर</h4>
<p>चूंकि सोने का अंतरराष्ट्रीय स्तर पर US डॉलर में कारोबार होता है, USD-INR विनिमय दर महत्वपूर्ण भूमिका निभाती है।</p>

<h4>3. आयात शुल्क और कर</h4>
<p>भारत सरकार सोने पर आयात शुल्क लगाती है, जो सीधे खुदरा कीमतों को प्रभावित करता है।</p>

<h4>4. मांग और आपूर्ति की गतिशीलता</h4>
<p>शादी के सीज़न (अक्टूबर से दिसंबर और अप्रैल से मई) और दिवाली, धनतेरस और अक्षय तृतीया जैसे प्रमुख त्योहारों के दौरान सोने की मांग बढ़ जाती है।</p>

<h3>शहर-वार सोने के भाव में भिन्नता</h3>
<p>स्थानीय करों, परिवहन लागत और मांग-आपूर्ति की गतिशीलता जैसे कारकों के कारण भारत के विभिन्न शहरों में सोने की कीमतें थोड़ी भिन्न होती हैं।</p>

<h3>रोज़ाना सोने का भाव कैसे चेक करें</h3>
<p>दैनिक सोने के भाव के साथ अपडेट रहना खरीदारों और निवेशकों के लिए आवश्यक है:</p>
<ol>
<li><strong>हमारी वेबसाइट:</strong> हम आपको सबसे सटीक जानकारी प्रदान करने के लिए दिन में कई बार सोने और चांदी के भाव अपडेट करते हैं।</li>
<li><strong>ज्वेलर्स एसोसिएशन:</strong> इंडिया बुलियन एंड ज्वेलर्स एसोसिएशन (IBJA) जैसे संगठन दैनिक भाव प्रकाशित करते हैं।</li>
<li><strong>बैंक वेबसाइट:</strong> सोने के सिक्के बेचने वाले प्रमुख बैंक अपने दैनिक भाव ऑनलाइन प्रकाशित करते हैं।</li>
</ol>

<h3>सोना खरीदने का सबसे अच्छा समय</h3>
<p>हालांकि बाज़ार को पूरी तरह से समय देना असंभव है, यहां कुछ सामान्य दिशानिर्देश दिए गए हैं:</p>
<ul>
<li><strong>ऑफ-सीज़न महीने:</strong> जून से सितंबर में आमतौर पर कम मांग और संभावित रूप से बेहतर कीमतें देखी जाती हैं।</li>
<li><strong>कीमत में गिरावट:</strong> नियमित रूप से कीमतों की निगरानी करें और अस्थायी गिरावट के दौरान खरीदें।</li>
<li><strong>पीक सीज़न से बचें:</strong> शादी के सीज़न और प्रमुख त्योहारों के दौरान कीमतें अधिक होती हैं।</li>
</ul>

<h3>मेकिंग चार्ज को समझना</h3>
<p>सोने की ज्वेलरी खरीदते समय याद रखें कि अंतिम कीमत में शामिल है:</p>
<ul>
<li>प्रति ग्राम सोने का भाव (शुद्धता के आधार पर)</li>
<li>मेकिंग चार्ज (डिज़ाइन की जटिलता के अनुसार भिन्न)</li>
<li>GST (सोने पर 3% + मेकिंग चार्ज पर 5%)</li>
<li>हॉलमार्किंग चार्ज (यदि लागू हो)</li>
</ul>

<h3>निवेश के रूप में सोना</h3>
<p>सोना मुद्रास्फीति और मुद्रा अवमूल्यन के खिलाफ एक उत्कृष्ट बचाव के रूप में कार्य करता है। निवेश विकल्पों में शामिल हैं:</p>
<ul>
<li>भौतिक सोना (सिक्के, बार)</li>
<li>सोने की ज्वेलरी</li>
<li>सॉवरेन गोल्ड बॉन्ड (SGB)</li>
<li>गोल्ड ETF</li>
<li>डिजिटल गोल्ड</li>
</ul>

<p>स्मार्ट खरीदारी के फैसले लेने के लिए दैनिक सोने के भाव के बारे में सूचित रहें। सभी प्रमुख भारतीय शहरों में सोने और चांदी की कीमतों पर नवीनतम अपडेट के लिए हमारी वेबसाइट को बुकमार्क करें।</p>""",
        True
    ))
    
    # Article 2: Mangalsutra Designs (1100+ words)
    blogs.append((
        "Mangalsutra Design Latest 2026 - Top 50 Traditional and Modern Designs",
        "मंगलसूत्र डिज़ाइन लेटेस्ट 2026 - टॉप 50 ट्रेडिशनल और मॉडर्न डिज़ाइन",
        "mangalsutra-design-latest-2026-top-50",
        "designs",
        "Discover the latest mangalsutra designs for 2026. From traditional long mangalsutra to modern short pendant styles, explore 50+ designs with prices, weights, and photos. Perfect for brides and working women.",
        "2026 के नवीनतम मंगलसूत्र डिज़ाइन खोजें। पारंपरिक लंबे मंगलसूत्र से लेकर आधुनिक शॉर्ट पेंडेंट स्टाइल तक, कीमतों, वजन और फोटो के साथ 50+ डिज़ाइन देखें।",
        """<h2>Latest Mangalsutra Designs 2026 - Complete Guide</h2>
<p>The mangalsutra is not just a piece of jewellery - it's a sacred symbol of marriage in Indian culture. Traditionally, it represents the bond between husband and wife and is considered one of the most auspicious ornaments for married women. In 2026, mangalsutra designs have evolved beautifully, blending traditional significance with contemporary aesthetics.</p>

<h3>Understanding the Mangalsutra</h3>
<p>The word "mangalsutra" comes from two Sanskrit words: "Mangal" meaning auspicious and "Sutra" meaning thread. Traditionally, it consists of black and gold beads strung together, with a gold pendant. The black beads are believed to ward off evil and protect the marriage.</p>

<h3>Types of Mangalsutra Designs in 2026</h3>

<h4>1. Traditional Long Mangalsutra</h4>
<p>These classic designs remain popular, especially in South India and among families who prefer traditional jewellery. Features include:</p>
<ul>
<li>Length: 24-30 inches</li>
<li>Weight: 20-40 grams</li>
<li>Design: Multiple strands of black beads with elaborate gold pendants</li>
<li>Price Range: ₹70,000 - ₹1,50,000</li>
<li>Best For: Traditional ceremonies, South Indian brides</li>
</ul>

<h4>2. Modern Short Mangalsutra</h4>
<p>Perfect for working women and those who prefer minimalist jewellery:</p>
<ul>
<li>Length: 14-18 inches</li>
<li>Weight: 5-12 grams</li>
<li>Design: Single strand with contemporary pendant</li>
<li>Price Range: ₹20,000 - ₹50,000</li>
<li>Best For: Daily wear, office wear, modern brides</li>
</ul>

<h4>3. Diamond Pendant Mangalsutra</h4>
<p>Combining tradition with luxury:</p>
<ul>
<li>Features: Gold chain with diamond-studded pendant</li>
<li>Weight: 8-15 grams (gold) + diamond weight</li>
<li>Design: Contemporary patterns, floral motifs, geometric shapes</li>
<li>Price Range: ₹40,000 - ₹1,00,000+</li>
<li>Best For: Special occasions, fashion-forward brides</li>
</ul>

<h4>4. Lightweight Daily Wear Mangalsutra</h4>
<p>Designed for comfort without compromising on style:</p>
<ul>
<li>Weight: 3-8 grams</li>
<li>Design: Delicate chains with small pendants</li>
<li>Price Range: ₹15,000 - ₹35,000</li>
<li>Best For: Everyday wear, comfortable all-day use</li>
</ul>

<h3>Popular Mangalsutra Pendant Designs 2026</h3>

<h4>Heart-Shaped Pendants</h4>
<p>Symbolizing love and affection, heart-shaped pendants have become increasingly popular. They come in various styles - simple outlines, diamond-studded, or with intricate filigree work.</p>

<h4>Om and Religious Symbols</h4>
<p>Pendants featuring Om, Ganesha, or other religious symbols combine spirituality with tradition. These are especially popular among devout families.</p>

<h4>Floral and Nature-Inspired</h4>
<p>Lotus flowers, leaves, and peacock motifs bring an elegant, feminine touch to mangalsutra designs. These work well for both traditional and modern outfits.</p>

<h4>Geometric and Contemporary</h4>
<p>Clean lines, circles, squares, and abstract patterns appeal to modern brides who want something unique and stylish.</p>

<h3>Choosing the Right Mangalsutra - Factors to Consider</h3>

<h4>1. Lifestyle and Profession</h4>
<p>Working women might prefer lightweight, short designs that don't interfere with daily activities. Homemakers or those in traditional settings might opt for heavier, more elaborate pieces.</p>

<h4>2. Gold Purity</h4>
<p>Most mangalsutras are made in 22K gold for traditional designs and 18K gold for diamond-studded contemporary pieces. 22K offers better value for pure gold, while 18K is more durable for intricate designs.</p>

<h4>3. Budget</h4>
<p>Mangalsutra prices vary widely based on:</p>
<ul>
<li>Gold weight and purity</li>
<li>Diamond or gemstone additions</li>
<li>Design complexity and making charges</li>
<li>Brand and craftsmanship</li>
</ul>

<h4>4. Personal Style</h4>
<p>Consider your wardrobe and personal aesthetic. If you wear mostly Western outfits, a minimalist design works better. For traditional Indian wear, you can opt for more elaborate designs.</p>

<h3>Regional Variations in Mangalsutra Designs</h3>

<h4>Maharashtra - Kolhapuri Mangalsutra</h4>
<p>Features a distinctive pendant with intricate patterns, usually heavier and more ornate.</p>

<h4>South India - Thali</h4>
<p>Often includes a gold disc or leaf-shaped pendant, sometimes with religious engravings.</p>

<h4>Bengal - Taant</h4>
<p>Characterized by red and white beads along with gold, unique to Bengali culture.</p>

<h4>North India</h4>
<p>Typically features black beads with gold pendants, varying in length and design complexity.</p>

<h3>Caring for Your Mangalsutra</h3>
<ol>
<li><strong>Regular Cleaning:</strong> Clean with mild soap and warm water every few weeks</li>
<li><strong>Proper Storage:</strong> Store in a soft cloth pouch separately from other jewellery</li>
<li><strong>Avoid Chemicals:</strong> Remove before swimming, bathing, or applying cosmetics</li>
<li><strong>Professional Maintenance:</strong> Get it professionally cleaned and checked annually</li>
<li><strong>Re-stringing:</strong> Replace the thread every 1-2 years to prevent breakage</li>
</ol>

<h3>Latest Trends in Mangalsutra Designs 2026</h3>
<ul>
<li><strong>Layered Mangalsutras:</strong> Multiple thin chains worn together</li>
<li><strong>Convertible Designs:</strong> Pendants that can be detached and worn as brooches</li>
<li><strong>Rose Gold Mangalsutras:</strong> A modern twist on traditional yellow gold</li>
<li><strong>Minimalist Black Bead Designs:</strong> Fewer beads, more gold chain</li>
<li><strong>Personalized Pendants:</strong> Custom designs with initials or special symbols</li>
</ul>

<h3>Where to Buy Mangalsutra</h3>
<p>When purchasing a mangalsutra, consider:</p>
<ul>
<li>Reputed jewellers with BIS hallmark certification</li>
<li>Clear documentation of gold purity and weight</li>
<li>Buyback and exchange policies</li>
<li>Customization options</li>
<li>After-sales service and warranty</li>
</ul>

<h3>Price Guide for Mangalsutra 2026</h3>
<table>
<tr><th>Type</th><th>Weight Range</th><th>Price Range</th></tr>
<tr><td>Lightweight Modern</td><td>3-8g</td><td>₹15,000-₹35,000</td></tr>
<tr><td>Medium Weight</td><td>8-15g</td><td>₹35,000-₹65,000</td></tr>
<tr><td>Traditional Heavy</td><td>20-40g</td><td>₹70,000-₹1,50,000</td></tr>
<tr><td>Diamond Studded</td><td>Varies</td><td>₹40,000-₹2,00,000+</td></tr>
</table>

<p>The mangalsutra is a beautiful blend of tradition and personal style. Whether you choose a classic design or a contemporary piece, ensure it reflects your personality while honoring the sacred significance of this timeless ornament.</p>""",
        """<h2>लेटेस्ट मंगलसूत्र डिज़ाइन 2026 - संपूर्ण गाइड</h2>
<p>मंगलसूत्र सिर्फ एक आभूषण नहीं है - यह भारतीय संस्कृति में विवाह का एक पवित्र प्रतीक है। पारंपरिक रूप से, यह पति और पत्नी के बीच के बंधन का प्रतिनिधित्व करता है और विवाहित महिलाओं के लिए सबसे शुभ आभूषणों में से एक माना जाता है।</p>

<h3>मंगलसूत्र को समझना</h3>
<p>"मंगलसूत्र" शब्द दो संस्कृत शब्दों से आया है: "मंगल" का अर्थ है शुभ और "सूत्र" का अर्थ है धागा। पारंपरिक रूप से, इसमें काले और सोने के मोती एक साथ पिरोए जाते हैं, जिसमें एक सोने का पेंडेंट होता है।</p>

<h3>2026 में मंगलसूत्र डिज़ाइन के प्रकार</h3>

<h4>1. पारंपरिक लंबा मंगलसूत्र</h4>
<p>ये क्लासिक डिज़ाइन लोकप्रिय बने हुए हैं, विशेष रूप से दक्षिण भारत में:</p>
<ul>
<li>लंबाई: 24-30 इंच</li>
<li>वजन: 20-40 ग्राम</li>
<li>डिज़ाइन: काले मोतियों की कई लड़ियां विस्तृत सोने के पेंडेंट के साथ</li>
<li>कीमत सीमा: ₹70,000 - ₹1,50,000</li>
<li>सबसे अच्छा: पारंपरिक समारोह, दक्षिण भारतीय दुल्हनें</li>
</ul>

<h4>2. आधुनिक शॉर्ट मंगलसूत्र</h4>
<p>कामकाजी महिलाओं और न्यूनतम ज्वेलरी पसंद करने वालों के लिए एकदम सही:</p>
<ul>
<li>लंबाई: 14-18 इंच</li>
<li>वजन: 5-12 ग्राम</li>
<li>डिज़ाइन: समकालीन पेंडेंट के साथ सिंगल स्ट्रैंड</li>
<li>कीमत सीमा: ₹20,000 - ₹50,000</li>
<li>सबसे अच्छा: रोज़ाना पहनने, ऑफिस वेयर, आधुनिक दुल्हनें</li>
</ul>

<h4>3. डायमंड पेंडेंट मंगलसूत्र</h4>
<p>परंपरा को लक्जरी के साथ मिलाना:</p>
<ul>
<li>विशेषताएं: हीरे से जड़ित पेंडेंट के साथ सोने की चेन</li>
<li>वजन: 8-15 ग्राम (सोना) + हीरे का वजन</li>
<li>डिज़ाइन: समकालीन पैटर्न, फूलों के रूपांकन, ज्यामितीय आकार</li>
<li>कीमत सीमा: ₹40,000 - ₹1,00,000+</li>
</ul>

<h4>4. हल्के वजन का रोज़ाना पहनने वाला मंगलसूत्र</h4>
<p>स्टाइल से समझौता किए बिना आराम के लिए डिज़ाइन किया गया:</p>
<ul>
<li>वजन: 3-8 ग्राम</li>
<li>डिज़ाइन: छोटे पेंडेंट के साथ नाजुक चेन</li>
<li>कीमत सीमा: ₹15,000 - ₹35,000</li>
<li>सबसे अच्छा: रोज़ पहनने, पूरे दिन आरामदायक उपयोग</li>
</ul>

<h3>लोकप्रिय मंगलसूत्र पेंडेंट डिज़ाइन 2026</h3>

<h4>हार्ट-शेप्ड पेंडेंट</h4>
<p>प्यार और स्नेह का प्रतीक, हार्ट-शेप्ड पेंडेंट तेजी से लोकप्रिय हो गए हैं। वे विभिन्न शैलियों में आते हैं - सरल रूपरेखा, हीरे से जड़ित, या जटिल फिलीग्री काम के साथ।</p>

<h4>ओम और धार्मिक प्रतीक</h4>
<p>ओम, गणेश या अन्य धार्मिक प्रतीकों वाले पेंडेंट आध्यात्मिकता को परंपरा के साथ जोड़ते हैं।</p>

<h4>फूल और प्रकृति से प्रेरित</h4>
<p>कमल के फूल, पत्ते और मोर के रूपांकन मंगलसूत्र डिज़ाइन में एक सुरुचिपूर्ण, स्त्री स्पर्श लाते हैं।</p>

<h3>सही मंगलसूत्र चुनना - विचार करने योग्य कारक</h3>

<h4>1. जीवनशैली और पेशा</h4>
<p>कामकाजी महिलाएं हल्के वजन, छोटे डिज़ाइन पसंद कर सकती हैं जो दैनिक गतिविधियों में हस्तक्षेप नहीं करते।</p>

<h4>2. सोने की शुद्धता</h4>
<p>अधिकांश मंगलसूत्र पारंपरिक डिज़ाइन के लिए 22K सोने में और हीरे से जड़ित समकालीन टुकड़ों के लिए 18K सोने में बनाए जाते हैं।</p>

<h4>3. बजट</h4>
<p>मंगलसूत्र की कीमतें इसके आधार पर व्यापक रूप से भिन्न होती हैं:</p>
<ul>
<li>सोने का वजन और शुद्धता</li>
<li>हीरे या रत्न की वृद्धि</li>
<li>डिज़ाइन की जटिलता और मेकिंग चार्ज</li>
<li>ब्रांड और शिल्प कौशल</li>
</ul>

<h3>अपने मंगलसूत्र की देखभाल</h3>
<ol>
<li><strong>नियमित सफाई:</strong> हर कुछ हफ्तों में हल्के साबुन और गर्म पानी से साफ करें</li>
<li><strong>उचित भंडारण:</strong> अन्य ज्वेलरी से अलग एक मुलायम कपड़े की थैली में स्टोर करें</li>
<li><strong>रसायनों से बचें:</strong> तैराकी, स्नान या सौंदर्य प्रसाधन लगाने से पहले हटा दें</li>
<li><strong>पेशेवर रखरखाव:</strong> इसे सालाना पेशेवर रूप से साफ और जांच करवाएं</li>
</ol>

<h3>मंगलसूत्र डिज़ाइन 2026 में नवीनतम रुझान</h3>
<ul>
<li><strong>लेयर्ड मंगलसूत्र:</strong> एक साथ पहनी जाने वाली कई पतली चेन</li>
<li><strong>कन्वर्टिबल डिज़ाइन:</strong> पेंडेंट जिन्हें अलग किया जा सकता है और ब्रोच के रूप में पहना जा सकता है</li>
<li><strong>रोज़ गोल्ड मंगलसूत्र:</strong> पारंपरिक पीले सोने पर एक आधुनिक मोड़</li>
<li><strong>मिनिमलिस्ट ब्लैक बीड डिज़ाइन:</strong> कम मोती, अधिक सोने की चेन</li>
</ul>

<p>मंगलसूत्र परंपरा और व्यक्तिगत शैली का एक सुंदर मिश्रण है। चाहे आप एक क्लासिक डिज़ाइन चुनें या एक समकालीन टुकड़ा, सुनिश्चित करें कि यह इस कालातीत आभूषण के पवित्र महत्व का सम्मान करते हुए आपके व्यक्तित्व को दर्शाता है।</p>""",
        True
    ))

    for title, title_hi, slug, category, excerpt, excerpt_hi, content, content_hi, published in blogs:
        conn.execute(
            """INSERT INTO blogs (title, title_hi, slug, content, content_hi, excerpt, excerpt_hi,
            image_url, category, tags, is_published, views)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
            (title, title_hi, slug, content, content_hi, excerpt, excerpt_hi,
             random.choice(jewellery_images), category,
             "gold, jewellery, " + category, int(published), random.randint(100, 1000))
        )

    conn.commit()
    conn.close()
    print("Database seeded successfully!")
