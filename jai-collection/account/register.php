<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/notify.php';

$error = '';
if (currentCustomer()) redirect(SITE_URL . '/account/dashboard.php');
if (getSetting('enable_registration','1') !== '1') {
    $error = 'New registrations are temporarily disabled.';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !$error) {
    csrfVerify();
    $name = sanitize($_POST['name'] ?? '');
    $mobile = sanitize($_POST['mobile'] ?? '');
    $email = sanitize($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    if (!$name || !$mobile || !$password) { $error = 'All required fields must be filled.'; }
    elseif (strlen($password) < 6) { $error = 'Password must be at least 6 characters.'; }
    else {
        $pdo = getPDO();
        $check = $pdo->prepare("SELECT id FROM customers WHERE mobile = ?");
        $check->execute([$mobile]);
        if ($check->fetch()) { $error = 'Mobile already registered. Please login.'; }
        else {
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $pdo->prepare("INSERT INTO customers (name, mobile, email, password) VALUES (?, ?, ?, ?)")
                ->execute([$name, $mobile, $email, $hash]);
            $id = $pdo->lastInsertId();
            $_SESSION['customer'] = ['id' => $id, 'name' => $name, 'mobile' => $mobile, 'email' => $email];
            if ($email) notifyWelcome($email, $name, 'customer');
            setFlash('success', 'Welcome to ' . SITE_NAME . '!');
            redirect(SITE_URL . '/account/dashboard.php');
        }
    }
}

$pageTitle = 'Register';
require_once __DIR__ . '/../includes/header.php';
?>
<div class="jc-panel" style="max-width:440px;margin:20px auto;">
    <h2 style="margin:0 0 16px;color:var(--jc-blue-dark);">Create Account</h2>
    <?php if ($error): ?><div class="jc-alert jc-alert-error"><?php echo e($error); ?></div><?php endif; ?>
    <form method="post">
        <?php echo csrfField(); ?>
        <div class="jc-form-group"><label>Full Name*</label><input class="jc-input" name="name" required></div>
        <div class="jc-form-group"><label>Mobile Number*</label><input class="jc-input" name="mobile" required pattern="[0-9]{10}"></div>
        <div class="jc-form-group"><label>Email</label><input class="jc-input" type="email" name="email"></div>
        <div class="jc-form-group"><label>Password*</label><input class="jc-input" type="password" name="password" required minlength="6"></div>
        <button class="jc-btn jc-btn-primary jc-btn-block" type="submit">Register</button>
    </form>
    <p style="text-align:center;margin-top:14px;">Already have an account? <a href="login.php">Login</a></p>
</div>
<?php require_once __DIR__ . '/../includes/footer.php'; ?>
