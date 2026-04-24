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
        $stmt = $pdo->prepare("SELECT * FROM customers WHERE email = ? OR mobile = ? LIMIT 1");
        $stmt->execute([$id, $id]);
        $c = $stmt->fetch();
        if ($c && !empty($c['email'])) {
            $token = bin2hex(random_bytes(24));
            $pdo->prepare("UPDATE customers SET reset_token = ?, reset_expires_at = DATE_ADD(NOW(), INTERVAL 60 MINUTE) WHERE id = ?")
                ->execute([$token, $c['id']]);
            // SITE_URL_TRUSTED (not SITE_URL) — reset link must never use the
            // request Host header, otherwise a forged Host → password-reset
            // poisoning would leak the token to an attacker-controlled domain.
            $link = SITE_URL_TRUSTED . '/account/reset-password.php?token=' . $token;
            notifyPasswordReset($c['email'], $c['name'], $link);
        }
        // Always show same message (do not leak which accounts exist)
        $msg = 'If the account exists and has an email on file, a reset link has been sent.';
        $msgType = 'success';
    }
}
$pageTitle = 'Forgot Password';
require_once __DIR__ . '/../includes/header.php';
?>
<div class="jc-panel" style="max-width:440px;margin:20px auto;">
    <h2 style="margin:0 0 16px;color:#0d2d66;">Reset Password</h2>
    <?php if ($msg): ?><div class="jc-alert jc-alert-<?php echo e($msgType); ?>"><?php echo e($msg); ?></div><?php endif; ?>
    <p style="color:#888;font-size:13px;">Enter your email or mobile number. If we find an account with an email on file, we'll send a reset link.</p>
    <form method="post">
        <?php echo csrfField(); ?>
        <div class="jc-form-group"><label>Email or Mobile</label><input class="jc-input" name="identifier" required></div>
        <button class="jc-btn jc-btn-primary jc-btn-block" type="submit">Send Reset Link</button>
    </form>
    <p style="text-align:center;margin-top:14px;"><a href="login.php">Back to login</a></p>
</div>
<?php require_once __DIR__ . '/../includes/footer.php'; ?>
