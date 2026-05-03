<?php
require_once __DIR__ . '/../includes/functions.php';

if (isset($_SESSION['parent_id'])) {
    logAudit((int) $_SESSION['parent_id'], 'logout', 'parents', (int) $_SESSION['parent_id']);
}

session_destroy();
header('Location: /safechild/admin/index.php');
exit;
