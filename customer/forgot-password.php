<?php
require_once '../includes/config.php';

$conn = getDBConnection();

// Handle API requests from mobile app
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    header('Content-Type: application/json');
    $action = $_POST['action'];
    
    if ($action === 'send_otp') {
        $email = sanitize($_POST['email'] ?? '');
        if (empty($email)) {
            echo json_encode(['success' => false, 'message' => 'Email is required']);
            exit;
        }
        
        $stmt = $conn->prepare("SELECT id, name, email FROM masons WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $user = $result->fetch_assoc();
            $otp = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
            
            $conn->query("DELETE FROM password_reset_otp WHERE email = '$email'");
            $stmt = $conn->prepare("INSERT INTO password_reset_otp (email, otp, expiry, user_type) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), 'customer')");
            $stmt->bind_param("ss", $email, $otp);
            $stmt->execute();
            
            $email_sent = sendOTPEmail($email, $otp, $user['name']);
            
            if ($email_sent) {
                echo json_encode(['success' => true, 'message' => 'OTP sent to your email']);
            } else {
                echo json_encode(['success' => true, 'message' => 'OTP: ' . $otp]);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Email not found']);
        }
        exit;
    }
    
    if ($action === 'verify_otp') {
        $email = sanitize($_POST['email'] ?? '');
        $otp = sanitize($_POST['otp'] ?? '');
        
        $stmt = $conn->prepare("SELECT * FROM password_reset_otp WHERE email = ? AND otp = ? AND expiry > NOW() AND user_type = 'customer'");
        $stmt->bind_param("ss", $email, $otp);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'OTP verified']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid or expired OTP']);
        }
        exit;
    }
    
    if ($action === 'reset_password') {
        $email = sanitize($_POST['email'] ?? '');
        $otp = sanitize($_POST['otp'] ?? '');
        $new_password = $_POST['new_password'] ?? '';
        
        if (strlen($new_password) < 6) {
            echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
            exit;
        }
        
        $stmt = $conn->prepare("SELECT * FROM password_reset_otp WHERE email = ? AND otp = ? AND expiry > NOW() AND user_type = 'customer'");
        $stmt->bind_param("ss", $email, $otp);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $hashed = password_hash($new_password, PASSWORD_DEFAULT);
            $stmt = $conn->prepare("UPDATE masons SET password = ? WHERE email = ?");
            $stmt->bind_param("ss", $hashed, $email);
            $stmt->execute();
            
            // Also update users table if linked
            $conn->query("UPDATE users SET password = '$hashed' WHERE email = '$email' AND role = 'mason'");
            
            $conn->query("DELETE FROM password_reset_otp WHERE email = '$email'");
            echo json_encode(['success' => true, 'message' => 'Password reset successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid or expired OTP']);
        }
        exit;
    }
}

$message = '';
$step = 'email';

if (isset($_SESSION['reset_email'])) {
    $step = 'otp';
}
if (isset($_SESSION['otp_verified'])) {
    $step = 'reset';
}

// Email sending function - Use SMTP directly (mail() doesn't work reliably on shared hosting)
function sendOTPEmail($to_email, $otp, $name = '') {
    $smtp_email = getSetting('smtp_email', '');
    $smtp_password = getSetting('smtp_password', '');
    
    if (empty($smtp_email) || empty($smtp_password)) {
        return false;
    }
    
    $subject = "JP Tiles - Password Reset OTP";
    $message = "Dear " . ($name ?: "Customer") . ",\n\n";
    $message .= "Your OTP for password reset is: $otp\n\n";
    $message .= "This OTP is valid for 10 minutes.\n\n";
    $message .= "If you did not request this, please ignore this email.\n\n";
    $message .= "Regards,\nJP Tiles Team";
    
    // Use SMTP directly - mail() returns true but doesn't actually send on shared hosting
    return sendSMTPEmail($smtp_email, $smtp_password, $to_email, $subject, $message);
}

