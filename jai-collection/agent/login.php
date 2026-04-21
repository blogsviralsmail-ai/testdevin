<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/functions.php';
if (currentAgent()) redirect('dashboard.php');

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrfVerify();
    $mobile = sanitize($_POST['mobile'] ?? '');
    $password = $_POST['password'] ?? '';
    $stmt = getPDO()->prepare("SELECT * FROM agents WHERE (mobile = ? OR email = ?) LIMIT 1");
    $stmt->execute([$mobile, $mobile]);
    $u = $stmt->fetch();
    if ($u && password_verify($password, $u['password'])) {
        if ($u['status'] === 'suspended') { $error = 'Your account has been suspended. Please contact admin.'; }
        elseif ($u['status'] === 'inactive') { $error = 'Your account is inactive. Please contact admin.'; }
        else {
            $_SESSION['agent'] = ['id' => $u['id'], 'name' => $u['name'], 'mobile' => $u['mobile'], 'referral_code' => $u['referral_code']];
            redirect('dashboard.php');
        }
    } else {
        $error = 'Invalid credentials.';
    }
}
$logoUrl = SITE_URL . '/uploads/logo/jai-collection-logo.png';
?>
<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>Agent Login - <?php echo e(SITE_NAME); ?></title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="<?php echo e(SITE_URL); ?>/assets/css/style.css">
<style>
    body { background: linear-gradient(135deg, #f26722 0%, #e53935 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; font-family: 'Poppins', sans-serif; }
    .login-box { background: #fff; padding: 40px; border-radius: 12px; width: 100%; max-width: 400px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .login-box img { display: block; height: 70px; margin: 0 auto 20px; }
    .login-box h2 { text-align: center; color: #0d2d66; margin: 0 0 24px; }
</style>
</head><body>
    <div class="login-box">
        <img src="<?php echo e($logoUrl); ?>" alt="">
        <h2>Agent Login</h2>
        <?php if ($error): ?><div class="jc-alert jc-alert-error"><?php echo e($error); ?></div><?php endif; ?>
        <form method="post">
            <?php echo csrfField(); ?>
            <div class="jc-form-group"><label>Mobile / Email</label><input class="jc-input" name="mobile" required autofocus></div>
            <div class="jc-form-group"><label>Password</label><input class="jc-input" type="password" name="password" required></div>
            <button class="jc-btn jc-btn-primary jc-btn-block" type="submit">Login</button>
        </form>
        <p style="text-align:center;font-size:13px;margin-top:14px;color:#888;">
            <a href="forgot-password.php">Forgot Password?</a> &middot; Contact admin to get agent credentials.
        </p>
    </div>
</body></html>
