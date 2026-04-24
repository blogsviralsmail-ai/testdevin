<?php
$pageTitle = 'Banners';
require_once __DIR__ . '/_header.php';
$pdo = getPDO();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrfVerify();
    $a = $_POST['action'] ?? '';
    if ($a === 'save') {
        $id = (int)($_POST['id'] ?? 0);
        $title = sanitize($_POST['title']);
        $subtitle = sanitize($_POST['subtitle']);
        $link = sanitize($_POST['link']);
        $sort = (int)$_POST['sort_order'];
        $status = $_POST['status'] === 'active' ? 'active' : 'inactive';
        $image = null;
        if ($id) {
            $r = $pdo->prepare("SELECT image FROM banners WHERE id = ?"); $r->execute([$id]); $image = ($r->fetch() ?: [])['image'] ?? null;
        }
        // Use the return-value-checking helper so we never INSERT a banner row
        // pointing at a file that didn't actually land on disk (the case that
        // caused "banner add ho raha hai par website par dikhai nahi de raha").
        if (!empty($_FILES['image']['tmp_name'])) {
            $newFn = uploadImageFile($_FILES['image'], 'products', 'banner', ['jpg','jpeg','png','webp']);
            if ($newFn) { $image = $newFn; }
        }
        if ($id) {
            $pdo->prepare("UPDATE banners SET title=?, subtitle=?, image=?, link=?, sort_order=?, status=? WHERE id=?")
                ->execute([$title, $subtitle, $image, $link, $sort, $status, $id]);
            setFlash('success', 'Banner updated.');
        } elseif ($image) {
            $pdo->prepare("INSERT INTO banners (title,subtitle,image,link,sort_order,status) VALUES (?,?,?,?,?,?)")
                ->execute([$title, $subtitle, $image, $link, $sort, $status]);
            setFlash('success', 'Banner added.');
        } else {
            // New banner submit without a successful image upload — tell the
            // admin explicitly rather than silently ignoring the submit.
            setFlash('error', 'Banner not saved: image upload failed or image missing.');
        }
        redirect('banners.php');
    }
    if ($a === 'delete') {
        $pdo->prepare("DELETE FROM banners WHERE id = ?")->execute([(int)$_POST['id']]);
        redirect('banners.php');
    }
}

$banners = $pdo->query("SELECT * FROM banners ORDER BY sort_order, id DESC")->fetchAll();
?>
<div class="jc-admin-actions"><h2>Banners (<?php echo count($banners); ?>)</h2></div>

<div class="jc-panel" style="margin-bottom:20px;">
    <h3 style="margin-top:0;color:#0d2d66;">Add / Edit Banner</h3>
    <form method="post" enctype="multipart/form-data">
        <?php echo csrfField(); ?>
        <input type="hidden" name="action" value="save">
        <input type="hidden" name="id" value="">
        <div class="jc-row">
            <div class="jc-form-group"><label>Title</label><input class="jc-input" name="title"></div>
            <div class="jc-form-group"><label>Subtitle</label><input class="jc-input" name="subtitle"></div>
        </div>
        <div class="jc-row">
            <div class="jc-form-group"><label>Link URL</label><input class="jc-input" name="link"></div>
            <div class="jc-form-group"><label>Sort Order</label><input class="jc-input" type="number" name="sort_order" value="0"></div>
        </div>
        <div class="jc-row">
            <div class="jc-form-group"><label>Image*</label><input class="jc-input" type="file" name="image" accept="image/*" required></div>
            <div class="jc-form-group">
                <label>Status</label>
                <select class="jc-select" name="status">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>
        </div>
        <button class="jc-btn jc-btn-primary" type="submit">Add Banner</button>
    </form>
</div>

<div class="jc-panel" style="padding:0;">
<table class="jc-table">
    <thead><tr><th>Image</th><th>Title</th><th>Link</th><th>Order</th><th>Status</th><th></th></tr></thead>
    <tbody>
        <?php foreach ($banners as $b): ?>
            <tr>
                <td><img src="<?php echo e(productImageUrl($b['image'])); ?>" style="height:40px;border-radius:4px;"></td>
                <td><?php echo e($b['title']); ?></td>
                <td><?php echo e($b['link']); ?></td>
                <td><?php echo (int)$b['sort_order']; ?></td>
                <td><span class="jc-badge jc-badge-<?php echo e($b['status']); ?>"><?php echo e($b['status']); ?></span></td>
                <td>
                    <form method="post" style="display:inline;">
                        <?php echo csrfField(); ?>
                        <input type="hidden" name="action" value="delete">
                        <input type="hidden" name="id" value="<?php echo (int)$b['id']; ?>">
                        <button class="jc-btn jc-btn-sm" style="background:#fdecec;color:#8a1a1a;" data-confirm="Delete?">Delete</button>
                    </form>
                </td>
            </tr>
        <?php endforeach; ?>
    </tbody>
</table>
</div>

<?php require_once __DIR__ . '/_footer.php'; ?>
