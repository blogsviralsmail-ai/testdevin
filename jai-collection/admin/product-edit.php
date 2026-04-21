<?php
$pageTitle = 'Product';
require_once __DIR__ . '/_header.php';
$pdo = getPDO();

$id = (int)($_GET['id'] ?? 0);
$product = null;
if ($id) {
    $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
    $stmt->execute([$id]);
    $product = $stmt->fetch();
    if (!$product) { setFlash('error', 'Product not found.'); redirect('products.php'); }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrfVerify();
    $action = $_POST['action'] ?? '';

    if ($action === 'save') {
        $name = sanitize($_POST['name']);
        $slug = sanitize($_POST['slug'] ?: slugify($name));
        // Ensure unique slug
        $base = $slug; $i = 1;
        while (true) {
            $chk = $pdo->prepare("SELECT id FROM products WHERE slug = ? AND id != ?");
            $chk->execute([$slug, $id]);
            if (!$chk->fetch()) break;
            $slug = $base . '-' . (++$i);
        }
        $categoryId = (int)$_POST['category_id'] ?: null;
        $sku = sanitize($_POST['sku']);
        $short = sanitize($_POST['short_description']);
        $desc = sanitize($_POST['description']);
        $price = (float)$_POST['price'];
        $comparePrice = $_POST['compare_price'] !== '' ? (float)$_POST['compare_price'] : null;
        $costPrice = $_POST['cost_price'] !== '' ? (float)$_POST['cost_price'] : null;
        $stock = (int)$_POST['stock'];
        $hasVariants = !empty($_POST['has_variants']) ? 1 : 0;
        $isFeatured = !empty($_POST['is_featured']) ? 1 : 0;
        $sortOrder = (int)$_POST['sort_order'];
        $status = $_POST['status'] === 'active' ? 'active' : 'inactive';

        // Main image upload
        $image = $product['image'] ?? null;
        if (!empty($_FILES['image']['tmp_name'])) {
            $ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
            if (in_array($ext, ['jpg','jpeg','png','webp','gif'])) {
                $fn = 'prod_' . time() . '_' . generateRandomString(6) . '.' . $ext;
                $dest = UPLOAD_DIR . '/products/' . $fn;
                if (!is_dir(dirname($dest))) mkdir(dirname($dest), 0755, true);
                move_uploaded_file($_FILES['image']['tmp_name'], $dest);
                $image = $fn;
            }
        }

        if ($id) {
            $pdo->prepare("UPDATE products SET category_id=?, name=?, slug=?, sku=?, short_description=?, description=?, image=?, price=?, compare_price=?, cost_price=?, stock=?, has_variants=?, is_featured=?, sort_order=?, status=? WHERE id=?")
                ->execute([$categoryId, $name, $slug, $sku, $short, $desc, $image, $price, $comparePrice, $costPrice, $stock, $hasVariants, $isFeatured, $sortOrder, $status, $id]);
        } else {
            $pdo->prepare("INSERT INTO products (category_id, name, slug, sku, short_description, description, image, price, compare_price, cost_price, stock, has_variants, is_featured, sort_order, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
                ->execute([$categoryId, $name, $slug, $sku, $short, $desc, $image, $price, $comparePrice, $costPrice, $stock, $hasVariants, $isFeatured, $sortOrder, $status]);
            $id = (int)$pdo->lastInsertId();
        }

        // Gallery upload
        if (!empty($_FILES['gallery']['tmp_name'])) {
            foreach ($_FILES['gallery']['tmp_name'] as $i => $tmp) {
                if (!$tmp) continue;
                $ext = strtolower(pathinfo($_FILES['gallery']['name'][$i], PATHINFO_EXTENSION));
                if (!in_array($ext, ['jpg','jpeg','png','webp','gif'])) continue;
                $fn = 'prod_' . time() . '_' . generateRandomString(6) . '.' . $ext;
                $dest = UPLOAD_DIR . '/products/' . $fn;
                if (!is_dir(dirname($dest))) mkdir(dirname($dest), 0755, true);
                move_uploaded_file($tmp, $dest);
                $pdo->prepare("INSERT INTO product_images (product_id, image) VALUES (?, ?)")->execute([$id, $fn]);
            }
        }
        setFlash('success', 'Product saved.');
        redirect('product-edit.php?id=' . $id);
    }

    if ($action === 'delete_image') {
        $pdo->prepare("DELETE FROM product_images WHERE id = ? AND product_id = ?")->execute([(int)$_POST['image_id'], $id]);
        redirect('product-edit.php?id=' . $id);
    }

    if ($action === 'variant_save') {
        $vid = (int)($_POST['variant_id'] ?? 0);
        $size = sanitize($_POST['size']);
        $color = sanitize($_POST['color']);
        $vsku = sanitize($_POST['vsku']);
        $vprice = $_POST['vprice'] !== '' ? (float)$_POST['vprice'] : null;
        $vstock = (int)$_POST['vstock'];
        $vorder = (int)$_POST['vorder'];
        if ($vid) {
            $pdo->prepare("UPDATE product_variants SET size=?, color=?, sku=?, price=?, stock=?, sort_order=? WHERE id=? AND product_id=?")
                ->execute([$size, $color, $vsku, $vprice, $vstock, $vorder, $vid, $id]);
        } else {
            $pdo->prepare("INSERT INTO product_variants (product_id, size, color, sku, price, stock, sort_order) VALUES (?,?,?,?,?,?,?)")
                ->execute([$id, $size, $color, $vsku, $vprice, $vstock, $vorder]);
        }
        $pdo->prepare("UPDATE products SET has_variants = 1 WHERE id = ?")->execute([$id]);
        setFlash('success', 'Variant saved.');
        redirect('product-edit.php?id=' . $id);
    }

    if ($action === 'variant_delete') {
        $pdo->prepare("DELETE FROM product_variants WHERE id = ? AND product_id = ?")->execute([(int)$_POST['variant_id'], $id]);
        redirect('product-edit.php?id=' . $id);
    }
}

$cats = getCategories(false);
$gallery = $id ? getProductImages($id) : [];
$variants = $id ? getProductVariants($id) : [];
?>

<div class="jc-admin-actions"><h2><?php echo $product ? 'Edit Product' : 'New Product'; ?></h2><a href="products.php" class="jc-btn jc-btn-outline">Back</a></div>

<form method="post" enctype="multipart/form-data" class="jc-panel">
    <?php echo csrfField(); ?>
    <input type="hidden" name="action" value="save">
    <div class="jc-row">
        <div class="jc-form-group"><label>Name*</label><input class="jc-input" name="name" required value="<?php echo e($product['name'] ?? ''); ?>"></div>
        <div class="jc-form-group"><label>Slug (auto if empty)</label><input class="jc-input" name="slug" value="<?php echo e($product['slug'] ?? ''); ?>"></div>
    </div>
    <div class="jc-row">
        <div class="jc-form-group">
            <label>Category</label>
            <select class="jc-select" name="category_id">
                <option value="">--</option>
                <?php foreach ($cats as $c): ?>
                    <option value="<?php echo (int)$c['id']; ?>" <?php if (($product['category_id'] ?? '') == $c['id']) echo 'selected'; ?>><?php echo e($c['name']); ?></option>
                <?php endforeach; ?>
            </select>
        </div>
        <div class="jc-form-group"><label>SKU</label><input class="jc-input" name="sku" value="<?php echo e($product['sku'] ?? ''); ?>"></div>
    </div>
    <div class="jc-form-group"><label>Short Description</label><input class="jc-input" name="short_description" value="<?php echo e($product['short_description'] ?? ''); ?>"></div>
    <div class="jc-form-group"><label>Description</label><textarea class="jc-textarea" name="description" rows="5"><?php echo e($product['description'] ?? ''); ?></textarea></div>
    <div class="jc-row">
        <div class="jc-form-group"><label>Price*</label><input class="jc-input" type="number" step="0.01" name="price" required value="<?php echo e($product['price'] ?? '0'); ?>"></div>
        <div class="jc-form-group"><label>Compare/MRP</label><input class="jc-input" type="number" step="0.01" name="compare_price" value="<?php echo e($product['compare_price'] ?? ''); ?>"></div>
    </div>
    <div class="jc-row">
        <div class="jc-form-group"><label>Cost Price</label><input class="jc-input" type="number" step="0.01" name="cost_price" value="<?php echo e($product['cost_price'] ?? ''); ?>"></div>
        <div class="jc-form-group"><label>Stock (no variants)</label><input class="jc-input" type="number" name="stock" value="<?php echo e($product['stock'] ?? '0'); ?>"></div>
    </div>
    <div class="jc-row">
        <div class="jc-form-group">
            <label>Main Image</label>
            <input class="jc-input" type="file" name="image" accept="image/*">
            <?php if (!empty($product['image'])): ?>
                <img src="<?php echo e(productImageUrl($product['image'])); ?>" style="height:60px;margin-top:6px;border-radius:6px;">
            <?php endif; ?>
        </div>
        <div class="jc-form-group">
            <label>Gallery Images (multiple)</label>
            <input class="jc-input" type="file" name="gallery[]" accept="image/*" multiple>
        </div>
    </div>
    <div class="jc-row">
        <div class="jc-form-group"><label>Sort Order</label><input class="jc-input" type="number" name="sort_order" value="<?php echo e($product['sort_order'] ?? '0'); ?>"></div>
        <div class="jc-form-group">
            <label>Status</label>
            <select class="jc-select" name="status">
                <option value="active" <?php if (($product['status'] ?? 'active') === 'active') echo 'selected'; ?>>Active</option>
                <option value="inactive" <?php if (($product['status'] ?? '') === 'inactive') echo 'selected'; ?>>Inactive</option>
            </select>
        </div>
    </div>
    <div style="display:flex;gap:20px;margin-bottom:14px;">
        <label><input type="checkbox" name="is_featured" value="1" <?php if (!empty($product['is_featured'])) echo 'checked'; ?>> Featured</label>
        <label><input type="checkbox" name="has_variants" value="1" <?php if (!empty($product['has_variants'])) echo 'checked'; ?>> Has Variants</label>
    </div>
    <button class="jc-btn jc-btn-primary" type="submit">Save Product</button>
</form>

<?php if ($id): ?>

<div class="jc-panel" style="margin-top:20px;">
    <h3 style="margin-top:0;color:#0d2d66;">Gallery Images</h3>
    <?php if (!$gallery): ?>
        <p style="color:#888;">No additional images.</p>
    <?php else: ?>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <?php foreach ($gallery as $img): ?>
                <div style="position:relative;">
                    <img src="<?php echo e(productImageUrl($img['image'])); ?>" style="width:100px;height:100px;object-fit:cover;border-radius:6px;">
                    <form method="post" style="position:absolute;top:4px;right:4px;">
                        <?php echo csrfField(); ?>
                        <input type="hidden" name="action" value="delete_image">
                        <input type="hidden" name="image_id" value="<?php echo (int)$img['id']; ?>">
                        <button class="jc-btn jc-btn-sm" style="background:rgba(139,26,26,0.9);color:#fff;padding:2px 6px;" data-confirm="Delete image?"><i class="fas fa-times"></i></button>
                    </form>
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
</div>

<div class="jc-panel" style="margin-top:20px;">
    <h3 style="margin-top:0;color:#0d2d66;">Variants (size / color)</h3>
    <table class="jc-table">
        <thead><tr><th>Size</th><th>Color</th><th>SKU</th><th>Price</th><th>Stock</th><th>Order</th><th></th></tr></thead>
        <tbody>
            <?php foreach ($variants as $v): ?>
                <tr>
                    <form method="post">
                        <?php echo csrfField(); ?>
                        <input type="hidden" name="action" value="variant_save">
                        <input type="hidden" name="variant_id" value="<?php echo (int)$v['id']; ?>">
                        <td><input class="jc-input" name="size" value="<?php echo e($v['size']); ?>"></td>
                        <td><input class="jc-input" name="color" value="<?php echo e($v['color']); ?>"></td>
                        <td><input class="jc-input" name="vsku" value="<?php echo e($v['sku']); ?>"></td>
                        <td><input class="jc-input" type="number" step="0.01" name="vprice" value="<?php echo e($v['price']); ?>" placeholder="inherit"></td>
                        <td><input class="jc-input" type="number" name="vstock" value="<?php echo (int)$v['stock']; ?>"></td>
                        <td><input class="jc-input" type="number" name="vorder" value="<?php echo (int)$v['sort_order']; ?>"></td>
                        <td>
                            <button class="jc-btn jc-btn-sm jc-btn-outline" type="submit">Save</button>
                    </form>
                            <form method="post" style="display:inline;">
                                <?php echo csrfField(); ?>
                                <input type="hidden" name="action" value="variant_delete">
                                <input type="hidden" name="variant_id" value="<?php echo (int)$v['id']; ?>">
                                <button class="jc-btn jc-btn-sm" style="background:#fdecec;color:#8a1a1a;" data-confirm="Delete variant?"><i class="fas fa-times"></i></button>
                            </form>
                        </td>
                </tr>
            <?php endforeach; ?>
            <tr>
                <form method="post">
                    <?php echo csrfField(); ?>
                    <input type="hidden" name="action" value="variant_save">
                    <td><input class="jc-input" name="size" placeholder="e.g. M / L / XL"></td>
                    <td><input class="jc-input" name="color" placeholder="e.g. Red"></td>
                    <td><input class="jc-input" name="vsku" placeholder="SKU"></td>
                    <td><input class="jc-input" type="number" step="0.01" name="vprice" placeholder="inherit"></td>
                    <td><input class="jc-input" type="number" name="vstock" value="0"></td>
                    <td><input class="jc-input" type="number" name="vorder" value="0"></td>
                    <td><button class="jc-btn jc-btn-sm jc-btn-primary" type="submit"><i class="fas fa-plus"></i> Add</button></td>
                </form>
            </tr>
        </tbody>
    </table>
</div>
<?php endif; ?>

<?php require_once __DIR__ . '/_footer.php'; ?>
