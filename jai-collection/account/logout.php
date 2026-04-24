<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/functions.php';
// Logout must be POST + CSRF so a third-party site can't force-logout our
// users by embedding <img src=".../logout.php"> or linking to it. Plain GETs
// fall back to the dashboard (or home if not logged in).
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect(SITE_URL . (isset($_SESSION['customer']) ? '/account/dashboard.php' : '/'));
}
csrfVerify();
unset($_SESSION['customer']);
redirect(SITE_URL . '/');
