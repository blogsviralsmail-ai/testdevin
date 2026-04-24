<?php
$pageTitle = 'Products';
require_once __DIR__ . '/_header.php';
require_once __DIR__ . '/../includes/export.php';
$pdo = getPDO();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrfVerify();
    $action = $_POST['action'] ?? '';
    if ($action === 'delete') {
        $pdo->prepare("DELETE FROM products WHERE id = ?")->execute([(int)$_POST['id']]);
        setFlash('info', 'Product deleted.');
        redirect('products.php');
    }
    if ($action === 'bulk') {
        $ids = array_filter(array_map('intval', $_POST['ids'] ?? []));
        if (!$ids) { setFlash('error','No rows selected.'); redirect('products.php'); }
        $ph = implode(',', array_fill(0, count($ids), '?'));
        $bulk = $_POST['bulk_action'];
        if ($bulk === 'delete')           $pdo->prepare("DELETE FROM products WHERE id IN ($ph)")->execute($ids);
        elseif ($bulk === 'activate')     $pdo->prepare("UPDATE products SET status='active' WHERE id IN ($ph)")->execute($ids);
        elseif ($bulk === 'deactivate')   $pdo->prepare("UPDATE products SET status='inactive' WHERE id IN ($ph)")->execute($ids);
        elseif ($bulk === 'feature')      $pdo->prepare("UPDATE products SET is_featured=1 WHERE id IN ($ph)")->execute($ids);
        elseif ($bulk === 'unfeature')    $pdo->prepare("UPDATE products SET is_featured=0 WHERE id IN ($ph)")->execute($ids);
        elseif ($bulk === 'hot')          $pdo->prepare("UPDATE products SET is_hot=1 WHERE id IN ($ph)")->execute($ids);
        elseif ($bulk === 'unhot')        $pdo->prepare("UPDATE products SET is_hot=0 WHERE id IN ($ph)")->execute($ids);
        setFlash('success', count($ids) . ' product(s) updated.');
        redirect('products.php');
    }
}

$filterCat = (int)($_GET['category_id'] ?? 0);
$search = sanitize($_GET['q'] ?? '');
$status = $_GET['status'] ?? '';
$flag = $_GET['flag'] ?? '';

$sql = "SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id";
$where = []; $args = [];
if ($filterCat) { $where[] = "p.category_id = ?"; $args[] = $filterCat; }
if ($search) { $where[] = "(p.name LIKE ? OR p.sku LIKE ?)"; $args[] = "%$search%"; $args[] = "%$search%"; }
if (in_array($status, ['active','inactive'], true)) { $where[] = "p.status = ?"; $args[] = $status; }
if ($flag === 'featured') $where[] = "p.is_featured = 1";
if ($flag === 'hot') $where[] = "p.is_hot = 1";
if ($flag === 'low_stock') $where[] = "p.stock <= 5";
if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
$sql .= ' ORDER BY p.id DESC LIMIT 500';
$stmt = $pdo->prepare($sql); $stmt->execute($args);
$products = $stmt->fetchAll();
$cats = getCategories(false);

if (($_GET['export'] ?? '') === 'csv' || ($_GET['export'] ?? '') === 'pdf') {
    $headers = ['ID','Name','SKU','Category','Price','Stock','Featured','Hot','Status'];
    $out = [];
    foreach ($products as $p) {
        $out[] = [$p['id'],$p['name'],$p['sku'],$p['category_name'],$p['price'],$p['stock'],$p['is_featured']?'Yes':'',$p['is_hot']?'Yes':'',$p['status']];
    }
    if ($_GET['export'] === 'csv') exportCsv('products-'.date('Ymd-Hi').'.csv', $headers, $out);
    else exportPdf('Products', $headers, $out);
}
?>

<div class="jc-admin-actions">
    <h2>Products (<?php echo count($products); ?>)</h2>
    <div>
        <a href="product-edit.php" class="jc-btn jc-btn-primary"><i class="fas fa-plus"></i> Add Product</a>
        <a href="stock.php" class="jc-btn jc-btn-outline"><i class="fas fa-warehouse"></i> Stock</a>
        <a href="?<?php echo http_build_query(array_merge($_GET,['export'=>'csv'])); ?>" class="jc-btn jc-btn-outline"><i class="fas fa-file-csv"></i> CSV</a>
        <a href="?<?php echo http_build_query(array_merge($_GET,['export'=>'pdf'])); ?>" class="jc-btn jc-btn-outline" target="_blank"><i class="fas fa-file-pdf"></i> PDF</a>
    </div>
</div>

