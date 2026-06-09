<?php
require_once 'includes/config.php';

// Get site settings
$site_name = getSetting('site_name', 'JP Tiles');
$site_tagline = getSetting('site_tagline', '#1 Trusted Brand Since 2013');
$phone_1 = getSetting('phone_1', '+91 9828290049');
$phone_2 = getSetting('phone_2', '+91 9828290055');
$email = getSetting('email', 'jptiles13@gmail.com');
$address = getSetting('address', 'Shop No. 40, Ravan Gate, Opp. Power House Kalwar Road, Jhotwara, Jaipur- 302012');
$whatsapp = getSetting('whatsapp', '919828290049');
$facebook = getSetting('facebook', '');
$instagram = getSetting('instagram', '');
$logo = getSetting('logo', 'https://jptiles.in/assets/images/logo.webp');

// Get categories
$conn = getDBConnection();
$categories = $conn->query("SELECT * FROM categories WHERE parent_id IS NULL AND status = 'active' ORDER BY sort_order");

// Get sliders
$sliders = $conn->query("SELECT * FROM sliders WHERE status = 'active' ORDER BY sort_order");

// Get featured products
$products = $conn->query("SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.status = 'active' ORDER BY p.sort_order LIMIT 8");

// Get features from database
$features = $conn->query("SELECT * FROM features WHERE is_active = 1 ORDER BY sort_order ASC");

// Get FAQs from database
$faqs = $conn->query("SELECT * FROM faqs WHERE is_active = 1 ORDER BY sort_order ASC");

// Get stats from database
$stats = $conn->query("SELECT * FROM stats WHERE is_active = 1 ORDER BY sort_order ASC");

// Get footer description and copyright
$footer_description = getSetting('footer_description', 'Discover premium sanitaryware solutions with J.P. Tiles Sanitaryware — where quality meets elegance for your dream spaces.');
$copyright_text = getSetting('copyright_text', date('Y') . ' ' . $site_name . '. All Rights Reserved.');
$youtube_url = getSetting('youtube_url', '');
$twitter_url = getSetting('twitter_url', '');

