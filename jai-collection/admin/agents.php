<?php
$pageTitle = 'Agents';
require_once __DIR__ . '/_header.php';
require_once __DIR__ . '/../includes/export.php';
require_once __DIR__ . '/../includes/notify.php';
$pdo = getPDO();

$edit = null;
$editId = $_GET['edit'] ?? '';
if ($editId && $editId !== 'new') {
    $stmt = $pdo->prepare("SELECT * FROM agents WHERE id = ?");
    $stmt->execute([(int)$editId]);
    $edit = $stmt->fetch();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrfVerify();
    $action = $_POST['action'] ?? '';
    if ($action === 'save') {
        $id = (int)($_POST['id'] ?? 0);
        $name = sanitize($_POST['name']);
        $email = sanitize($_POST['email']);
        $mobile = sanitize($_POST['mobile']);
        $commission = (float)$_POST['commission_percent'];
        $refCode = sanitize($_POST['referral_code'] ?? '') ?: generateReferralCode($name);
        $allowed = ['active','inactive','suspended'];
        $status = in_array($_POST['status'] ?? 'active', $allowed, true) ? $_POST['status'] : 'active';
        $notes = sanitize($_POST['notes'] ?? '');
        $bankHolder = sanitize($_POST['bank_account_holder'] ?? '');
        $bankAcc = sanitize($_POST['bank_account_number'] ?? '');
        $bankIfsc = sanitize($_POST['bank_ifsc'] ?? '');
        $bankName = sanitize($_POST['bank_name'] ?? '');
        $upi = sanitize($_POST['upi_id'] ?? '');

        if ($id) {
            $fields = "name=?, email=?, mobile=?, commission_percent=?, referral_code=?, status=?, notes=?,
                bank_account_holder=?, bank_account_number=?, bank_ifsc=?, bank_name=?, upi_id=?";
            $args = [$name, $email, $mobile, $commission, $refCode, $status, $notes, $bankHolder, $bankAcc, $bankIfsc, $bankName, $upi];
            if (!empty($_POST['password'])) {
                $fields .= ", password=?";
                $args[] = password_hash($_POST['password'], PASSWORD_DEFAULT);
            }
            $args[] = $id;
            $pdo->prepare("UPDATE agents SET $fields WHERE id=?")->execute($args);
        } else {
            $password = !empty($_POST['password']) ? $_POST['password'] : generateRandomString(8);
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $pdo->prepare("INSERT INTO agents (name, email, mobile, password, referral_code, commission_percent, status, notes,
                bank_account_holder, bank_account_number, bank_ifsc, bank_name, upi_id)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)")
                ->execute([$name, $email, $mobile, $hash, $refCode, $commission, $status, $notes, $bankHolder, $bankAcc, $bankIfsc, $bankName, $upi]);
            setFlash('success', 'Agent created. Login password: ' . $password);
            redirect('agents.php');
        }
        setFlash('success', 'Agent saved.');
        redirect('agents.php');
    }
    if ($action === 'delete') {
        $pdo->prepare("DELETE FROM agents WHERE id = ?")->execute([(int)$_POST['id']]);
        setFlash('info', 'Agent deleted.');
        redirect('agents.php');
    }
    if ($action === 'bulk') {
        $ids = array_filter(array_map('intval', $_POST['ids'] ?? []));
        if (!$ids) { setFlash('error','No rows selected.'); redirect('agents.php'); }
        $ph = implode(',', array_fill(0, count($ids), '?'));
        $bulk = $_POST['bulk_action'];
        if ($bulk === 'delete')        $pdo->prepare("DELETE FROM agents WHERE id IN ($ph)")->execute($ids);
        elseif ($bulk === 'suspend')   $pdo->prepare("UPDATE agents SET status='suspended' WHERE id IN ($ph)")->execute($ids);
        elseif ($bulk === 'activate')  $pdo->prepare("UPDATE agents SET status='active' WHERE id IN ($ph)")->execute($ids);
        setFlash('success', count($ids) . ' agent(s) updated.');
        redirect('agents.php');
    }
    if ($action === 'reset_pw') {
        $id = (int)$_POST['id'];
        $a = $pdo->prepare("SELECT * FROM agents WHERE id = ?"); $a->execute([$id]); $a = $a->fetch();
        if ($a) {
            $new = generateRandomString(8);
            $pdo->prepare("UPDATE agents SET password=? WHERE id=?")->execute([password_hash($new, PASSWORD_DEFAULT), $id]);
            setFlash('success', 'New password for ' . $a['name'] . ': ' . $new);
        }
        redirect('agents.php');
    }
}

