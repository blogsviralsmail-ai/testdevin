<?php
require_once 'includes/config.php';

$conn = getDBConnection();

$site_name = getSetting('site_name', 'JP Tiles');
$site_tagline = getSetting('site_tagline', '#1 Trusted Brand Since 2013');
$logo = getSetting('logo', 'https://jptiles.in/assets/images/logo.webp');
$phone_1 = getSetting('phone_1', '+91 9828290049');
$phone_2 = getSetting('phone_2', '+91 9828290055');
$email = getSetting('email', 'jptiles13@gmail.com');
$address = getSetting('address', 'Shop No. 40, Ravan Gate, Opp. Power House Kalwar Road, Jhotwara, Jaipur- 302012');
$whatsapp = getSetting('whatsapp', '919828290049');
$facebook = getSetting('facebook', '');
$instagram = getSetting('instagram', '');

$success = false;
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $email_input = trim($_POST['email'] ?? '');
    $subject = trim($_POST['subject'] ?? '');
    $message = trim($_POST['message'] ?? '');
    
    if (empty($name) || empty($phone) || empty($message)) {
        $error = 'Please fill in all required fields.';
    } else {
        $stmt = $conn->prepare("INSERT INTO contact_messages (name, phone, email, subject, message, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
        $stmt->bind_param("sssss", $name, $phone, $email_input, $subject, $message);
        if ($stmt->execute()) { $success = true; } else { $error = 'Something went wrong. Please try again.'; }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact Us - <?php echo $site_name; ?></title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/style.css">
    <style>
        .contact-section { padding: 80px 5%; background: #f8f8f8; }
        .contact-container { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 50px; }
        @media (max-width: 992px) { .contact-container { grid-template-columns: 1fr; } }
        .contact-info h2 { font-size: 28px; color: #1a1a1a; margin-bottom: 30px; }
        .info-card { display: flex; align-items: flex-start; gap: 20px; padding: 25px; background: white; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 15px rgba(0,0,0,0.05); transition: all 0.3s ease; }
        .info-card:hover { transform: translateY(-3px); box-shadow: 0 5px 25px rgba(0,0,0,0.1); }
        .info-card .icon-box { width: 60px; height: 60px; background: linear-gradient(135deg, #c9a227, #d4af37); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .info-card .icon-box i { font-size: 24px; color: white; }
        .info-card .info-content h4 { font-size: 18px; color: #1a1a1a; margin: 0 0 8px 0; font-weight: 600; }
        .info-card .info-content p { color: #666; margin: 0; font-size: 14px; line-height: 1.6; }
        .info-card .info-content a { color: #c9a227; text-decoration: none; font-weight: 500; }
        .contact-form-wrap { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 5px 30px rgba(0,0,0,0.08); }
        .contact-form-wrap h2 { font-size: 28px; color: #1a1a1a; margin-bottom: 30px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; font-weight: 500; color: #333; margin-bottom: 8px; font-size: 14px; }
        .form-group input, .form-group textarea { width: 100%; padding: 14px 18px; border: 2px solid #e0e0e0; border-radius: 10px; font-size: 15px; transition: all 0.3s ease; font-family: inherit; box-sizing: border-box; }
        .form-group input:focus, .form-group textarea:focus { border-color: #c9a227; outline: none; }
        .form-group textarea { resize: vertical; min-height: 120px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 768px) { .form-row { grid-template-columns: 1fr; } }
        .submit-btn { width: 100%; padding: 16px; background: linear-gradient(135deg, #c9a227, #d4af37); color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; }
        .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(201,162,39,0.4); }
        .alert { padding: 15px 20px; border-radius: 10px; margin-bottom: 25px; display: flex; align-items: center; gap: 12px; }
        .alert-success { background: #d4edda; color: #155724; }
        .alert-danger { background: #f8d7da; color: #721c24; }
        .map-section { margin-top: 0; }
        .map-section iframe { border-radius: 0 0 16px 16px; }
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
                    <li><a href="enquiry.php">Enquiry</a></li>
                    <li><a href="contact.php" class="active">Contact Us</a></li>
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
        <div class="container"><h1>Contact Us</h1><p>Get in touch with us - We'd love to hear from you</p></div>
    </section>

    <section class="contact-section">
        <div class="contact-container">
            <div class="contact-info">
                <h2>Get In Touch</h2>
                <div class="info-card">
                    <div class="icon-box"><i class="fas fa-map-marker-alt"></i></div>
                    <div class="info-content"><h4>Our Location</h4><p><?php echo $address; ?></p></div>
                </div>
                <div class="info-card">
                    <div class="icon-box"><i class="fas fa-phone-alt"></i></div>
                    <div class="info-content"><h4>Phone Numbers</h4><p><a href="tel:<?php echo str_replace(['+', ' '], '', $phone_1); ?>"><?php echo $phone_1; ?></a></p><?php if($phone_2): ?><p><a href="tel:<?php echo str_replace(['+', ' '], '', $phone_2); ?>"><?php echo $phone_2; ?></a></p><?php endif; ?></div>
                </div>
                <div class="info-card">
                    <div class="icon-box"><i class="fas fa-envelope"></i></div>
                    <div class="info-content"><h4>Email Address</h4><p><a href="mailto:<?php echo $email; ?>"><?php echo $email; ?></a></p></div>
                </div>
                <div class="info-card">
                    <div class="icon-box"><i class="fas fa-clock"></i></div>
                    <div class="info-content"><h4>Business Hours</h4><p>Mon - Sat: 9:00 AM - 8:00 PM</p><p>Sunday: 10:00 AM - 6:00 PM</p></div>
                </div>
            </div>
            <div class="contact-form-wrap">
                <h2>Send Us a Message</h2>
                <?php if($success): ?><div class="alert alert-success"><i class="fas fa-check-circle"></i> Thank you! Your message has been sent.</div><?php elseif($error): ?><div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> <?php echo $error; ?></div><?php endif; ?>
                <form method="POST">
                    <div class="form-row">
                        <div class="form-group"><label>Your Name *</label><input type="text" name="name" required placeholder="Enter your name"></div>
                        <div class="form-group"><label>Phone Number *</label><input type="tel" name="phone" required placeholder="Enter your phone"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Email Address</label><input type="email" name="email" placeholder="Enter your email"></div>
                        <div class="form-group"><label>Subject</label><input type="text" name="subject" placeholder="Subject of your message"></div>
                    </div>
                    <div class="form-group"><label>Message *</label><textarea name="message" required placeholder="Write your message here"></textarea></div>
                    <button type="submit" class="submit-btn">Send Message</button>
                </form>
            </div>
        </div>
    </section>

    <section class="map-section">
        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3557.5!2d75.7204716!3d26.9477331!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396db3fa845cf729%3A0xf3e21bfb271082c!2sJ%20P%20TILES%20SANITARYWARE!5e0!3m2!1sen!2sin!4v1705000000000!5m2!1sen!2sin" width="100%" height="400" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
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
