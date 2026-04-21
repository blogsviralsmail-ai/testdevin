<?php
$pageTitle = 'Dashboard';
require_once __DIR__ . '/_header.php';
$pdo = getPDO();

$stats = [
    'orders' => (int)$pdo->query("SELECT COUNT(*) FROM orders")->fetchColumn(),
    'pending_orders' => (int)$pdo->query("SELECT COUNT(*) FROM orders WHERE status = 'pending'")->fetchColumn(),
    'customers' => (int)$pdo->query("SELECT COUNT(*) FROM customers")->fetchColumn(),
    'agents' => (int)$pdo->query("SELECT COUNT(*) FROM agents WHERE status = 'active'")->fetchColumn(),
    'products' => (int)$pdo->query("SELECT COUNT(*) FROM products")->fetchColumn(),
    'revenue' => (float)$pdo->query("SELECT COALESCE(SUM(total),0) FROM orders WHERE (payment_status = 'paid' OR payment_method = 'cod') AND status NOT IN ('cancelled','returned')")->fetchColumn(),
    'pending_payouts' => (float)$pdo->query("SELECT COALESCE(SUM(amount),0) FROM payouts WHERE status IN ('pending','approved')")->fetchColumn(),
    'wallet_outstanding' => (float)$pdo->query("SELECT COALESCE(SUM(wallet_balance),0) FROM agents")->fetchColumn(),
    'low_stock' => (int)$pdo->query("SELECT COUNT(*) FROM products WHERE stock <= 5")->fetchColumn(),
];
$recentOrders = $pdo->query("SELECT * FROM orders ORDER BY id DESC LIMIT 10")->fetchAll();
$lowStockList = $pdo->query("SELECT id, name, stock FROM products WHERE stock <= 5 ORDER BY stock ASC LIMIT 8")->fetchAll();
?>

<div class="jc-admin-stats">
    <div class="jc-admin-stat blue"><div class="jc-stat-label">Total Orders</div><div class="jc-stat-value"><?php echo $stats['orders']; ?></div></div>
    <div class="jc-admin-stat yellow"><div class="jc-stat-label">Pending Orders</div><div class="jc-stat-value"><?php echo $stats['pending_orders']; ?></div></div>
    <div class="jc-admin-stat green"><div class="jc-stat-label">Revenue</div><div class="jc-stat-value"><?php echo money($stats['revenue']); ?></div></div>
    <div class="jc-admin-stat"><div class="jc-stat-label">Products</div><div class="jc-stat-value"><?php echo $stats['products']; ?></div></div>
    <div class="jc-admin-stat blue"><div class="jc-stat-label">Customers</div><div class="jc-stat-value"><?php echo $stats['customers']; ?></div></div>
    <div class="jc-admin-stat"><div class="jc-stat-label">Active Agents</div><div class="jc-stat-value"><?php echo $stats['agents']; ?></div></div>
    <div class="jc-admin-stat red"><div class="jc-stat-label">Pending Payouts</div><div class="jc-stat-value"><?php echo money($stats['pending_payouts']); ?></div></div>
    <div class="jc-admin-stat yellow"><div class="jc-stat-label">Wallet Outstanding</div><div class="jc-stat-value"><?php echo money($stats['wallet_outstanding']); ?></div></div>
    <div class="jc-admin-stat red"><div class="jc-stat-label">Low Stock</div><div class="jc-stat-value"><?php echo $stats['low_stock']; ?></div></div>
</div>

<?php if ($lowStockList): ?>
<div class="jc-admin-actions"><h2>Low Stock Alerts</h2><a href="stock.php?low=1" class="jc-btn jc-btn-outline jc-btn-sm">Manage Stock</a></div>
<div class="jc-panel" style="padding:0;margin-bottom:20px;">
<table class="jc-table">
    <thead><tr><th>Product</th><th>Stock</th><th></th></tr></thead>
    <tbody>
        <?php foreach ($lowStockList as $p): ?>
            <tr>
                <td><?php echo e($p['name']); ?></td>
                <td><strong style="color:<?php echo (int)$p['stock'] <= 0 ? '#c62828' : '#ef6c00'; ?>;"><?php echo (int)$p['stock']; ?></strong></td>
                <td><a class="jc-btn jc-btn-sm jc-btn-outline" href="product-edit.php?id=<?php echo (int)$p['id']; ?>">Edit</a></td>
            </tr>
        <?php endforeach; ?>
    </tbody>
</table>
</div>
<?php endif; ?>

<div class="jc-admin-actions"><h2>Recent Orders</h2><a href="orders.php" class="jc-btn jc-btn-outline jc-btn-sm">View All</a></div>
<div class="jc-panel" style="padding:0;">
<table class="jc-table">
    <thead><tr><th>#</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th></th></tr></thead>
    <tbody>
        <?php foreach ($recentOrders as $o): ?>
            <tr>
                <td><?php echo e($o['order_number']); ?></td>
                <td><?php echo e($o['ship_name']); ?><br><small style="color:#888;"><?php echo e($o['ship_mobile']); ?></small></td>
                <td><?php echo money($o['total']); ?></td>
                <td><?php echo strtoupper(e($o['payment_method'])); ?><br><span class="jc-badge jc-badge-<?php echo e($o['payment_status']); ?>"><?php echo e($o['payment_status']); ?></span></td>
                <td><span class="jc-badge jc-badge-<?php echo e($o['status']); ?>"><?php echo e($o['status']); ?></span></td>
                <td><?php echo formatDateTime($o['created_at']); ?></td>
                <td><a class="jc-btn jc-btn-sm jc-btn-outline" href="order-detail.php?id=<?php echo (int)$o['id']; ?>">View</a></td>
            </tr>
        <?php endforeach; ?>
        <?php if (!$recentOrders): ?><tr><td colspan="7" style="text-align:center;color:#888;">No orders yet.</td></tr><?php endif; ?>
    </tbody>
</table>
</div>

<?php require_once __DIR__ . '/_footer.php'; ?>
