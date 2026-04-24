<?php
$pageTitle = 'Commissions';
require_once __DIR__ . '/_header.php';
require_once __DIR__ . '/../includes/export.php';
$pdo = getPDO();

$status = $_GET['status'] ?? '';
$q = trim($_GET['q'] ?? '');
$where = []; $args = [];
if (in_array($status, ['pending','credited','cancelled'], true)) { $where[] = "ac.status = ?"; $args[] = $status; }
if ($q) { $where[] = "(a.name LIKE ? OR o.order_number LIKE ?)"; $args[] = "%$q%"; $args[] = "%$q%"; }
$wsql = $where ? (' WHERE ' . implode(' AND ', $where)) : '';

$stmt = $pdo->prepare("SELECT ac.*, a.name AS agent_name, o.order_number FROM agent_commissions ac
    JOIN agents a ON a.id = ac.agent_id
    JOIN orders o ON o.id = ac.order_id
    $wsql ORDER BY ac.id DESC LIMIT 2000");
$stmt->execute($args);
$rows = $stmt->fetchAll();

if (($_GET['export'] ?? '') === 'csv' || ($_GET['export'] ?? '') === 'pdf') {
    $headers = ['Agent','Order','Subtotal','%','Amount','Status','Credited'];
    $out = [];
    foreach ($rows as $r) $out[] = [$r['agent_name'],$r['order_number'],$r['order_subtotal'],$r['commission_percent'],$r['amount'],$r['status'],$r['credited_at']];
    if ($_GET['export'] === 'csv') exportCsv('commissions-'.date('Ymd-Hi').'.csv', $headers, $out);
    else exportPdf('Agent Commissions', $headers, $out);
}
?>
<div class="jc-admin-actions">
    <h2>Agent Commissions (<?php echo count($rows); ?>)</h2>
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
        <option value="pending" <?php if ($status==='pending') echo 'selected'; ?>>Pending</option>
        <option value="credited" <?php if ($status==='credited') echo 'selected'; ?>>Credited</option>
        <option value="cancelled" <?php if ($status==='cancelled') echo 'selected'; ?>>Cancelled</option>
    </select></div>
    <div><label style="font-size:12px;color:#888;">Search</label><br><input class="jc-input" name="q" placeholder="Agent / Order #" value="<?php echo e($q); ?>"></div>
    <button class="jc-btn jc-btn-primary">Filter</button>
    <a href="commissions.php" class="jc-btn jc-btn-outline">Reset</a>
</form>
</div>

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
