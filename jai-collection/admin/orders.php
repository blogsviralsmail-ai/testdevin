<?php
$pageTitle = 'Orders';
require_once __DIR__ . '/_header.php';
$pdo = getPDO();

$filterStatus = sanitize($_GET['status'] ?? '');
$search = sanitize($_GET['q'] ?? '');
$sql = "SELECT o.*, a.name AS agent_name FROM orders o LEFT JOIN agents a ON o.agent_id = a.id";
$where = []; $args = [];
if ($filterStatus) { $where[] = "o.status = ?"; $args[] = $filterStatus; }
if ($search) { $where[] = "(o.order_number LIKE ? OR o.ship_mobile LIKE ? OR o.ship_name LIKE ?)";
    $args[] = "%$search%"; $args[] = "%$search%"; $args[] = "%$search%"; }
if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
$sql .= ' ORDER BY o.id DESC LIMIT 200';
$stmt = $pdo->prepare($sql); $stmt->execute($args);
$orders = $stmt->fetchAll();
?>
<div class="jc-admin-actions"><h2>Orders (<?php echo count($orders); ?>)</h2></div>

<form method="get" style="display:flex;gap:10px;margin-bottom:14px;">
    <select name="status" class="jc-select" style="max-width:200px;">
        <option value="">All Status</option>
        <?php foreach (['pending','confirmed','packed','shipped','delivered','cancelled','returned'] as $s): ?>
            <option value="<?php echo $s; ?>" <?php if ($filterStatus === $s) echo 'selected'; ?>><?php echo ucfirst($s); ?></option>
        <?php endforeach; ?>
    </select>
    <input class="jc-input" name="q" placeholder="Order #, mobile, name..." value="<?php echo e($search); ?>" style="max-width:300px;">
    <button class="jc-btn jc-btn-outline" type="submit">Filter</button>
</form>

<div class="jc-panel" style="padding:0;">
<table class="jc-table">
    <thead><tr><th>Order</th><th>Customer</th><th>Agent</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th></th></tr></thead>
    <tbody>
        <?php foreach ($orders as $o): ?>
            <tr>
                <td><?php echo e($o['order_number']); ?></td>
                <td><?php echo e($o['ship_name']); ?><br><small style="color:#888;"><?php echo e($o['ship_mobile']); ?></small></td>
                <td><?php echo e($o['agent_name'] ?: '-'); ?><?php if ($o['agent_commission_amount']): ?><br><small style="color:#888;"><?php echo money($o['agent_commission_amount']); ?></small><?php endif; ?></td>
                <td><?php echo money($o['total']); ?></td>
                <td><?php echo strtoupper(e($o['payment_method'])); ?><br><span class="jc-badge jc-badge-<?php echo e($o['payment_status']); ?>"><?php echo e($o['payment_status']); ?></span></td>
                <td><span class="jc-badge jc-badge-<?php echo e($o['status']); ?>"><?php echo e($o['status']); ?></span></td>
                <td><?php echo formatDateTime($o['created_at']); ?></td>
                <td><a class="jc-btn jc-btn-sm jc-btn-outline" href="order-detail.php?id=<?php echo (int)$o['id']; ?>">View</a></td>
            </tr>
        <?php endforeach; ?>
        <?php if (!$orders): ?><tr><td colspan="8" style="text-align:center;color:#888;">No orders.</td></tr><?php endif; ?>
    </tbody>
</table>
</div>

<?php require_once __DIR__ . '/_footer.php'; ?>
