<?php
/**
 * SafeChild Admin - Login Page
 */
require_once __DIR__ . '/../includes/functions.php';

// If already logged in, redirect to dashboard
if (getAuthParent()) {
    header('Location: /safechild/admin/dashboard.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = sanitize($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        $error = 'Please enter email and password';
    } else {
        $db = getDB();
        $result = $db->query("SELECT * FROM parents WHERE email = '$email' AND is_active = 1");
        
        if ($result && $result->num_rows > 0) {
            $parent = $result->fetch_assoc();
            if (verifyPassword($password, $parent['password_hash'])) {
                $_SESSION['parent_id'] = $parent['id'];
                
                // Update last login
                $now = date('Y-m-d H:i:s');
                $db->query("UPDATE parents SET last_login = '$now' WHERE id = {$parent['id']}");
                
                logAudit($parent['id'], 'login', 'parents', $parent['id'], 'Successful login');
                
                header('Location: /safechild/admin/dashboard.php');
                exit;
            } else {
                $error = 'Invalid password';
            }
        } else {
            $error = 'Account not found';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - SafeChild</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="/safechild/admin/assets/css/style.css" rel="stylesheet">
</head>
<body>
<div class="login-wrapper">
    <div class="login-card">
        <div class="logo-section">
            <div class="logo-icon"><i class="fas fa-shield-alt"></i></div>
            <h1>SafeChild</h1>
            <p>Transparent Parental Control</p>
        </div>
        
        <?php if ($error): ?>
            <div class="error-message"><i class="fas fa-exclamation-circle"></i> <?= htmlspecialchars($error) ?></div>
        <?php endif; ?>
        
        <form method="POST">
            <div class="form-group">
                <label for="email"><i class="fas fa-envelope"></i> Email</label>
                <input type="email" id="email" name="email" class="form-control" placeholder="your@email.com" required value="<?= htmlspecialchars($_POST['email'] ?? '') ?>">
            </div>
            
            <div class="form-group">
                <label for="password"><i class="fas fa-lock"></i> Password</label>
                <input type="password" id="password" name="password" class="form-control" placeholder="Enter password" required>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; padding:12px;">
                <i class="fas fa-sign-in-alt"></i> Login
            </button>
        </form>
        
        <p style="text-align:center; margin-top:20px; font-size:14px; color:var(--gray);">
            Don't have an account? <a href="/safechild/admin/register.php">Register</a>
        </p>
    </div>
</div>
</body>
</html>