// Filters
$q = trim($_GET['q'] ?? ''); $fstatus = $_GET['status'] ?? '';
$where = []; $args = [];
if ($q) { $where[] = "(a.name LIKE ? OR a.mobile LIKE ? OR a.referral_code LIKE ?)"; $args[] = "%$q%"; $args[] = "%$q%"; $args[] = "%$q%"; }
if (in_array($fstatus, ['active','inactive','suspended'], true)) { $where[] = "a.status = ?"; $args[] = $fstatus; }
$wsql = $where ? (' WHERE ' . implode(' AND ', $where)) : '';

$stmt = $pdo->prepare("SELECT a.*, (SELECT COUNT(*) FROM orders o WHERE o.agent_id = a.id) AS orders_count FROM agents a $wsql ORDER BY a.id DESC");
$stmt->execute($args);
$agents = $stmt->fetchAll();

if (($_GET['export'] ?? '') === 'csv' || ($_GET['export'] ?? '') === 'pdf') {
    $headers = ['ID','Name','Mobile','Email','Ref Code','Commission %','Orders','Wallet','Earned','Paid','Status','Joined'];
    $out = [];
    foreach ($agents as $a) {
        $out[] = [$a['id'],$a['name'],$a['mobile'],$a['email'],$a['referral_code'],$a['commission_percent'],$a['orders_count'],$a['wallet_balance'],$a['lifetime_earned'],$a['lifetime_paid'],$a['status'],$a['created_at']];
    }
    if ($_GET['export'] === 'csv') exportCsv('agents-'.date('Ymd-Hi').'.csv', $headers, $out);
    else exportPdf('Agents', $headers, $out);
}
?>
<div class="jc-admin-actions">
    <h2>Agents (<?php echo count($agents); ?>)</h2>
    <div>
        <a href="?edit=new" class="jc-btn jc-btn-primary"><i class="fas fa-plus"></i> Onboard Agent</a>
        <a href="?<?php echo http_build_query(array_merge($_GET,['export'=>'csv'])); ?>" class="jc-btn jc-btn-outline"><i class="fas fa-file-csv"></i> CSV</a>
        <a href="?<?php echo http_build_query(array_merge($_GET,['export'=>'pdf'])); ?>" class="jc-btn jc-btn-outline" target="_blank"><i class="fas fa-file-pdf"></i> PDF</a>
    </div>
</div>

<div class="jc-panel" style="margin-bottom:14px;">
    <form method="get" style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;">
        <div><label style="font-size:12px;color:#888;">Search</label><br><input class="jc-input" name="q" value="<?php echo e($q); ?>" placeholder="Name / mobile / ref code"></div>
        <div><label style="font-size:12px;color:#888;">Status</label><br>
            <select class="jc-select" name="status">
                <option value="">All</option>
                <option value="active" <?php if ($fstatus==='active') echo 'selected'; ?>>Active</option>
                <option value="inactive" <?php if ($fstatus==='inactive') echo 'selected'; ?>>Inactive</option>
                <option value="suspended" <?php if ($fstatus==='suspended') echo 'selected'; ?>>Suspended</option>
            </select>
        </div>
        <button class="jc-btn jc-btn-primary">Filter</button>
        <a href="agents.php" class="jc-btn jc-btn-outline">Reset</a>
    </form>
</div>

