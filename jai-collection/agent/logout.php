<?php
require_once __DIR__ . '/../includes/config.php';
unset($_SESSION['agent']);
redirect(SITE_URL . '/agent/login.php');
