<?php
// Generate QR Code for customer registration
// This redirects to a QR code API service

$registration_url = 'https://jptiles.in/qr-register.php';
$encoded_url = urlencode($registration_url);

// Use QR Server API (free, no API key required)
$qr_api_url = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={$encoded_url}&format=png&margin=10";

// Set headers for image output
header('Content-Type: image/png');
header('Cache-Control: no-cache, no-store, must-revalidate');

// Fetch and output the QR code image
$qr_image = file_get_contents($qr_api_url);

if ($qr_image !== false) {
    echo $qr_image;
} else {
    // Fallback: Generate a simple placeholder if API fails
    $img = imagecreatetruecolor(300, 300);
    $white = imagecolorallocate($img, 255, 255, 255);
    $black = imagecolorallocate($img, 0, 0, 0);
    $gold = imagecolorallocate($img, 201, 162, 39);
    
    imagefill($img, 0, 0, $white);
    
    // Draw border
    imagerectangle($img, 0, 0, 299, 299, $gold);
    imagerectangle($img, 1, 1, 298, 298, $gold);
    
    // Add text
    $text = "QR Code";
    $text2 = "Scan to Register";
    
    imagestring($img, 5, 110, 130, $text, $black);
    imagestring($img, 3, 95, 155, $text2, $gold);
    
    imagepng($img);
    imagedestroy($img);
}
?>
