<?php
$pageTitle = 'Agents';
require_once __DIR__ . '/_header.php';
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
        $status = $_POST['status'] === 'active' ? 'active' : 'inactive';
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
}

$agents = $pdo->query("SELECT a.*,
    (SELECT COUNT(*) FROM orders o WHERE o.agent_id = a.id) AS orders_count
    FROM agents a ORDER BY a.id DESC")->fetchAll();
?>
<div class="jc-admin-actions">
    <h2>Agents (<?php echo count($agents); ?>)</h2>
    <a href="?edit=new" class="jc-btn jc-btn-primary"><i class="fas fa-plus"></i> Onboard Agent</a>
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
            </select>
        </div>
        <button class="jc-btn jc-btn-primary" type="submit">Save</button>
        <a href="agents.php" class="jc-btn jc-btn-outline">Cancel</a>
    </form>
</div>
<?php endif; ?>

<div class="jc-panel" style="padding:0;">
<table class="jc-table">
    <thead><tr><th>Name</th><th>Mobile</th><th>Ref Code</th><th>Comm %</th><th>Orders</th><th>Wallet</th><th>Earned</th><th>Paid</th><th>Status</th><th></th></tr></thead>
    <tbody>
        <?php foreach ($agents as $a): ?>
            <tr>
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
        <?php if (!$agents): ?><tr><td colspan="10" style="text-align:center;color:#888;">No agents yet. Click "Onboard Agent" to add one.</td></tr><?php endif; ?>
    </tbody>
</table>
</div>

<?php require_once __DIR__ . '/_footer.php'; ?>
