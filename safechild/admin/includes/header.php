<?php
/**
 * SafeChild Admin - Header & Sidebar
 */
require_once __DIR__ . '/../../includes/functions.php';
$parent = requireAuth();

$currentPage = basename($_SERVER['PHP_SELF'], '.php');
$currentDir = basename(dirname($_SERVER['PHP_SELF']));

// Get unread alerts count
$db = getDB();
$parentId = (int) $parent['id'];
$unreadResult = $db->query("SELECT COUNT(*) as cnt FROM parent_alerts WHERE parent_id = $parentId AND is_read = 0");
$unreadAlerts = ($unreadResult && $row = $unreadResult->fetch_assoc()) ? (int) $row['cnt'] : 0;
?>
<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $pageTitle ?? 'Dashboard' ?> - SafeChild</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="/safechild/admin/assets/css/style.css" rel="stylesheet">
    <?php if (isset($extraHead)) echo $extraHead; ?>
</head>
<body>

<!-- Sidebar -->
<div class="sidebar" id="sidebar">
    <div class="sidebar-header">
        <div class="logo"><i class="fas fa-shield-alt"></i></div>
        <h2>SafeChild</h2>
    </div>
    
    <nav class="sidebar-nav">
        <div class="nav-label">Main</div>
        <a href="/safechild/admin/dashboard.php" class="<?= $currentPage === 'dashboard' ? 'active' : '' ?>">
            <i class="fas fa-home"></i> Dashboard
        </a>
        
        <div class="nav-label">Children</div>
        <a href="/safechild/admin/children/list.php" class="<?= $currentDir === 'children' ? 'active' : '' ?>">
            <i class="fas fa-child"></i> My Children
        </a>
        
        <div class="nav-label">Monitoring</div>
        <a href="/safechild/admin/location/live.php" class="<?= $currentDir === 'location' && $currentPage === 'live' ? 'active' : '' ?>">
            <i class="fas fa-map-marker-alt"></i> Live Location
        </a>
        <a href="/safechild/admin/location/history.php" class="<?= $currentDir === 'location' && $currentPage === 'history' ? 'active' : '' ?>">
            <i class="fas fa-route"></i> Location History
        </a>
        <a href="/safechild/admin/location/geofences.php" class="<?= $currentDir === 'location' && $currentPage === 'geofences' ? 'active' : '' ?>">
            <i class="fas fa-draw-polygon"></i> Safe Zones
        </a>
        
        <div class="nav-label">Controls</div>
        <a href="/safechild/admin/screentime/overview.php" class="<?= $currentDir === 'screentime' ? 'active' : '' ?>">
            <i class="fas fa-clock"></i> Screen Time
        </a>
        <a href="/safechild/admin/apps/installed.php" class="<?= $currentDir === 'apps' && $currentPage === 'installed' ? 'active' : '' ?>">
            <i class="fas fa-th-large"></i> Apps
        </a>
        <a href="/safechild/admin/apps/usage.php" class="<?= $currentDir === 'apps' && $currentPage === 'usage' ? 'active' : '' ?>">
            <i class="fas fa-chart-bar"></i> App Usage
        </a>
        <a href="/safechild/admin/content/web_filter.php" class="<?= $currentDir === 'content' ? 'active' : '' ?>">
            <i class="fas fa-filter"></i> Content Filter
        </a>
        
        <div class="nav-label">Alerts</div>
        <a href="/safechild/admin/alerts/list.php" class="<?= $currentDir === 'alerts' ? 'active' : '' ?>">
            <i class="fas fa-bell"></i> Alerts
            <?php if ($unreadAlerts > 0): ?>
                <span class="badge badge-danger" style="margin-left:auto;"><?= $unreadAlerts ?></span>
            <?php endif; ?>
        </a>
        
        <div class="nav-label">Privacy</div>
        <a href="/safechild/admin/privacy/consent.php" class="<?= $currentDir === 'privacy' ? 'active' : '' ?>">
            <i class="fas fa-user-shield"></i> Privacy & Data
        </a>
        
        <div class="nav-label">Account</div>
        <a href="/safechild/admin/logout.php">
            <i class="fas fa-sign-out-alt"></i> Logout
        </a>
    </nav>
</div>

<!-- Main Content -->
<div class="main-content">
    <div class="topbar">
        <div>
            <button class="btn btn-outline" id="sidebarToggle" style="display:none;" onclick="document.getElementById('sidebar').classList.toggle('open')">
                <i class="fas fa-bars"></i>
            </button>
            <h1><?= $pageTitle ?? 'Dashboard' ?></h1>
        </div>
        <div class="user-info">
            <span style="font-size:14px;color:var(--gray);"><?= htmlspecialchars($parent['name']) ?></span>
            <div class="user-avatar"><?= strtoupper(substr($parent['name'], 0, 1)) ?></div>
        </div>
    </div>
