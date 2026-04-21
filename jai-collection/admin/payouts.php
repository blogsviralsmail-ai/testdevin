<?php
$pageTitle = 'Payouts';
require_once __DIR__ . '/_header.php';
$pdo = getPDO();
$filter = sanitize($_GET['status'] ?? '');

$sql = "SELECT p.*, a.name AS agent_name, a.mobile AS agent_mobile FROM payouts p JOIN agents a ON a.id = p.agent_id";
$args = [];
if ($filter) { $sql .= ' WHERE p.status = ?'; $args[] = $filter; }
$sql .= ' ORDER BY p.id DESC LIMIT 300';
$stmt = $pdo->prepare($sql); $stmt->execute($args);
$rows = $stmt->fetchAll();
?>
<div class="jc-admin-actions"><h2>Payout Requests (<?php echo count($rows); ?>)</h2></div>

<form method="get" style="margin-bottom:14px;">
    <select name="status" class="jc-select" data-auto-submit style="max-width:200px;">
        <option value="">All</option>
        <?php foreach (['pending','approved','paid','rejected'] as $s): ?>
            <option value="<?php echo $s; ?>" <?php if ($filter === $s) echo 'selected'; ?>><?php echo ucfirst($s); ?></option>
        <?php endforeach; ?>
    </select>
</form>

<div class="jc-panel" style="padding:0;">
<table class="jc-table">
    <thead><tr><th>Agent</th><th>Amount</th><th>Method</th><th>Bank / UPI</th><th>Status</th><th>Requested</th><th></th></tr></thead>
    <tbody>
        <?php foreach ($rows as $r): ?>
            <tr>
                <td><?php echo e($r['agent_name']); ?><br><small><?php echo e($r['agent_mobile']); ?></small></td>
                <td><strong><?php echo money($r['amount']); ?></strong></td>
                <td><?php echo strtoupper(e($r['method'])); ?></td>
                <td>
                    <?php if ($r['method'] === 'upi'): ?>
                        <?php echo e($r['upi_id']); ?>
                    <?php else: ?>
                        A/C: <?php echo e($r['bank_account_number']); ?><br>
                        IFSC: <?php echo e($r['bank_ifsc']); ?>
                    <?php endif; ?>
                </td>
                <td><span class="jc-badge jc-badge-<?php echo e($r['status']); ?>"><?php echo e($r['status']); ?></span></td>
                <td><?php echo formatDateTime($r['requested_at']); ?></td>
                <td><a class="jc-btn jc-btn-sm jc-btn-outline" href="payout-detail.php?id=<?php echo (int)$r['id']; ?>">View</a></td>
            </tr>
        <?php endforeach; ?>
        <?php if (!$rows): ?><tr><td colspan="7" style="text-align:center;color:#888;">No payout requests.</td></tr><?php endif; ?>
    </tbody>
</table>
</div>

<?php require_once __DIR__ . '/_footer.php'; ?>
