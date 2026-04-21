<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/functions.php';
$pageTitle = 'All Categories';
$parents = getCategories(true, 0);
$pdo = getPDO();
require_once __DIR__ . '/includes/header.php';
?>
<div class="jc-section-title"><h2>Browse by Category</h2></div>

<?php foreach ($parents as $parent):
    $children = $pdo->prepare("SELECT * FROM categories WHERE parent_id = ? AND status='active' ORDER BY sort_order, name");
    $children->execute([$parent['id']]);
    $children = $children->fetchAll();
?>
<div class="jc-panel" style="padding:18px;margin-bottom:18px;border-radius:14px;background:#fff;box-shadow:0 6px 16px rgba(13,45,102,.08);">
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">
        <div class="jc-cat-tile-img" style="width:54px;height:54px;margin:0;">
            <?php if (!empty($parent['image'])): ?><img src="<?php echo e(productImageUrl($parent['image'])); ?>" alt=""><?php else: ?><i class="fas fa-tags"></i><?php endif; ?>
        </div>
        <h3 style="margin:0;color:#0d2d66;"><?php echo e($parent['name']); ?></h3>
        <a href="<?php echo e(SITE_URL); ?>/category.php?slug=<?php echo e($parent['slug']); ?>" style="margin-left:auto;font-size:13px;">View all &rarr;</a>
    </div>
    <div class="jc-cat-tiles">
        <?php foreach ($children as $c): ?>
            <a class="jc-cat-tile" href="<?php echo e(SITE_URL); ?>/category.php?slug=<?php echo e($c['slug']); ?>">
                <div class="jc-cat-tile-img">
                    <?php if (!empty($c['image'])): ?><img src="<?php echo e(productImageUrl($c['image'])); ?>" alt=""><?php else: ?><i class="fas fa-tag"></i><?php endif; ?>
                </div>
                <span><?php echo e($c['name']); ?></span>
            </a>
        <?php endforeach; ?>
        <?php if (!$children): ?><div style="color:#888;font-size:13px;">No sub-categories yet.</div><?php endif; ?>
    </div>
</div>
<?php endforeach; ?>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
