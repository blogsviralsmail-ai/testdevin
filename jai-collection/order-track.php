<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/functions.php';

$orderNumber = sanitize($_GET['order'] ?? $_POST['order'] ?? '');
$mobile = sanitize($_GET['mobile'] ?? $_POST['mobile'] ?? '');
$order = null;
$trackError = '';

$customer = currentCustomer();
if ($orderNumber) {
    // Require either (a) a logged-in customer who owns this order, or
    // (b) the shipping mobile number on file. Without this, order numbers
    // (predictable pattern JC{yymmdd}{5 chars}) could be enumerated to
    // harvest customer PII (names, cities, totals).
    $stmt = getPDO()->prepare("SELECT * FROM orders WHERE order_number = ?");
    $stmt->execute([$orderNumber]);
    $found = $stmt->fetch();
    if ($found) {
        $authorized = false;
        if ($customer && !empty($found['customer_id']) && (int)$found['customer_id'] === (int)$customer['id']) {
            $authorized = true;
        } elseif ($mobile !== '' && hash_equals((string)$found['ship_mobile'], $mobile)) {
            $authorized = true;
        }
        if ($authorized) {
            $order = $found;
        } else {
            // Do not reveal whether the order exists — same message for
            // wrong number and wrong mobile.
            $trackError = 'Order not found, or mobile number does not match.';
        }
    } else {
        $trackError = 'Order not found, or mobile number does not match.';
    }
}
$pageTitle = 'Track Order';
require_once __DIR__ . '/includes/header.php';
?>

<h1 style="font-size:22px;color:var(--jc-blue-dark);">Track Your Order</h1>

<div class="jc-panel" style="max-width:700px;">
    <form method="get" style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;">
        <input class="jc-input" name="order" placeholder="Order number e.g. JC..." value="<?php echo e($orderNumber); ?>" style="flex:1 1 200px;">
        <?php if (!$customer): ?>
        <input class="jc-input" name="mobile" placeholder="Mobile used at checkout" value="<?php echo e($mobile); ?>" style="flex:1 1 180px;">
        <?php endif; ?>
        <button class="jc-btn jc-btn-primary" type="submit">Track</button>
    </form>

    <?php if ($order): ?>
        <h3 style="color:var(--jc-blue-dark);">Order <?php echo e($order['order_number']); ?></h3>
        <p>Status: <span class="jc-badge jc-badge-<?php echo e($order['status']); ?>"><?php echo strtoupper(e($order['status'])); ?></span></p>
        <p>Payment: <span class="jc-badge jc-badge-<?php echo e($order['payment_status']); ?>"><?php echo strtoupper(e($order['payment_status'])); ?></span></p>
        <p>Placed on: <?php echo formatDateTime($order['created_at']); ?></p>
        <p>Shipping to: <?php echo e($order['ship_name']); ?>, <?php echo e($order['ship_city']); ?> - <?php echo e($order['ship_pincode']); ?></p>
        <p>Total: <strong><?php echo money($order['total']); ?></strong></p>
    <?php elseif ($trackError): ?>
        <div class="jc-alert jc-alert-error"><?php echo e($trackError); ?></div>
    <?php endif; ?>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