<?php if ($edit !== null || $editId === 'new'): ?>
<div class="jc-panel" style="margin-bottom:20px;">
    <h3 style="margin-top:0;color:#0d2d66;"><?php echo $edit ? 'Edit Agent' : 'Onboard New Agent'; ?></h3>
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
            <div class="jc-form-group"><label>Password <?php echo $edit ? '(leave blank to keep)' : '(auto if empty)'; ?></label><input class="jc-input" type="text" name="password"></div>
        </div>
        <div class="jc-row">
            <div class="jc-form-group">
                <label>Commission % (locked in at onboarding)*</label>
                <input class="jc-input" type="number" step="0.01" name="commission_percent" required value="<?php echo e($edit['commission_percent'] ?? getSetting('default_commission_percent','5')); ?>">
            </div>
            <div class="jc-form-group"><label>Referral Code (auto if empty)</label><input class="jc-input" name="referral_code" value="<?php echo e($edit['referral_code'] ?? ''); ?>"></div>
        </div>

        <h4 style="color:#0d2d66;">Bank / Payout Details</h4>
        <div class="jc-row">
            <div class="jc-form-group"><label>Account Holder</label><input class="jc-input" name="bank_account_holder" value="<?php echo e($edit['bank_account_holder'] ?? ''); ?>"></div>
            <div class="jc-form-group"><label>Account Number</label><input class="jc-input" name="bank_account_number" value="<?php echo e($edit['bank_account_number'] ?? ''); ?>"></div>
        </div>
        <div class="jc-row">
            <div class="jc-form-group"><label>IFSC</label><input class="jc-input" name="bank_ifsc" value="<?php echo e($edit['bank_ifsc'] ?? ''); ?>"></div>
            <div class="jc-form-group"><label>Bank Name</label><input class="jc-input" name="bank_name" value="<?php echo e($edit['bank_name'] ?? ''); ?>"></div>
        </div>
        <div class="jc-form-group"><label>UPI ID</label><input class="jc-input" name="upi_id" value="<?php echo e($edit['upi_id'] ?? ''); ?>"></div>

        <div class="jc-form-group"><label>Notes (internal)</label><textarea class="jc-textarea" name="notes"><?php echo e($edit['notes'] ?? ''); ?></textarea></div>
        <div class="jc-form-group">
            <label>Status</label>
            <select class="jc-select" name="status">
                <option value="active" <?php if (($edit['status'] ?? 'active') === 'active') echo 'selected'; ?>>Active</option>
                <option value="inactive" <?php if (($edit['status'] ?? '') === 'inactive') echo 'selected'; ?>>Inactive</option>
                <option value="suspended" <?php if (($edit['status'] ?? '') === 'suspended') echo 'selected'; ?>>Suspended</option>
            </select>
        </div>
        <button class="jc-btn jc-btn-primary" type="submit">Save</button>
        <a href="agents.php" class="jc-btn jc-btn-outline">Cancel</a>
    </form>
</div>
<?php endif; ?>

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
        <th>Name</th><th>Mobile</th><th>Ref Code</th><th>Comm %</th><th>Orders</th><th>Wallet</th><th>Earned</th><th>Paid</th><th>Status</th><th></th>
    </tr></thead>
    <tbody>
        <?php foreach ($agents as $a): ?>
            <tr>
                <td><input type="checkbox" name="ids[]" value="<?php echo (int)$a['id']; ?>"></td>
                <td><?php echo e($a['name']); ?></td>
                <td><?php echo e($a['mobile']); ?></td>
                <td><code><?php echo e($a['referral_code']); ?></code><br><small><a href="<?php echo e(SITE_URL); ?>/?ref=<?php echo e($a['referral_code']); ?>" target="_blank" style="font-size:11px;">Link</a></small></td>
                <td><?php echo e($a['commission_percent']); ?>%</td>
                <td><?php echo (int)$a['orders_count']; ?></td>
                <td><?php echo money($a['wallet_balance']); ?></td>
                <td><?php echo money($a['lifetime_earned']); ?></td>
                <td><?php echo money($a['lifetime_paid']); ?></td>
                <td><span class="jc-badge jc-badge-<?php echo e($a['status']); ?>"><?php echo e($a['status']); ?></span></td>
                <td>
                    <a class="jc-btn jc-btn-sm jc-btn-outline" href="?edit=<?php echo (int)$a['id']; ?>">Edit</a>
                </td>
            </tr>
        <?php endforeach; ?>
        <?php if (!$agents): ?><tr><td colspan="11" style="text-align:center;color:#888;">No agents yet. Click "Onboard Agent" to add one.</td></tr><?php endif; ?>
    </tbody>
</table>
</div>
</form>

<?php require_once __DIR__ . '/_footer.php'; ?>