function sendSMTPEmail($from, $password, $to, $subject, $body) {
    $smtp_host = 'ssl://smtp.gmail.com';
    $smtp_port = 465;
    
    $socket = @fsockopen($smtp_host, $smtp_port, $errno, $errstr, 30);
    if (!$socket) return false;
    
    $response = fgets($socket, 515);
    
    fputs($socket, "EHLO localhost\r\n");
    while ($line = fgets($socket, 515)) {
        if (substr($line, 3, 1) == ' ') break;
    }
    
    fputs($socket, "AUTH LOGIN\r\n");
    fgets($socket, 515);
    
    fputs($socket, base64_encode($from) . "\r\n");
    fgets($socket, 515);
    
    fputs($socket, base64_encode($password) . "\r\n");
    $auth_response = fgets($socket, 515);
    
    if (substr($auth_response, 0, 3) != '235') {
        fclose($socket);
        return false;
    }
    
    fputs($socket, "MAIL FROM:<$from>\r\n");
    fgets($socket, 515);
    
    fputs($socket, "RCPT TO:<$to>\r\n");
    fgets($socket, 515);
    
    fputs($socket, "DATA\r\n");
    fgets($socket, 515);
    
    $headers = "From: JP Tiles <$from>\r\n";
    $headers .= "To: $to\r\n";
    $headers .= "Subject: $subject\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "\r\n";
    
    fputs($socket, $headers . $body . "\r\n.\r\n");
    fgets($socket, 515);
    
    fputs($socket, "QUIT\r\n");
    fclose($socket);
    
    return true;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['send_otp'])) {
    $email = sanitize($_POST['email']);
    
    $stmt = $conn->prepare("SELECT id, name, email FROM masons WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
        if ($result->num_rows > 0) {
            $user = $result->fetch_assoc();
            $otp = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
        
            $conn->query("DELETE FROM password_reset_otp WHERE email = '$email'");
            // Use database NOW() + 10 minutes to avoid timezone mismatch
            $stmt = $conn->prepare("INSERT INTO password_reset_otp (email, otp, expiry, user_type) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), 'customer')");
            $stmt->bind_param("ss", $email, $otp);
            $stmt->execute();
        
        $email_sent = sendOTPEmail($email, $otp, $user['name']);
        
        $_SESSION['reset_email'] = $email;
        $_SESSION['reset_user_id'] = $user['id'];
        $step = 'otp';
        
        if ($email_sent) {
            $message = '<div class="alert alert-success">OTP sent to your email address</div>';
        } else {
            $message = '<div class="alert alert-warning">Email not configured. Your OTP is: <strong>' . $otp . '</strong></div>';
        }
    } else {
        $message = '<div class="alert alert-danger">Email not found</div>';
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['verify_otp'])) {
    $otp = sanitize($_POST['otp']);
    $email = $_SESSION['reset_email'];
    
    $stmt = $conn->prepare("SELECT * FROM password_reset_otp WHERE email = ? AND otp = ? AND expiry > NOW() AND user_type = 'customer'");
    $stmt->bind_param("ss", $email, $otp);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $_SESSION['otp_verified'] = true;
        $step = 'reset';
        $message = '<div class="alert alert-success">OTP verified successfully</div>';
    } else {
        $message = '<div class="alert alert-danger">Invalid or expired OTP</div>';
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['reset_password'])) {
    $password = $_POST['password'];
    $confirm = $_POST['confirm_password'];
    
    if ($password !== $confirm) {
        $message = '<div class="alert alert-danger">Passwords do not match</div>';
    } elseif (strlen($password) < 6) {
        $message = '<div class="alert alert-danger">Password must be at least 6 characters</div>';
    } else {
        $user_id = $_SESSION['reset_user_id'];
        $email = $_SESSION['reset_email'];
        
        $hashed = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("UPDATE masons SET password = ? WHERE id = ?");
        $stmt->bind_param("si", $hashed, $user_id);
        $stmt->execute();
        
        $conn->query("DELETE FROM password_reset_otp WHERE email = '$email'");
        unset($_SESSION['reset_email'], $_SESSION['reset_user_id'], $_SESSION['otp_verified']);
        
        $message = '<div class="alert alert-success">Password reset successfully! <a href="login.php">Login now</a></div>';
        $step = 'done';
    }
}

