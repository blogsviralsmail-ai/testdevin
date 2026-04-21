<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/functions.php';
$pageTitle = 'Categories';
$cats = getCategories(true, 0);
require_once __DIR__ . '/includes/header.php';
?>
<div class="jc-section-title"><h2>All Categories</h2></div>
<div class="jc-cat-tiles">
    <?php foreach ($cats as $c): ?>
        <a class="jc-cat-tile" href="<?php echo e(SITE_URL); ?>/category.php?slug=<?php echo e($c['slug']); ?>">
            <div class="jc-cat-tile-img">
                <?php if ($c['image']): ?><img src="<?php echo e(productImageUrl($c['image'])); ?>"><?php else: ?><i class="fas fa-tag"></i><?php endif; ?>
            </div>
            <span><?php echo e($c['name']); ?></span>
        </a>
    <?php endforeach; ?>
</div>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
