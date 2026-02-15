<?php
header("Content-Type: application/json");
error_reporting(E_ALL);
ini_set('display_errors', 1);

// List files in api directory
$files = scandir('/home/jptilesi/public_html/api/');
$loginFile = '/home/jptilesi/public_html/api/login.php';
$loginContent = "";
if (file_exists($loginFile)) {
    $loginContent = file_get_contents($loginFile);
    // Extract database credentials
    preg_match('/\$host\s*=\s*["\']([^"\']+)["\']/', $loginContent, $hostMatch);
    preg_match('/\$dbname\s*=\s*["\']([^"\']+)["\']/', $loginContent, $dbnameMatch);
    preg_match('/\$username\s*=\s*["\']([^"\']+)["\']/', $loginContent, $usernameMatch);
    preg_match('/\$password\s*=\s*["\']([^"\']+)["\']/', $loginContent, $passwordMatch);
}

echo json_encode(array(
    "success" => true,
    "files" => $files,
    "db_host" => isset($hostMatch[1]) ? $hostMatch[1] : "not found",
    "db_name" => isset($dbnameMatch[1]) ? $dbnameMatch[1] : "not found",
    "db_user" => isset($usernameMatch[1]) ? $usernameMatch[1] : "not found",
    "db_pass" => isset($passwordMatch[1]) ? substr($passwordMatch[1], 0, 3) . "***" : "not found"
));