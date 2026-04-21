<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/functions.php';

$token = trim($_GET['token'] ?? ($_POST['token'] ?? ''));
$pdo = getPDO();
$error = ''; $ok = false;

$stmt = $pdo->prepare("SELECT * FROM agents WHERE reset_token = ? AND reset_expires_at > NOW()");
$stmt->execute([$token]);
$a = $stmt->fetch();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrfVerify();
    if (!$a) {
        $error = 'Invalid or expired reset link.';
    } else {
        $pw = $_POST['password'] ?? ''; $pw2 = $_POST['password2'] ?? '';
        if (strlen($pw) < 6) $error = 'Password must be at least 6 characters.';
        elseif ($pw !== $pw2) $error = 'Passwords do not match.';
        else {
            $pdo->prepare("UPDATE agents SET password = ?, reset_token = NULL, reset_expires_at = NULL WHERE id = ?")
                ->execute([password_hash($pw, PASSWORD_DEFAULT), $a['id']]);
            $ok = true;
        }
    }
}
$logoUrl = SITE_URL . '/uploads/logo/jai-collection-logo.png';
?>
<!DOCTYPE html>
<html><head>
<meta charset="UTF-8"><title>Reset Password - <?php echo e(SITE_NAME); ?> Agent</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="<?php echo e(SITE_URL); ?>/assets/css/style.css">
<style>body{background:linear-gradient(135deg,#f26722,#e53935);min-height:100vh;display:flex;align-items:center;justify-content:center;margin:0;font-family:Poppins,sans-serif;}
.login-box{background:#fff;padding:40px;border-radius:12px;max-width:400px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.3);}
.login-box h2{color:#0d2d66;text-align:center;margin:0 0 16px;}</style>
</head><body>
<div class="login-box">
    <h2>Set New Password</h2>
    <?php if ($ok): ?>
        <div class="jc-alert jc-alert-success">Password updated. You can now <a href="login.php">login</a>.</div>
    <?php elseif (!$a && !$error): ?>
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
</body></html>
