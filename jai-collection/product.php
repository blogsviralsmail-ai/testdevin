<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/functions.php';

$slug = sanitize($_GET['slug'] ?? '');
$product = $slug ? getProductBySlug($slug) : null;
if (!$product || $product['status'] !== 'active') { http_response_code(404); die('Product not found'); }

$variants = getProductVariants($product['id']);
$images = getProductImages($product['id']);
$selectedVariant = $variants ? $variants[0] : null;
$price = productEffectivePrice($product, $selectedVariant);

$pageTitle = $product['name'];
require_once __DIR__ . '/includes/header.php';
?>

<nav style="font-size:13px;color:#666;margin-bottom:14px;">
    <a href="<?php echo e(SITE_URL); ?>/">Home</a> &raquo;
    <?php if ($product['category_slug']): ?>
        <a href="<?php echo e(SITE_URL); ?>/category.php?slug=<?php echo e($product['category_slug']); ?>"><?php echo e($product['category_name']); ?></a> &raquo;
    <?php endif; ?>
    <span><?php echo e($product['name']); ?></span>
</nav>

<div class="jc-pd">
    <div class="jc-pd-gallery">
        <img data-main-image src="<?php echo e(productImageUrl($product['image'])); ?>" alt="<?php echo e($product['name']); ?>">
        <?php if ($images): ?>
            <div class="jc-pd-thumbs">
                <img data-thumb class="active" src="<?php echo e(productImageUrl($product['image'])); ?>" alt="">
                <?php foreach ($images as $img): ?>
                    <img data-thumb src="<?php echo e(productImageUrl($img['image'])); ?>" alt="">
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>

    <div class="jc-pd-info">
        <h1><?php echo e($product['name']); ?></h1>
        <?php if ($product['sku']): ?>
            <div style="color:#888;font-size:12px;">SKU: <?php echo e($product['sku']); ?></div>
        <?php endif; ?>
        <div class="jc-pd-price" data-variant-price><?php echo money($price); ?></div>
        <?php if (!empty($product['compare_price']) && $product['compare_price'] > $product['price']): ?>
            <div style="margin-top:-8px;">
                <span class="jc-price-old" style="font-size:14px;"><?php echo money($product['compare_price']); ?></span>
                <?php $off = round((($product['compare_price'] - $product['price']) / $product['compare_price']) * 100); ?>
                <span class="jc-price-off" style="font-size:13px;"><?php echo $off; ?>% off</span>
            </div>
        <?php endif; ?>

        <?php if ($product['short_description']): ?>
            <p style="color:#555;margin-top:14px;"><?php echo e($product['short_description']); ?></p>
        <?php endif; ?>

        <form method="post" action="<?php echo e(SITE_URL); ?>/cart.php" style="margin-top:20px;">
            <?php echo csrfField(); ?>
            <input type="hidden" name="action" value="add">
            <input type="hidden" name="product_id" value="<?php echo (int)$product['id']; ?>">
            <input type="hidden" name="variant_id" value="<?php echo $selectedVariant ? (int)$selectedVariant['id'] : ''; ?>">

            <?php if ($variants):
                // Group variants by size then color
                $sizes = [];
                foreach ($variants as $v) { if ($v['size']) $sizes[$v['size']] = true; }
                $colors = [];
                foreach ($variants as $v) { if ($v['color']) $colors[$v['color']] = true; }
            ?>
                <div class="jc-variant-group" data-variant-group>
                    <label>Choose variant</label>
                    <div class="jc-variant-opts">
                        <?php foreach ($variants as $i => $v):
                            $label = variantLabel($v) ?: ('Option ' . ($i+1));
                            $vp = productEffectivePrice($product, $v);
                        ?>
                            <button type="button"
                                data-variant-id="<?php echo (int)$v['id']; ?>"
                                data-price="<?php echo e(money($vp)); ?>"
                                <?php if ($i === 0) echo 'class="active"'; ?>
                                <?php if ((int)$v['stock'] <= 0) echo 'disabled'; ?>>
                                <?php echo e($label); ?>
                                <?php if ((int)$v['stock'] <= 0) echo ' (Out)'; ?>
                            </button>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endif; ?>

            <div class="jc-variant-group">
                <label>Quantity</label>
                <div class="jc-qty">
                    <button type="button" data-qty="-1">-</button>
                    <input type="number" name="qty" value="1" min="1" max="20">
                    <button type="button" data-qty="1">+</button>
                </div>
            </div>

            <div style="display:flex;gap:10px;margin-top:20px;">
                <button type="submit" class="jc-btn jc-btn-primary" style="flex:1;">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                </button>
                <button type="submit" name="buy_now" value="1" class="jc-btn jc-btn-secondary" style="flex:1;">
                    <i class="fas fa-bolt"></i> Buy Now
                </button>
            </div>
        </form>

        <?php if ($product['description']): ?>
            <div style="margin-top:30px;padding-top:20px;border-top:1px solid #eee;">
                <h3 style="font-size:16px;color:var(--jc-blue-dark);">Description</h3>
                <div style="color:#555;"><?php echo nl2br(e($product['description'])); ?></div>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
