<?php
$pageTitle = 'Customers';
require_once __DIR__ . '/_header.php';
$pdo = getPDO();
$rows = $pdo->query("SELECT c.*,
    (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) AS orders_count,
    (SELECT COALESCE(SUM(total),0) FROM orders o WHERE o.customer_id = c.id) AS total_spent
    FROM customers c ORDER BY c.id DESC LIMIT 500")->fetchAll();
?>
<div class="jc-admin-actions"><h2>Customers (<?php echo count($rows); ?>)</h2></div>
<div class="jc-panel" style="padding:0;">
<table class="jc-table">
    <thead><tr><th>Name</th><th>Mobile</th><th>Email</th><th>Orders</th><th>Spent</th><th>Status</th><th>Joined</th></tr></thead>
    <tbody>
        <?php foreach ($rows as $c): ?>
            <tr>
                <td><?php echo e($c['name']); ?></td>
                <td><?php echo e($c['mobile']); ?></td>
                <td><?php echo e($c['email']); ?></td>
                <td><?php echo (int)$c['orders_count']; ?></td>
                <td><?php echo money($c['total_spent']); ?></td>
                <td><span class="jc-badge jc-badge-<?php echo e($c['status']); ?>"><?php echo e($c['status']); ?></span></td>
                <td><?php echo formatDate($c['created_at']); ?></td>
            </tr>
        <?php endforeach; ?>
    </tbody>
</table>
</div>
<?php require_once __DIR__ . '/_footer.php'; ?>
