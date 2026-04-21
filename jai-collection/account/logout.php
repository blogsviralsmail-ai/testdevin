<?php
require_once __DIR__ . '/../includes/config.php';
unset($_SESSION['customer']);
redirect(SITE_URL . '/');
