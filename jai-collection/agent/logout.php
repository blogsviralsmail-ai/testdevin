<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/functions.php';
// Logout must be POST + CSRF so a third-party site can't force-logout the
// agent by embedding <img src=".../agent/logout.php">.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect(SITE_URL . (isset($_SESSION['agent']) ? '/agent/dashboard.php' : '/agent/login.php'));
}
csrfVerify();
unset($_SESSION['agent']);
redirect(SITE_URL . '/agent/login.php');
