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

// Get categories
$categories = $conn->query("SELECT * FROM categories WHERE status = 'active' ORDER BY parent_id IS NULL DESC, sort_order");

// Filter
$cat_filter = isset($_GET['category']) ? $_GET['category'] : '';
$search = isset($_GET['search']) ? trim($_GET['search']) : '';

$where = "p.status = 'active'";

// Pagination
$page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$per_page = 12;
$offset = ($page - 1) * $per_page;
if ($cat_filter) {
    if (is_numeric($cat_filter)) {
        // Get category and its subcategories
        $cat_id = (int)$cat_filter;
        $subcats = $conn->query("SELECT id FROM categories WHERE id = $cat_id OR parent_id = $cat_id");
        $cat_ids = [];
        while($sc = $subcats->fetch_assoc()) {
            $cat_ids[] = $sc['id'];
        }
        if (!empty($cat_ids)) {
            $where .= " AND p.category_id IN (" . implode(',', $cat_ids) . ")";
        } else {
            $where .= " AND p.category_id = $cat_id";
        }
    } else {
        // Get category by slug and include subcategories
        $slug_escaped = $conn->real_escape_string($cat_filter);
        $cat_result = $conn->query("SELECT id FROM categories WHERE slug = '$slug_escaped'");
        if ($cat_row = $cat_result->fetch_assoc()) {
            $cat_id = $cat_row['id'];
            $subcats = $conn->query("SELECT id FROM categories WHERE id = $cat_id OR parent_id = $cat_id");
            $cat_ids = [];
            while($sc = $subcats->fetch_assoc()) {
                $cat_ids[] = $sc['id'];
            }
            if (!empty($cat_ids)) {
                $where .= " AND p.category_id IN (" . implode(',', $cat_ids) . ")";
            } else {
                $where .= " AND c.slug = '$slug_escaped'";
            }
        } else {
            $where .= " AND c.slug = '$slug_escaped'";
        }
    }
}
if ($search) {
    $search_escaped = $conn->real_escape_string($search);
    $where .= " AND (p.name LIKE '%$search_escaped%' OR p.description LIKE '%$search_escaped%')";
}

// Get products
// Get total count for pagination
$count_result = $conn->query("SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE $where");
$total_products = $count_result->fetch_assoc()['total'];
$total_pages = ceil($total_products / $per_page);

// Get products with pagination
$products = $conn->query("SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE $where ORDER BY p.is_featured DESC, p.created_at DESC LIMIT $per_page OFFSET $offset");

