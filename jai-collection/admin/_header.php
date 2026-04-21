<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/functions.php';

// Login page skips auth
$skipAuth = basename($_SERVER['SCRIPT_NAME']) === 'login.php';
if (!$skipAuth) { requireAdmin(); }

$pageTitle = $pageTitle ?? 'Admin';
$flash = getFlash();
$admin = currentAdmin();
$current = basename($_SERVER['SCRIPT_NAME']);
$logoUrl = getSetting('logo_url', '/uploads/logo/jai-collection-logo.png');
if (strpos($logoUrl, '/') === 0) $logoUrl = SITE_URL . $logoUrl;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title><?php echo e($pageTitle); ?> - <?php echo e(SITE_NAME); ?> Admin</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="<?php echo e(SITE_URL); ?>/assets/css/style.css">
    <link rel="stylesheet" href="<?php echo e(SITE_URL); ?>/assets/css/admin.css">
</head>
<body class="jc-admin-body">
<?php if (!$skipAuth): ?>
<aside class="jc-admin-sidebar">
    <div class="jc-admin-logo">
        <img src="<?php echo e($logoUrl); ?>" alt="Logo">
        <div class="jc-admin-logo-text"><?php echo e(SITE_NAME); ?><br><span>Admin Panel</span></div>
    </div>
    <?php include __DIR__ . '/_nav.php'; ?>
</aside>

<div class="jc-admin-main">
    <header class="jc-admin-topbar">
        <div>
            <strong><?php echo e($pageTitle); ?></strong>
        </div>
        <div>
            <a href="<?php echo e(SITE_URL); ?>/" target="_blank" class="jc-btn jc-btn-sm jc-btn-outline"><i class="fas fa-external-link-alt"></i> View Site</a>
            <span style="margin:0 10px;color:#888;">|</span>
            <i class="fas fa-user-shield"></i> <?php echo e($admin['name']); ?>
            <a href="logout.php" class="jc-btn jc-btn-sm" style="background:#fdecec;color:#8a1a1a;margin-left:10px;">Logout</a>
        </div>
    </header>
    <div class="jc-admin-content">
        <?php if ($flash): ?>
            <div class="jc-alert jc-alert-<?php echo e($flash['type']); ?>"><?php echo e($flash['msg']); ?></div>
        <?php endif; ?>
<?php endif; ?>
