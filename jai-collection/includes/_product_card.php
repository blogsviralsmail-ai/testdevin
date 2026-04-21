<?php
// Expects $p (product row) in scope. Optional $isHot forces hot badge.
$off = null;
if (!empty($p['compare_price']) && $p['compare_price'] > $p['price']) {
    $off = round((($p['compare_price'] - $p['price']) / $p['compare_price']) * 100);
}
$showHot = !empty($isHot) || !empty($p['is_hot']);
?>
<div class="jc-product-card">
    <?php if (!empty($p['is_featured'])): ?><span class="jc-badge-ribbon"><i class="fas fa-star"></i> Featured</span><?php endif; ?>
    <?php if ($showHot): ?><span class="jc-hot-badge">🔥 Hot</span><?php endif; ?>
    <a class="jc-product-img" href="<?php echo e(SITE_URL); ?>/product.php?slug=<?php echo e($p['slug']); ?>">
        <img src="<?php echo e(productImageUrl($p['image'])); ?>" alt="<?php echo e($p['name']); ?>" loading="lazy">
    </a>
    <div class="jc-product-body">
        <a class="jc-product-name" href="<?php echo e(SITE_URL); ?>/product.php?slug=<?php echo e($p['slug']); ?>"><?php echo e($p['name']); ?></a>
        <div style="margin-top:auto;">
            <span class="jc-product-price"><?php echo money($p['price']); ?></span>
            <?php if (!empty($p['compare_price']) && $p['compare_price'] > $p['price']): ?>
                <span class="jc-product-compare"><?php echo money($p['compare_price']); ?></span>
                <?php if ($off): ?><span style="color:#2a9d2a;font-size:12px;font-weight:600;margin-left:4px;"><?php echo $off; ?>% off</span><?php endif; ?>
            <?php endif; ?>
        </div>
    </div>
</div>
