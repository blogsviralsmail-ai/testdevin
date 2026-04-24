<?php
$pageTitle = 'Customers';
require_once __DIR__ . '/_header.php';
require_once __DIR__ . '/../includes/export.php';
require_once __DIR__ . '/../includes/notify.php';
$pdo = getPDO();

$edit = null;
$editId = $_GET['edit'] ?? '';
if ($editId && $editId !== 'new') {
    $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ?");
    $stmt->execute([(int)$editId]);
    $edit = $stmt->fetch();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrfVerify();
    $action = $_POST['action'] ?? '';
    if ($action === 'save') {
        $id = (int)($_POST['id'] ?? 0);
        $name = sanitize($_POST['name']);
        $email = sanitize($_POST['email'] ?? '');
        $mobile = sanitize($_POST['mobile']);
        $allowed = ['active','inactive','suspended'];
        $status = in_array($_POST['status'] ?? 'active', $allowed, true) ? $_POST['status'] : 'active';
        if ($id) {
            $sql = "UPDATE customers SET name=?, email=?, mobile=?, status=?";
            $args = [$name, $email, $mobile, $status];
            if (!empty($_POST['password'])) {
                if (strlen($_POST['password']) < 6) { setFlash('error','Password must be at least 6 characters.'); redirect('customers.php?edit='.$id); }
                $sql .= ", password=?"; $args[] = password_hash($_POST['password'], PASSWORD_DEFAULT);
            }
            $sql .= " WHERE id=?"; $args[] = $id;
            $pdo->prepare($sql)->execute($args);
            setFlash('success','Customer updated.');
        } else {
            $password = !empty($_POST['password']) ? $_POST['password'] : generateRandomString(8);
            if (strlen($password) < 6) { setFlash('error','Password must be at least 6 characters.'); redirect('customers.php?edit=new'); }
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO customers (name, email, mobile, password, status) VALUES (?,?,?,?,?)");
            try {
                $stmt->execute([$name, $email, $mobile, $hash, $status]);
                if ($email) { notifyWelcome($email, $name, 'customer'); }
                setFlash('success', 'Customer created. Login password: ' . $password);
            } catch (Exception $e) {
                setFlash('error', 'Failed: mobile or email may already exist.');
            }
        }
        redirect('customers.php');
    }
    if ($action === 'bulk') {
        $ids = array_map('intval', $_POST['ids'] ?? []);
        $ids = array_filter($ids);
        if (!$ids) { setFlash('error','No rows selected.'); redirect('customers.php'); }
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $bulk = $_POST['bulk_action'];
        if ($bulk === 'delete')            $pdo->prepare("DELETE FROM customers WHERE id IN ($placeholders)")->execute($ids);
        elseif ($bulk === 'suspend')       $pdo->prepare("UPDATE customers SET status='suspended' WHERE id IN ($placeholders)")->execute($ids);
        elseif ($bulk === 'activate')      $pdo->prepare("UPDATE customers SET status='active' WHERE id IN ($placeholders)")->execute($ids);
        setFlash('success', count($ids) . ' customer(s) updated.');
        redirect('customers.php');
    }
    if ($action === 'reset_pw') {
        $id = (int)$_POST['id'];
        $c = $pdo->prepare("SELECT * FROM customers WHERE id = ?"); $c->execute([$id]); $c = $c->fetch();
        if ($c) {
            $new = generateRandomString(8);
            $pdo->prepare("UPDATE customers SET password=? WHERE id=?")->execute([password_hash($new, PASSWORD_DEFAULT), $id]);
            setFlash('success', 'New password for ' . $c['name'] . ': ' . $new);
        }
        redirect('customers.php');
    }
}

// Filters
$q = trim($_GET['q'] ?? '');
$status = $_GET['status'] ?? '';
$where = []; $args = [];
if ($q) { $where[] = "(c.name LIKE ? OR c.mobile LIKE ? OR c.email LIKE ?)"; $args[] = "%$q%"; $args[] = "%$q%"; $args[] = "%$q%"; }
if (in_array($status, ['active','inactive','suspended'], true)) { $where[] = "c.status = ?"; $args[] = $status; }
$wsql = $where ? (' WHERE ' . implode(' AND ', $where)) : '';

$sql = "SELECT c.*,
    (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) AS orders_count,
    (SELECT COALESCE(SUM(total),0) FROM orders o WHERE o.customer_id = c.id) AS total_spent
    FROM customers c $wsql ORDER BY c.id DESC LIMIT 1000";
$stmt = $pdo->prepare($sql); $stmt->execute($args); $rows = $stmt->fetchAll();

// Export
if (($_GET['export'] ?? '') === 'csv' || ($_GET['export'] ?? '') === 'pdf') {
    $headers = ['ID','Name','Mobile','Email','Status','Orders','Total Spent','Joined'];
    $out = [];
    foreach ($rows as $c) {
        $out[] = [$c['id'],$c['name'],$c['mobile'],$c['email'],$c['status'],$c['orders_count'],$c['total_spent'],$c['created_at']];
    }
    if ($_GET['export'] === 'csv') exportCsv('customers-'.date('Ymd-Hi').'.csv', $headers, $out);
    else exportPdf('Customers', $headers, $out);
}
?>
<div class="jc-admin-actions">
    <h2>Customers (<?php echo count($rows); ?>)</h2>
    <div>
        <a href="?edit=new" class="jc-btn jc-btn-primary"><i class="fas fa-user-plus"></i> Add Customer</a>
        <a href="?<?php echo http_build_query(array_merge($_GET,['export'=>'csv'])); ?>" class="jc-btn jc-btn-outline"><i class="fas fa-file-csv"></i> CSV</a>
        <a href="?<?php echo http_build_query(array_merge($_GET,['export'=>'pdf'])); ?>" class="jc-btn jc-btn-outline" target="_blank"><i class="fas fa-file-pdf"></i> PDF</a>
    </div>
