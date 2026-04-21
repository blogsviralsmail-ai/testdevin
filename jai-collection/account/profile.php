<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/functions.php';
requireCustomer();

$pdo = getPDO();
$cust = currentCustomer();
$c = $pdo->prepare("SELECT * FROM customers WHERE id = ?"); $c->execute([$cust['id']]); $c = $c->fetch();
$error = ''; $info = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrfVerify();
    $action = $_POST['action'] ?? '';
    if ($action === 'profile') {
        $name = sanitize($_POST['name']);
        $email = sanitize($_POST['email']);
        $pdo->prepare("UPDATE customers SET name=?, email=? WHERE id=?")->execute([$name, $email, $c['id']]);
        $_SESSION['customer']['name'] = $name;
        $_SESSION['customer']['email'] = $email;
        $info = 'Profile updated.';
        $c['name'] = $name; $c['email'] = $email;
    }
    if ($action === 'password') {
        $cur = $_POST['current'] ?? '';
        $new = $_POST['new'] ?? '';
        $new2 = $_POST['new2'] ?? '';
        if (!password_verify($cur, $c['password'])) $error = 'Current password is wrong.';
        elseif (strlen($new) < 6) $error = 'New password must be at least 6 characters.';
        elseif ($new !== $new2) $error = 'New passwords do not match.';
        else {
            $pdo->prepare("UPDATE customers SET password=? WHERE id=?")->execute([password_hash($new, PASSWORD_DEFAULT), $c['id']]);
            $info = 'Password changed.';
        }
    }
}

$pageTitle = 'My Profile';
require_once __DIR__ . '/../includes/header.php';
?>
<div class="jc-panel" style="max-width:620px;margin:20px auto;">
    <h2 style="margin:0 0 16px;color:#0d2d66;">My Profile</h2>
    <?php if ($error): ?><div class="jc-alert jc-alert-error"><?php echo e($error); ?></div><?php endif; ?>
    <?php if ($info): ?><div class="jc-alert jc-alert-success"><?php echo e($info); ?></div><?php endif; ?>

    <form method="post" style="margin-bottom:26px;">
        <?php echo csrfField(); ?>
        <input type="hidden" name="action" value="profile">
        <div class="jc-row">
            <div class="jc-form-group"><label>Name</label><input class="jc-input" name="name" required value="<?php echo e($c['name']); ?>"></div>
            <div class="jc-form-group"><label>Mobile (cannot change)</label><input class="jc-input" value="<?php echo e($c['mobile']); ?>" disabled></div>
        </div>
        <div class="jc-form-group"><label>Email</label><input class="jc-input" type="email" name="email" value="<?php echo e($c['email']); ?>"></div>
        <button class="jc-btn jc-btn-primary" type="submit">Save Profile</button>
    </form>

    <h3 style="color:#0d2d66;">Change Password</h3>
    <form method="post">
        <?php echo csrfField(); ?>
        <input type="hidden" name="action" value="password">
        <div class="jc-form-group"><label>Current Password</label><input class="jc-input" type="password" name="current" required></div>
        <div class="jc-row">
            <div class="jc-form-group"><label>New Password</label><input class="jc-input" type="password" name="new" required minlength="6"></div>
            <div class="jc-form-group"><label>Confirm New</label><input class="jc-input" type="password" name="new2" required minlength="6"></div>
        </div>
        <button class="jc-btn jc-btn-primary" type="submit">Update Password</button>
    </form>
</div>
<?php require_once __DIR__ . '/../includes/footer.php'; ?>
