<?php
require_once '../includes/config.php';

// Redirect if already logged in
if (isLoggedIn() && isAdmin()) {
    redirect('index.php');
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $mobile = sanitize($_POST['mobile'] ?? '');
    $password = $_POST['password'] ?? '';
    
    if (empty($mobile) || empty($password)) {
        $error = 'Please enter mobile number and password';
    } else {
        $conn = getDBConnection();
        $stmt = $conn->prepare("SELECT * FROM users WHERE mobile = ? AND role IN ('admin', 'employee') AND status = 'active'");
        $stmt->bind_param("s", $mobile);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($user = $result->fetch_assoc()) {
            if (password_verify($password, $user['password'])) {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_name'] = $user['name'];
                $_SESSION['user_role'] = $user['role'];
                $_SESSION['user_permissions'] = json_decode($user['permissions'] ?: '[]', true);
                redirect('index.php');
            } else {
                $error = 'Invalid password';
            }
        } else {
            $error = 'Account not found or inactive';
        }
        $stmt->close();
        $conn->close();
    }
}

$logo = getSetting('logo', 'https://jptiles.in/assets/images/logo.webp');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login - JP Tiles</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
    <style>
        body {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-container {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            width: 100%;
            max-width: 400px;
        }
        .login-logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .login-logo img {
            height: 60px;
        }
        .login-title {
            text-align: center;
            margin-bottom: 30px;
        }
        .login-title h2 {
            color: #1a1a1a;
            margin-bottom: 5px;
        }
        .login-title p {
            color: #666;
        }
        .login-form .form-group {
            margin-bottom: 20px;
        }
        .login-form label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #333;
        }
        .login-form input {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        .login-form input:focus {
            outline: none;
            border-color: #c9a227;
        }
        .login-form .btn {
            width: 100%;
            padding: 14px;
            font-size: 16px;
        }
        .error-message {
            background: #fee;
            color: #c00;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        }
        .back-link {
            text-align: center;
            margin-top: 20px;
        }
        .back-link a {
            color: #666;
        }
        .back-link a:hover {
            color: #c9a227;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-logo">
            <img src="<?php echo $logo; ?>" alt="JP Tiles">
        </div>
        <div class="login-title">
            <h2>Admin Login</h2>
            <p>Enter your credentials to access admin panel</p>
        </div>
        
        <?php if ($error): ?>
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i> <?php echo $error; ?>
        </div>
        <?php endif; ?>
        
        <form method="POST" class="login-form">
            <div class="form-group">
                <label><i class="fas fa-phone"></i> Mobile Number</label>
                <input type="text" name="mobile" placeholder="Enter mobile number" required>
            </div>
            <div class="form-group">
                <label><i class="fas fa-lock"></i> Password</label>
                <input type="password" name="password" placeholder="Enter password" required>
            </div>
            <button type="submit" class="btn btn-primary">
                <i class="fas fa-sign-in-alt"></i> Login
            </button>
        </form>
        
        <div class="back-link" style="margin-bottom: 15px;">
            <a href="forgot-password.php" style="color: #c9a227;"><i class="fas fa-key"></i> Forgot Password?</a>
        </div>
        <div class="back-link">
            <a href="../index.php"><i class="fas fa-arrow-left"></i> Back to Website</a>
        </div>
    </div>
</body>
</html>
