<?php
$pageTitle = 'Dashboard';
require_once __DIR__ . '/_header.php';
$pdo = getPDO();
$aid = (int)$agent['id'];

// Use prepared statements (consistent with the rest of the codebase) rather
// than interpolating $aid into the SQL. $aid is cast to int above for an extra
// layer of defense, but the prepared statements are the primary guard.
$ordersStmt = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE agent_id = ?");
$ordersStmt->execute([$aid]);
$deliveredStmt = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE agent_id = ? AND status = 'delivered'");
$deliveredStmt->execute([$aid]);
$pendingCommStmt = $pdo->prepare("SELECT COALESCE(SUM(amount),0) FROM agent_commissions WHERE agent_id = ? AND status = 'pending'");
$pendingCommStmt->execute([$aid]);

$stats = [
    'orders' => (int)$ordersStmt->fetchColumn(),
    'delivered' => (int)$deliveredStmt->fetchColumn(),
    'pending_comm' => (float)$pendingCommStmt->fetchColumn(),
    'earned' => (float)($agent['lifetime_earned'] ?? 0),
    'paid' => (float)($agent['lifetime_paid'] ?? 0),
    'wallet' => (float)($agent['wallet_balance'] ?? 0),
];
$referralLink = SITE_URL . '/?ref=' . urlencode($agent['referral_code']);
$recent = $pdo->prepare("SELECT * FROM orders WHERE agent_id = ? ORDER BY id DESC LIMIT 10");
$recent->execute([$aid]);
$recent = $recent->fetchAll();
?>

<div class="jc-panel" style="margin-bottom:20px;">
    <h3 style="margin-top:0;color:#0d2d66;">Your Referral Link</h3>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <input class="jc-input" readonly value="<?php echo e($referralLink); ?>" id="refLink" style="flex:1;min-width:200px;background:#f7f8fa;font-family:monospace;">
        <button type="button" class="jc-btn jc-btn-primary" data-jc-copy="#refLink"><i class="fas fa-copy"></i> Copy</button>
        <a class="jc-btn jc-btn-secondary" target="_blank" href="https://wa.me/?text=<?php echo urlencode('Shop at ' . SITE_NAME . ': ' . $referralLink); ?>"><i class="fab fa-whatsapp"></i> Share on WhatsApp</a>
    </div>
    <p style="margin:10px 0 0;color:#888;font-size:13px;">
        Referral Code: <code><?php echo e($agent['referral_code']); ?></code> &nbsp;|&nbsp;
        Commission: <strong><?php echo e($agent['commission_percent']); ?>%</strong>
    </p>
</div>

<div class="jc-admin-stats">
    <div class="jc-admin-stat green"><div class="jc-stat-label">Wallet Balance</div><div class="jc-stat-value"><?php echo money($stats['wallet']); ?></div></div>
    <div class="jc-admin-stat yellow"><div class="jc-stat-label">Pending Commission</div><div class="jc-stat-value"><?php echo money($stats['pending_comm']); ?></div></div>
    <div class="jc-admin-stat blue"><div class="jc-stat-label">Lifetime Earned</div><div class="jc-stat-value"><?php echo money($stats['earned']); ?></div></div>
    <div class="jc-admin-stat"><div class="jc-stat-label">Total Paid Out</div><div class="jc-stat-value"><?php echo money($stats['paid']); ?></div></div>
    <div class="jc-admin-stat"><div class="jc-stat-label">Referred Orders</div><div class="jc-stat-value"><?php echo $stats['orders']; ?></div></div>
    <div class="jc-admin-stat green"><div class="jc-stat-label">Delivered</div><div class="jc-stat-value"><?php echo $stats['delivered']; ?></div></div>
</div>

<div class="jc-admin-actions"><h2>Recent Referred Orders</h2><a href="orders.php" class="jc-btn jc-btn-outline jc-btn-sm">View All</a></div>
<div class="jc-panel" style="padding:0;">
<table class="jc-table">
    <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Commission</th><th>Status</th><th>Date</th></tr></thead>
    <tbody>
        <?php foreach ($recent as $o): ?>
            <tr>
                <td><?php echo e($o['order_number']); ?></td>
                <td><?php echo e($o['ship_name']); ?></td>
                <td><?php echo money($o['total']); ?></td>
                <td><strong><?php echo money($o['agent_commission_amount']); ?></strong></td>
                <td><span class="jc-badge jc-badge-<?php echo e($o['status']); ?>"><?php echo e($o['status']); ?></span></td>
                <td><?php echo formatDateTime($o['created_at']); ?></td>
            </tr>
        <?php endforeach; ?>
        <?php if (!$recent): ?><tr><td colspan="6" style="text-align:center;color:#888;">No referrals yet. Share your link to start earning!</td></tr><?php endif; ?>
    </tbody>
</table>
</div>

<?php require_once __DIR__ . '/_footer.php'; ?>
