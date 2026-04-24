<?php
$pageTitle = 'Orders';
require_once __DIR__ . '/_header.php';
require_once __DIR__ . '/../includes/export.php';
require_once __DIR__ . '/../includes/notify.php';
$pdo = getPDO();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrfVerify();
    $action = $_POST['action'] ?? '';
    if ($action === 'bulk') {
        $ids = array_filter(array_map('intval', $_POST['ids'] ?? []));
        if (!$ids) { setFlash('error','No rows selected.'); redirect('orders.php'); }
        $ph = implode(',', array_fill(0, count($ids), '?'));
        $bulk = $_POST['bulk_action'];
        $allowed = ['confirmed','packed','shipped','delivered','cancelled','returned'];
        if (in_array($bulk, $allowed, true)) {
            $pdo->prepare("UPDATE orders SET status=? WHERE id IN ($ph)")->execute(array_merge([$bulk], $ids));
            foreach ($ids as $oid) {
                $oid = (int)$oid;
                // Keep commission ledger consistent (mirrors admin/order-detail.php).
                if ($bulk === 'delivered') {
                    creditCommissionForOrder($oid);
                } elseif (in_array($bulk, ['cancelled','returned'], true)) {
                    $pdo->prepare("UPDATE agent_commissions SET status = 'cancelled' WHERE order_id = ? AND status = 'pending'")->execute([$oid]);
                    reverseCommissionForOrder($oid);
                }
                notifyOrderStatusChange($oid, $bulk);
            }
            setFlash('success', count($ids) . ' order(s) updated to ' . $bulk . '.');
        } elseif ($bulk === 'delete') {
            // Reverse any credited commissions BEFORE delete — ON DELETE CASCADE
            // would otherwise wipe agent_commissions rows without returning the
            // money from the agent wallet.
            foreach ($ids as $oid) {
                $oid = (int)$oid;
                $pdo->prepare("UPDATE agent_commissions SET status = 'cancelled' WHERE order_id = ? AND status = 'pending'")->execute([$oid]);
                reverseCommissionForOrder($oid);
            }
            $pdo->prepare("DELETE FROM orders WHERE id IN ($ph)")->execute($ids);
            setFlash('success', count($ids) . ' order(s) deleted.');
        }
        redirect('orders.php');
    }
}

$filterStatus = sanitize($_GET['status'] ?? '');
$filterPay = sanitize($_GET['pay_status'] ?? '');
$search = sanitize($_GET['q'] ?? '');
$from = sanitize($_GET['from'] ?? '');
$to = sanitize($_GET['to'] ?? '');

$sql = "SELECT o.*, a.name AS agent_name FROM orders o LEFT JOIN agents a ON o.agent_id = a.id";
$where = []; $args = [];
if ($filterStatus) { $where[] = "o.status = ?"; $args[] = $filterStatus; }
if ($filterPay) { $where[] = "o.payment_status = ?"; $args[] = $filterPay; }
if ($search) { $where[] = "(o.order_number LIKE ? OR o.ship_mobile LIKE ? OR o.ship_name LIKE ?)"; $args[] = "%$search%"; $args[] = "%$search%"; $args[] = "%$search%"; }
if ($from) { $where[] = "DATE(o.created_at) >= ?"; $args[] = $from; }
if ($to) { $where[] = "DATE(o.created_at) <= ?"; $args[] = $to; }
if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
$sql .= ' ORDER BY o.id DESC LIMIT 1000';
$stmt = $pdo->prepare($sql); $stmt->execute($args);
$orders = $stmt->fetchAll();

if (($_GET['export'] ?? '') === 'csv' || ($_GET['export'] ?? '') === 'pdf') {
    $headers = ['Order #','Customer','Mobile','Agent','Subtotal','Shipping','Total','Payment','Pay Status','Status','Date'];
    $out = [];
    foreach ($orders as $o) {
        $out[] = [$o['order_number'],$o['ship_name'],$o['ship_mobile'],$o['agent_name'],$o['subtotal'],$o['shipping_fee'],$o['total'],$o['payment_method'],$o['payment_status'],$o['status'],$o['created_at']];
    }
    if ($_GET['export'] === 'csv') exportCsv('orders-'.date('Ymd-Hi').'.csv', $headers, $out);
    else exportPdf('Orders', $headers, $out);
}
?>
<div class="jc-admin-actions">
    <h2>Orders (<?php echo count($orders); ?>)</h2>
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
        <?php foreach (['pending','confirmed','packed','shipped','delivered','cancelled','returned'] as $s): ?>
            <option value="<?php echo $s; ?>" <?php if ($filterStatus === $s) echo 'selected'; ?>><?php echo ucfirst($s); ?></option>
        <?php endforeach; ?>
    </select></div>
    <div><label style="font-size:12px;color:#888;">Payment</label><br>
    <select name="pay_status" class="jc-select">
        <option value="">All</option>
        <?php foreach (['pending','paid','failed','refunded'] as $s): ?>
            <option value="<?php echo $s; ?>" <?php if ($filterPay === $s) echo 'selected'; ?>><?php echo ucfirst($s); ?></option>
        <?php endforeach; ?>
    </select></div>
    <div><label style="font-size:12px;color:#888;">From</label><br><input type="date" class="jc-input" name="from" value="<?php echo e($from); ?>"></div>
    <div><label style="font-size:12px;color:#888;">To</label><br><input type="date" class="jc-input" name="to" value="<?php echo e($to); ?>"></div>
    <div><label style="font-size:12px;color:#888;">Search</label><br><input class="jc-input" name="q" placeholder="Order # / name / mobile" value="<?php echo e($search); ?>"></div>
    <button class="jc-btn jc-btn-primary">Filter</button>
    <a href="orders.php" class="jc-btn jc-btn-outline">Reset</a>
</form>
</div>

<form method="post" data-jc-bulk-confirm>
<?php echo csrfField(); ?>
<input type="hidden" name="action" value="bulk">
<div class="jc-panel" style="padding:10px;margin-bottom:8px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
    <select class="jc-select" name="bulk_action" style="max-width:240px;">
        <option value="">Bulk action...</option>
        <option value="confirmed">Mark Confirmed</option>
        <option value="packed">Mark Packed</option>
        <option value="shipped">Mark Shipped</option>
        <option value="delivered">Mark Delivered</option>
        <option value="cancelled">Mark Cancelled</option>
        <option value="delete">Delete</option>
    </select>
    <button class="jc-btn jc-btn-primary">Apply</button>
</div>

<div class="jc-panel" style="padding:0;">
<table class="jc-table">
    <thead><tr>
        <th style="width:30px;"><input type="checkbox" data-jc-check-all='input[name="ids[]"]'></th>
        <th>Order</th><th>Customer</th><th>Agent</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th></th>
    </tr></thead>
    <tbody>
        <?php foreach ($orders as $o): ?>
            <tr>
                <td><input type="checkbox" name="ids[]" value="<?php echo (int)$o['id']; ?>"></td>
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
        <?php if (!$orders): ?><tr><td colspan="9" style="text-align:center;color:#888;">No orders.</td></tr><?php endif; ?>
    </tbody>
</table>
</div>
</form>

<?php require_once __DIR__ . '/_footer.php'; ?>
