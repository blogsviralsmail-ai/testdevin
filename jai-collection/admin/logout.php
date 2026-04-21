<?php
require_once __DIR__ . '/../includes/config.php';
unset($_SESSION['admin']);
redirect(SITE_URL . '/admin/login.php');
