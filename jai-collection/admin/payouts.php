<?php
$pageTitle = 'Payouts';
require_once __DIR__ . '/_header.php';
require_once __DIR__ . '/../includes/export.php';
$pdo = getPDO();
$filter = sanitize($_GET['status'] ?? '');
$q = trim($_GET['q'] ?? '');

$where = []; $args = [];
if ($filter) { $where[] = "p.status = ?"; $args[] = $filter; }
if ($q) { $where[] = "(a.name LIKE ? OR a.mobile LIKE ?)"; $args[] = "%$q%"; $args[] = "%$q%"; }
$wsql = $where ? (' WHERE ' . implode(' AND ', $where)) : '';
$sql = "SELECT p.*, a.name AS agent_name, a.mobile AS agent_mobile FROM payouts p JOIN agents a ON a.id = p.agent_id $wsql ORDER BY p.id DESC LIMIT 1000";
$stmt = $pdo->prepare($sql); $stmt->execute($args);
$rows = $stmt->fetchAll();

if (($_GET['export'] ?? '') === 'csv' || ($_GET['export'] ?? '') === 'pdf') {
    $headers = ['Agent','Mobile','Amount','Method','Account','IFSC/UPI','Status','Requested','Paid At','UTR'];
    $out = [];
    foreach ($rows as $r) {
        $out[] = [$r['agent_name'],$r['agent_mobile'],$r['amount'],$r['method'],$r['bank_account_number'],$r['method']==='upi'?$r['upi_id']:$r['bank_ifsc'],$r['status'],$r['requested_at'],$r['processed_at'] ?? '',$r['utr_number'] ?? ''];
    }
    if ($_GET['export'] === 'csv') exportCsv('payouts-'.date('Ymd-Hi').'.csv', $headers, $out);
    else exportPdf('Payout Requests', $headers, $out);
}
?>
<div class="jc-admin-actions">
    <h2>Payout Requests (<?php echo count($rows); ?>)</h2>
    <div>
        <a href="?<?php echo http_build_query(array_merge($_GET,['export'=>'csv'])); ?>" class="jc-btn jc-btn-outline"><i class="fas fa-file-csv"></i> CSV</a>
        <a href="?<?php echo http_build_query(array_merge($_GET,['export'=>'pdf'])); ?>" class="jc-btn jc-btn-outline" target="_blank"><i class="fas fa-file-pdf"></i> PDF</a>
    </div>
</div>

<div class="jc-panel" style="margin-bottom:14px;">
<form method="get" style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;">
    <div><label style="font-size:12px;color:#888;">Status</label><br>
    <select name="status" class="jc-select">
        <option value="">All</option>
        <?php foreach (['pending','approved','paid','rejected'] as $s): ?>
            <option value="<?php echo $s; ?>" <?php if ($filter === $s) echo 'selected'; ?>><?php echo ucfirst($s); ?></option>
        <?php endforeach; ?>
    </select></div>
    <div><label style="font-size:12px;color:#888;">Search</label><br><input class="jc-input" name="q" placeholder="Agent name/mobile" value="<?php echo e($q); ?>"></div>
    <button class="jc-btn jc-btn-primary">Filter</button>
    <a href="payouts.php" class="jc-btn jc-btn-outline">Reset</a>
</form>
</div>

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
