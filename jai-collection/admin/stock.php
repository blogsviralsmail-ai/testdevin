<?php
$pageTitle = 'Stock Management';
require_once __DIR__ . '/_header.php';
require_once __DIR__ . '/../includes/export.php';
$pdo = getPDO();

// Handle stock adjustment POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrfVerify();
    $action = $_POST['action'] ?? '';
    if ($action === 'adjust') {
        $pid = (int)$_POST['product_id'];
        $vid = !empty($_POST['variant_id']) ? (int)$_POST['variant_id'] : null;
        $delta = (int)$_POST['delta'];
        $reason = sanitize($_POST['reason'] ?? '');
        if (!$pid || $delta === 0) { setFlash('error','Invalid adjustment.'); redirect('stock.php'); }

        $pdo->beginTransaction();
        try {
            if ($vid) {
                // Read the pre-update stock so the audit log records the
                // actual change, not the requested one (GREATEST clamps at 0,
                // so delta=-100 on stock=5 really only changed stock by -5).
                $getOld = $pdo->prepare("SELECT stock FROM product_variants WHERE id = ? AND product_id = ?");
                $getOld->execute([$vid, $pid]);
                $old = (int)$getOld->fetchColumn();
                $pdo->prepare("UPDATE product_variants SET stock = GREATEST(stock + ?, 0) WHERE id = ? AND product_id = ?")
                    ->execute([$delta, $vid, $pid]);
                $getNew = $pdo->prepare("SELECT stock FROM product_variants WHERE id = ?");
                $getNew->execute([$vid]);
                $new = (int)$getNew->fetchColumn();
                // Also refresh aggregated product stock
                $sumStmt = $pdo->prepare("SELECT COALESCE(SUM(stock),0) FROM product_variants WHERE product_id = ?");
                $sumStmt->execute([$pid]);
                $pdo->prepare("UPDATE products SET stock = ? WHERE id = ?")->execute([(int)$sumStmt->fetchColumn(), $pid]);
            } else {
                $getOld = $pdo->prepare("SELECT stock FROM products WHERE id = ?");
                $getOld->execute([$pid]);
                $old = (int)$getOld->fetchColumn();
                $pdo->prepare("UPDATE products SET stock = GREATEST(stock + ?, 0) WHERE id = ?")
                    ->execute([$delta, $pid]);
                $getNew = $pdo->prepare("SELECT stock FROM products WHERE id = ?");
                $getNew->execute([$pid]);
                $new = (int)$getNew->fetchColumn();
            }
            $actualDelta = $new - $old;
            $admin = currentAdmin();
            $pdo->prepare("INSERT INTO stock_adjustments (product_id, variant_id, delta, new_stock, reason, admin_id) VALUES (?,?,?,?,?,?)")
                ->execute([$pid, $vid, $actualDelta, $new, $reason, (int)($admin['id'] ?? 0)]);
            $pdo->commit();
            setFlash('success', 'Stock adjusted (' . ($actualDelta > 0 ? '+' : '') . $actualDelta . '). New: ' . $new);
        } catch (Exception $e) {
            $pdo->rollBack();
            error_log('[stock-adjust] ' . $e->getMessage());
            setFlash('error', 'Adjustment failed. Try again.');
        }
        redirect('stock.php' . (!empty($_POST['redir']) ? '?' . $_POST['redir'] : ''));
    }
    if ($action === 'bulk_set') {
        $ids = array_filter(array_map('intval', $_POST['ids'] ?? []));
        $newStock = (int)$_POST['new_stock'];
        if ($ids) {
            $ph = implode(',', array_fill(0, count($ids), '?'));
            $pdo->prepare("UPDATE products SET stock = ? WHERE id IN ($ph)")->execute(array_merge([$newStock], $ids));
            setFlash('success', count($ids) . ' product(s) set to stock ' . $newStock);
        }
        redirect('stock.php');
    }
}

$low = (int)($_GET['low'] ?? 0);
$q = trim($_GET['q'] ?? '');
$lowThreshold = (int)getSetting('low_stock_threshold', '5');

$where = []; $args = [];
if ($q) { $where[] = "(p.name LIKE ? OR p.sku LIKE ?)"; $args[] = "%$q%"; $args[] = "%$q%"; }
if ($low) { $where[] = "p.stock <= ?"; $args[] = $lowThreshold; }
$wsql = $where ? (' WHERE ' . implode(' AND ', $where)) : '';