// Get SEO settings
$meta_title = getSetting('meta_title', $site_name . ' - ' . $site_tagline);
$meta_description = getSetting('meta_description', 'Discover premium sanitaryware solutions with J.P. Tiles Sanitaryware — where quality meets elegance for your dream spaces.');
$meta_keywords = getSetting('meta_keywords', 'tiles, sanitaryware, bathroom fittings, jaipur');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($meta_title); ?></title>
    <meta name="description" content="<?php echo htmlspecialchars($meta_description); ?>">
    <meta name="keywords" content="<?php echo htmlspecialchars($meta_keywords); ?>">
    <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" media="print" onload="this.media='all'">
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
                    <li><a href="index.php" class="active" style="font-size: 13px;">Home</a></li>
                    <li><a href="about.php" style="font-size: 13px;">About Us</a></li>
                    <li><a href="products.php" style="font-size: 13px;">Products</a></li>
                    <li><a href="gallery.php" style="font-size: 13px;">Gallery</a></li>
                    <li><a href="enquiry.php" style="font-size: 13px;">Enquiry</a></li>
                    <li><a href="contact.php" style="font-size: 13px;">Contact Us</a></li>
                </ul>
                <div class="mobile-login-buttons" style="display: none;">
                    <a href="admin/login.php" class="admin"><i class="fas fa-user-shield"></i> Admin Login</a>
                    <a href="customer/login.php" class="customer"><i class="fas fa-user"></i> Customer Login</a>
                </div>
            </nav>
            <div class="header-buttons" style="display: flex; gap: 8px; align-items: center;">
                <a href="admin/login.php" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: #c9a227; color: #fff; border-radius: 6px; font-weight: 600; font-size: 12px; text-decoration: none; transition: all 0.3s;"><i class="fas fa-user-shield"></i> Admin Login</a>
                <a href="customer/login.php" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: transparent; color: #c9a227; border: 2px solid #c9a227; border-radius: 6px; font-weight: 600; font-size: 12px; text-decoration: none; transition: all 0.3s;"><i class="fas fa-user"></i> Customer Login</a>
            </div>
            <a href="tel:<?php echo str_replace(['+', ' '], '', $phone_1); ?>" class="header-contact" style="font-size: 12px; padding: 8px 14px;">
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

    <!-- Hero Slider -->
    <section class="hero-slider">
        <?php 
        $slideIndex = 0;
        while($slide = $sliders->fetch_assoc()): 
        ?>
        <div class="slide <?php echo $slideIndex === 0 ? 'active' : ''; ?>" style="background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('<?php echo $slide['image']; ?>');">
            <div class="slide-content">
                <h1><?php echo $slide['title']; ?></h1>
                <p><?php echo $slide['subtitle']; ?></p>
                <a href="products.php" class="btn btn-primary">View More <i class="fas fa-arrow-right"></i></a>
            </div>
        </div>
        <?php 
        $slideIndex++;
        endwhile; 
        ?>
    </section>

    <!-- Categories Section -->
    <section class="categories-section">
        <div class="container">
            <div class="section-title">
                <h2>Our <span>Categories</span></h2>
                <p>Discover a wide range of high-quality products for your home</p>
            </div>
            <div class="categories-grid">
                <?php while($cat = $categories->fetch_assoc()): ?>
                <a href="products.php?category=<?php echo $cat['slug']; ?>" class="category-card">
                    <img src="<?php echo $cat['image'] ?: 'https://via.placeholder.com/400x300'; ?>" alt="<?php echo $cat['name']; ?>" loading="lazy">
                    <h3><?php echo $cat['name']; ?></h3>
                </a>
                <?php endwhile; ?>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="features-section">
        <div class="container">
            <div class="features-grid">
                <?php if ($features && $features->num_rows > 0): ?>
                    <?php while($feature = $features->fetch_assoc()): ?>
                    <div class="feature-card">
                        <i class="fas <?php echo htmlspecialchars($feature['icon']); ?>"></i>
                        <h4><?php echo htmlspecialchars($feature['title']); ?></h4>
                        <p><?php echo htmlspecialchars($feature['description']); ?></p>
                    </div>
                    <?php endwhile; ?>
                <?php else: ?>
                    <div class="feature-card">
                        <i class="fas fa-boxes"></i>
                        <h4>Wide Range</h4>
                        <p>Discover a wide range of high-quality products</p>
                    </div>
                    <div class="feature-card">
                        <i class="fas fa-truck"></i>
                        <h4>Fast Delivery</h4>
                        <p>Experience fast and reliable product delivery</p>
                    </div>
                    <div class="feature-card">
                        <i class="fas fa-tags"></i>
                        <h4>Best Prices</h4>
                        <p>Unlock the best deals with competitive pricing</p>
                    </div>
                    <div class="feature-card">
                        <i class="fas fa-headset"></i>
                        <h4>Expert Support</h4>
                        <p>Our dedicated experts are ready to assist you</p>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </section>

    <!-- Product Range Section -->
    <section class="product-range-section">
        <div class="container">
            <div class="section-title">
                <h2>Product <span>Range</span></h2>
                <p>Quality, Durability, and Style</p>
            </div>
            <div class="product-range-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px;">
                <div class="range-card" style="position: relative; height: 350px; border-radius: 15px; overflow: hidden;">
                    <img src="assets/images/collections/vanity.jpg" alt="Vanity Collection" style="width: 100%; height: 100%; object-fit: cover;">
                    <div class="range-overlay" style="position: absolute; bottom: 0; left: 0; right: 0; padding: 20px; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);">
                        <h3 style="color: #fff; margin-bottom: 10px;">Vanity Collection</h3>
                        <a href="products.php?category=bath" class="btn btn-sm" style="background: #c9a227; color: #fff; padding: 8px 20px; border-radius: 5px; text-decoration: none; font-size: 14px;">View Collection</a>
                    </div>
                </div>
                <div class="range-card" style="position: relative; height: 350px; border-radius: 15px; overflow: hidden;">
                    <img src="assets/images/collections/showers.jpg" alt="Showers Collection" style="width: 100%; height: 100%; object-fit: cover;">
                    <div class="range-overlay" style="position: absolute; bottom: 0; left: 0; right: 0; padding: 20px; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);">
                        <h3 style="color: #fff; margin-bottom: 10px;">Showers Collection</h3>
                        <a href="products.php?category=bath" class="btn btn-sm" style="background: #c9a227; color: #fff; padding: 8px 20px; border-radius: 5px; text-decoration: none; font-size: 14px;">View Collection</a>
                    </div>
                </div>
                <div class="range-card" style="position: relative; height: 350px; border-radius: 15px; overflow: hidden;">
                    <img src="assets/images/collections/basin.jpg" alt="Basin Collection" style="width: 100%; height: 100%; object-fit: cover;">
                    <div class="range-overlay" style="position: absolute; bottom: 0; left: 0; right: 0; padding: 20px; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);">
                        <h3 style="color: #fff; margin-bottom: 10px;">Basin Collection</h3>
                        <a href="products.php?category=bath" class="btn btn-sm" style="background: #c9a227; color: #fff; padding: 8px 20px; border-radius: 5px; text-decoration: none; font-size: 14px;">View Collection</a>
                    </div>
                </div>
                <div class="range-card" style="position: relative; height: 350px; border-radius: 15px; overflow: hidden;">
                    <img src="assets/images/collections/kitchen.jpg" alt="Modular Kitchen Collection" style="width: 100%; height: 100%; object-fit: cover;">
                    <div class="range-overlay" style="position: absolute; bottom: 0; left: 0; right: 0; padding: 20px; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);">
                        <h3 style="color: #fff; margin-bottom: 10px;">Modular Kitchen</h3>
                        <a href="products.php?category=kitchen" class="btn btn-sm" style="background: #c9a227; color: #fff; padding: 8px 20px; border-radius: 5px; text-decoration: none; font-size: 14px;">View Collection</a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Products Section -->
    <section class="products-section">
        <div class="container">
            <div class="section-title">
    <!-- Catalogs Section -->
    <section class="catalogs-section" id="catalogs" style="padding: 80px 5%; background: #f8f8f8;">
        <div style="text-align: center; margin-bottom: 50px;">
            <h2 style="font-size: 36px; color: #1a1a1a;">Our <span style="color: #c9a227;">Catalogs</span></h2>
            <p style="color: #666; margin-top: 10px;">Browse our product catalogs - View online or download</p>
        </div>
        
        <?php
        $catalogs_result = $conn->query("SELECT * FROM catalogs WHERE is_active = 1 ORDER BY category, sort_order, created_at DESC");
        $catalogs_by_category = [];
        while($cat = $catalogs_result->fetch_assoc()) {
            $catalogs_by_category[$cat['category']][] = $cat;
        }
        if(!empty($catalogs_by_category)):
        ?>
        
        <!-- Main Card Container -->
        <div style="max-width: 1000px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); padding: 40px; border: 1px solid #eee;">
            
            <?php $first = true; foreach($catalogs_by_category as $category => $catalogs): ?>
            <?php if(!$first): ?><div style="border-top: 1px solid #eee; margin: 30px 0;"></div><?php endif; $first = false; ?>
            
            <div style="text-align: center; margin-bottom: 25px;">
                <h3 style="font-size: 24px; color: #1a1a1a; margin-bottom: 8px; display: inline-block; position: relative;">
                    <?php echo htmlspecialchars($category); ?>
                    <span style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 50px; height: 3px; background: #c9a227; border-radius: 2px;"></span>
                </h3>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <?php foreach($catalogs as $catalog): ?>
                <div style="background: #fafafa; border-radius: 12px; padding: 20px 25px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px; border: 1px solid #f0f0f0; transition: all 0.3s ease;" onmouseover="this.style.boxShadow='0 4px 15px rgba(0,0,0,0.1)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.boxShadow='none'; this.style.transform='translateY(0)';">
                    <div style="display: flex; align-items: center; gap: 18px; flex: 1;">
                        <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #c9a227, #d4af37); border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 10px rgba(201,162,39,0.3);">
                            <i class="fas fa-file-pdf" style="font-size: 22px; color: white;"></i>
                        </div>
                        <div>
                            <h4 style="font-size: 17px; color: #1a1a1a; margin: 0; font-weight: 600;"><?php echo htmlspecialchars($catalog['title']); ?></h4>
                            <?php if($catalog['description']): ?>
                            <p style="color: #777; font-size: 14px; margin: 5px 0 0;"><?php echo htmlspecialchars($catalog['description']); ?></p>
                            <?php endif; ?>
                        </div>
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <a href="uploads/catalogs/<?php echo $catalog['pdf_file']; ?>" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 22px; background: #c9a227; color: white; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; transition: all 0.3s ease; box-shadow: 0 3px 10px rgba(201,162,39,0.3);" onmouseover="this.style.background='#b8922a'; this.style.transform='translateY(-2px)';" onmouseout="this.style.background='#c9a227'; this.style.transform='translateY(0)';">
                            <i class="fas fa-eye"></i> View
                        </a>
                        <a href="uploads/catalogs/<?php echo $catalog['pdf_file']; ?>" download style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 22px; background: #1a1a1a; color: white; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; transition: all 0.3s ease; box-shadow: 0 3px 10px rgba(0,0,0,0.2);" onmouseover="this.style.background='#333'; this.style.transform='translateY(-2px)';" onmouseout="this.style.background='#1a1a1a'; this.style.transform='translateY(0)';">
                            <i class="fas fa-download"></i> Download
                        </a>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
            <?php endforeach; ?>
            
        </div>
        <?php endif; ?>
    </section>
                <h2>Featured <span>Products</span></h2>
                <p>Explore our premium collection of sanitaryware and tiles</p>
            </div>
            <div class="products-grid">
                <?php while($product = $products->fetch_assoc()): ?>
                <div class="product-card">
                    <img src="<?php echo $product['image'] ?: 'https://via.placeholder.com/400x300'; ?>" alt="<?php echo $product['name']; ?>">
                    <div class="product-info">
                        <h4><?php echo $product['name']; ?></h4>
                        <p><?php echo $product['category_name']; ?></p>
                    </div>
                </div>
                <?php endwhile; ?>
            </div>
            <div style="text-align: center; margin-top: 40px;">
                <a href="products.php" class="btn btn-primary">View All Products</a>
            </div>
        </div>
    </section>

    <!-- About Section -->
    <section class="about-section">
        <div class="container">
            <div class="about-content">
                <div class="about-text">
                    <h2>About <span>JP Tiles</span></h2>
                    <p>At J.P. Tiles Sanitaryware, we provide a wide range of premium sanitaryware products designed to elevate your bathroom and kitchen spaces. Our collection includes everything from stylish washbasins and toilets to modern bidets and bathroom accessories.</p>
                    <p>Each product is crafted with high-quality materials for durability and long-lasting performance. We carefully select items that not only add functionality but also enhance the aesthetic appeal of your interiors.</p>
                    <a href="about.php" class="btn btn-primary">Learn More</a>
                </div>
                <div class="about-image">
                    <img src="assets/images/2-2.png" alt="About JP Tiles">
                </div>
            </div>
        </div>
    </section>

    <!-- FAQ Section -->
    <section class="faq-section">
        <div class="container">
            <div class="section-title">
                <h2>Frequently Asked <span>Questions</span></h2>
            </div>
            <div class="faq-list">
                <?php if ($faqs && $faqs->num_rows > 0): ?>
                    <?php while($faq = $faqs->fetch_assoc()): ?>
                    <div class="faq-item">
                        <div class="faq-question">
                            <span><?php echo htmlspecialchars($faq['question']); ?></span>
                            <i class="fas fa-chevron-down"></i>
                        </div>
                        <div class="faq-answer">
                            <p><?php echo htmlspecialchars($faq['answer']); ?></p>
                        </div>
                    </div>
                    <?php endwhile; ?>
                <?php else: ?>
                    <div class="faq-item">
                        <div class="faq-question">
                            <span>What types of sanitaryware products do you offer?</span>
                            <i class="fas fa-chevron-down"></i>
                        </div>
                        <div class="faq-answer">
                            <p>We offer a wide range of sanitaryware products, including washbasins, toilets, bidets, urinals, and premium bathroom accessories to meet various design and functional needs.</p>
                        </div>
                    </div>
                    <div class="faq-item">
                        <div class="faq-question">
                            <span>Are your products durable and long-lasting?</span>
                            <i class="fas fa-chevron-down"></i>
                        </div>
                        <div class="faq-answer">
                            <p>Our products are crafted from high-quality materials with advanced manufacturing techniques, ensuring long-lasting durability, stain resistance, and easy maintenance.</p>
                        </div>
                    </div>
                    <div class="faq-item">
                        <div class="faq-question">
                            <span>Can I visit your showroom to see the products?</span>
                            <i class="fas fa-chevron-down"></i>
                        </div>
                        <div class="faq-answer">
                            <p>Absolutely! We welcome you to visit our showroom, where you can explore our extensive collection of sanitaryware and get expert advice from our team.</p>
                        </div>
                    </div>
                    <div class="faq-item">
                        <div class="faq-question">
                            <span>Do you provide warranty on your products?</span>
                            <i class="fas fa-chevron-down"></i>
                        </div>
                        <div class="faq-answer">
                            <p>Yes, all our sanitaryware products come with manufacturer warranties to ensure peace of mind and product satisfaction.</p>
                        </div>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer>
        <div class="container">
            <div class="footer-grid">
                <div class="footer-col">
                    <img src="<?php echo $logo; ?>" alt="<?php echo $site_name; ?>" style="height: 60px; margin-bottom: 20px;">
                    <p><?php echo htmlspecialchars($footer_description); ?></p>
                    <div class="social-links">
                        <?php if($facebook): ?>
                        <a href="<?php echo $facebook; ?>" target="_blank"><i class="fab fa-facebook-f"></i></a>
                        <?php endif; ?>
                        <?php if($instagram): ?>
                        <a href="<?php echo $instagram; ?>" target="_blank"><i class="fab fa-instagram"></i></a>
                        <?php endif; ?>
                        <?php if($youtube_url): ?>
                        <a href="<?php echo $youtube_url; ?>" target="_blank"><i class="fab fa-youtube"></i></a>
                        <?php endif; ?>
                        <?php if($twitter_url): ?>
                        <a href="<?php echo $twitter_url; ?>" target="_blank"><i class="fab fa-twitter"></i></a>
                        <?php endif; ?>
                    </div>
                    <div class="login-buttons">
                    </div>
                </div>
                <div class="footer-col">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><a href="index.php"><i class="fas fa-chevron-right"></i> Home</a></li>
                        <li><a href="about.php"><i class="fas fa-chevron-right"></i> About Us</a></li>
                        <li><a href="products.php"><i class="fas fa-chevron-right"></i> Products</a></li>
                        <li><a href="gallery.php"><i class="fas fa-chevron-right"></i> Gallery</a></li>
                        <li><a href="contact.php"><i class="fas fa-chevron-right"></i> Contact</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Legal</h4><ul><li><a href="privacy.php">Privacy Policy</a></li><li><a href="terms.php">Terms &amp; Conditions</a></li></ul></div><div class="footer-links"><h4>Categories</h4>
                    <ul>
                        <li><a href="products.php?category=tiles"><i class="fas fa-chevron-right"></i> Tiles</a></li>
                        <li><a href="products.php?category=bath"><i class="fas fa-chevron-right"></i> Bath</a></li>
                        <li><a href="products.php?category=kitchen"><i class="fas fa-chevron-right"></i> Kitchen</a></li>
                        <li><a href="products.php?category=tile-chemical"><i class="fas fa-chevron-right"></i> Tile Chemical</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Contact Us</h4>
                    <ul>
                        <li><i class="fas fa-map-marker-alt"></i> <?php echo $address; ?></li>
                        <li><a href="tel:<?php echo str_replace(['+', ' '], '', $phone_1); ?>"><i class="fas fa-phone"></i> <?php echo $phone_1; ?></a></li>
                        <li><a href="tel:<?php echo str_replace(['+', ' '], '', $phone_2); ?>"><i class="fas fa-phone"></i> <?php echo $phone_2; ?></a></li>
                        <li><a href="mailto:<?php echo $email; ?>"><i class="fas fa-envelope"></i> <?php echo $email; ?></a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; <?php echo htmlspecialchars($copyright_text); ?></p>
            </div>
        </div>
    </footer>

    <!-- Floating Buttons -->
    <div class="floating-buttons" style="right: 20px !important; left: auto !important;">
        <a href="tel:<?php echo str_replace(['+', ' '], '', $phone_1); ?>" class="floating-btn phone">
            <i class="fas fa-phone"></i>
        </a>
        <a href="https://wa.me/<?php echo $whatsapp; ?>" target="_blank" class="floating-btn whatsapp">
            <i class="fab fa-whatsapp"></i>
        </a>
    </div>

    <script>
        // Hero Slider
        let currentSlide = 0;
        const slides = document.querySelectorAll('.slide');
        
        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.classList.remove('active');
                if (i === index) {
                    slide.classList.add('active');
                }
            });
        }
        
        function nextSlide() {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        }
        
        if (slides.length > 0) {
            setInterval(nextSlide, 5000);
        }

        // FAQ Toggle
        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', () => {
                const item = question.parentElement;
                item.classList.toggle('active');
            });
        });

        // Mobile Menu Toggle
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
