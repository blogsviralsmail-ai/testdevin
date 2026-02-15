<?php
session_start();
require_once '../config/database.php';

// Check if user is logged in
if (!isset($_SESSION['mason_id'])) {
    header('Location: login.php');
    exit;
}

$mason_id = $_SESSION['mason_id'];
$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $mobile = trim($_POST['mobile'] ?? '');
    $address = trim($_POST['address'] ?? '');
    $current_password = $_POST['current_password'] ?? '';
    $new_password = $_POST['new_password'] ?? '';
    
    // Get current mason data
    $stmt = $conn->prepare("SELECT * FROM masons WHERE id = ?");
    $stmt->bind_param("i", $mason_id);
    $stmt->execute();
    $mason = $stmt->get_result()->fetch_assoc();
    
    if (!$mason) {
        $error = 'User not found';
    } else {
        // Handle photo upload
        $photo_path = $mason['photo'];
        if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
            $upload_dir = '../uploads/customers/';
            if (!is_dir($upload_dir)) {
                mkdir($upload_dir, 0755, true);
            }
            
            $file_ext = strtolower(pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION));
            $allowed_ext = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            
            if (in_array($file_ext, $allowed_ext)) {
                $new_filename = 'customer_' . $mason_id . '_' . time() . '.' . $file_ext;
                $upload_path = $upload_dir . $new_filename;
                
                if (move_uploaded_file($_FILES['photo']['tmp_name'], $upload_path)) {
                    $photo_path = $new_filename;
                    
                    // Delete old photo if exists
                    if (!empty($mason['photo']) && file_exists('../uploads/customers/' . $mason['photo'])) {
                        @unlink('../uploads/customers/' . $mason['photo']);
                    }
                }
            }
        }
        
        // Handle password change
        $password_hash = $mason['password'];
        if (!empty($current_password) && !empty($new_password)) {
            if (password_verify($current_password, $mason['password']) || $current_password === $mason['password']) {
                $password_hash = password_hash($new_password, PASSWORD_DEFAULT);
            } else {
                $error = 'Current password is incorrect';
            }
        }
        
        if (empty($error)) {
            // Update mason data
            $stmt = $conn->prepare("UPDATE masons SET name = ?, mobile = ?, address = ?, photo = ?, password = ? WHERE id = ?");
            $stmt->bind_param("sssssi", $name, $mobile, $address, $photo_path, $password_hash, $mason_id);
            
            if ($stmt->execute()) {
                $_SESSION['success_message'] = 'Profile updated successfully!';
                header('Location: index.php');
                exit;
            } else {
                $error = 'Failed to update profile';
            }
        }
    }
}

// If there's an error, redirect back with error message
if (!empty($error)) {
    $_SESSION['error_message'] = $error;
}
header('Location: index.php');
exit;

$conn->close();
?>
