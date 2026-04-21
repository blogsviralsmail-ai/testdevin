<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/functions.php';

$error = '';
$dashboardUrl = SITE_URL . '/account/dashboard.php';
$redirect = safeRedirect($_GET['redirect'] ?? '', $dashboardUrl);

if (currentCustomer()) redirect($dashboardUrl);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrfVerify();
    $mobile = sanitize($_POST['mobile'] ?? '');
    $password = $_POST['password'] ?? '';
    if (!$mobile || !$password) {
        $error = 'Mobile and password are required.';
    } else {
        $stmt = getPDO()->prepare("SELECT * FROM customers WHERE mobile = ? AND status = 'active'");
        $stmt->execute([$mobile]);
        $c = $stmt->fetch();
        if ($c && password_verify($password, $c['password'])) {
            $_SESSION['customer'] = ['id' => $c['id'], 'name' => $c['name'], 'mobile' => $c['mobile'], 'email' => $c['email']];
            redirect($redirect);
        } else {
            $error = 'Invalid mobile or password.';
        }
    }
}

$pageTitle = 'Login';
require_once __DIR__ . '/../includes/header.php';
?>
<div class="jc-panel" style="max-width:440px;margin:20px auto;">
    <h2 style="margin:0 0 16px;color:var(--jc-blue-dark);">Customer Login</h2>
    <?php if ($error): ?><div class="jc-alert jc-alert-error"><?php echo e($error); ?></div><?php endif; ?>
    <form method="post">
        <?php echo csrfField(); ?>
        <div class="jc-form-group"><label>Mobile Number</label><input class="jc-input" name="mobile" required></div>
        <div class="jc-form-group"><label>Password</label><input class="jc-input" type="password" name="password" required></div>
        <button class="jc-btn jc-btn-primary jc-btn-block" type="submit">Login</button>
    </form>
    <p style="text-align:center;margin-top:14px;">New to <?php echo e(SITE_NAME); ?>? <a href="register.php">Create an account</a></p>
</div>
<?php require_once __DIR__ . '/../includes/footer.php'; ?>
