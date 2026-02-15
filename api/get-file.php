<?php
header('Content-Type: text/plain');
$file = '/home/jptilesi/public_html/api/pending-visits.php';
if (file_exists($file)) {
    echo file_get_contents($file);
} else {
    echo "File not found";
}
