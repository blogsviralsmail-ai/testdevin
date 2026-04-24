<?php
$pageTitle = 'Coupons';
require_once __DIR__ . '/_header.php';
$pdo = getPDO();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrfVerify();
    $a = $_POST['action'] ?? '';
    if ($a === 'save') {
        $pdo->prepare("INSERT INTO coupons (code, type, value, min_order, max_discount, usage_limit, valid_from, valid_to, status) VALUES (?,?,?,?,?,?,?,?,?)")
            ->execute([
                strtoupper(sanitize($_POST['code'])),
                $_POST['type'] === 'flat' ? 'flat' : 'percent',
                (float)$_POST['value'],
                (float)($_POST['min_order'] ?? 0),
                $_POST['max_discount'] !== '' ? (float)$_POST['max_discount'] : null,
                $_POST['usage_limit'] !== '' ? (int)$_POST['usage_limit'] : null,
                $_POST['valid_from'] ?: null,
                $_POST['valid_to'] ?: null,
                $_POST['status'] === 'active' ? 'active' : 'inactive',
            ]);
        setFlash('success', 'Coupon added.');
        redirect('coupons.php');
    }
    if ($a === 'delete') {
        $pdo->prepare("DELETE FROM coupons WHERE id = ?")->execute([(int)$_POST['id']]);
        redirect('coupons.php');
    }
}

$rows = $pdo->query("SELECT * FROM coupons ORDER BY id DESC")->fetchAll();
?>
<div class="jc-admin-actions"><h2>Coupons (<?php echo count($rows); ?>)</h2></div>

<div class="jc-panel" style="margin-bottom:20px;">
    <h3 style="margin-top:0;color:#0d2d66;">Add Coupon</h3>
    <form method="post">
        <?php echo csrfField(); ?>
        <input type="hidden" name="action" value="save">
        <div class="jc-row">
            <div class="jc-form-group"><label>Code</label><input class="jc-input" name="code" required style="text-transform:uppercase;"></div>
            <div class="jc-form-group">
                <label>Type</label>
                <select class="jc-select" name="type"><option value="percent">Percent</option><option value="flat">Flat</option></select>
            </div>
        </div>
        <div class="jc-row">
            <div class="jc-form-group"><label>Value</label><input class="jc-input" type="number" step="0.01" name="value" required></div>
            <div class="jc-form-group"><label>Min Order</label><input class="jc-input" type="number" step="0.01" name="min_order" value="0"></div>
        </div>
        <div class="jc-row">
            <div class="jc-form-group"><label>Max Discount (percent only)</label><input class="jc-input" type="number" step="0.01" name="max_discount"></div>
            <div class="jc-form-group"><label>Usage Limit</label><input class="jc-input" type="number" name="usage_limit"></div>
        </div>
        <div class="jc-row">
            <div class="jc-form-group"><label>Valid From</label><input class="jc-input" type="date" name="valid_from"></div>
            <div class="jc-form-group"><label>Valid To</label><input class="jc-input" type="date" name="valid_to"></div>
        </div>
        <div class="jc-form-group">
            <label>Status</label>
            <select class="jc-select" name="status"><option value="active">Active</option><option value="inactive">Inactive</option></select>
        </div>
        <button class="jc-btn jc-btn-primary" type="submit">Add Coupon</button>
    </form>
</div>

<div class="jc-panel" style="padding:0;">
<table class="jc-table">
    <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Used</th><th>Valid</th><th>Status</th><th></th></tr></thead>
    <tbody>
        <?php foreach ($rows as $r): ?>
            <tr>
                <td><code><?php echo e($r['code']); ?></code></td>
                <td><?php echo e($r['type']); ?></td>
                <td><?php echo $r['type'] === 'percent' ? $r['value'].'%' : money($r['value']); ?></td>
                <td><?php echo money($r['min_order']); ?></td>
                <td><?php echo (int)$r['used_count']; ?><?php if ($r['usage_limit']): ?>/<?php echo (int)$r['usage_limit']; ?><?php endif; ?></td>
                <td><?php echo e($r['valid_from']); ?> &mdash; <?php echo e($r['valid_to']); ?></td>
                <td><span class="jc-badge jc-badge-<?php echo e($r['status']); ?>"><?php echo e($r['status']); ?></span></td>
                <td>
                    <form method="post" style="display:inline;">
                        <?php echo csrfField(); ?>
                        <input type="hidden" name="action" value="delete">
                        <input type="hidden" name="id" value="<?php echo (int)$r['id']; ?>">
                        <button class="jc-btn jc-btn-sm" style="background:#fdecec;color:#8a1a1a;" data-confirm="Delete?">Delete</button>
                    </form>
                </td>
            </tr>
        <?php endforeach; ?>
    </tbody>
</table>
</div>

<?php require_once __DIR__ . '/_footer.php'; ?>