if (isset($_GET['cancel'])) {
    unset($_SESSION['reset_email'], $_SESSION['reset_user_id'], $_SESSION['otp_verified']);
    header('Location: forgot-password.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forgot Password - JP Tiles Customer</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Poppins', sans-serif; background: #1a1a1a; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .login-container { background: white; padding: 40px; border-radius: 15px; width: 100%; max-width: 400px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo img { height: 60px; }
        h2 { text-align: center; color: #1a1a1a; margin-bottom: 10px; font-size: 24px; }
        .subtitle { text-align: center; color: #666; margin-bottom: 30px; font-size: 14px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; color: #333; font-weight: 500; }
        .form-group input { width: 100%; padding: 12px 15px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px; }
        .form-group input:focus { outline: none; border-color: #c9a227; }
        .btn { width: 100%; padding: 14px; background: #c9a227; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; }
        .btn:hover { background: #b8922a; }
        .back-link { text-align: center; margin-top: 20px; }
        .back-link a { color: #c9a227; text-decoration: none; font-size: 14px; }
        .alert { padding: 12px 15px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; }
        .alert-success { background: #d4edda; color: #155724; }
        .alert-danger { background: #f8d7da; color: #721c24; }
        .alert-warning { background: #fff3cd; color: #856404; }
        .step-indicator { display: flex; justify-content: center; gap: 10px; margin-bottom: 30px; }
        .step { width: 30px; height: 30px; border-radius: 50%; background: #e0e0e0; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #666; }
        .step.active { background: #c9a227; color: white; }
        .step.done { background: #28a745; color: white; }
        .resend-link { text-align: center; margin-top: 15px; font-size: 14px; color: #666; }
        .resend-link a { color: #c9a227; }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo"><img src="<?php echo SITE_URL; ?>/assets/images/logo.webp" alt="JP Tiles"></div>
        <h2><i class="fas fa-key"></i> Forgot Password</h2>
        
        <div class="step-indicator">
            <div class="step <?php echo $step == 'email' ? 'active' : ($step != 'email' ? 'done' : ''); ?>">1</div>
            <div class="step <?php echo $step == 'otp' ? 'active' : ($step == 'reset' || $step == 'done' ? 'done' : ''); ?>">2</div>
            <div class="step <?php echo $step == 'reset' ? 'active' : ($step == 'done' ? 'done' : ''); ?>">3</div>
        </div>
        
        <?php echo $message; ?>
        
        <?php if ($step == 'email'): ?>
        <p class="subtitle">Enter your registered email address</p>
        <form method="POST">
            <div class="form-group">
                <label><i class="fas fa-envelope"></i> Email Address</label>
                <input type="email" name="email" placeholder="Enter email address" required>
            </div>
            <button type="submit" name="send_otp" class="btn"><i class="fas fa-paper-plane"></i> Send OTP</button>
        </form>
        <?php elseif ($step == 'otp'): ?>
        <p class="subtitle">Enter the OTP sent to <?php echo substr($_SESSION['reset_email'], 0, 3) . '***' . strstr($_SESSION['reset_email'], '@'); ?></p>
        <form method="POST">
            <div class="form-group">
                <label><i class="fas fa-shield-alt"></i> Enter OTP</label>
                <input type="text" name="otp" placeholder="Enter 6-digit OTP" required maxlength="6" pattern="[0-9]{6}" style="text-align: center; font-size: 24px; letter-spacing: 10px;">
            </div>
            <button type="submit" name="verify_otp" class="btn"><i class="fas fa-check"></i> Verify OTP</button>
        </form>
        <div class="resend-link"><a href="?cancel=1">Cancel</a> | <a href="?cancel=1">Resend OTP</a></div>
        <?php elseif ($step == 'reset'): ?>
        <p class="subtitle">Create your new password</p>
        <form method="POST">
            <div class="form-group">
                <label><i class="fas fa-lock"></i> New Password</label>
                <input type="password" name="password" placeholder="Enter new password" required minlength="6">
            </div>
            <div class="form-group">
                <label><i class="fas fa-lock"></i> Confirm Password</label>
                <input type="password" name="confirm_password" placeholder="Confirm new password" required minlength="6">
            </div>
            <button type="submit" name="reset_password" class="btn"><i class="fas fa-save"></i> Reset Password</button>
        </form>
        <?php endif; ?>
        
        <div class="back-link"><a href="login.php"><i class="fas fa-arrow-left"></i> Back to Login</a></div>
    </div>
</body>
</html>
<?php $conn->close(); ?>
