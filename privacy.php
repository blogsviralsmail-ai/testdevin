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
$footer_description = getSetting('footer_description', 'Discover premium sanitaryware solutions with J.P. Tiles Sanitaryware.');
$copyright_text = getSetting('copyright_text', '2026 JP Tiles. All Rights Reserved.');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - <?php echo $site_name; ?></title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/style.css">
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
                    <li><a href="contact.php">Contact Us</a></li>
                </ul>
            </nav>
            <div class="header-buttons" style="display: flex; gap: 8px; align-items: center;">
                <a href="admin/login.php" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: #c9a227; color: #fff; border-radius: 6px; font-weight: 600; font-size: 12px; text-decoration: none;"><i class="fas fa-user-shield"></i> Admin Login</a>
                <a href="customer/login.php" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: transparent; color: #c9a227; border: 2px solid #c9a227; border-radius: 6px; font-weight: 600; font-size: 12px; text-decoration: none;"><i class="fas fa-user"></i> Customer Login</a>
            </div>
            <a href="tel:<?php echo str_replace(['+', ' '], '', $phone_1); ?>" class="header-contact" style="font-size: 12px; padding: 8px 14px;"><i class="fas fa-phone"></i><span><?php echo $phone_1; ?></span></a>
            <div class="mobile-menu-toggle" id="mobileMenuToggle"><span></span><span></span><span></span></div>
        </div>
    </header>
    <div class="mobile-overlay" id="mobileOverlay"></div>
    <section class="page-header-section" style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 80px 0; text-align: center; color: white;">
        <div class="container"><h1>Privacy Policy</h1><p>How we collect, use, and protect your information</p></div>
    </section>
    <section style="padding: 60px 0;">
        <div class="container" style="max-width: 900px;">
            <div style="background: #fff; padding: 40px; border-radius: 15px; box-shadow: 0 5px 30px rgba(0,0,0,0.1);">
                <h2 style="color: #c9a227; margin-bottom: 20px;">Information We Collect</h2>
                <p style="margin-bottom: 20px; line-height: 1.8;">We collect information you provide directly to us, such as when you create an account, make a purchase, fill out a form, or contact us. This may include your name, email address, phone number, and address.</p>
                
                <h2 style="color: #c9a227; margin-bottom: 20px;">How We Use Your Information</h2>
                <p style="margin-bottom: 20px; line-height: 1.8;">We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and respond to your comments and questions.</p>
                
                <h2 style="color: #c9a227; margin-bottom: 20px;">Information Sharing</h2>
                <p style="margin-bottom: 20px; line-height: 1.8;">We do not share your personal information with third parties except as described in this policy. We may share information with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.</p>
                
                <h2 style="color: #c9a227; margin-bottom: 20px;">Data Security</h2>
                <p style="margin-bottom: 20px; line-height: 1.8;">We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.</p>
                
                <h2 style="color: #c9a227; margin-bottom: 20px;">Contact Us</h2>
                <p style="line-height: 1.8;">If you have any questions about this Privacy Policy, please contact us at:<br><strong>Email:</strong> <?php echo $email; ?><br><strong>Phone:</strong> <?php echo $phone_1; ?><br><strong>Address:</strong> <?php echo $address; ?></p>
            </div>
        </div>
    </section>
    <footer class="main-footer">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-about">
                    <img src="<?php echo $logo; ?>" alt="<?php echo $site_name; ?>" class="footer-logo">
                    <p><?php echo htmlspecialchars($footer_description); ?></p>
                    <div class="social-links">
                        <?php if ($facebook): ?><a href="<?php echo $facebook; ?>" target="_blank"><i class="fab fa-facebook-f"></i></a><?php endif; ?>
                        <?php if ($instagram): ?><a href="<?php echo $instagram; ?>" target="_blank"><i class="fab fa-instagram"></i></a><?php endif; ?>
                    </div>
                </div>
                <div class="footer-links"><h4>Quick Links</h4><ul><li><a href="index.php">Home</a></li><li><a href="about.php">About Us</a></li><li><a href="products.php">Products</a></li><li><a href="gallery.php">Gallery</a></li><li><a href="contact.php">Contact</a></li></ul></div>
                <div class="footer-links"><h4>Legal</h4><ul><li><a href="privacy.php">Privacy Policy</a></li><li><a href="terms.php">Terms & Conditions</a></li></ul></div>
                <div class="footer-contact"><h4>Contact Us</h4><ul><li><?php echo $address; ?></li><li><a href="tel:<?php echo str_replace(['+', ' '], '', $phone_1); ?>"><?php echo $phone_1; ?></a></li><li><a href="mailto:<?php echo $email; ?>"><?php echo $email; ?></a></li></ul></div>
            </div>
            <div class="footer-bottom"><p>&copy; <?php echo $copyright_text; ?></p></div>
        </div>
    </footer>
    <div class="floating-buttons"><a href="tel:<?php echo str_replace(['+', ' '], '', $phone_1); ?>" class="float-btn call-btn"><i class="fas fa-phone"></i></a><a href="https://wa.me/<?php echo $whatsapp; ?>" class="float-btn whatsapp-btn" target="_blank"><i class="fab fa-whatsapp"></i></a></div>
    <script>document.getElementById('mobileMenuToggle').addEventListener('click', function() { document.getElementById('mainNav').classList.toggle('active'); document.getElementById('mobileOverlay').classList.toggle('active'); this.classList.toggle('active'); }); document.getElementById('mobileOverlay').addEventListener('click', function() { document.getElementById('mainNav').classList.remove('active'); this.classList.remove('active'); document.getElementById('mobileMenuToggle').classList.remove('active'); });</script>
</body>
</html>
<?php $conn->close(); ?>
