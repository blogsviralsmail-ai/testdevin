<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/functions.php';
requireCustomer();

$customer = currentCustomer();
$stmt = getPDO()->prepare("SELECT * FROM orders WHERE customer_id = ? ORDER BY id DESC LIMIT 5");
$stmt->execute([$customer['id']]);
$recent = $stmt->fetchAll();

$pageTitle = 'My Account';
require_once __DIR__ . '/../includes/header.php';
?>
<h1 style="color:var(--jc-blue-dark);font-size:22px;">Hi, <?php echo e($customer['name']); ?></h1>

<div class="jc-row">
    <div class="jc-panel">
        <h3 style="margin-top:0;">Account</h3>
        <p><strong>Mobile:</strong> <?php echo e($customer['mobile']); ?></p>
        <p><strong>Email:</strong> <?php echo e($customer['email']); ?></p>
        <a href="orders.php" class="jc-btn jc-btn-outline">All Orders</a>
        <form method="post" action="logout.php" style="display:inline;margin:0;padding:0;">
            <?php echo csrfField(); ?>
            <button type="submit" class="jc-btn jc-btn-sm" style="background:#fdecec;color:#8a1a1a;">Logout</button>
        </form>
    </div>
    <div class="jc-panel">
        <h3 style="margin-top:0;">Recent Orders</h3>
        <?php if (!$recent): ?>
            <p style="color:#888;">No orders yet. <a href="<?php echo e(SITE_URL); ?>/">Start shopping</a>.</p>
        <?php else: ?>
            <table class="jc-table">
                <tr><th>Order</th><th>Total</th><th>Status</th></tr>
                <?php foreach ($recent as $o): ?>
                    <tr>
                        <td><a href="<?php echo e(SITE_URL); ?>/order-track.php?order=<?php echo e($o['order_number']); ?>"><?php echo e($o['order_number']); ?></a></td>
                        <td><?php echo money($o['total']); ?></td>
                        <td><span class="jc-badge jc-badge-<?php echo e($o['status']); ?>"><?php echo e($o['status']); ?></span></td>
                    </tr>
                <?php endforeach; ?>
            </table>
        <?php endif; ?>
    </div>
</div>
<?php require_once __DIR__ . '/../includes/footer.php'; ?>