$sql = "SELECT p.id, p.name, p.sku, p.stock, p.has_variants, p.status, c.name AS category_name
        FROM products p LEFT JOIN categories c ON p.category_id = c.id $wsql
        ORDER BY p.stock ASC, p.id DESC LIMIT 1000";
$stmt = $pdo->prepare($sql); $stmt->execute($args);
$rows = $stmt->fetchAll();

$totalProducts = (int)$pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();
// Use a prepared statement for $lowThreshold instead of concatenation — even
// though it's `(int)` cast above, every other DB access on this page goes
// through prepared statements and concatenating integers into SQL breaks that
// invariant. Also defends against a future code path where getSetting()
// might return a non-integer.
$lcStmt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE stock <= ?");
$lcStmt->execute([$lowThreshold]);
$lowCount = (int)$lcStmt->fetchColumn();
$outCount = (int)$pdo->query("SELECT COUNT(*) FROM products WHERE stock <= 0")->fetchColumn();
$recentAdj = $pdo->query("SELECT sa.*, p.name AS pname FROM stock_adjustments sa LEFT JOIN products p ON p.id = sa.product_id ORDER BY sa.id DESC LIMIT 15")->fetchAll();

if (($_GET['export'] ?? '') === 'csv') {
    $headers = ['ID','Name','SKU','Category','Stock','Status'];
    $out = [];
    foreach ($rows as $r) $out[] = [$r['id'],$r['name'],$r['sku'],$r['category_name'],$r['stock'],$r['status']];
    exportCsv('stock-'.date('Ymd-Hi').'.csv', $headers, $out);
}
if (($_GET['export'] ?? '') === 'pdf') {
    $headers = ['ID','Name','SKU','Category','Stock','Status'];
    $out = [];
    foreach ($rows as $r) $out[] = [$r['id'],$r['name'],$r['sku'],$r['category_name'],$r['stock'],$r['status']];
    exportPdf('Stock', $headers, $out);
}
?>
<div class="jc-admin-actions">
    <h2>Stock Management</h2>
    <div>
        <a href="?<?php echo http_build_query(array_merge($_GET,['export'=>'csv'])); ?>" class="jc-btn jc-btn-outline"><i class="fas fa-file-csv"></i> CSV</a>
        <a href="?<?php echo http_build_query(array_merge($_GET,['export'=>'pdf'])); ?>" class="jc-btn jc-btn-outline" target="_blank"><i class="fas fa-file-pdf"></i> PDF</a>
    </div>
</div>

<div class="jc-admin-stats">
    <div class="jc-admin-stat"><div class="jc-stat-label">Total Products</div><div class="jc-stat-value"><?php echo $totalProducts; ?></div></div>
    <div class="jc-admin-stat yellow"><div class="jc-stat-label">Low Stock (&le; <?php echo $lowThreshold; ?>)</div><div class="jc-stat-value"><?php echo $lowCount; ?></div></div>
    <div class="jc-admin-stat red"><div class="jc-stat-label">Out of Stock</div><div class="jc-stat-value"><?php echo $outCount; ?></div></div>
</div>

<div class="jc-panel" style="margin-bottom:14px;">
    <form method="get" style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;">
        <div><label style="font-size:12px;color:#888;">Search</label><br><input class="jc-input" name="q" value="<?php echo e($q); ?>" placeholder="Name / SKU"></div>
        <div><label style="font-size:12px;color:#888;">View</label><br>
            <select name="low" class="jc-select">
                <option value="0">All</option>
                <option value="1" <?php if ($low) echo 'selected'; ?>>Only Low Stock</option>
            </select>
        </div>
        <button class="jc-btn jc-btn-primary">Filter</button>
        <a href="stock.php" class="jc-btn jc-btn-outline">Reset</a>
    </form>
</div>

<!--
    Bulk-set form and per-row quick-adjust forms CANNOT be nested (HTML parsers
    close the outer form at the first inner </form>, which would orphan every
    row-2+ checkbox from the bulk form). We close the outer form right after
    the Apply button, then use the HTML5 `form="stock-bulk-form"` attribute on
    the row checkboxes so they still submit with the bulk form even though
    they live outside it in the DOM. Per-row forms remain standalone.
