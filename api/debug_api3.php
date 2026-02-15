<?php
header("Content-Type: application/json");
$loginFile = '/home/jptilesi/public_html/api/login.php';
if (file_exists($loginFile)) {
    $content = file_get_contents($loginFile);
    echo json_encode(array(
        "success" => true,
        "content" => substr($content, 0, 1500)
    ));
} else {
    echo json_encode(array("success" => false, "message" => "login.php not found"));
}