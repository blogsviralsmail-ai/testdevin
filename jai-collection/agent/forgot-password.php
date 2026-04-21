<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/notify.php';

$msg = ''; $msgType = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrfVerify();
    $id = trim($_POST['identifier'] ?? '');
    if ($id) {
        $pdo = getPDO();
        $stmt = $pdo->prepare("SELECT * FROM agents WHERE email = ? OR mobile = ? LIMIT 1");
        $stmt->execute([$id, $id]);
        $a = $stmt->fetch();
        if ($a && !empty($a['email'])) {
            $token = bin2hex(random_bytes(24));
            $pdo->prepare("UPDATE agents SET reset_token = ?, reset_expires_at = DATE_ADD(NOW(), INTERVAL 60 MINUTE) WHERE id = ?")
                ->execute([$token, $a['id']]);
            $link = SITE_URL . '/agent/reset-password.php?token=' . $token;
            notifyPasswordReset($a['email'], $a['name'], $link);
        }
        $msg = 'If the account exists and has an email on file, a reset link has been sent.';
        $msgType = 'success';
    }
}
$logoUrl = SITE_URL . '/uploads/logo/jai-collection-logo.png';
?>
<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>Forgot Password - <?php echo e(SITE_NAME); ?> Agent</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="<?php echo e(SITE_URL); ?>/assets/css/style.css">
<style>
    body { background: linear-gradient(135deg, #f26722 0%, #e53935 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; font-family: 'Poppins', sans-serif; }
    .login-box { background: #fff; padding: 40px; border-radius: 12px; width: 100%; max-width: 400px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .login-box img { display: block; height: 70px; margin: 0 auto 20px; }
    .login-box h2 { text-align: center; color: #0d2d66; margin: 0 0 18px; }
</style>
</head><body>
<div class="login-box">
    <img src="<?php echo e($logoUrl); ?>" alt="">
    <h2>Reset Agent Password</h2>
    <?php if ($msg): ?><div class="jc-alert jc-alert-<?php echo e($msgType); ?>"><?php echo e($msg); ?></div><?php endif; ?>
    <form method="post">
        <?php echo csrfField(); ?>
        <div class="jc-form-group"><label>Email or Mobile</label><input class="jc-input" name="identifier" required></div>
        <button class="jc-btn jc-btn-primary jc-btn-block" type="submit">Send Reset Link</button>
    </form>
    <p style="text-align:center;margin-top:14px;"><a href="login.php">Back to login</a></p>
</div>
</body></html>
