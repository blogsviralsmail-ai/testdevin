<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/functions.php';
// Logout must be POST + CSRF so a third-party site can't force-logout the
// admin by embedding <img src=".../admin/logout.php">.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect(SITE_URL . (isset($_SESSION['admin']) ? '/admin/index.php' : '/admin/login.php'));
}
csrfVerify();
unset($_SESSION['admin']);
redirect(SITE_URL . '/admin/login.php');
