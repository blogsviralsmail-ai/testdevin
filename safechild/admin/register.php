<?php
/**
 * SafeChild Admin - Parent Registration
 */
require_once __DIR__ . '/../includes/functions.php';

if (getAuthParent()) {
    header('Location: /safechild/admin/dashboard.php');
    exit;
}

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = sanitize($_POST['name'] ?? '');
    $email = sanitize($_POST['email'] ?? '');
    $phone = sanitize($_POST['phone'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirmPassword = $_POST['confirm_password'] ?? '';
    
    if (empty($name) || empty($email) || empty($password)) {
        $error = 'Please fill all required fields';
    } elseif (strlen($password) < 6) {
        $error = 'Password must be at least 6 characters';
    } elseif ($password !== $confirmPassword) {
        $error = 'Passwords do not match';
    } else {
        $db = getDB();
        
        // Check if email exists
        $check = $db->query("SELECT id FROM parents WHERE email = '$email'");
        if ($check && $check->num_rows > 0) {
            $error = 'This email is already registered';
        } else {
            $passwordHash = hashPassword($password);
            $phoneVal = !empty($phone) ? "'$phone'" : 'NULL';
            
            $db->query("
                INSERT INTO parents (name, email, password_hash, phone)
                VALUES ('$name', '$email', '$passwordHash', $phoneVal)
            ");
            
            if ($db->affected_rows > 0) {
                $parentId = $db->insert_id;
                
                // Create default family
                $db->query("
                    INSERT INTO families (parent_id, family_name)
                    VALUES ($parentId, '{$name}\\'s Family')
                ");
                
                $success = 'Account created successfully! Please login.';
            } else {
                $error = 'Registration failed. Please try again.';
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - SafeChild</title>
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
            <p>Create Parent Account</p>
        </div>
        
        <?php if ($error): ?>
            <div class="error-message"><i class="fas fa-exclamation-circle"></i> <?= htmlspecialchars($error) ?></div>
        <?php endif; ?>
        
        <?php if ($success): ?>
            <div class="success-message"><i class="fas fa-check-circle"></i> <?= htmlspecialchars($success) ?></div>
        <?php endif; ?>
        
        <form method="POST">
            <div class="form-group">
                <label for="name"><i class="fas fa-user"></i> Full Name *</label>
                <input type="text" id="name" name="name" class="form-control" placeholder="Your full name" required value="<?= htmlspecialchars($_POST['name'] ?? '') ?>">
            </div>
            
            <div class="form-group">
                <label for="email"><i class="fas fa-envelope"></i> Email *</label>
                <input type="email" id="email" name="email" class="form-control" placeholder="your@email.com" required value="<?= htmlspecialchars($_POST['email'] ?? '') ?>">
            </div>
            
            <div class="form-group">
                <label for="phone"><i class="fas fa-phone"></i> Phone (Optional)</label>
                <input type="tel" id="phone" name="phone" class="form-control" placeholder="+91 9876543210" value="<?= htmlspecialchars($_POST['phone'] ?? '') ?>">
            </div>
            
            <div class="form-group">
                <label for="password"><i class="fas fa-lock"></i> Password *</label>
                <input type="password" id="password" name="password" class="form-control" placeholder="Minimum 6 characters" required>
            </div>
            
            <div class="form-group">
                <label for="confirm_password"><i class="fas fa-lock"></i> Confirm Password *</label>
                <input type="password" id="confirm_password" name="confirm_password" class="form-control" placeholder="Re-enter password" required>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; padding:12px;">
                <i class="fas fa-user-plus"></i> Create Account
            </button>
        </form>
        
        <p style="text-align:center; margin-top:20px; font-size:14px; color:var(--gray);">
            Already have an account? <a href="/safechild/admin/index.php">Login</a>
        </p>
    </div>
</div>
</body>
</html>
