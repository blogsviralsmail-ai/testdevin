<?php
$pageTitle = 'Wallet';
require_once __DIR__ . '/_header.php';
$pdo = getPDO();
$stmt = $pdo->prepare("SELECT * FROM agent_wallet_transactions WHERE agent_id = ? ORDER BY id DESC LIMIT 200");
$stmt->execute([$agent['id']]);
$txns = $stmt->fetchAll();
?>
<div class="jc-admin-stats">
    <div class="jc-admin-stat green"><div class="jc-stat-label">Current Balance</div><div class="jc-stat-value"><?php echo money($agent['wallet_balance']); ?></div></div>
    <div class="jc-admin-stat blue"><div class="jc-stat-label">Lifetime Earned</div><div class="jc-stat-value"><?php echo money($agent['lifetime_earned']); ?></div></div>
    <div class="jc-admin-stat"><div class="jc-stat-label">Total Withdrawn</div><div class="jc-stat-value"><?php echo money($agent['lifetime_paid']); ?></div></div>
</div>

<div class="jc-admin-actions">
    <h2>Transaction History</h2>
    <a href="payout-requests.php" class="jc-btn jc-btn-primary"><i class="fas fa-money-check-alt"></i> Request Payout</a>
</div>
<div class="jc-panel" style="padding:0;">
<table class="jc-table">
    <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Balance After</th><th>Description</th></tr></thead>
    <tbody>
        <?php foreach ($txns as $t): ?>
            <tr>
                <td><?php echo formatDateTime($t['created_at']); ?></td>
                <td><?php echo $t['type'] === 'credit' ? '<span style="color:#2a9d2a;"><i class="fas fa-arrow-down"></i> Credit</span>' : '<span style="color:#e53935;"><i class="fas fa-arrow-up"></i> Debit</span>'; ?></td>
                <td><strong><?php echo money($t['amount']); ?></strong></td>
                <td><?php echo money($t['balance_after']); ?></td>
                <td><?php echo e($t['description']); ?></td>
            </tr>
        <?php endforeach; ?>
        <?php if (!$txns): ?><tr><td colspan="5" style="text-align:center;color:#888;">No transactions yet.</td></tr><?php endif; ?>
    </tbody>
</table>
</div>
<?php require_once __DIR__ . '/_footer.php'; ?>
