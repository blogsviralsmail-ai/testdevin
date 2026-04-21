<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/functions.php';
requireCustomer();
$customer = currentCustomer();

$stmt = getPDO()->prepare("SELECT * FROM orders WHERE customer_id = ? ORDER BY id DESC");
$stmt->execute([$customer['id']]);
$orders = $stmt->fetchAll();

$pageTitle = 'My Orders';
require_once __DIR__ . '/../includes/header.php';
?>
<h1 style="color:var(--jc-blue-dark);font-size:22px;">My Orders</h1>
<div class="jc-panel" style="padding:0;">
    <table class="jc-table">
        <thead><tr><th>Order #</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th><th></th></tr></thead>
        <tbody>
        <?php foreach ($orders as $o): ?>
            <tr>
                <td><?php echo e($o['order_number']); ?></td>
                <td><?php echo formatDateTime($o['created_at']); ?></td>
                <td><?php echo money($o['total']); ?></td>
                <td><?php echo strtoupper(e($o['payment_method'])); ?> / <span class="jc-badge jc-badge-<?php echo e($o['payment_status']); ?>"><?php echo e($o['payment_status']); ?></span></td>
                <td><span class="jc-badge jc-badge-<?php echo e($o['status']); ?>"><?php echo e($o['status']); ?></span></td>
                <td><a class="jc-btn jc-btn-sm jc-btn-outline" href="<?php echo e(SITE_URL); ?>/order-track.php?order=<?php echo e($o['order_number']); ?>">View</a></td>
            </tr>
        <?php endforeach; ?>
        <?php if (!$orders): ?><tr><td colspan="6" style="text-align:center;color:#888;">No orders yet.</td></tr><?php endif; ?>
        </tbody>
    </table>
</div>
<?php require_once __DIR__ . '/../includes/footer.php'; ?>
