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

$product = isset($_GET['product']) ? htmlspecialchars($_GET['product']) : '';
$success = false;
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $email_input = trim($_POST['email'] ?? '');
    $product_interest = trim($_POST['product'] ?? '');
    $message = trim($_POST['message'] ?? '');
    
    if (empty($name) || empty($phone)) {
        $error = 'Please fill in all required fields.';
    } else {
        $stmt = $conn->prepare("INSERT INTO enquiries (name, phone, email, product, message, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
        $stmt->bind_param("sssss", $name, $phone, $email_input, $product_interest, $message);
        if ($stmt->execute()) { $success = true; } else { $error = 'Something went wrong. Please try again.'; }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enquiry - <?php echo $site_name; ?></title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/style.css">
    <style>
        .enquiry-section { padding: 80px 5%; background: #f8f8f8; }
        .enquiry-container { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 50px; }
        @media (max-width: 992px) { .enquiry-container { grid-template-columns: 1fr; } }
        .enquiry-info h2 { font-size: 28px; color: #1a1a1a; margin-bottom: 30px; }
        .info-card { display: flex; align-items: flex-start; gap: 20px; padding: 25px; background: white; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 15px rgba(0,0,0,0.05); transition: all 0.3s ease; }
        .info-card:hover { transform: translateY(-3px); box-shadow: 0 5px 25px rgba(0,0,0,0.1); }
        .info-card .icon-box { width: 60px; height: 60px; background: linear-gradient(135deg, #c9a227, #d4af37); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .info-card .icon-box i { font-size: 24px; color: white; }
        .info-card .info-content h4 { font-size: 18px; color: #1a1a1a; margin: 0 0 8px 0; font-weight: 600; }
        .info-card .info-content p { color: #666; margin: 0; font-size: 14px; line-height: 1.6; }
        .info-card .info-content a { color: #c9a227; text-decoration: none; font-weight: 500; }
        .enquiry-form-wrap { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 5px 30px rgba(0,0,0,0.08); }
        .enquiry-form-wrap h2 { font-size: 28px; color: #1a1a1a; margin-bottom: 30px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; font-weight: 500; color: #333; margin-bottom: 8px; font-size: 14px; }
        .form-group input, .form-group textarea { width: 100%; padding: 14px 18px; border: 2px solid #e0e0e0; border-radius: 10px; font-size: 15px; transition: all 0.3s ease; font-family: inherit; box-sizing: border-box; }
        .form-group input:focus, .form-group textarea:focus { border-color: #c9a227; outline: none; }
        .form-group textarea { resize: vertical; min-height: 120px; }
        .submit-btn { width: 100%; padding: 16px; background: linear-gradient(135deg, #c9a227, #d4af37); color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; }
        .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(201,162,39,0.4); }
        .alert { padding: 15px 20px; border-radius: 10px; margin-bottom: 25px; display: flex; align-items: center; gap: 12px; }
        .alert-success { background: #d4edda; color: #155724; }
        .alert-danger { background: #f8d7da; color: #721c24; }
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
                    <li><a href="about.php">About Us</a></li>
                    <li><a href="products.php">Products</a></li>
                    <li><a href="gallery.php">Gallery</a></li>
                    <li><a href="enquiry.php" class="active">Enquiry</a></li>
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
        <div class="container"><h1>Enquiry</h1><p>Get in touch with us for bulk orders and business partnerships</p></div>
    </section>

    <section class="enquiry-section">
        <div class="enquiry-container">
            <div class="enquiry-info">
                <h2>Why Partner With Us?</h2>
                <div class="info-card">
                    <div class="icon-box"><i class="fas fa-handshake"></i></div>
                    <div class="info-content"><h4>Trusted Partnership</h4><p>12+ years of experience in the tiles and sanitaryware industry with a proven track record of excellence.</p></div>
                </div>
                <div class="info-card">
                    <div class="icon-box"><i class="fas fa-tags"></i></div>
                    <div class="info-content"><h4>Competitive Pricing</h4><p>Best wholesale rates for bulk orders with flexible payment options for our business partners.</p></div>
                </div>
                <div class="info-card">
                    <div class="icon-box"><i class="fas fa-truck"></i></div>
                    <div class="info-content"><h4>Reliable Delivery</h4><p>On-time delivery across India with proper packaging and handling of all products.</p></div>
                </div>
                <div class="info-card">
                    <div class="icon-box"><i class="fas fa-phone-alt"></i></div>
                    <div class="info-content"><h4>Call Us Directly</h4><p><a href="tel:<?php echo str_replace(['+', ' '], '', $phone_1); ?>"><?php echo $phone_1; ?></a></p></div>
                </div>
            </div>
            <div class="enquiry-form-wrap">
                <h2>Send Your Enquiry</h2>
                <?php if($success): ?><div class="alert alert-success"><i class="fas fa-check-circle"></i> Thank you! Your enquiry has been submitted.</div><?php elseif($error): ?><div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> <?php echo $error; ?></div><?php endif; ?>
                <form method="POST">
                    <div class="form-group"><label>Your Name *</label><input type="text" name="name" required placeholder="Enter your name"></div>
                    <div class="form-group"><label>Phone Number *</label><input type="tel" name="phone" required placeholder="Enter your phone number"></div>
                    <div class="form-group"><label>Email Address</label><input type="email" name="email" placeholder="Enter your email"></div>
                    <div class="form-group"><label>Product Interest</label><input type="text" name="product" value="<?php echo $product; ?>" placeholder="Which products are you interested in?"></div>
                    <div class="form-group"><label>Message</label><textarea name="message" placeholder="Tell us about your requirements"></textarea></div>
                    <button type="submit" class="submit-btn">Submit Enquiry</button>
                </form>
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
