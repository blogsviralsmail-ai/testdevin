<?php
require_once '../includes/config.php';

if (!isLoggedIn() || !isMason()) {
    redirect('login.php');
}

$conn = getDBConnection();
$mason_id = $_SESSION['mason_id'];
$user_id = $_SESSION['user_id'];
$message = getMessage();

// Get mason details
$mason = $conn->query("SELECT * FROM masons WHERE id = $mason_id")->fetch_assoc();

// Handle password change
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $current_password = $_POST['current_password'];
    $new_password = $_POST['new_password'];
    $confirm_password = $_POST['confirm_password'];
    
    // Get current user
    $user = $conn->query("SELECT * FROM users WHERE id = $user_id")->fetch_assoc();
    
    if (!password_verify($current_password, $user['password'])) {
        setMessage('danger', 'Current password is incorrect!');
    } elseif ($new_password !== $confirm_password) {
        setMessage('danger', 'New passwords do not match!');
    } elseif (strlen($new_password) < 5) {
        setMessage('danger', 'Password must be at least 5 characters!');
    } else {
        $hashed = password_hash($new_password, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
        $stmt->bind_param("si", $hashed, $user_id);
        if ($stmt->execute()) {
            setMessage('success', 'Password changed successfully!');
        } else {
            setMessage('danger', 'Error changing password.');
        }
    }
    redirect('change-password.php');
}

$logo = getSetting('logo', 'https://jptiles.in/assets/images/logo.webp');
$site_name = getSetting('site_name', 'JP Tiles');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Change Password - <?php echo $site_name; ?> Customer Portal</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="mason-wrapper">
        <!-- Header -->
        <header class="mason-header">
            <div class="mason-header-left">
                <img src="<?php echo $logo; ?>" alt="<?php echo $site_name; ?>" style="height: 40px;">
            </div>
            <div class="mason-header-right">
                <span>Welcome, <?php echo $mason['name']; ?></span>
                <a href="logout.php" class="btn btn-outline" style="padding: 8px 15px;"><i class="fas fa-sign-out-alt"></i></a>
            </div>
        </header>

        <!-- Navigation -->
        <nav class="mason-nav">
            <a href="index.php"><i class="fas fa-home"></i> Dashboard</a>
            <a href="visits.php"><i class="fas fa-clipboard-list"></i> My Visits</a>
            <a href="rewards.php"><i class="fas fa-gift"></i> Rewards</a>
            <a href="offers.php"><i class="fas fa-tags"></i> Offers</a>
            <a href="winners.php"><i class="fas fa-trophy"></i> Winners</a>
            <a href="change-password.php" class="active"><i class="fas fa-key"></i> Change Password</a>
        </nav>

        <!-- Main Content -->
        <main class="mason-content">
            <h1 style="margin-bottom: 20px;"><i class="fas fa-key"></i> Change Password</h1>

            <?php if ($message): ?>
            <div class="alert alert-<?php echo $message['type']; ?>">
                <?php echo $message['text']; ?>
            </div>
            <?php endif; ?>

            <div class="password-card">
                <form method="POST" class="password-form">
                    <div class="form-group">
                        <label><i class="fas fa-lock"></i> Current Password</label>
                        <input type="password" name="current_password" required placeholder="Enter current password">
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-key"></i> New Password</label>
                        <input type="password" name="new_password" required minlength="5" placeholder="Enter new password">
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-check-circle"></i> Confirm New Password</label>
                        <input type="password" name="confirm_password" required minlength="5" placeholder="Confirm new password">
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">
                        <i class="fas fa-save"></i> Change Password
                    </button>
                </form>
            </div>
        </main>
    </div>

    <style>
        .mason-wrapper {
            min-height: 100vh;
            background: #f5f7fa;
        }
        .mason-header {
            background: white;
            padding: 15px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .mason-header-right {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .mason-nav {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            padding: 0 30px;
            display: flex;
            gap: 5px;
            overflow-x: auto;
        }
        .mason-nav a {
            color: rgba(255,255,255,0.8);
            padding: 15px 20px;
            text-decoration: none;
            white-space: nowrap;
            transition: all 0.3s;
        }
        .mason-nav a:hover, .mason-nav a.active {
            color: white;
            background: rgba(255,255,255,0.1);
        }
        .mason-content {
            padding: 30px;
            max-width: 600px;
            margin: 0 auto;
        }
        .password-card {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.05);
        }
        .password-form .form-group {
            margin-bottom: 20px;
        }
        .password-form label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #333;
        }
        .password-form label i {
            margin-right: 8px;
            color: #c9a227;
        }
        .password-form input {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #eee;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        .password-form input:focus {
            outline: none;
            border-color: #c9a227;
        }
        .btn-block {
            width: 100%;
            padding: 15px;
            font-size: 16px;
        }
        .btn-primary {
            background: linear-gradient(135deg, #c9a227 0%, #d4af37 100%);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: transform 0.3s;
        }
        .btn-primary:hover {
            transform: translateY(-2px);
        }
        .alert {
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .alert-success {
            background: #d4edda;
            color: #155724;
        }
        .alert-danger {
            background: #f8d7da;
            color: #721c24;
        }
        @media (max-width: 768px) {
            .mason-content {
                padding: 15px;
            }
        }
    </style>
</body>
</html>
<?php $conn->close(); ?>