-->
<form method="post" data-jc-bulk-confirm id="stock-bulk-form">
    <?php echo csrfField(); ?>
    <input type="hidden" name="action" value="bulk_set">
    <div class="jc-panel" style="padding:10px;margin-bottom:8px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <label style="font-size:12px;color:#888;">Set selected to stock:</label>
        <input class="jc-input" type="number" name="new_stock" value="10" style="max-width:110px;">
        <button class="jc-btn jc-btn-primary">Apply</button>
        <span style="color:#888;font-size:12px;">Tip: use +/- below for single adjustments.</span>
    </div>
</form>
<div class="jc-panel" style="padding:0;">
<table class="jc-table">
    <thead><tr>
        <th style="width:30px;"><input type="checkbox" data-jc-check-all='input[name="ids[]"]' form="stock-bulk-form"></th>
        <th>Product</th><th>SKU</th><th>Category</th><th>Stock</th><th>Quick Adjust</th>
    </tr></thead>
    <tbody>
        <?php foreach ($rows as $r): ?>
            <tr class="<?php echo (int)$r['stock'] <= $lowThreshold ? ($r['stock']<=0 ? 'jc-row-danger' : 'jc-row-warn') : ''; ?>">
                <td><input type="checkbox" name="ids[]" value="<?php echo (int)$r['id']; ?>" form="stock-bulk-form"></td>
                <td>
                    <a href="product-edit.php?id=<?php echo (int)$r['id']; ?>"><?php echo e($r['name']); ?></a>
                    <?php if ($r['has_variants']): ?><br><small style="color:#888;">Has variants</small><?php endif; ?>
                </td>
                <td><?php echo e($r['sku']); ?></td>
                <td><?php echo e($r['category_name']); ?></td>
                <td><strong style="color:<?php echo (int)$r['stock'] <= 0 ? '#c62828' : ((int)$r['stock'] <= $lowThreshold ? '#ef6c00' : '#2e7d32'); ?>;"><?php echo (int)$r['stock']; ?></strong></td>
                <td>
                    <form method="post" style="display:flex;gap:6px;align-items:center;margin:0;">
                        <?php echo csrfField(); ?>
                        <input type="hidden" name="action" value="adjust">
                        <input type="hidden" name="product_id" value="<?php echo (int)$r['id']; ?>">
                        <input class="jc-input" type="number" name="delta" value="1" style="width:70px;padding:4px 6px;">
                        <input class="jc-input" type="text" name="reason" placeholder="Reason (optional)" style="width:160px;padding:4px 6px;">
                        <button class="jc-btn jc-btn-sm jc-btn-primary" name="delta_sign" value="plus" onclick="this.form.delta.value=Math.abs(+this.form.delta.value)">+</button>
                        <button class="jc-btn jc-btn-sm" style="background:#fdecec;color:#8a1a1a;" onclick="this.form.delta.value=-Math.abs(+this.form.delta.value)">−</button>
                    </form>
                </td>
            </tr>
        <?php endforeach; ?>
        <?php if (!$rows): ?><tr><td colspan="6" style="text-align:center;color:#888;">No products.</td></tr><?php endif; ?>
    </tbody>
</table>
</div>

<?php if ($recentAdj): ?>
<div class="jc-admin-actions" style="margin-top:24px;"><h3 style="margin:0;color:#0d2d66;">Recent Stock Adjustments</h3></div>
<div class="jc-panel" style="padding:0;">
<table class="jc-table">
    <thead><tr><th>When</th><th>Product</th><th>Δ</th><th>New</th><th>Reason</th></tr></thead>
    <tbody>
        <?php foreach ($recentAdj as $a): ?>
            <tr>
                <td><?php echo formatDateTime($a['created_at']); ?></td>
                <td><?php echo e($a['pname']); ?><?php if ($a['variant_id']): ?> <small style="color:#888;">(variant #<?php echo (int)$a['variant_id']; ?>)</small><?php endif; ?></td>
                <td><strong style="color:<?php echo (int)$a['delta'] >= 0 ? '#2e7d32' : '#c62828'; ?>;"><?php echo ((int)$a['delta'] >= 0 ? '+' : '') . (int)$a['delta']; ?></strong></td>
                <td><?php echo (int)$a['new_stock']; ?></td>
                <td><?php echo e($a['reason']); ?></td>
            </tr>
        <?php endforeach; ?>
    </tbody>
</table>
</div>
<?php endif; ?>

<style>
.jc-row-warn { background: #fff8e1 !important; }
.jc-row-danger { background: #fdecec !important; }
</style>

<?php require_once __DIR__ . '/_footer.php'; ?>
