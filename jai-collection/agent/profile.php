<?php
$pageTitle = 'Profile';
require_once __DIR__ . '/_header.php';
$pdo = getPDO();
$agentFull = getAgentById($agent['id']);
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrfVerify();
    $name = sanitize($_POST['name']);
    $email = sanitize($_POST['email']);
    $upi = sanitize($_POST['upi_id']);
    $bankHolder = sanitize($_POST['bank_account_holder']);
    $bankAcc = sanitize($_POST['bank_account_number']);
    $bankIfsc = sanitize($_POST['bank_ifsc']);
    $bankName = sanitize($_POST['bank_name']);
    $pdo->prepare("UPDATE agents SET name=?, email=?, upi_id=?, bank_account_holder=?, bank_account_number=?, bank_ifsc=?, bank_name=? WHERE id=?")
        ->execute([$name, $email, $upi, $bankHolder, $bankAcc, $bankIfsc, $bankName, $agent['id']]);
    if (!empty($_POST['new_password'])) {
        $hash = password_hash($_POST['new_password'], PASSWORD_DEFAULT);
        $pdo->prepare("UPDATE agents SET password = ? WHERE id = ?")->execute([$hash, $agent['id']]);
    }
    $_SESSION['agent']['name'] = $name;
    setFlash('success', 'Profile updated.');
    redirect('profile.php');
}
?>
<div class="jc-admin-actions"><h2>My Profile</h2></div>
<div class="jc-panel">
    <form method="post">
        <?php echo csrfField(); ?>
        <div class="jc-row">
            <div class="jc-form-group"><label>Name</label><input class="jc-input" name="name" value="<?php echo e($agentFull['name']); ?>"></div>
            <div class="jc-form-group"><label>Mobile (not editable)</label><input class="jc-input" value="<?php echo e($agentFull['mobile']); ?>" disabled></div>
        </div>
        <div class="jc-row">
            <div class="jc-form-group"><label>Email</label><input class="jc-input" type="email" name="email" value="<?php echo e($agentFull['email']); ?>"></div>
            <div class="jc-form-group"><label>Referral Code (not editable)</label><input class="jc-input" value="<?php echo e($agentFull['referral_code']); ?>" disabled></div>
        </div>
        <h4 style="color:#0d2d66;">Bank / UPI</h4>
        <div class="jc-form-group"><label>UPI ID</label><input class="jc-input" name="upi_id" value="<?php echo e($agentFull['upi_id']); ?>"></div>
        <div class="jc-row">
            <div class="jc-form-group"><label>Account Holder</label><input class="jc-input" name="bank_account_holder" value="<?php echo e($agentFull['bank_account_holder']); ?>"></div>
            <div class="jc-form-group"><label>Account Number</label><input class="jc-input" name="bank_account_number" value="<?php echo e($agentFull['bank_account_number']); ?>"></div>
        </div>
        <div class="jc-row">
            <div class="jc-form-group"><label>IFSC</label><input class="jc-input" name="bank_ifsc" value="<?php echo e($agentFull['bank_ifsc']); ?>"></div>
            <div class="jc-form-group"><label>Bank Name</label><input class="jc-input" name="bank_name" value="<?php echo e($agentFull['bank_name']); ?>"></div>
        </div>
        <h4 style="color:#0d2d66;">Change Password</h4>
        <div class="jc-form-group"><label>New Password (leave blank to keep)</label><input class="jc-input" type="password" name="new_password"></div>
        <button class="jc-btn jc-btn-primary" type="submit">Save</button>
    </form>
</div>
<?php require_once __DIR__ . '/_footer.php'; ?>
