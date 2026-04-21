<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/functions.php';

$orderNumber = sanitize($_GET['order'] ?? '');
$stmt = getPDO()->prepare("SELECT * FROM orders WHERE order_number = ?");
$stmt->execute([$orderNumber]);
$order = $stmt->fetch();
if (!$order) { http_response_code(404); die('Order not found'); }

// Access control: order numbers follow a predictable JC{yymmdd}{5 chars} pattern
// so we can't treat "knowing the number" as proof of ownership. Allow the
// success page to render only when:
//   (a) the viewer is the customer that owns the order, or
//   (b) checkout.php / api/rogerpay-callback.php just whitelisted this order
//       for the current session (guest checkout case), or
//   (c) the correct checkout mobile is supplied via ?mobile=... (fallback so a
//       user who lost their session can still retrieve their confirmation).
$customer = currentCustomer();
$sessionWhitelist = $_SESSION['jc_order_confirm'] ?? [];
if (!is_array($sessionWhitelist)) $sessionWhitelist = [$sessionWhitelist];
$mobileIn = sanitize($_GET['mobile'] ?? $_POST['mobile'] ?? '');

$authorized = false;
if ($customer && !empty($order['customer_id']) && (int)$order['customer_id'] === (int)$customer['id']) {
    $authorized = true;
} elseif (in_array($orderNumber, $sessionWhitelist, true)) {
    $authorized = true;
} elseif ($mobileIn !== '' && hash_equals((string)$order['ship_mobile'], $mobileIn)) {
    $authorized = true;
}

if (!$authorized) {
    // Do not leak existence: require the checkout mobile (same pattern as
    // order-track.php). Show a minimal form and stop rendering the details.
    $pageTitle = 'Order Confirmation';
    require_once __DIR__ . '/includes/header.php';
    echo '<div class="jc-panel" style="max-width:600px;margin:20px auto;">';
    echo '<h2 style="color:var(--jc-blue-dark);margin-top:0;">View Order</h2>';
    echo '<p>Enter the mobile number you used at checkout to view this order.</p>';
    echo '<form method="get" style="display:flex;gap:10px;flex-wrap:wrap;">';
    echo '<input type="hidden" name="order" value="' . e($orderNumber) . '">';
    echo '<input class="jc-input" name="mobile" placeholder="Checkout mobile" value="' . e($mobileIn) . '" style="flex:1 1 200px;">';
    echo '<button class="jc-btn jc-btn-primary" type="submit">View Order</button>';
    echo '</form>';
    if ($mobileIn !== '') {
        echo '<div class="jc-alert jc-alert-error" style="margin-top:14px;">Mobile does not match this order.</div>';
    }
    echo '</div>';
    require_once __DIR__ . '/includes/footer.php';
    exit;
}

$items = getPDO()->prepare("SELECT * FROM order_items WHERE order_id = ?");
$items->execute([$order['id']]);
$items = $items->fetchAll();

$pageTitle = 'Order ' . $order['order_number'];
require_once __DIR__ . '/includes/header.php';
?>

<div class="jc-panel" style="text-align:center;max-width:600px;margin:0 auto;">
    <?php if ($order['payment_status'] === 'paid' || $order['payment_method'] === 'cod'): ?>
        <div style="font-size:56px;color:#2a9d2a;margin-bottom:10px;"><i class="fas fa-check-circle"></i></div>
        <h2 style="color:var(--jc-blue-dark);">Thank you! Order Confirmed</h2>
    <?php elseif ($order['payment_status'] === 'failed'): ?>
        <div style="font-size:56px;color:#e53935;margin-bottom:10px;"><i class="fas fa-times-circle"></i></div>
        <h2 style="color:#8a1a1a;">Payment Failed</h2>
        <p style="color:#888;">Your order was placed but payment did not go through. Please contact us to retry.</p>
    <?php else: ?>
        <div style="font-size:56px;color:#f5a623;margin-bottom:10px;"><i class="fas fa-clock"></i></div>
        <h2 style="color:var(--jc-blue-dark);">Order Placed</h2>
        <p style="color:#888;">Your payment is pending confirmation.</p>
    <?php endif; ?>
    <p>Order Number: <strong><?php echo e($order['order_number']); ?></strong></p>
    <p>Total: <strong><?php echo money($order['total']); ?></strong></p>
    <p>Payment: <strong><?php echo strtoupper(e($order['payment_method'])); ?></strong> / <span class="jc-badge jc-badge-<?php echo e($order['payment_status']); ?>"><?php echo e($order['payment_status']); ?></span></p>
    <div style="text-align:left;margin-top:20px;">
        <h4 style="color:var(--jc-blue-dark);">Items</h4>
        <ul style="list-style:none;padding:0;">
            <?php foreach ($items as $it): ?>
                <li style="padding:8px 0;border-bottom:1px solid #eee;">
                    <?php echo e($it['product_name']); ?>
                    <?php if ($it['variant_label']): ?><small style="color:#888;">(<?php echo e($it['variant_label']); ?>)</small><?php endif; ?>
                    &times; <?php echo (int)$it['qty']; ?>
                    <span style="float:right;"><?php echo money($it['line_total']); ?></span>
                </li>
            <?php endforeach; ?>
        </ul>
    </div>
    <div style="margin-top:20px;">
        <a href="<?php echo e(SITE_URL); ?>/" class="jc-btn jc-btn-primary">Continue Shopping</a>
        <a href="<?php echo e(SITE_URL); ?>/order-track.php?order=<?php echo e($order['order_number']); ?>" class="jc-btn jc-btn-outline">Track Order</a>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
