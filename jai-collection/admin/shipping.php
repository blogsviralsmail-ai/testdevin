<?php
$pageTitle = 'Shipping';
require_once __DIR__ . '/_header.php';
$pdo = getPDO();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrfVerify();
    $a = $_POST['action'] ?? '';
    if ($a === 'save') {
        $pdo->prepare("INSERT INTO shipping_rates (name, pincode_prefix, min_order, rate, free_above, status) VALUES (?,?,?,?,?,?)")
            ->execute([
                sanitize($_POST['name']),
                sanitize($_POST['pincode_prefix']) ?: null,
                (float)($_POST['min_order'] ?? 0),
                (float)$_POST['rate'],
                $_POST['free_above'] !== '' ? (float)$_POST['free_above'] : null,
                $_POST['status'] === 'active' ? 'active' : 'inactive',
            ]);
        setFlash('success', 'Rate added.');
        redirect('shipping.php');
    }
    if ($a === 'delete') {
        $pdo->prepare("DELETE FROM shipping_rates WHERE id = ?")->execute([(int)$_POST['id']]);
        redirect('shipping.php');
    }
}

$rows = $pdo->query("SELECT * FROM shipping_rates ORDER BY id DESC")->fetchAll();
?>
<div class="jc-admin-actions"><h2>Shipping Rates</h2></div>

<div class="jc-panel" style="margin-bottom:20px;">
    <h3 style="margin-top:0;color:#0d2d66;">Add Rate</h3>
    <p style="color:#888;font-size:13px;">Leave pincode prefix empty for fallback. Prefix matches from beginning, longest-match wins.</p>
    <form method="post">
        <?php echo csrfField(); ?>
        <input type="hidden" name="action" value="save">
        <div class="jc-row">
            <div class="jc-form-group"><label>Name</label><input class="jc-input" name="name" required></div>
            <div class="jc-form-group"><label>Pincode Prefix</label><input class="jc-input" name="pincode_prefix" placeholder="e.g. 4 for 4xxxxx"></div>
        </div>
        <div class="jc-row">
            <div class="jc-form-group"><label>Rate*</label><input class="jc-input" type="number" step="0.01" name="rate" required></div>
            <div class="jc-form-group"><label>Free Above</label><input class="jc-input" type="number" step="0.01" name="free_above"></div>
        </div>
        <button class="jc-btn jc-btn-primary" type="submit">Add</button>
    </form>
</div>

<div class="jc-panel" style="padding:0;">
<table class="jc-table">
    <thead><tr><th>Name</th><th>Prefix</th><th>Rate</th><th>Free Above</th><th>Status</th><th></th></tr></thead>
    <tbody>
        <?php foreach ($rows as $r): ?>
            <tr>
                <td><?php echo e($r['name']); ?></td>
                <td><?php echo e($r['pincode_prefix'] ?: '(default)'); ?></td>
                <td><?php echo money($r['rate']); ?></td>
                <td><?php echo $r['free_above'] !== null ? money($r['free_above']) : '-'; ?></td>
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
