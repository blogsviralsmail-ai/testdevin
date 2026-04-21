<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/functions.php';

$orderNumber = sanitize($_GET['order'] ?? '');
$stmt = getPDO()->prepare("SELECT * FROM orders WHERE order_number = ?");
$stmt->execute([$orderNumber]);
$order = $stmt->fetch();
if (!$order) { http_response_code(404); die('Order not found'); }

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
