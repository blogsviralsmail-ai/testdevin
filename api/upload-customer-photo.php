<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { exit(0); }

require_once "../includes/config.php";

$customer_id = $_POST["customer_id"] ?? null;

if (!$customer_id) {
    echo json_encode(["success" => false, "message" => "Customer ID required"]);
    exit;
}

if (!isset($_FILES["photo"]) || $_FILES["photo"]["error"] !== UPLOAD_ERR_OK) {
    echo json_encode(["success" => false, "message" => "No photo uploaded or upload error"]);
    exit;
}

// Limit file size to 2MB
if ($_FILES["photo"]["size"] > 2 * 1024 * 1024) {
    echo json_encode(["success" => false, "message" => "File too large. Maximum 2MB allowed."]);
    exit;
}

// Check if customer exists using PDO
$stmt = $pdo->prepare("SELECT id FROM masons WHERE id = ?");
$stmt->execute([$customer_id]);

if (!$stmt->fetch()) {
    echo json_encode(["success" => false, "message" => "Customer not found"]);
    exit;
}

// Create uploads directory if not exists
$upload_dir = "../uploads/customers/";
if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0755, true);
}

// Generate unique filename
$file_ext = strtolower(pathinfo($_FILES["photo"]["name"], PATHINFO_EXTENSION));
$allowed_ext = ["jpg", "jpeg", "png", "gif", "webp"];

if (!in_array($file_ext, $allowed_ext)) {
    echo json_encode(["success" => false, "message" => "Invalid file type. Allowed: jpg, jpeg, png, gif, webp"]);
    exit;
}

$new_filename = "customer_" . $customer_id . "_" . time() . "." . $file_ext;
$upload_path = $upload_dir . $new_filename;

if (move_uploaded_file($_FILES["photo"]["tmp_name"], $upload_path)) {
    // Update customer photo in database using PDO
    $stmt = $pdo->prepare("UPDATE masons SET photo = ? WHERE id = ?");
    
    if ($stmt->execute([$new_filename, $customer_id])) {
        echo json_encode(["success" => true, "message" => "Photo uploaded successfully", "photo_path" => $new_filename]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update database"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Failed to save photo"]);
}