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
        conn.execute("INSERT INTO settings (key, value) VALUES (?, ?)", (key, value))

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

    # Seed blog posts
    blogs = [
        ("Aaj Ka Sone Ka Bhav Kya Hai - Gold Rate Today", "आज का सोने का भाव क्या है - Gold Rate Today",
         "aaj-ka-sone-ka-bhav", "gold-rate",
         "Check today's gold rate in India. We provide daily updated 22K and 24K gold prices for all major cities.",
         "आज के सोने का भाव देखें। हम रोज़ाना सभी प्रमुख शहरों के लिए 22K और 24K सोने की कीमतें अपडेट करते हैं।",
         """<h2>Today's Gold Rate in India</h2>
<p>Gold prices in India fluctuate daily based on international market conditions, currency exchange rates, and domestic demand. Here we provide you with the most accurate and updated gold rates.</p>
<h3>Factors Affecting Gold Price</h3>
<ul><li>International gold market prices</li><li>USD to INR exchange rate</li><li>Domestic demand and supply</li><li>Government import duties</li><li>Festival and wedding season demand</li></ul>
<h3>How to Check Gold Rate Daily</h3>
<p>Visit our website daily to get updated gold and silver rates for your city. We update prices multiple times a day to give you the most accurate information.</p>""",
         """<h2>आज का सोने का भाव भारत में</h2>
<p>भारत में सोने की कीमतें अंतरराष्ट्रीय बाज़ार की स्थिति, मुद्रा विनिमय दरों और घरेलू मांग के आधार पर रोज़ाना बदलती हैं। यहाँ हम आपको सबसे सटीक और अपडेटेड सोने का भाव देते हैं।</p>
<h3>सोने की कीमत को प्रभावित करने वाले कारक</h3>
<ul><li>अंतरराष्ट्रीय सोने के बाज़ार की कीमतें</li><li>USD से INR विनिमय दर</li><li>घरेलू मांग और आपूर्ति</li><li>सरकार का आयात शुल्क</li><li>त्योहार और शादी के सीज़न की मांग</li></ul>
<h3>रोज़ सोने का भाव कैसे चेक करें</h3>
<p>अपने शहर के अपडेटेड सोने और चाँदी का भाव जानने के लिए रोज़ाना हमारी वेबसाइट पर आएं। हम दिन में कई बार कीमतें अपडेट करते हैं।</p>""",
         True),
        ("Mangalsutra Design Latest 2026 - Top 50 Designs", "मंगलसूत्र डिज़ाइन लेटेस्ट 2026 - टॉप 50 डिज़ाइन",
         "mangalsutra-design-latest-2026", "designs",
         "Browse the latest mangalsutra designs of 2026 with price, weight and photos.",
         "2026 के नवीनतम मंगलसूत्र डिज़ाइन कीमत, वजन और फोटो के साथ देखें।",
         """<h2>Latest Mangalsutra Designs 2026</h2>
<p>Mangalsutra is one of the most important pieces of jewellery in Indian culture. It symbolizes the sacred bond of marriage.</p>
<h3>Types of Mangalsutra</h3>
<ul><li>Traditional Long Mangalsutra</li><li>Modern Short Mangalsutra</li><li>Diamond Pendant Mangalsutra</li><li>Lightweight Daily Wear Mangalsutra</li></ul>
<h3>How to Choose the Perfect Mangalsutra</h3>
<p>Consider weight, design, your daily routine, and budget when selecting a mangalsutra.</p>""",
         """<h2>लेटेस्ट मंगलसूत्र डिज़ाइन 2026</h2>
<p>मंगलसूत्र भारतीय संस्कृति में सबसे महत्वपूर्ण आभूषणों में से एक है। यह विवाह के पवित्र बंधन का प्रतीक है।</p>
<h3>मंगलसूत्र के प्रकार</h3>
<ul><li>ट्रेडिशनल लंबा मंगलसूत्र</li><li>मॉडर्न शॉर्ट मंगलसूत्र</li><li>डायमंड पेंडेंट मंगलसूत्र</li><li>लाइटवेट डेली वेयर मंगलसूत्र</li></ul>
<h3>सही मंगलसूत्र कैसे चुनें</h3>
<p>मंगलसूत्र चुनते समय वजन, डिज़ाइन, अपनी दैनिक दिनचर्या और बजट पर विचार करें।</p>""",
         True),
        ("Gold Jewellery Buying Guide in Hindi", "सोने के ज्वेलरी खरीदने की गाइड हिंदी में",
         "gold-jewellery-buying-guide-hindi", "guide",
         "Complete guide to buying gold jewellery in India - purity, hallmark, making charges explained.",
         "भारत में सोने की ज्वेलरी खरीदने की पूरी गाइड - प्योरिटी, हॉलमार्क, मेकिंग चार्ज सब कुछ।",
         """<h2>Gold Jewellery Buying Guide</h2>
<p>Buying gold jewellery is a significant investment. This guide will help you make informed decisions.</p>
<h3>Understanding Gold Purity</h3>
<ul><li>24K - 99.9% pure gold (too soft for jewellery)</li><li>22K - 91.67% pure gold (most common for jewellery)</li><li>18K - 75% pure gold (used with diamonds)</li><li>14K - 58.3% pure gold (affordable option)</li></ul>
<h3>BIS Hallmark</h3>
<p>Always buy BIS hallmarked gold jewellery. The hallmark guarantees purity and authenticity.</p>""",
         """<h2>सोने की ज्वेलरी खरीदने की गाइड</h2>
<p>सोने की ज्वेलरी खरीदना एक बड़ा निवेश है। यह गाइड आपको सही फैसला लेने में मदद करेगी।</p>
<h3>सोने की शुद्धता को समझें</h3>
<ul><li>24K - 99.9% शुद्ध सोना (ज्वेलरी के लिए बहुत नरम)</li><li>22K - 91.67% शुद्ध सोना (ज्वेलरी के लिए सबसे आम)</li><li>18K - 75% शुद्ध सोना (हीरे के साथ इस्तेमाल)</li><li>14K - 58.3% शुद्ध सोना (किफायती विकल्प)</li></ul>
<h3>BIS हॉलमार्क</h3>
<p>हमेशा BIS हॉलमार्क वाली सोने की ज्वेलरी खरीदें। हॉलमार्क शुद्धता और प्रामाणिकता की गारंटी देता है।</p>""",
         True),
        ("Wedding Jewellery Collection 2026", "वेडिंग ज्वेलरी कलेक्शन 2026",
         "wedding-jewellery-collection-2026", "designs",
         "Explore the best wedding jewellery collection for 2026 - bridal sets, engagement rings, and more.",
         "2026 की बेस्ट वेडिंग ज्वेलरी कलेक्शन देखें - ब्राइडल सेट, सगाई की अंगूठी और बहुत कुछ।",
         """<h2>Wedding Jewellery Collection 2026</h2>
<p>Your wedding day is special, and your jewellery should be too. Explore our curated collection of wedding jewellery.</p>
<h3>Must-Have Wedding Jewellery</h3>
<ul><li>Bridal Necklace Set</li><li>Maang Tikka</li><li>Wedding Bangles</li><li>Nose Ring (Nath)</li><li>Engagement Ring</li><li>Mangalsutra</li></ul>""",
         """<h2>वेडिंग ज्वेलरी कलेक्शन 2026</h2>
<p>आपकी शादी का दिन खास है, और आपकी ज्वेलरी भी खास होनी चाहिए। हमारी क्यूरेटेड वेडिंग ज्वेलरी कलेक्शन देखें।</p>
<h3>शादी के लिए ज़रूरी ज्वेलरी</h3>
<ul><li>ब्राइडल नेकलेस सेट</li><li>मांग टीका</li><li>शादी की चूड़ियाँ</li><li>नथ</li><li>सगाई की अंगूठी</li><li>मंगलसूत्र</li></ul>""",
         True),
        ("Light Weight Gold Jewellery Designs for Daily Wear", "रोज़ पहनने के लिए हल्की सोने की ज्वेलरी डिज़ाइन",
         "light-weight-gold-jewellery-daily-wear", "designs",
         "Best light weight gold jewellery designs for daily wear - comfortable, stylish and affordable.",
         "रोज़ पहनने के लिए बेस्ट हल्की सोने की ज्वेलरी डिज़ाइन - आरामदायक, स्टाइलिश और किफायती।",
         """<h2>Light Weight Gold Jewellery for Daily Wear</h2>
<p>Not all gold jewellery needs to be heavy. Light weight designs are perfect for everyday use.</p>
<h3>Benefits of Light Weight Jewellery</h3>
<ul><li>Comfortable for all-day wear</li><li>More affordable</li><li>Modern and trendy designs</li><li>Easy to maintain</li></ul>""",
         """<h2>रोज़ पहनने के लिए हल्की सोने की ज्वेलरी</h2>
<p>सभी सोने की ज्वेलरी भारी नहीं होनी चाहिए। हल्के वज़न की डिज़ाइन रोज़मर्रा के इस्तेमाल के लिए एकदम सही हैं।</p>
<h3>हल्की ज्वेलरी के फायदे</h3>
<ul><li>पूरे दिन पहनने में आरामदायक</li><li>ज़्यादा किफायती</li><li>मॉडर्न और ट्रेंडी डिज़ाइन</li><li>रखरखाव में आसान</li></ul>""",
         True),
    ]

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
