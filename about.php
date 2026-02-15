<?php
require_once 'includes/config.php';

$conn = getDBConnection();

$site_name = getSetting('site_name', 'JP Tiles');
$site_tagline = getSetting('site_tagline', '#1 Trusted Brand Since 2013');
$logo = getSetting('logo', 'https://jptiles.in/assets/images/logo.webp');
$phone_1 = getSetting('phone_1', '+91 9828290049');
$email = getSetting('email', 'jptiles13@gmail.com');
$address = getSetting('address', 'Shop No. 40, Ravan Gate, Opp. Power House Kalwar Road, Jhotwara, Jaipur- 302012');
$whatsapp = getSetting('whatsapp', '919828290049');
$facebook = getSetting('facebook', '');
$instagram = getSetting('instagram', '');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About Us - <?php echo $site_name; ?></title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/style.css">
    <style>
        .about-section { padding: 80px 5%; background: #f8f8f8; }
        .about-container { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        @media (max-width: 992px) { .about-container { grid-template-columns: 1fr; } }
        .about-image { position: relative; }
        .about-image img { width: 100%; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
        .experience-badge { position: absolute; bottom: -20px; right: -20px; background: linear-gradient(135deg, #c9a227, #d4af37); color: white; padding: 25px 30px; border-radius: 16px; text-align: center; box-shadow: 0 10px 30px rgba(201,162,39,0.3); }
        .experience-badge .years { display: block; font-size: 42px; font-weight: 700; line-height: 1; }
        .experience-badge .text { font-size: 14px; margin-top: 5px; }
        .about-content h4 { color: #c9a227; font-size: 16px; font-weight: 600; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; }
        .about-content h2 { font-size: 36px; color: #1a1a1a; margin-bottom: 25px; line-height: 1.3; }
        .about-content p { color: #666; font-size: 16px; line-height: 1.8; margin-bottom: 20px; }
        .feature-list { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 30px 0; }
        .feature-item { display: flex; align-items: center; gap: 12px; }
        .feature-item i { color: #c9a227; font-size: 18px; }
        .feature-item span { color: #333; font-weight: 500; }
        .btn-gold { display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #c9a227, #d4af37); color: white; border-radius: 10px; text-decoration: none; font-weight: 600; transition: all 0.3s; }
        .btn-gold:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(201,162,39,0.4); }
        
        .stats-section { padding: 80px 5%; background: linear-gradient(135deg, #1a1a1a, #2d2d2d); }
        .stats-container { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 30px; }
        @media (max-width: 768px) { .stats-container { grid-template-columns: repeat(2, 1fr); } }
        .stat-card { text-align: center; padding: 30px; }
        .stat-card .icon { width: 70px; height: 70px; background: rgba(201,162,39,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
        .stat-card .icon i { font-size: 28px; color: #c9a227; }
        .stat-card .number { font-size: 42px; font-weight: 700; color: white; margin-bottom: 5px; }
        .stat-card .label { color: #999; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
        
        .why-section { padding: 80px 5%; background: #f8f8f8; }
        .why-container { max-width: 1200px; margin: 0 auto; }
        .section-header { text-align: center; margin-bottom: 50px; }
        .section-header h2 { font-size: 36px; color: #1a1a1a; margin-bottom: 15px; }
        .section-header h2 span { color: #c9a227; }
        .section-header p { color: #666; font-size: 16px; }
        .why-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 30px; }
        @media (max-width: 992px) { .why-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 576px) { .why-grid { grid-template-columns: 1fr; } }
        .why-card { background: white; padding: 35px 25px; border-radius: 16px; text-align: center; box-shadow: 0 5px 25px rgba(0,0,0,0.05); transition: all 0.3s; }
        .why-card:hover { transform: translateY(-10px); box-shadow: 0 15px 40px rgba(0,0,0,0.1); }
        .why-card .icon { width: 80px; height: 80px; background: linear-gradient(135deg, #c9a227, #d4af37); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 25px; }
        .why-card .icon i { font-size: 32px; color: white; }
        .why-card h3 { font-size: 20px; color: #1a1a1a; margin-bottom: 15px; }
        .why-card p { color: #666; font-size: 14px; line-height: 1.7; }
        
        .floating-buttons { position: fixed !important; bottom: 20px !important; right: 20px !important; left: auto !important; }
        .mobile-menu-toggle { display: none; }
        @media (max-width: 992px) { header nav { position: fixed !important; top: 0 !important; left: -100% !important; width: 80% !important; max-width: 300px !important; height: 100vh !important; background: #1a1a1a !important; padding: 80px 20px 20px !important; transition: left 0.3s ease !important; z-index: 1000 !important; } header nav.active { left: 0 !important; } header nav ul { flex-direction: column !important; display: flex !important; } header nav ul li a { display: block !important; padding: 15px 0 !important; border-bottom: 1px solid rgba(255,255,255,0.1) !important; color: white !important; } .mobile-menu-toggle { display: flex !important; flex-direction: column !important; gap: 5px !important; cursor: pointer !important; padding: 10px !important; } .mobile-menu-toggle span { width: 25px !important; height: 3px !important; background: white !important; display: block !important; } }
    </style>
</head>
<body>
    <div class="top-bar"><div class="container"><span><?php echo $site_name; ?> : <?php echo $site_tagline; ?></span></div></div>
    <header class="main-header">
        <div class="container">
            <a href="index.php" class="logo"><img src="<?php echo $logo; ?>" alt="<?php echo $site_name; ?>"></a>
            <nav id="mainNav">
                <ul style="font-size: 13px;">
                    <li><a href="index.php">Home</a></li>
                    <li><a href="about.php" class="active">About Us</a></li>
                    <li><a href="products.php">Products</a></li>
                    <li><a href="gallery.php">Gallery</a></li>
                    <li><a href="enquiry.php">Enquiry</a></li>
                    <li><a href="contact.php">Contact Us</a></li>
                </ul>
            </nav>
            <div class="header-buttons" style="display: flex; gap: 10px; align-items: center;">
                <a href="admin/login.php" style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; background: #c9a227; color: #fff; border-radius: 8px; font-weight: 600; font-size: 12px; text-decoration: none;"><i class="fas fa-user-shield"></i> Admin Login</a>
                <a href="customer/login.php" style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; background: transparent; color: #c9a227; border: 2px solid #c9a227; border-radius: 8px; font-weight: 600; font-size: 12px; text-decoration: none;"><i class="fas fa-user"></i> Customer Login</a>
            </div>
            <a href="tel:<?php echo str_replace(['+', ' '], '', $phone_1); ?>" class="header-contact"><i class="fas fa-phone"></i><span><?php echo $phone_1; ?></span></a>
            <div class="mobile-menu-toggle" id="mobileMenuToggle"><span></span><span></span><span></span></div>
        </div>
    </header>
    <div class="mobile-overlay" id="mobileOverlay"></div>

    <section class="page-header-section" style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 80px 0; text-align: center; color: white;">
        <div class="container"><h1>About Us</h1><p>Know more about JP Tiles - Your trusted partner for premium tiles</p></div>
    </section>

    <section class="about-section">
        <div class="about-container">
            <div class="about-image">
                <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=500&fit=crop" alt="JP Tiles Showroom">
                <div class="experience-badge">
                    <span class="years">12+</span>
                    <span class="text">Years of Excellence</span>
                </div>
            </div>
            <div class="about-content">
                <h4>Who We Are</h4>
                <h2>Your Trusted Partner for Premium Tiles Since 2013</h2>
                <p>JP Tiles has been a leading name in the tiles and bathroom fittings industry for over a decade. We are committed to providing our customers with the highest quality products at competitive prices.</p>
                <p>Our extensive range includes floor tiles, wall tiles, bathroom fittings, kitchen accessories, and tile chemicals from top brands. We serve both retail customers and business partners across Jaipur and Rajasthan.</p>
                <div class="feature-list">
                    <div class="feature-item"><i class="fas fa-check-circle"></i><span>Premium Quality Products</span></div>
                    <div class="feature-item"><i class="fas fa-check-circle"></i><span>Competitive Pricing</span></div>
                    <div class="feature-item"><i class="fas fa-check-circle"></i><span>Expert Guidance</span></div>
                    <div class="feature-item"><i class="fas fa-check-circle"></i><span>Wide Product Range</span></div>
                </div>
                <a href="contact.php" class="btn-gold">Contact Us</a>
            </div>
        </div>
    </section>

    <section class="stats-section">
        <div class="stats-container">
            <div class="stat-card">
                <div class="icon"><i class="fas fa-calendar-alt"></i></div>
                <div class="number">12+</div>
                <div class="label">Years Experience</div>
            </div>
            <div class="stat-card">
                <div class="icon"><i class="fas fa-users"></i></div>
                <div class="number">10,000+</div>
                <div class="label">Happy Customers</div>
            </div>
            <div class="stat-card">
                <div class="icon"><i class="fas fa-box"></i></div>
                <div class="number">5,000+</div>
                <div class="label">Products</div>
            </div>
            <div class="stat-card">
                <div class="icon"><i class="fas fa-handshake"></i></div>
                <div class="number">500+</div>
                <div class="label">Partners</div>
            </div>
        </div>
    </section>

    <section class="why-section">
        <div class="why-container">
            <div class="section-header">
                <h2>Why Choose <span>Us</span></h2>
                <p>What makes JP Tiles different from others</p>
            </div>
            <div class="why-grid">
                <div class="why-card">
                    <div class="icon"><i class="fas fa-gem"></i></div>
                    <h3>Premium Quality</h3>
                    <p>We source our products from the best manufacturers ensuring top quality.</p>
                </div>
                <div class="why-card">
                    <div class="icon"><i class="fas fa-tags"></i></div>
                    <h3>Best Prices</h3>
                    <p>Competitive prices without compromising on quality or service.</p>
                </div>
                <div class="why-card">
                    <div class="icon"><i class="fas fa-headset"></i></div>
                    <h3>Expert Support</h3>
                    <p>Our experienced team helps you choose the right products for your needs.</p>
                </div>
                <div class="why-card">
                    <div class="icon"><i class="fas fa-truck"></i></div>
                    <h3>Fast Delivery</h3>
                    <p>Timely delivery to keep your projects on schedule across Rajasthan.</p>
                </div>
            </div>
        </div>
    </section>

    <footer>
        <div class="container">
            <div class="footer-grid">
                <div class="footer-col"><img src="<?php echo $logo; ?>" alt="<?php echo $site_name; ?>" style="height: 60px; margin-bottom: 20px;"><p>Premium sanitaryware solutions with J.P. Tiles Sanitaryware.</p><div class="social-links"><?php if($facebook): ?><a href="<?php echo $facebook; ?>" target="_blank"><i class="fab fa-facebook-f"></i></a><?php endif; ?><?php if($instagram): ?><a href="<?php echo $instagram; ?>" target="_blank"><i class="fab fa-instagram"></i></a><?php endif; ?></div></div>
                <div class="footer-col"><h4>Quick Links</h4><ul style="font-size: 13px;"><li><a href="index.php"><i class="fas fa-chevron-right"></i> Home</a></li><li><a href="about.php"><i class="fas fa-chevron-right"></i> About Us</a></li><li><a href="products.php"><i class="fas fa-chevron-right"></i> Products</a></li><li><a href="gallery.php"><i class="fas fa-chevron-right"></i> Gallery</a></li><li><a href="contact.php"><i class="fas fa-chevron-right"></i> Contact</a></li></ul></div>
                <div class="footer-col"><h4>Legal</h4><ul><li><a href="privacy.php">Privacy Policy</a></li><li><a href="terms.php">Terms & Conditions</a></li></ul></div>
                <div class="footer-col"><h4>Contact Us</h4><ul style="font-size: 13px;"><li><i class="fas fa-map-marker-alt"></i> <?php echo $address; ?></li><li><a href="tel:<?php echo str_replace(['+', ' '], '', $phone_1); ?>"><i class="fas fa-phone"></i> <?php echo $phone_1; ?></a></li><li><a href="mailto:<?php echo $email; ?>"><i class="fas fa-envelope"></i> <?php echo $email; ?></a></li></ul></div>
            </div>
            <div class="footer-bottom"><p>&copy; <?php echo date('Y'); ?> <?php echo $site_name; ?>. All Rights Reserved.</p></div>
        </div>
    </footer>

    <div class="floating-buttons"><a href="tel:<?php echo str_replace(['+', ' '], '', $phone_1); ?>" class="floating-btn phone"><i class="fas fa-phone"></i></a><a href="https://wa.me/<?php echo $whatsapp; ?>" target="_blank" class="floating-btn whatsapp"><i class="fab fa-whatsapp"></i></a></div>

    <script>
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const mainNav = document.getElementById('mainNav');
        const mobileOverlay = document.getElementById('mobileOverlay');
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => { mainNav.classList.toggle('active'); mobileOverlay.classList.toggle('active'); });
            mobileOverlay.addEventListener('click', () => { mainNav.classList.remove('active'); mobileOverlay.classList.remove('active'); });
        }
    </script>
</body>
</html>
<?php $conn->close(); ?>
