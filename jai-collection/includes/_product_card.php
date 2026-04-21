<?php
// Expects $p (product row) in scope
$off = null;
if (!empty($p['compare_price']) && $p['compare_price'] > $p['price']) {
    $off = round((($p['compare_price'] - $p['price']) / $p['compare_price']) * 100);
}
?>
<a class="jc-card" href="<?php echo e(SITE_URL); ?>/product.php?slug=<?php echo e($p['slug']); ?>">
    <div class="jc-card-img">
        <img src="<?php echo e(productImageUrl($p['image'])); ?>" alt="<?php echo e($p['name']); ?>" loading="lazy">
    </div>
    <div class="jc-card-body">
        <h3><?php echo e($p['name']); ?></h3>
        <div style="margin-top:auto;">
            <span class="jc-price"><?php echo money($p['price']); ?></span>
            <?php if (!empty($p['compare_price']) && $p['compare_price'] > $p['price']): ?>
                <span class="jc-price-old"><?php echo money($p['compare_price']); ?></span>
                <?php if ($off): ?><span class="jc-price-off"><?php echo $off; ?>% off</span><?php endif; ?>
            <?php endif; ?>
        </div>
    </div>
</a>
