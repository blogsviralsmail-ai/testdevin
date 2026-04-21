<?php
$pageTitle = 'Commissions';
require_once __DIR__ . '/_header.php';
$pdo = getPDO();
$rows = $pdo->query("SELECT ac.*, a.name AS agent_name, o.order_number FROM agent_commissions ac
    JOIN agents a ON a.id = ac.agent_id
    JOIN orders o ON o.id = ac.order_id
    ORDER BY ac.id DESC LIMIT 500")->fetchAll();
?>
<div class="jc-admin-actions"><h2>Agent Commissions (<?php echo count($rows); ?>)</h2></div>
<div class="jc-panel" style="padding:0;">
<table class="jc-table">
    <thead><tr><th>Agent</th><th>Order</th><th>Subtotal</th><th>%</th><th>Amount</th><th>Status</th><th>Credited</th></tr></thead>
    <tbody>
        <?php foreach ($rows as $r): ?>
            <tr>
                <td><?php echo e($r['agent_name']); ?></td>
                <td><a href="order-detail.php?id=<?php echo (int)$r['order_id']; ?>"><?php echo e($r['order_number']); ?></a></td>
                <td><?php echo money($r['order_subtotal']); ?></td>
                <td><?php echo e($r['commission_percent']); ?>%</td>
                <td><strong><?php echo money($r['amount']); ?></strong></td>
                <td><span class="jc-badge jc-badge-<?php echo e($r['status']); ?>"><?php echo e($r['status']); ?></span></td>
                <td><?php echo $r['credited_at'] ? formatDateTime($r['credited_at']) : '-'; ?></td>
            </tr>
        <?php endforeach; ?>
        <?php if (!$rows): ?><tr><td colspan="7" style="text-align:center;color:#888;">No commission entries yet.</td></tr><?php endif; ?>
    </tbody>
</table>
</div>
<?php require_once __DIR__ . '/_footer.php'; ?>
