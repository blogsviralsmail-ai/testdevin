<?php
header("Content-Type: application/json");
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Check if config.php exists
$configFile = '/home/jptilesi/public_html/api/config.php';
if (file_exists($configFile)) {
    echo json_encode(array(
        "success" => true,
        "config_exists" => true,
        "config_size" => filesize($configFile),
        "config_first_100" => substr(file_get_contents($configFile), 0, 200)
    ));
} else {
    echo json_encode(array("success" => false, "message" => "config.php not found"));
}