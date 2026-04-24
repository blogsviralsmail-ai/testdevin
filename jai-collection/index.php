<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/functions.php';

$pageTitle = 'Home';
require_once __DIR__ . '/includes/header.php';

$featured = getProducts(['only_active' => 1, 'is_featured' => 1, 'limit' => 12]);
$hot = getProducts(['only_active' => 1, 'is_hot' => 1, 'limit' => 12]);
$latest = getProducts(['only_active' => 1, 'limit' => 12]);

// Parent categories (tiles on home). Show all active parents; the /categories.php
// page shows the full tree including sub-categories.
$allCats = getCategories(true, 0);

$banners = getPDO()->query("SELECT * FROM banners WHERE status = 'active' ORDER BY sort_order, id LIMIT 6")->fetchAll();
$hotBlinkEnabled = getSetting('enable_hot_blink', '1') === '1';
$heading = getSetting('homepage_heading', 'Welcome to ' . SITE_NAME);
$subheading = getSetting('homepage_subheading', SITE_TAGLINE);
?>

<?php if ($banners): ?>
<div class="jc-hero-carousel">
    <div class="jc-hero-track">
        <?php foreach ($banners as $b): $img = productImageUrl($b['image']); ?>
            <div class="jc-hero-slide" style="background-image:url('<?php echo e($img); ?>');">
                <div class="container jc-hero-slide-body">
                    <h2><?php echo e($b['title'] ?: $heading); ?></h2>
                    <?php if (!empty($b['subtitle'])): ?><p><?php echo e($b['subtitle']); ?></p><?php endif; ?>
                    <a href="<?php echo e($b['link'] ?: SITE_URL . '/categories.php'); ?>" class="jc-btn jc-btn-primary"><?php echo e($b['button_text'] ?: 'Shop Now'); ?></a>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
    <?php if (count($banners) > 1): ?>
    <button class="jc-hero-arrow prev" aria-label="Previous"><i class="fas fa-chevron-left"></i></button>
    <button class="jc-hero-arrow next" aria-label="Next"><i class="fas fa-chevron-right"></i></button>
    <div class="jc-hero-dots">
        <?php foreach ($banners as $i => $b): ?>
            <button class="<?php echo $i===0 ? 'is-active' : ''; ?>" aria-label="Slide <?php echo $i+1; ?>"></button>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>
</div>
<?php else: ?>
<section class="jc-hero-carousel" style="background: linear-gradient(135deg,#f26722,#e53935);">
    <div class="jc-hero-track"><div class="jc-hero-slide" style="min-height:320px;">
        <div class="container jc-hero-slide-body">
            <h2><?php echo e($heading); ?></h2>
            <p><?php echo e($subheading); ?></p>
            <a href="<?php echo e(SITE_URL); ?>/products.php" class="jc-btn jc-btn-primary">Shop Now</a>
        </div>
    </div></div>
</section>
<?php endif; ?>

<div class="jc-section-title">
    <h2>Shop by Category</h2>
    <a href="<?php echo e(SITE_URL); ?>/categories.php">View All <i class="fas fa-arrow-right"></i></a>
</div>
<div class="jc-cat-tiles">
    <?php foreach ($allCats as $c): ?>
        <a class="jc-cat-tile" href="<?php echo e(SITE_URL); ?>/category.php?slug=<?php echo e($c['slug']); ?>">
            <div class="jc-cat-tile-img">
                <?php if (!empty($c['image'])): ?>
                    <img src="<?php echo e(productImageUrl($c['image'])); ?>" alt="<?php echo e($c['name']); ?>">
                <?php else: ?>
                    <i class="fas fa-tag"></i>
                <?php endif; ?>
            </div>
            <span><?php echo e($c['name']); ?></span>
        </a>
    <?php endforeach; ?>
</div>

<?php if ($hot && $hotBlinkEnabled): ?>
<div class="jc-hot-strip">
    <div class="jc-hot-blink"><span class="dot"></span> HOT DEALS &mdash; Limited Time Only!</div>
    <a href="<?php echo e(SITE_URL); ?>/products.php?filter=hot" class="jc-btn" style="background:#fff;color:#e53935;border:0;">View All Hot</a>
</div>
<div class="jc-grid">
    <?php foreach ($hot as $p): $isHot = true; ?>
        <?php include __DIR__ . '/includes/_product_card.php'; ?>
    <?php endforeach; $isHot = false; ?>
</div>
<?php endif; ?>

<?php if ($featured): ?>
<div class="jc-section-title">
    <h2><i class="fas fa-star" style="color:#f5a623;"></i> Featured Products</h2>
    <a href="<?php echo e(SITE_URL); ?>/products.php">View All</a>
</div>
<div class="jc-grid">
    <?php foreach ($featured as $p): ?>
        <?php include __DIR__ . '/includes/_product_card.php'; ?>
    <?php endforeach; ?>
</div>
<?php endif; ?>

<div class="jc-section-title">
    <h2>Latest Arrivals</h2>
    <a href="<?php echo e(SITE_URL); ?>/products.php">View All</a>
</div>
<div class="jc-grid">
    <?php foreach ($latest as $p): ?>
        <?php include __DIR__ . '/includes/_product_card.php'; ?>
    <?php endforeach; ?>
    <?php if (!$latest): ?>
        <p style="grid-column:1/-1;color:#888;">No products yet. Admin can add products from the admin panel.</p>
    <?php endif; ?>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
