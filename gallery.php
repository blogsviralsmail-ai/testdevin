<?php
require_once 'includes/config.php';

$conn = getDBConnection();

// Get settings
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

// Get gallery images
$gallery = $conn->query("SELECT * FROM gallery WHERE status = 'active' ORDER BY sort_order, created_at DESC");

// Get unique categories
$categories = $conn->query("SELECT DISTINCT category FROM gallery WHERE status = 'active' AND category IS NOT NULL AND category != ''");
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gallery - <?php echo $site_name; ?></title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <!-- Top Bar -->
    <div class="top-bar">
        <div class="container">
            <span><?php echo $site_name; ?> : <?php echo $site_tagline; ?></span>
        </div>
    </div>

    <!-- Header -->
    <header class="main-header">
        <div class="container">
            <a href="index.php" class="logo">
                <img src="<?php echo $logo; ?>" alt="<?php echo $site_name; ?>">
            </a>
            <nav id="mainNav">
                <ul style="font-size: 13px;">
                    <li><a href="index.php">Home</a></li>
                    <li><a href="about.php">About Us</a></li>
                    <li><a href="products.php">Products</a></li>
                    <li><a href="gallery.php" class="active">Gallery</a></li>
                    <li><a href="enquiry.php">Enquiry</a></li>
                    <li><a href="contact.php">Contact Us</a></li>
                </ul>
            </nav>
            <div class="header-buttons" style="display: flex; gap: 10px; align-items: center;">
                <a href="admin/login.php" style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; background: #c9a227; color: #fff; border-radius: 8px; font-weight: 600; font-size: 12px; text-decoration: none; transition: all 0.3s;"><i class="fas fa-user-shield"></i> Admin Login</a>
                <a href="customer/login.php" style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; background: transparent; color: #c9a227; border: 2px solid #c9a227; border-radius: 8px; font-weight: 600; font-size: 12px; text-decoration: none; transition: all 0.3s;"><i class="fas fa-user"></i> Customer Login</a>
            </div>
            <a href="tel:<?php echo str_replace(['+', ' '], '', $phone_1); ?>" class="header-contact">
                <i class="fas fa-phone"></i>
                <span><?php echo $phone_1; ?></span>
            </a>
            <div class="mobile-menu-toggle" id="mobileMenuToggle">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    </header>
    <div class="mobile-overlay" id="mobileOverlay"></div>

    <!-- Page Header -->
    <section class="page-header-section" style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 80px 0; text-align: center; color: white;">
        <div class="container">
            <h1>Gallery</h1>
            <p>Take a virtual tour of our premium showroom</p>
        </div>
    </section>

    <!-- Gallery Section -->
    <section class="gallery-section">
        <div class="container">
            <!-- Filter Buttons -->
            <?php if ($categories->num_rows > 0): ?>
            <div class="gallery-filters">
                <button class="filter-btn active" data-filter="all">All</button>
                <?php while($cat = $categories->fetch_assoc()): ?>
                <button class="filter-btn" data-filter="<?php echo strtolower(str_replace(' ', '-', $cat['category'])); ?>">
                    <?php echo $cat['category']; ?>
                </button>
                <?php endwhile; ?>
            </div>
            <?php endif; ?>

            <!-- Gallery Grid -->
            <?php if ($gallery->num_rows > 0): ?>
            <div class="gallery-grid">
                <?php while($img = $gallery->fetch_assoc()): ?>
                <div class="gallery-item" data-category="<?php echo strtolower(str_replace(' ', '-', $img['category'])); ?>">
                    <img src="<?php echo $img['image']; ?>" alt="<?php echo $img['title']; ?>" loading="lazy">
                    <div class="gallery-overlay">
                        <div class="gallery-info">
                            <?php if ($img['title']): ?>
                            <h4><?php echo $img['title']; ?></h4>
                            <?php endif; ?>
                            <?php if ($img['category']): ?>
                            <span><?php echo $img['category']; ?></span>
                            <?php endif; ?>
                        </div>
                        <button class="zoom-btn" onclick="openLightbox('<?php echo $img['image']; ?>')">
                            <i class="fas fa-search-plus"></i>
                        </button>
                    </div>
                </div>
                <?php endwhile; ?>
            </div>
            <?php else: ?>
            <div class="no-gallery">
                <i class="fas fa-images"></i>
                <h3>Gallery Coming Soon</h3>
                <p>We're updating our gallery with new images. Check back soon!</p>
            </div>
            <?php endif; ?>
        </div>
    </section>

    <!-- Lightbox -->
    <div id="lightbox" class="lightbox" onclick="closeLightbox()">
        <span class="close-lightbox">&times;</span>
        <img id="lightbox-img" src="" alt="">
    </div>

    <!-- Footer -->
    <footer>
        <div class="container">
            <div class="footer-grid">
                <div class="footer-col">
                    <img src="<?php echo $logo; ?>" alt="<?php echo $site_name; ?>" style="height: 60px; margin-bottom: 20px;">
                    <p>Premium sanitaryware solutions with J.P. Tiles Sanitaryware.</p>
                    <div class="social-links">
                        <?php if($facebook): ?><a href="<?php echo $facebook; ?>" target="_blank"><i class="fab fa-facebook-f"></i></a><?php endif; ?>
                        <?php if($instagram): ?><a href="<?php echo $instagram; ?>" target="_blank"><i class="fab fa-instagram"></i></a><?php endif; ?>
                    </div>
                </div>
                <div class="footer-col">
                    <h4>Quick Links</h4>
                    <ul style="font-size: 13px;">
                        <li><a href="index.php"><i class="fas fa-chevron-right"></i> Home</a></li>
                        <li><a href="about.php"><i class="fas fa-chevron-right"></i> About Us</a></li>
                        <li><a href="products.php"><i class="fas fa-chevron-right"></i> Products</a></li>
                        <li><a href="gallery.php"><i class="fas fa-chevron-right"></i> Gallery</a></li>
                        <li><a href="contact.php"><i class="fas fa-chevron-right"></i> Contact</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Legal</h4><ul><li><a href="privacy.php">Privacy Policy</a></li><li><a href="terms.php">Terms &amp; Conditions</a></li></ul></div><div class="footer-links"><h4>Categories</h4>
                    <ul style="font-size: 13px;">
                        <li><a href="products.php?category=tiles"><i class="fas fa-chevron-right"></i> Tiles</a></li>
                        <li><a href="products.php?category=bath"><i class="fas fa-chevron-right"></i> Bath</a></li>
                        <li><a href="products.php?category=kitchen"><i class="fas fa-chevron-right"></i> Kitchen</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Contact Us</h4>
                    <ul style="font-size: 13px;">
                        <li><i class="fas fa-map-marker-alt"></i> <?php echo $address; ?></li>
                        <li><a href="tel:<?php echo str_replace(['+', ' '], '', $phone_1); ?>"><i class="fas fa-phone"></i> <?php echo $phone_1; ?></a></li>
                        <li><a href="mailto:<?php echo $email; ?>"><i class="fas fa-envelope"></i> <?php echo $email; ?></a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; <?php echo date('Y'); ?> <?php echo $site_name; ?>. All Rights Reserved.</p>
            </div>
        </div>
    </footer>

    <div class="floating-buttons" style="right: 20px !important; left: auto !important;">
        <a href="tel:<?php echo str_replace(['+', ' '], '', $phone_1); ?>" class="floating-btn phone"><i class="fas fa-phone"></i></a>
        <a href="https://wa.me/<?php echo $whatsapp; ?>" target="_blank" class="floating-btn whatsapp"><i class="fab fa-whatsapp"></i></a>
    </div>

    <style>
        .gallery-section {
            padding: 80px 0;
            background: #f8f9fa;
        }
        .gallery-filters {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-bottom: 40px;
            flex-wrap: wrap;
        }
        .filter-btn {
            padding: 12px 25px;
            border: 2px solid #c9a227;
            background: white;
            color: #c9a227;
            border-radius: 30px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s;
        }
        .filter-btn:hover, .filter-btn.active {
            background: #c9a227;
            color: white;
        }
        .gallery-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        .gallery-item {
            position: relative;
            border-radius: 15px;
            overflow: hidden;
            aspect-ratio: 4/3;
            cursor: pointer;
        }
        .gallery-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s;
        }
        .gallery-item:hover img {
            transform: scale(1.1);
        }
        .gallery-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%);
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 20px;
            opacity: 0;
            transition: opacity 0.3s;
        }
        .gallery-item:hover .gallery-overlay {
            opacity: 1;
        }
        .gallery-info {
            color: white;
        }
        .gallery-info h4 {
            font-size: 18px;
            margin-bottom: 5px;
        }
        .gallery-info span {
            font-size: 12px;
            opacity: 0.8;
        }
        .zoom-btn {
            position: absolute;
            top: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            font-size: 20px;
            color: #c9a227;
            transition: all 0.3s;
        }
        .zoom-btn:hover {
            background: #c9a227;
            color: white;
        }
        .no-gallery {
            text-align: center;
            padding: 80px;
            background: white;
            border-radius: 20px;
        }
        .no-gallery i {
            font-size: 80px;
            color: #ddd;
            margin-bottom: 20px;
        }
        .no-gallery h3 {
            font-size: 24px;
            margin-bottom: 10px;
        }
        .no-gallery p {
            color: #666;
        }
        .lightbox {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.95);
            z-index: 9999;
            justify-content: center;
            align-items: center;
        }
        .lightbox.active {
            display: flex;
        }
        .lightbox img {
            max-width: 90%;
            max-height: 90%;
            border-radius: 10px;
        }
        .close-lightbox {
            position: absolute;
            top: 20px;
            right: 30px;
            color: white;
            font-size: 50px;
            cursor: pointer;
        }
        @media (max-width: 768px) {
            .gallery-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>

    <script>
        // Filter functionality
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                const filter = this.dataset.filter;
                document.querySelectorAll('.gallery-item').forEach(item => {
                    if (filter === 'all' || item.dataset.category === filter) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });

        // Lightbox
        function openLightbox(src) {
            document.getElementById('lightbox-img').src = src;
            document.getElementById('lightbox').classList.add('active');
        }
        
        function closeLightbox() {
            document.getElementById('lightbox').classList.remove('active');
        }

        // Mobile menu
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const mainNav = document.getElementById('mainNav');
        const mobileOverlay = document.getElementById('mobileOverlay');
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                mainNav.classList.toggle('active');
                mobileOverlay.classList.toggle('active');
            });
            mobileOverlay.addEventListener('click', () => {
                mainNav.classList.remove('active');
                mobileOverlay.classList.remove('active');
            });
        }
    </script>
</body>
</html>
<?php $conn->close(); ?>
