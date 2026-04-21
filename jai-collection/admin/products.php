<?php
$pageTitle = 'Products';
require_once __DIR__ . '/_header.php';
$pdo = getPDO();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrfVerify();
    if (($_POST['action'] ?? '') === 'delete') {
        $pdo->prepare("DELETE FROM products WHERE id = ?")->execute([(int)$_POST['id']]);
        setFlash('info', 'Product deleted.');
        redirect('products.php');
    }
}

$filterCat = (int)($_GET['category_id'] ?? 0);
$search = sanitize($_GET['q'] ?? '');
$sql = "SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id";
$where = []; $args = [];
if ($filterCat) { $where[] = "p.category_id = ?"; $args[] = $filterCat; }
if ($search) { $where[] = "p.name LIKE ?"; $args[] = '%' . $search . '%'; }
if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
$sql .= ' ORDER BY p.id DESC LIMIT 200';
$stmt = $pdo->prepare($sql); $stmt->execute($args);
$products = $stmt->fetchAll();
$cats = getCategories(false);
?>

<div class="jc-admin-actions">
    <h2>Products (<?php echo count($products); ?>)</h2>
    <a href="product-edit.php" class="jc-btn jc-btn-primary"><i class="fas fa-plus"></i> Add Product</a>
</div>

<form method="get" style="display:flex;gap:10px;margin-bottom:14px;">
    <select name="category_id" class="jc-select" style="max-width:260px;">
        <option value="0">All Categories</option>
        <?php foreach ($cats as $c): ?>
            <option value="<?php echo (int)$c['id']; ?>" <?php if ($filterCat == $c['id']) echo 'selected'; ?>><?php echo e($c['name']); ?></option>
        <?php endforeach; ?>
    </select>
    <input class="jc-input" name="q" placeholder="Search..." value="<?php echo e($search); ?>" style="max-width:260px;">
    <button class="jc-btn jc-btn-outline" type="submit">Filter</button>
</form>

<div class="jc-panel" style="padding:0;">
<table class="jc-table">
    <thead><tr><th>Img</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Featured</th><th>Status</th><th></th></tr></thead>
    <tbody>
        <?php foreach ($products as $p): ?>
            <tr>
                <td><?php if ($p['image']): ?><img src="<?php echo e(productImageUrl($p['image'])); ?>" style="width:40px;height:40px;object-fit:cover;border-radius:4px;"><?php endif; ?></td>
                <td>
                    <strong><?php echo e($p['name']); ?></strong>
                    <?php if ($p['sku']): ?><br><small style="color:#888;">SKU: <?php echo e($p['sku']); ?></small><?php endif; ?>
                </td>
                <td><?php echo e($p['category_name'] ?: '-'); ?></td>
                <td><?php echo money($p['price']); ?></td>
                <td><?php echo (int)$p['stock']; ?><?php if ($p['has_variants']): ?><br><small style="color:#888;">+ variants</small><?php endif; ?></td>
                <td><?php echo $p['is_featured'] ? '<i class="fas fa-star" style="color:#f5a623;"></i>' : '-'; ?></td>
                <td><span class="jc-badge jc-badge-<?php echo e($p['status']); ?>"><?php echo e($p['status']); ?></span></td>
                <td>
                    <a class="jc-btn jc-btn-sm jc-btn-outline" href="product-edit.php?id=<?php echo (int)$p['id']; ?>">Edit</a>
                    <form method="post" style="display:inline;">
                        <?php echo csrfField(); ?>
                        <input type="hidden" name="action" value="delete">
                        <input type="hidden" name="id" value="<?php echo (int)$p['id']; ?>">
                        <button class="jc-btn jc-btn-sm" style="background:#fdecec;color:#8a1a1a;" data-confirm="Delete <?php echo e($p['name']); ?>?">Delete</button>
                    </form>
                </td>
            </tr>
        <?php endforeach; ?>
        <?php if (!$products): ?><tr><td colspan="8" style="text-align:center;color:#888;">No products yet.</td></tr><?php endif; ?>
    </tbody>
</table>
</div>

<?php require_once __DIR__ . '/_footer.php'; ?>
