<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/functions.php';

$orderNumber = sanitize($_GET['order'] ?? $_POST['order'] ?? '');
$order = null;
if ($orderNumber) {
    $stmt = getPDO()->prepare("SELECT * FROM orders WHERE order_number = ?");
    $stmt->execute([$orderNumber]);
    $order = $stmt->fetch();
}
$pageTitle = 'Track Order';
require_once __DIR__ . '/includes/header.php';
?>

<h1 style="font-size:22px;color:var(--jc-blue-dark);">Track Your Order</h1>

<div class="jc-panel" style="max-width:700px;">
    <form method="get" style="display:flex;gap:10px;margin-bottom:20px;">
        <input class="jc-input" name="order" placeholder="Enter order number e.g. JC..." value="<?php echo e($orderNumber); ?>">
        <button class="jc-btn jc-btn-primary" type="submit">Track</button>
    </form>

    <?php if ($order): ?>
        <h3 style="color:var(--jc-blue-dark);">Order <?php echo e($order['order_number']); ?></h3>
        <p>Status: <span class="jc-badge jc-badge-<?php echo e($order['status']); ?>"><?php echo strtoupper(e($order['status'])); ?></span></p>
        <p>Payment: <span class="jc-badge jc-badge-<?php echo e($order['payment_status']); ?>"><?php echo strtoupper(e($order['payment_status'])); ?></span></p>
        <p>Placed on: <?php echo formatDateTime($order['created_at']); ?></p>
        <p>Shipping to: <?php echo e($order['ship_name']); ?>, <?php echo e($order['ship_city']); ?> - <?php echo e($order['ship_pincode']); ?></p>
        <p>Total: <strong><?php echo money($order['total']); ?></strong></p>
    <?php elseif ($orderNumber): ?>
        <div class="jc-alert jc-alert-error">Order not found. Please check the order number.</div>
    <?php endif; ?>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
