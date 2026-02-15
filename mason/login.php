<?php
require_once '../includes/config.php';

// If already logged in as mason, redirect to dashboard
if (isLoggedIn() && isMason()) {
    redirect('index.php');
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $mobile = sanitize($_POST['mobile']);
    $password = $_POST['password'];
    
    $conn = getDBConnection();
    
    // Find user by mobile
    $stmt = $conn->prepare("SELECT u.*, m.id as mason_id, m.name as mason_name FROM users u JOIN masons m ON m.user_id = u.id WHERE u.mobile = ? AND u.role = 'mason'");
    $stmt->bind_param("s", $mobile);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($user = $result->fetch_assoc()) {
        if (password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_role'] = 'mason';
            $_SESSION['mason_id'] = $user['mason_id'];
            $_SESSION['user_name'] = $user['mason_name'];
            redirect('index.php');
        } else {
            $error = 'Invalid password';
        }
    } else {
        $error = 'Mobile number not found';
    }
    
    $conn->close();
}

$logo = getSetting('logo', 'https://jptiles.in/wp-content/uploads/2025/01/Untitled-design-2025-01-31T170820.186.png');
$site_name = getSetting('site_name', 'JP Tiles');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customer Login - <?php echo $site_name; ?></title>
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
            padding: 20px;
        }
        .login-container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
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
        .login-title h1 {
            font-size: 24px;
            color: #333;
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
            padding: 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        .login-form input:focus {
            border-color: #c9a227;
            outline: none;
        }
        .login-form .btn {
            width: 100%;
            padding: 15px;
            font-size: 16px;
            border-radius: 10px;
        }
        .error-message {
            background: #ffebee;
            color: #c62828;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            text-align: center;
        }
        .back-link {
            text-align: center;
            margin-top: 20px;
        }
        .back-link a {
            color: #c9a227;
            text-decoration: none;
        }
        .customer-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #c9a227 0%, #d4af37 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
        }
        .customer-icon i {
            font-size: 36px;
            color: white;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-logo">
            <img src="<?php echo $logo; ?>" alt="<?php echo $site_name; ?>">
        </div>
        
        <div class="customer-icon">
            <i class="fas fa-user"></i>
        </div>
        
        <div class="login-title">
            <h1>Customer Login</h1>
            <p>Enter your credentials to access your account</p>
        </div>
        
        <?php if ($error): ?>
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i> <?php echo $error; ?>
        </div>
        <?php endif; ?>
        
        <form method="POST" class="login-form">
            <div class="form-group">
                <label><i class="fas fa-phone"></i> Mobile Number</label>
                <input type="text" name="mobile" placeholder="Enter your mobile number" required>
            </div>
            <div class="form-group">
                <label><i class="fas fa-lock"></i> Password</label>
                <input type="password" name="password" placeholder="Enter your password" required>
            </div>
            <button type="submit" class="btn btn-primary">
                <i class="fas fa-sign-in-alt"></i> Login
            </button>
        </form>
        
        <div class="back-link">
            <a href="../index.php"><i class="fas fa-arrow-left"></i> Back to Website</a>
        </div>
    </div>
</body>
</html>