<div class="jc-panel" style="margin-bottom:14px;">
<form method="get" style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;">
    <div><label style="font-size:12px;color:#888;">Category</label><br>
    <select name="category_id" class="jc-select" style="max-width:220px;">
        <option value="0">All</option>
        <?php foreach ($cats as $c): ?><option value="<?php echo (int)$c['id']; ?>" <?php if ($filterCat == $c['id']) echo 'selected'; ?>><?php echo e($c['name']); ?></option><?php endforeach; ?>
    </select></div>
    <div><label style="font-size:12px;color:#888;">Search</label><br><input class="jc-input" name="q" placeholder="Name / SKU" value="<?php echo e($search); ?>"></div>
    <div><label style="font-size:12px;color:#888;">Status</label><br>
    <select name="status" class="jc-select">
        <option value="">All</option>
        <option value="active" <?php if ($status==='active') echo 'selected'; ?>>Active</option>
        <option value="inactive" <?php if ($status==='inactive') echo 'selected'; ?>>Inactive</option>
    </select></div>
    <div><label style="font-size:12px;color:#888;">Flag</label><br>
    <select name="flag" class="jc-select">
        <option value="">All</option>
        <option value="featured" <?php if ($flag==='featured') echo 'selected'; ?>>Featured</option>
        <option value="hot" <?php if ($flag==='hot') echo 'selected'; ?>>Hot</option>
        <option value="low_stock" <?php if ($flag==='low_stock') echo 'selected'; ?>>Low stock (≤5)</option>
    </select></div>
    <button class="jc-btn jc-btn-primary">Filter</button>
    <a href="products.php" class="jc-btn jc-btn-outline">Reset</a>
</form>
</div>

<form method="post" data-jc-bulk-confirm>
<?php echo csrfField(); ?>
<input type="hidden" name="action" value="bulk">
<div class="jc-panel" style="padding:10px;margin-bottom:8px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
    <select class="jc-select" name="bulk_action" style="max-width:240px;">
        <option value="">Bulk action...</option>
        <option value="activate">Activate</option>
        <option value="deactivate">Deactivate</option>
        <option value="feature">Mark Featured</option>
        <option value="unfeature">Unmark Featured</option>
        <option value="hot">Mark Hot</option>
        <option value="unhot">Unmark Hot</option>
        <option value="delete">Delete</option>
    </select>
    <button class="jc-btn jc-btn-primary">Apply</button>
</div>

<div class="jc-panel" style="padding:0;">
<table class="jc-table">
    <thead><tr>
        <th style="width:30px;"><input type="checkbox" data-jc-check-all='input[name="ids[]"]'></th>
        <th>Img</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Flags</th><th>Status</th><th></th>
    </tr></thead>
    <tbody>
        <?php foreach ($products as $p): $lowStock = $p['stock'] <= 5; ?>
            <tr>
                <td><input type="checkbox" name="ids[]" value="<?php echo (int)$p['id']; ?>"></td>
                <td><?php if ($p['image']): ?><img src="<?php echo e(productImageUrl($p['image'])); ?>" style="width:40px;height:40px;object-fit:cover;border-radius:4px;"><?php endif; ?></td>
                <td>
                    <strong><?php echo e($p['name']); ?></strong>
                    <?php if ($p['sku']): ?><br><small style="color:#888;">SKU: <?php echo e($p['sku']); ?></small><?php endif; ?>
                </td>
                <td><?php echo e($p['category_name'] ?: '-'); ?></td>
                <td><?php echo money($p['price']); ?></td>
                <td<?php if ($lowStock) echo ' style="color:#c62828;font-weight:600;"'; ?>><?php echo (int)$p['stock']; ?><?php if ($p['has_variants']): ?><br><small style="color:#888;">+ variants</small><?php endif; ?></td>
                <td>
                    <?php if ($p['is_featured']): ?><span class="jc-badge" style="background:#fff3cd;color:#8a6d00;">★ Featured</span><?php endif; ?>
                    <?php if (!empty($p['is_hot'])): ?><span class="jc-badge" style="background:#ffe0e0;color:#b71c1c;">🔥 Hot</span><?php endif; ?>
                </td>
                <td><span class="jc-badge jc-badge-<?php echo e($p['status']); ?>"><?php echo e($p['status']); ?></span></td>
                <td>
                    <a class="jc-btn jc-btn-sm jc-btn-outline" href="product-edit.php?id=<?php echo (int)$p['id']; ?>">Edit</a>
                </td>
            </tr>
        <?php endforeach; ?>
        <?php if (!$products): ?><tr><td colspan="9" style="text-align:center;color:#888;">No products found.</td></tr><?php endif; ?>
    </tbody>
</table>
</div>
</form>

<?php require_once __DIR__ . '/_footer.php'; ?>
