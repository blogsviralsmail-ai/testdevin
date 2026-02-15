<?php
require_once 'includes/config.php';

$response = ['success' => false, 'message' => ''];

if($_SERVER['REQUEST_METHOD'] == 'POST') {
    $title = trim($_POST['title'] ?? '');
    $category = trim($_POST['category'] ?? '');
    
    if(empty($title) || empty($category)) {
        $response['message'] = 'Please fill in all required fields.';
    } elseif(!isset($_FILES['pdf_file']) || $_FILES['pdf_file']['error'] != 0) {
        $response['message'] = 'Please select a PDF file to upload.';
    } else {
        $allowed = ['pdf'];
        $filename = $_FILES['pdf_file']['name'];
        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        
        if(!in_array($ext, $allowed)) {
            $response['message'] = 'Only PDF files are allowed.';
        } elseif($_FILES['pdf_file']['size'] > 50 * 1024 * 1024) { // 50MB limit
            $response['message'] = 'File size must be less than 50MB.';
        } else {
            $new_filename = time() . '_' . preg_replace('/[^a-zA-Z0-9.]/', '_', $filename);
            $upload_path = 'uploads/catalogs/' . $new_filename;
            
            if(move_uploaded_file($_FILES['pdf_file']['tmp_name'], $upload_path)) {
                $conn = getDBConnection();
                $stmt = $conn->prepare("INSERT INTO catalogs (title, category, pdf_file, is_active) VALUES (?, ?, ?, 1)");
                $stmt->bind_param("sss", $title, $category, $new_filename);
                
                if($stmt->execute()) {
                    $response['success'] = true;
                    $response['message'] = 'Catalog uploaded successfully!';
                } else {
                    $response['message'] = 'Failed to save catalog to database.';
                    unlink($upload_path);
                }
            } else {
                $response['message'] = 'Failed to upload file.';
            }
        }
    }
}

// Redirect back to homepage with message
$_SESSION['catalog_message'] = $response['message'];
$_SESSION['catalog_success'] = $response['success'];
header('Location: index.php#catalogs');
exit;
