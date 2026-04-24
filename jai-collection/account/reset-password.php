<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/functions.php';

$token = trim($_GET['token'] ?? ($_POST['token'] ?? ''));
$pdo = getPDO();
$error = '';
$ok = false;

// Short-circuit on empty token so an attacker can't probe for rows where
// reset_token accidentally ended up as ''. Non-empty tokens are looked up
// normally; we still filter reset_token != '' as a belt-and-braces guard.
if ($token === '') {
    $c = false;
} else {
    $stmt = $pdo->prepare("SELECT * FROM customers WHERE reset_token = ? AND reset_token != '' AND reset_expires_at > NOW()");
    $stmt->execute([$token]);
    $c = $stmt->fetch();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrfVerify();
    if (!$c) {
        $error = 'Invalid or expired reset link. Please request a new one.';
    } else {
        $pw = $_POST['password'] ?? '';
        $pw2 = $_POST['password2'] ?? '';
        if (strlen($pw) < 6) $error = 'Password must be at least 6 characters.';
        elseif ($pw !== $pw2) $error = 'Passwords do not match.';
        else {
            $pdo->prepare("UPDATE customers SET password = ?, reset_token = NULL, reset_expires_at = NULL WHERE id = ?")
                ->execute([password_hash($pw, PASSWORD_DEFAULT), $c['id']]);
            $ok = true;
        }
    }
}

$pageTitle = 'Reset Password';
require_once __DIR__ . '/../includes/header.php';
?>
<div class="jc-panel" style="max-width:440px;margin:20px auto;">
    <h2 style="margin:0 0 16px;color:#0d2d66;">Set New Password</h2>
    <?php if ($ok): ?>
        <div class="jc-alert jc-alert-success">Password updated. You can now <a href="login.php">login</a>.</div>
    <?php elseif (!$c && !$error): ?>
        <div class="jc-alert jc-alert-error">Invalid or expired reset link.</div>
    <?php else: ?>
        <?php if ($error): ?><div class="jc-alert jc-alert-error"><?php echo e($error); ?></div><?php endif; ?>
        <form method="post">
            <?php echo csrfField(); ?>
            <input type="hidden" name="token" value="<?php echo e($token); ?>">
            <div class="jc-form-group"><label>New Password</label><input class="jc-input" type="password" name="password" required minlength="6"></div>
            <div class="jc-form-group"><label>Confirm Password</label><input class="jc-input" type="password" name="password2" required minlength="6"></div>
            <button class="jc-btn jc-btn-primary jc-btn-block" type="submit">Update Password</button>
        </form>
    <?php endif; ?>
</div>
<?php require_once __DIR__ . '/../includes/footer.php'; ?>
