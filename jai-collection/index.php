<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/functions.php';

$pageTitle = 'Home';
require_once __DIR__ . '/includes/header.php';

$featured = getProducts(['only_active' => 1, 'is_featured' => 1, 'limit' => 12]);
$latest = getProducts(['only_active' => 1, 'limit' => 12]);
$allCats = getCategories(true, 0);

// Banners
$banners = getPDO()->query("SELECT * FROM banners WHERE status = 'active' ORDER BY sort_order, id LIMIT 5")->fetchAll();
?>

<section class="jc-hero" style="border-radius:12px;overflow:hidden;padding:0;margin-top:10px;">
    <?php if ($banners): $b = $banners[0]; ?>
        <a href="<?php echo e($b['link'] ?: '#'); ?>" style="display:block;">
            <img src="<?php echo e(productImageUrl($b['image'])); ?>" alt="<?php echo e($b['title']); ?>" style="width:100%;max-height:360px;object-fit:cover;">
        </a>
    <?php else: ?>
        <div style="padding:60px 20px;">
            <h1>Welcome to <?php echo e(getSetting('site_name', SITE_NAME)); ?></h1>
            <p><?php echo e(getSetting('site_tagline', SITE_TAGLINE)); ?></p>
            <a href="<?php echo e(SITE_URL); ?>/products.php" class="jc-btn jc-btn-secondary" style="margin-top:16px;">Shop Now</a>
        </div>
    <?php endif; ?>
</section>

<div class="jc-section-title">
    <h2>Shop by Category</h2>
    <a href="<?php echo e(SITE_URL); ?>/categories.php">View All <i class="fas fa-arrow-right"></i></a>
</div>
<div class="jc-cat-tiles">
    <?php foreach (array_slice($allCats, 0, 14) as $c): ?>
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
