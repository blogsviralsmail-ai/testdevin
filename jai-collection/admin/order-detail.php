<?php
$pageTitle = 'Order Detail';
require_once __DIR__ . '/_header.php';
$pdo = getPDO();

$id = (int)($_GET['id'] ?? 0);
$stmt = $pdo->prepare("SELECT o.*, a.name AS agent_name FROM orders o LEFT JOIN agents a ON o.agent_id = a.id WHERE o.id = ?");
$stmt->execute([$id]);
$order = $stmt->fetch();
if (!$order) { setFlash('error', 'Order not found.'); redirect('orders.php'); }

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrfVerify();
    $action = $_POST['action'] ?? '';
    if ($action === 'update_status') {
        $new = $_POST['status'];
        $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?")->execute([$new, $id]);
        // Auto-credit commission when delivered
        if ($new === 'delivered' && $order['agent_id']) {
            creditCommissionForOrder($id);
        }
        // Cancel commission if order cancelled
        if (in_array($new, ['cancelled', 'returned']) && $order['agent_id']) {
            $pdo->prepare("UPDATE agent_commissions SET status = 'cancelled' WHERE order_id = ? AND status = 'pending'")->execute([$id]);
        }
        setFlash('success', 'Status updated to ' . $new);
        redirect('order-detail.php?id=' . $id);
    }
    if ($action === 'update_payment') {
        $new = $_POST['payment_status'];
        $pdo->prepare("UPDATE orders SET payment_status = ? WHERE id = ?")->execute([$new, $id]);
        setFlash('success', 'Payment status updated.');
        redirect('order-detail.php?id=' . $id);
    }
}

$items = $pdo->prepare("SELECT * FROM order_items WHERE order_id = ?");
$items->execute([$id]);
$items = $items->fetchAll();
?>

<div class="jc-admin-actions">
    <h2>Order <?php echo e($order['order_number']); ?></h2>
    <a href="orders.php" class="jc-btn jc-btn-outline">Back</a>
</div>

<div class="jc-row">
    <div class="jc-panel">
        <h3 style="margin-top:0;color:#0d2d66;">Items</h3>
        <table class="jc-table">
            <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Total</th></tr></thead>
            <tbody>
                <?php foreach ($items as $it): ?>
                    <tr>
                        <td><strong><?php echo e($it['product_name']); ?></strong><?php if ($it['variant_label']): ?><br><small style="color:#888;"><?php echo e($it['variant_label']); ?></small><?php endif; ?></td>
                        <td><?php echo money($it['price']); ?></td>
                        <td><?php echo (int)$it['qty']; ?></td>
                        <td><?php echo money($it['line_total']); ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
        <div style="text-align:right;padding:10px 0;">
            <div>Subtotal: <strong><?php echo money($order['subtotal']); ?></strong></div>
            <div>Shipping: <?php echo money($order['shipping_fee']); ?></div>
            <div style="font-size:18px;margin-top:8px;color:#0d2d66;">Total: <strong><?php echo money($order['total']); ?></strong></div>
        </div>
    </div>

    <div>
        <div class="jc-panel" style="margin-bottom:16px;">
            <h3 style="margin-top:0;color:#0d2d66;">Shipping</h3>
            <p>
                <strong><?php echo e($order['ship_name']); ?></strong><br>
                <?php echo e($order['ship_mobile']); ?><br>
                <?php echo e($order['ship_email']); ?><br>
                <?php echo e($order['ship_line1']); ?><br>
                <?php if ($order['ship_line2']): ?><?php echo e($order['ship_line2']); ?><br><?php endif; ?>
                <?php echo e($order['ship_city']); ?>, <?php echo e($order['ship_state']); ?> - <?php echo e($order['ship_pincode']); ?>
                <?php if ($order['ship_landmark']): ?><br><small>Landmark: <?php echo e($order['ship_landmark']); ?></small><?php endif; ?>
            </p>
            <?php if ($order['notes']): ?><p><strong>Notes:</strong> <?php echo e($order['notes']); ?></p><?php endif; ?>
        </div>

        <div class="jc-panel" style="margin-bottom:16px;">
            <h3 style="margin-top:0;color:#0d2d66;">Status</h3>
            <form method="post" style="margin-bottom:10px;">
                <?php echo csrfField(); ?>
                <input type="hidden" name="action" value="update_status">
                <label>Order Status</label>
                <select class="jc-select" name="status">
                    <?php foreach (['pending','confirmed','packed','shipped','delivered','cancelled','returned'] as $s): ?>
                        <option value="<?php echo $s; ?>" <?php if ($order['status'] === $s) echo 'selected'; ?>><?php echo ucfirst($s); ?></option>
                    <?php endforeach; ?>
                </select>
                <button class="jc-btn jc-btn-primary jc-btn-sm" style="margin-top:8px;" type="submit">Update Status</button>
            </form>
            <form method="post">
                <?php echo csrfField(); ?>
                <input type="hidden" name="action" value="update_payment">
                <label>Payment Status</label>
                <select class="jc-select" name="payment_status">
                    <?php foreach (['pending','paid','failed','refunded'] as $s): ?>
                        <option value="<?php echo $s; ?>" <?php if ($order['payment_status'] === $s) echo 'selected'; ?>><?php echo ucfirst($s); ?></option>
                    <?php endforeach; ?>
                </select>
                <button class="jc-btn jc-btn-secondary jc-btn-sm" style="margin-top:8px;" type="submit">Update Payment</button>
            </form>
        </div>

        <?php if ($order['agent_id']): ?>
        <div class="jc-panel">
            <h3 style="margin-top:0;color:#0d2d66;">Agent</h3>
            <p>
                <strong><?php echo e($order['agent_name']); ?></strong><br>
                Commission: <?php echo money($order['agent_commission_amount']); ?> (<?php echo $order['agent_commission_percent']; ?>%)
            </p>
        </div>
        <?php endif; ?>
    </div>
</div>

<?php require_once __DIR__ . '/_footer.php'; ?>