</div>

<?php if ($edit !== null || $editId === 'new'): ?>
<div class="jc-panel" style="margin-bottom:20px;">
    <h3 style="margin-top:0;color:#0d2d66;"><?php echo $edit ? 'Edit Customer' : 'New Customer'; ?></h3>
    <form method="post">
        <?php echo csrfField(); ?>
        <input type="hidden" name="action" value="save">
        <input type="hidden" name="id" value="<?php echo (int)($edit['id'] ?? 0); ?>">
        <div class="jc-row">
            <div class="jc-form-group"><label>Name*</label><input class="jc-input" name="name" required value="<?php echo e($edit['name'] ?? ''); ?>"></div>
            <div class="jc-form-group"><label>Mobile*</label><input class="jc-input" name="mobile" required value="<?php echo e($edit['mobile'] ?? ''); ?>"></div>
        </div>
        <div class="jc-row">
            <div class="jc-form-group"><label>Email</label><input class="jc-input" type="email" name="email" value="<?php echo e($edit['email'] ?? ''); ?>"></div>
            <div class="jc-form-group"><label>Password <?php echo $edit ? '(leave blank to keep)' : '(auto if empty, min 6 chars)'; ?></label><input class="jc-input" type="text" name="password"></div>
        </div>
        <div class="jc-form-group">
            <label>Status</label>
            <select class="jc-select" name="status">
                <option value="active" <?php if (($edit['status'] ?? 'active')==='active') echo 'selected'; ?>>Active</option>
                <option value="inactive" <?php if (($edit['status'] ?? '')==='inactive') echo 'selected'; ?>>Inactive</option>
                <option value="suspended" <?php if (($edit['status'] ?? '')==='suspended') echo 'selected'; ?>>Suspended</option>
            </select>
        </div>
        <button class="jc-btn jc-btn-primary" type="submit">Save</button>
        <a href="customers.php" class="jc-btn jc-btn-outline">Cancel</a>
    </form>
</div>
<?php endif; ?>

<div class="jc-panel" style="margin-bottom:14px;">
    <form method="get" style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;">
        <div><label style="font-size:12px;color:#888;">Search</label><br><input class="jc-input" name="q" value="<?php echo e($q); ?>" placeholder="Name / mobile / email"></div>
        <div><label style="font-size:12px;color:#888;">Status</label><br>
            <select class="jc-select" name="status">
                <option value="">All</option>
                <option value="active" <?php if ($status==='active') echo 'selected'; ?>>Active</option>
                <option value="inactive" <?php if ($status==='inactive') echo 'selected'; ?>>Inactive</option>
                <option value="suspended" <?php if ($status==='suspended') echo 'selected'; ?>>Suspended</option>
            </select>
        </div>
        <button class="jc-btn jc-btn-primary">Filter</button>
        <a href="customers.php" class="jc-btn jc-btn-outline">Reset</a>
    </form>
</div>

<form method="post" data-jc-bulk-confirm>
    <?php echo csrfField(); ?>
    <input type="hidden" name="action" value="bulk">
    <div class="jc-panel" style="padding:10px;margin-bottom:8px;display:flex;gap:10px;align-items:center;">
        <select class="jc-select" name="bulk_action" style="max-width:240px;">
            <option value="">Bulk action...</option>
            <option value="activate">Activate</option>
            <option value="suspend">Suspend</option>
            <option value="delete">Delete</option>
        </select>
        <button class="jc-btn jc-btn-primary">Apply</button>
    </div>
    <div class="jc-panel" style="padding:0;">
    <table class="jc-table">
        <thead><tr>
            <th style="width:30px;"><input type="checkbox" data-jc-check-all='input[name="ids[]"]'></th>
            <th>Name</th><th>Mobile</th><th>Email</th><th>Orders</th><th>Spent</th><th>Status</th><th>Joined</th><th></th>
        </tr></thead>
        <tbody>
            <?php foreach ($rows as $c): ?>
                <tr>
                    <td><input type="checkbox" name="ids[]" value="<?php echo (int)$c['id']; ?>"></td>
                    <td><?php echo e($c['name']); ?></td>
                    <td><?php echo e($c['mobile']); ?></td>
                    <td><?php echo e($c['email']); ?></td>
                    <td><?php echo (int)$c['orders_count']; ?></td>
                    <td><?php echo money($c['total_spent']); ?></td>
                    <td><span class="jc-badge jc-badge-<?php echo e($c['status']); ?>"><?php echo e($c['status']); ?></span></td>
                    <td><?php echo formatDate($c['created_at']); ?></td>
                    <td>
                        <a class="jc-btn jc-btn-sm jc-btn-outline" href="?edit=<?php echo (int)$c['id']; ?>">Edit</a>
                    </td>
                </tr>
            <?php endforeach; ?>
            <?php if (!$rows): ?><tr><td colspan="9" style="text-align:center;color:#888;">No customers found.</td></tr><?php endif; ?>
        </tbody>
    </table>
    </div>
</form>

<?php require_once __DIR__ . '/_footer.php'; ?>