// Get selected category name
$selectedCategory = '';
if ($cat_filter) {
    if (is_numeric($cat_filter)) {
        $catResult = $conn->query("SELECT name FROM categories WHERE id = " . (int)$cat_filter);
    } else {
        $catResult = $conn->query("SELECT name FROM categories WHERE slug = '" . $conn->real_escape_string($cat_filter) . "'");
    }
    if ($cat = $catResult->fetch_assoc()) {
        $selectedCategory = $cat['name'];
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Products - <?php echo $site_name; ?></title>
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
                    <li><a href="products.php" class="active">Products</a></li>
                    <li><a href="gallery.php">Gallery</a></li>
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
            <div class="mobile-menu-toggle" id="mobileMenuToggle" >
                <span ></span>
                <span ></span>
                <span ></span>
            </div>
        </div>
    </header>
    <div class="mobile-overlay" id="mobileOverlay"></div>

    <!-- Page Header -->
    <section class="page-header-section" style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 80px 0; text-align: center; color: white;">
        <div class="container">
            <h1><?php echo $selectedCategory ?: 'Our Products'; ?></h1>
            <p>Explore our wide range of premium quality tiles and bathroom fittings</p>
        </div>
    </section>

    <!-- Products Section -->
    <section class="products-page">
        <div class="container">
            <div class="products-layout">
                <!-- Sidebar -->
                <aside class="products-sidebar">
                    <div class="sidebar-widget">
                        <h3>Search</h3>
                        <form method="GET" class="search-form">
                            <input type="text" name="search" placeholder="Search products..." value="<?php echo htmlspecialchars($search); ?>">
                            <button type="submit"><i class="fas fa-search"></i></button>
                        </form>
                    </div>
                    <div class="sidebar-widget">
                        <h3>Categories</h3>
                        <ul class="category-list">
                            <li><a href="products.php" <?php echo !$cat_filter ? 'class="active"' : ''; ?>>All Products</a></li>
                            <?php 
                            // Get parent categories (where parent_id is NULL)
                            $parent_cats = $conn->query("SELECT * FROM categories WHERE parent_id IS NULL AND status = 'active' ORDER BY sort_order");
                            while($parent = $parent_cats->fetch_assoc()): 
                                // Check if this parent or any of its children is active
                                $parent_active = ($cat_filter == $parent['slug'] || $cat_filter == $parent['id']);
                                $child_cats = $conn->query("SELECT * FROM categories WHERE parent_id = {$parent['id']} AND status = 'active' ORDER BY sort_order");
                                $has_active_child = false;
                                $children = [];
                                while($child = $child_cats->fetch_assoc()) {
                                    $children[] = $child;
                                    if ($cat_filter == $child['slug'] || $cat_filter == $child['id']) {
                                        $has_active_child = true;
                                    }
                                }
                                $is_expanded = $parent_active || $has_active_child;
                            ?>
                            <li class="category-parent <?php echo $is_expanded ? 'expanded' : ''; ?>">
                                <div class="parent-header" onclick="toggleCategory(this)">
                                    <a href="products.php?category=<?php echo $parent['slug']; ?>" <?php echo $parent_active ? 'class="active"' : ''; ?> onclick="event.stopPropagation();"><?php echo $parent['name']; ?></a>
                                    <?php if(count($children) > 0): ?>
                                    <i class="fas fa-chevron-down toggle-icon"></i>
                                    <?php endif; ?>
                                </div>
                                <?php if(count($children) > 0): ?>
                                <ul class="subcategory-list" style="<?php echo $is_expanded ? '' : 'display: none;'; ?>">
                                    <?php foreach($children as $child): ?>
                                    <li><a href="products.php?category=<?php echo $child['slug']; ?>" <?php echo ($cat_filter == $child['slug'] || $cat_filter == $child['id']) ? 'class="active"' : ''; ?>><?php echo $child['name']; ?></a></li>
                                    <?php endforeach; ?>
                                </ul>
                                <?php endif; ?>
                            </li>
                            <?php endwhile; ?>
                        </ul>
                    </div>
                </aside>

                <!-- Products Grid -->
                <div class="products-main">
                    <div class="products-grid">
                        <?php if($products->num_rows > 0): ?>
                            <?php while($product = $products->fetch_assoc()): ?>
                            <div class="product-card">
                                <img src="<?php echo $product['image'] ?: 'https://via.placeholder.com/400x300'; ?>" alt="<?php echo $product['name']; ?>" loading="lazy">
                                <div class="product-info">
                                    <h4><?php echo $product['name']; ?></h4>
                                    <p><?php echo $product['category_name']; ?></p>
                                    <a href="enquiry.php?product=<?php echo urlencode($product['name']); ?>" class="btn btn-primary btn-sm">Enquire Now</a>
                                </div>
                            </div>
                            <?php endwhile; ?>
                        <?php else: ?>
                            <div class="no-products">
                                <i class="fas fa-box-open"></i>
                                <h3>No products found</h3>
                                <p>Try adjusting your search or filter criteria</p>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    </section>

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

    <script>
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
        
        // Category dropdown toggle
        function toggleCategory(element) {
            const parent = element.closest('.category-parent');
            const sublist = parent.querySelector('.subcategory-list');
            if (sublist) {
                if (sublist.style.display === 'none') {
                    sublist.style.display = 'block';
                    parent.classList.add('expanded');
                } else {
                    sublist.style.display = 'none';
                    parent.classList.remove('expanded');
                }
            }
        }
    </script>
    <style>
        .floating-buttons { position: fixed !important; bottom: 20px !important; right: 20px !important; left: auto !important; }
        .mobile-menu-toggle { display: none; }
        @media (max-width: 992px) { header nav { position: fixed !important; top: 0 !important; left: -100% !important; width: 80% !important; max-width: 300px !important; height: 100vh !important; background: #1a1a1a !important; padding: 80px 20px 20px !important; transition: left 0.3s ease !important; z-index: 1000 !important; } header nav.active { left: 0 !important; } header nav ul { flex-direction: column !important; display: flex !important; } header nav ul li a { display: block !important; padding: 15px 0 !important; border-bottom: 1px solid rgba(255,255,255,0.1) !important; color: white !important; } .mobile-menu-toggle { display: flex !important; flex-direction: column !important; gap: 5px !important; cursor: pointer !important; padding: 10px !important; } .mobile-menu-toggle span { width: 25px !important; height: 3px !important; background: white !important; display: block !important; } }
        .products-sidebar { background: #f8f8f8 !important; padding: 25px !important; border-radius: 12px !important; }
        .category-list { list-style: none !important; padding: 0 !important; margin: 0 !important; }
        .category-list > li > a { display: block !important; padding: 12px 15px !important; color: #333 !important; text-decoration: none !important; border-radius: 6px !important; transition: all 0.3s ease !important; }
        .category-list > li > a:hover, .category-list > li > a.active { background: #c9a227 !important; color: white !important; }
        .category-parent { margin-bottom: 5px !important; }
        .parent-header { display: flex !important; align-items: center !important; justify-content: space-between !important; cursor: pointer !important; padding: 12px 15px !important; border-radius: 6px !important; transition: all 0.3s ease !important; }
        .parent-header:hover { background: #eee !important; }
        .parent-header a { flex: 1 !important; color: #333 !important; text-decoration: none !important; font-weight: 500 !important; padding: 0 !important; }
        .parent-header a.active { color: #c9a227 !important; font-weight: 600 !important; }
        .parent-header a:hover { background: transparent !important; }
        .toggle-icon { color: #999 !important; font-size: 12px !important; transition: transform 0.3s ease !important; }
        .category-parent.expanded .toggle-icon { transform: rotate(180deg) !important; }
        .subcategory-list { list-style: none !important; padding: 0 !important; margin: 5px 0 0 15px !important; border-left: 2px solid #e0e0e0 !important; }
        .subcategory-list li a { display: block !important; padding: 10px 15px !important; color: #666 !important; text-decoration: none !important; font-size: 14px !important; transition: all 0.3s ease !important; }
        .subcategory-list li a:hover { color: #c9a227 !important; padding-left: 20px !important; }
        .subcategory-list li a.active { color: #c9a227 !important; font-weight: 600 !important; background: rgba(201,162,39,0.1) !important; border-radius: 4px !important; }
        .search-form { display: flex !important; border: 2px solid #e0e0e0 !important; border-radius: 8px !important; overflow: hidden !important; background: white !important; }
        .search-form input { flex: 1 !important; padding: 12px 15px !important; border: none !important; outline: none !important; }
        .search-form button { background: #c9a227 !important; color: white !important; border: none !important; padding: 12px 18px !important; cursor: pointer !important; }
        .sidebar-widget h3 { font-size: 18px !important; font-weight: 600 !important; color: #1a1a1a !important; margin-bottom: 15px !important; padding-bottom: 10px !important; border-bottom: 2px solid #c9a227 !important; }
        .btn-sm { padding: 8px 16px; font-size: 13px; }
        .no-products { text-align: center; padding: 60px 20px; grid-column: 1/-1; }
        .no-products i { font-size: 60px; color: var(--primary-color); margin-bottom: 20px; }
        .no-products h3 { margin-bottom: 10px; }
        .no-products p { color: var(--text-light); }
        .products-main { width: 100%; }
    </style>
</body>
</html>
<?php $conn->close(); ?>
