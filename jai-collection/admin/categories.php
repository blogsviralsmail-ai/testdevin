<?php
$pageTitle = 'Categories';
require_once __DIR__ . '/_header.php';
$pdo = getPDO();

$edit = null;
if (!empty($_GET['edit'])) {
    $stmt = $pdo->prepare("SELECT * FROM categories WHERE id = ?");
    $stmt->execute([(int)$_GET['edit']]);
    $edit = $stmt->fetch();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrfVerify();
    $action = $_POST['action'] ?? '';
    if ($action === 'save') {
        $id = (int)($_POST['id'] ?? 0);
        $name = sanitize($_POST['name']);
        $slug = sanitize($_POST['slug'] ?: slugify($name));
        $parentId = !empty($_POST['parent_id']) ? (int)$_POST['parent_id'] : null;
        $description = sanitize($_POST['description'] ?? '');
        $sortOrder = (int)($_POST['sort_order'] ?? 0);
        $status = $_POST['status'] === 'active' ? 'active' : 'inactive';

        $image = $edit['image'] ?? null;
        if (!empty($_FILES['image']['tmp_name'])) {
            $ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
            if (in_array($ext, ['jpg','jpeg','png','webp','gif'])) {
                $fn = 'cat_' . time() . '_' . generateRandomString(6) . '.' . $ext;
                $dest = UPLOAD_DIR . '/products/' . $fn;
                if (!is_dir(dirname($dest))) mkdir(dirname($dest), 0755, true);
                move_uploaded_file($_FILES['image']['tmp_name'], $dest);
                $image = $fn;
            }
        }

        if ($id) {
            $pdo->prepare("UPDATE categories SET name=?, slug=?, parent_id=?, description=?, image=?, sort_order=?, status=? WHERE id=?")
                ->execute([$name, $slug, $parentId, $description, $image, $sortOrder, $status, $id]);
            setFlash('success', 'Category updated.');
        } else {
            $pdo->prepare("INSERT INTO categories (name, slug, parent_id, description, image, sort_order, status) VALUES (?,?,?,?,?,?,?)")
                ->execute([$name, $slug, $parentId, $description, $image, $sortOrder, $status]);
            setFlash('success', 'Category created.');
        }
        redirect('categories.php');
    } elseif ($action === 'delete') {
        $pdo->prepare("DELETE FROM categories WHERE id = ?")->execute([(int)$_POST['id']]);
        setFlash('info', 'Category deleted.');
        redirect('categories.php');
    }
}

$cats = $pdo->query("SELECT c.*, p.name AS parent_name,
    (SELECT COUNT(*) FROM products pr WHERE pr.category_id = c.id) AS product_count
    FROM categories c LEFT JOIN categories p ON c.parent_id = p.id
    ORDER BY c.sort_order, c.name")->fetchAll();
$parents = $pdo->query("SELECT id, name FROM categories WHERE parent_id IS NULL ORDER BY name")->fetchAll();
?>

<div class="jc-admin-actions">
    <h2>Categories (<?php echo count($cats); ?>)</h2>
    <a href="categories.php?edit=new" class="jc-btn jc-btn-primary"><i class="fas fa-plus"></i> Add Category</a>
</div>

<?php if ($edit !== null || (isset($_GET['edit']) && $_GET['edit'] === 'new')): ?>
<div class="jc-panel" style="margin-bottom:20px;">
    <h3 style="margin-top:0;color:#0d2d66;"><?php echo ($edit ? 'Edit' : 'New') . ' Category'; ?></h3>
    <form method="post" enctype="multipart/form-data">
        <?php echo csrfField(); ?>
        <input type="hidden" name="action" value="save">
        <input type="hidden" name="id" value="<?php echo (int)($edit['id'] ?? 0); ?>">
        <div class="jc-row">
            <div class="jc-form-group"><label>Name*</label><input class="jc-input" name="name" required value="<?php echo e($edit['name'] ?? ''); ?>"></div>
            <div class="jc-form-group"><label>Slug (auto if empty)</label><input class="jc-input" name="slug" value="<?php echo e($edit['slug'] ?? ''); ?>"></div>
        </div>
        <div class="jc-row">
            <div class="jc-form-group">
                <label>Parent Category</label>
                <select class="jc-select" name="parent_id">
                    <option value="">(None - top level)</option>
                    <?php foreach ($parents as $p): if (($edit['id'] ?? 0) == $p['id']) continue; ?>
                        <option value="<?php echo (int)$p['id']; ?>" <?php if (($edit['parent_id'] ?? null) == $p['id']) echo 'selected'; ?>><?php echo e($p['name']); ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="jc-form-group"><label>Sort Order</label><input class="jc-input" type="number" name="sort_order" value="<?php echo (int)($edit['sort_order'] ?? 0); ?>"></div>
        </div>
        <div class="jc-form-group"><label>Description</label><textarea class="jc-textarea" name="description"><?php echo e($edit['description'] ?? ''); ?></textarea></div>
        <div class="jc-row">
            <div class="jc-form-group">
                <label>Image</label>
                <input class="jc-input" type="file" name="image" accept="image/*">
                <?php if (!empty($edit['image'])): ?>
                    <img src="<?php echo e(productImageUrl($edit['image'])); ?>" style="height:60px;margin-top:6px;border-radius:6px;">
                <?php endif; ?>
            </div>
            <div class="jc-form-group">
                <label>Status</label>
                <select class="jc-select" name="status">
                    <option value="active" <?php if (($edit['status'] ?? 'active') === 'active') echo 'selected'; ?>>Active</option>
                    <option value="inactive" <?php if (($edit['status'] ?? '') === 'inactive') echo 'selected'; ?>>Inactive</option>
                </select>
            </div>
        </div>
        <button class="jc-btn jc-btn-primary" type="submit">Save</button>
        <a href="categories.php" class="jc-btn jc-btn-outline">Cancel</a>
    </form>
</div>
<?php endif; ?>

<div class="jc-panel" style="padding:0;">
<table class="jc-table">
    <thead><tr><th>Img</th><th>Name</th><th>Slug</th><th>Parent</th><th>Products</th><th>Order</th><th>Status</th><th></th></tr></thead>
    <tbody>
        <?php foreach ($cats as $c): ?>
            <tr>
                <td><?php if ($c['image']): ?><img src="<?php echo e(productImageUrl($c['image'])); ?>" style="width:36px;height:36px;object-fit:cover;border-radius:4px;"><?php endif; ?></td>
                <td><strong><?php echo e($c['name']); ?></strong></td>
                <td><?php echo e($c['slug']); ?></td>
                <td><?php echo e($c['parent_name'] ?: '-'); ?></td>
                <td><?php echo (int)$c['product_count']; ?></td>
                <td><?php echo (int)$c['sort_order']; ?></td>
                <td><span class="jc-badge jc-badge-<?php echo e($c['status']); ?>"><?php echo e($c['status']); ?></span></td>
                <td>
                    <a class="jc-btn jc-btn-sm jc-btn-outline" href="?edit=<?php echo (int)$c['id']; ?>">Edit</a>
                    <form method="post" style="display:inline;">
                        <?php echo csrfField(); ?>
                        <input type="hidden" name="action" value="delete">
                        <input type="hidden" name="id" value="<?php echo (int)$c['id']; ?>">
                        <button class="jc-btn jc-btn-sm" style="background:#fdecec;color:#8a1a1a;" data-confirm="Delete <?php echo e($c['name']); ?>?">Delete</button>
                    </form>
                </td>
            </tr>
        <?php endforeach; ?>
    </tbody>
</table>
</div>

<?php require_once __DIR__ . '/_footer.php'; ?>
