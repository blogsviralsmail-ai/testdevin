<?php
$pageTitle = 'Referred Orders';
require_once __DIR__ . '/_header.php';
$pdo = getPDO();

$stmt = $pdo->prepare("SELECT o.*, ac.status AS commission_status FROM orders o
    LEFT JOIN agent_commissions ac ON ac.order_id = o.id AND ac.agent_id = ?
    WHERE o.agent_id = ? ORDER BY o.id DESC");
$stmt->execute([$agent['id'], $agent['id']]);
$orders = $stmt->fetchAll();
?>
<div class="jc-admin-actions"><h2>Referred Orders (<?php echo count($orders); ?>)</h2></div>
<div class="jc-panel" style="padding:0;">
<table class="jc-table">
    <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Commission</th><th>Order Status</th><th>Commission Status</th><th>Date</th></tr></thead>
    <tbody>
        <?php foreach ($orders as $o): ?>
            <tr>
                <td><?php echo e($o['order_number']); ?></td>
                <td><?php echo e($o['ship_name']); ?></td>
                <td><?php echo money($o['total']); ?></td>
                <td><strong><?php echo money($o['agent_commission_amount']); ?></strong> (<?php echo e($o['agent_commission_percent']); ?>%)</td>
                <td><span class="jc-badge jc-badge-<?php echo e($o['status']); ?>"><?php echo e($o['status']); ?></span></td>
                <td><?php echo $o['commission_status'] ? '<span class="jc-badge jc-badge-'.e($o['commission_status']).'">'.e($o['commission_status']).'</span>' : '-'; ?></td>
                <td><?php echo formatDateTime($o['created_at']); ?></td>
            </tr>
        <?php endforeach; ?>
        <?php if (!$orders): ?><tr><td colspan="7" style="text-align:center;color:#888;">No referrals yet.</td></tr><?php endif; ?>
    </tbody>
</table>
</div>
<?php require_once __DIR__ . '/_footer.php'; ?>
