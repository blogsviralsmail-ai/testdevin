<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrfVerify();
    $action = $_POST['action'] ?? '';
    if ($action === 'add') {
        $pid = (int)($_POST['product_id'] ?? 0);
        $vid = $_POST['variant_id'] !== '' ? (int)$_POST['variant_id'] : null;
        $qty = max(1, (int)($_POST['qty'] ?? 1));
        if ($pid) {
            cartAdd($pid, $vid, $qty);
            setFlash('success', 'Added to cart.');
        }
        if (!empty($_POST['buy_now'])) { redirect(SITE_URL . '/checkout.php'); }
        redirect(SITE_URL . '/cart.php');
    } elseif ($action === 'update') {
        $key = $_POST['key'] ?? '';
        $qty = (int)($_POST['qty'] ?? 1);
        cartUpdate($key, $qty);
        redirect(SITE_URL . '/cart.php');
    } elseif ($action === 'remove') {
        $key = $_POST['key'] ?? '';
        cartRemove($key);
        setFlash('info', 'Item removed.');
        redirect(SITE_URL . '/cart.php');
    } elseif ($action === 'clear') {
        cartClear();
        redirect(SITE_URL . '/cart.php');
    }
}

$pageTitle = 'Cart';
require_once __DIR__ . '/includes/header.php';
$cart = cartResolved();
$ship = calcShipping($cart['subtotal']);
$total = $cart['subtotal'] + $ship;
?>

<h1 style="font-size:22px;color:var(--jc-blue-dark);">Your Cart</h1>

<?php if (!$cart['items']): ?>
    <div class="jc-panel" style="text-align:center;padding:50px 20px;">
        <i class="fas fa-shopping-cart" style="font-size:48px;color:#ccc;"></i>
        <h3 style="margin-top:10px;">Your cart is empty</h3>
        <p style="color:#888;">Add some products to get started.</p>
        <a href="<?php echo e(SITE_URL); ?>/" class="jc-btn jc-btn-primary">Continue Shopping</a>
    </div>
<?php else: ?>
<div class="jc-checkout">
    <div class="jc-panel" style="padding:0;">
        <table class="jc-table">
            <thead><tr><th>Item</th><th>Price</th><th>Qty</th><th>Total</th><th></th></tr></thead>
            <tbody>
            <?php foreach ($cart['items'] as $item): ?>
                <tr>
                    <td>
                        <div style="display:flex;gap:12px;align-items:center;">
                            <img src="<?php echo e(productImageUrl($item['product']['image'])); ?>" style="width:60px;height:60px;object-fit:cover;border-radius:6px;">
                            <div>
                                <a href="<?php echo e(SITE_URL); ?>/product.php?slug=<?php echo e($item['product']['slug']); ?>" style="font-weight:500;">
                                    <?php echo e($item['product']['name']); ?>
                                </a>
                                <?php if ($item['variant']): ?>
                                    <div style="font-size:12px;color:#888;"><?php echo e(variantLabel($item['variant'])); ?></div>
                                <?php endif; ?>
                            </div>
                        </div>
                    </td>
                    <td><?php echo money($item['price']); ?></td>
                    <td>
                        <form method="post" style="display:inline-flex;align-items:center;gap:4px;">
                            <?php echo csrfField(); ?>
                            <input type="hidden" name="action" value="update">
                            <input type="hidden" name="key" value="<?php echo e($item['key']); ?>">
                            <input type="number" name="qty" value="<?php echo $item['qty']; ?>" min="0" max="50" style="width:60px;padding:4px;text-align:center;" class="jc-input">
                            <button class="jc-btn jc-btn-outline jc-btn-sm" type="submit">Update</button>
                        </form>
                    </td>
                    <td><strong><?php echo money($item['line_total']); ?></strong></td>
                    <td>
                        <form method="post">
                            <?php echo csrfField(); ?>
                            <input type="hidden" name="action" value="remove">
                            <input type="hidden" name="key" value="<?php echo e($item['key']); ?>">
                            <button class="jc-btn jc-btn-sm" style="background:#fdecec;color:#8a1a1a;" data-confirm="Remove this item?"><i class="fas fa-trash"></i></button>
                        </form>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>

    <aside class="jc-panel jc-order-summary">
        <h3 style="margin-top:0;color:var(--jc-blue-dark);">Order Summary</h3>
        <div class="jc-summary-line"><span>Subtotal (<?php echo $cart['count']; ?> items)</span><span><?php echo money($cart['subtotal']); ?></span></div>
        <div class="jc-summary-line"><span>Shipping</span><span><?php echo $ship > 0 ? money($ship) : 'FREE'; ?></span></div>
        <div class="jc-summary-line jc-summary-total"><span>Total</span><span><?php echo money($total); ?></span></div>
        <a href="<?php echo e(SITE_URL); ?>/checkout.php" class="jc-btn jc-btn-primary jc-btn-block" style="margin-top:16px;">
            <i class="fas fa-lock"></i> Proceed to Checkout
        </a>
        <a href="<?php echo e(SITE_URL); ?>/" class="jc-btn jc-btn-outline jc-btn-block" style="margin-top:10px;">Continue Shopping</a>
    </aside>
</div>
<?php endif; ?>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
