<?php
require_once '../includes/config.php';

if (!isLoggedIn()) {
    redirect('login.php');
}

$conn = getDBConnection();
$user_id = $_SESSION['user_id'];

// Get current user data
$stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['update_profile'])) {
        $name = sanitize($_POST['name']);
        $email = sanitize($_POST['email']);
        $mobile = sanitize($_POST['mobile']);
        
        // Check if mobile already exists for another user
        $check = $conn->prepare("SELECT id FROM users WHERE mobile = ? AND id != ?");
        $check->bind_param("si", $mobile, $user_id);
        $check->execute();
        if ($check->get_result()->num_rows > 0) {
            setMessage('danger', 'Mobile number already exists for another user!');
        } else {
            $stmt = $conn->prepare("UPDATE users SET name = ?, email = ?, mobile = ? WHERE id = ?");
            $stmt->bind_param("sssi", $name, $email, $mobile, $user_id);
            if ($stmt->execute()) {
                $_SESSION['user_name'] = $name;
                setMessage('success', 'Profile updated successfully!');
            }
        }
    }
    
    if (isset($_POST['change_password'])) {
        $current = $_POST['current_password'];
        $new = $_POST['new_password'];
        $confirm = $_POST['confirm_password'];
        
        if (!password_verify($current, $user['password'])) {
            setMessage('danger', 'Current password is incorrect!');
        } elseif ($new !== $confirm) {
            setMessage('danger', 'New passwords do not match!');
        } elseif (strlen($new) < 6) {
            setMessage('danger', 'Password must be at least 6 characters!');
        } else {
            $hashed = password_hash($new, PASSWORD_DEFAULT);
            $stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
            $stmt->bind_param("si", $hashed, $user_id);
            if ($stmt->execute()) {
                setMessage('success', 'Password changed successfully!');
            }
        }
    }
    
    redirect('profile.php');
}

$message = getMessage();

// Refresh user data after update
$stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Profile - Admin Panel</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
    <style>
        .profile-container { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 768px) { .profile-container { grid-template-columns: 1fr; } }
        .profile-card { background: white; border-radius: 10px; padding: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .profile-card h3 { margin-bottom: 20px; color: #1a1a1a; border-bottom: 2px solid #c9a227; padding-bottom: 10px; }
        .profile-info { margin-bottom: 15px; }
        .profile-info label { display: block; font-weight: 600; color: #666; margin-bottom: 5px; font-size: 13px; }
        .profile-info span { font-size: 16px; color: #1a1a1a; }
        .profile-avatar { width: 100px; height: 100px; border-radius: 50%; background: #c9a227; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
        .profile-avatar i { font-size: 50px; color: white; }
    </style>
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'sidebar.php'; ?>
        
        <div class="admin-content">
            <div class="admin-header">
                <h2><i class="fas fa-user-circle"></i> My Profile</h2>
            </div>
            
            <?php if ($message): ?>
            <div class="alert alert-<?php echo $message['type']; ?>"><?php echo $message['text']; ?></div>
            <?php endif; ?>
            
            <div class="profile-container">
                <!-- Profile Info Card -->
                <div class="profile-card">
                    <div class="profile-avatar"><i class="fas fa-user"></i></div>
                    <h3><i class="fas fa-id-card"></i> Profile Information</h3>
                    <form method="POST">
                        <div class="form-group">
                            <label>Name</label>
                            <input type="text" name="name" value="<?php echo htmlspecialchars($user['name']); ?>" required>
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" name="email" value="<?php echo htmlspecialchars($user['email'] ?? ''); ?>" required>
                        </div>
                        <div class="form-group">
                            <label>Mobile</label>
                            <input type="text" name="mobile" value="<?php echo htmlspecialchars($user['mobile']); ?>" required pattern="[0-9]{10}">
                        </div>
                        <div class="form-group">
                            <label>Role</label>
                            <input type="text" value="<?php echo ucfirst($user['role']); ?>" disabled style="background: #f5f5f5;">
                        </div>
                        <div class="form-group">
                            <label>Member Since</label>
                            <input type="text" value="<?php echo date('d M Y', strtotime($user['created_at'])); ?>" disabled style="background: #f5f5f5;">
                        </div>
                        <button type="submit" name="update_profile" class="btn btn-primary"><i class="fas fa-save"></i> Update Profile</button>
                    </form>
                </div>
                
                <!-- Change Password Card -->
                <div class="profile-card">
                    <h3><i class="fas fa-lock"></i> Change Password</h3>
                    <form method="POST">
                        <div class="form-group">
                            <label>Current Password</label>
                            <input type="password" name="current_password" required>
                        </div>
                        <div class="form-group">
                            <label>New Password</label>
                            <input type="password" name="new_password" required minlength="6">
                        </div>
                        <div class="form-group">
                            <label>Confirm New Password</label>
                            <input type="password" name="confirm_password" required minlength="6">
                        </div>
                        <button type="submit" name="change_password" class="btn btn-primary"><i class="fas fa-key"></i> Change Password</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
<?php $conn->close(); ?>
