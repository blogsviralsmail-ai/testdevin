<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/functions.php';

$skipAuth = basename($_SERVER['SCRIPT_NAME']) === 'login.php';
if (!$skipAuth) { requireAgent(); }

$pageTitle = $pageTitle ?? 'Agent';
$flash = getFlash();
$agent = currentAgent();
$current = basename($_SERVER['SCRIPT_NAME']);
$logoUrl = getSetting('logo_url', '/uploads/logo/jai-collection-logo.png');
if (strpos($logoUrl, '/') === 0) $logoUrl = SITE_URL . $logoUrl;

// refresh agent wallet from DB
if ($agent) {
    $a = getAgentById($agent['id']);
    if ($a) { $agent = array_merge($agent, ['wallet_balance' => $a['wallet_balance'], 'lifetime_earned' => $a['lifetime_earned'], 'lifetime_paid' => $a['lifetime_paid'], 'referral_code' => $a['referral_code'], 'commission_percent' => $a['commission_percent']]); }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title><?php echo e($pageTitle); ?> - <?php echo e(SITE_NAME); ?> Agent</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="<?php echo e(SITE_URL); ?>/assets/css/style.css">
    <link rel="stylesheet" href="<?php echo e(SITE_URL); ?>/assets/css/admin.css">
    <link rel="stylesheet" href="<?php echo e(SITE_URL); ?>/assets/css/modern.css">
</head>
<body class="jc-admin-body">
<?php if (!$skipAuth): ?>
<aside class="jc-admin-sidebar">
    <div class="jc-admin-logo">
        <img src="<?php echo e($logoUrl); ?>" alt="">
        <div class="jc-admin-logo-text"><?php echo e(SITE_NAME); ?><br><span>Agent Panel</span></div>
    </div>
    <nav class="jc-admin-nav">
        <a href="dashboard.php" class="<?php echo $current === 'dashboard.php' ? 'active' : ''; ?>"><i class="fas fa-tachometer-alt"></i> <span>Dashboard</span></a>
        <a href="orders.php" class="<?php echo $current === 'orders.php' ? 'active' : ''; ?>"><i class="fas fa-receipt"></i> <span>Referred Orders</span></a>
        <a href="wallet.php" class="<?php echo $current === 'wallet.php' ? 'active' : ''; ?>"><i class="fas fa-wallet"></i> <span>Wallet</span></a>
        <a href="payout-requests.php" class="<?php echo $current === 'payout-requests.php' ? 'active' : ''; ?>"><i class="fas fa-money-check-alt"></i> <span>Payouts</span></a>
        <a href="profile.php" class="<?php echo $current === 'profile.php' ? 'active' : ''; ?>"><i class="fas fa-user"></i> <span>Profile</span></a>
    </nav>
</aside>

<div class="jc-admin-main">
    <header class="jc-admin-topbar">
        <div><strong><?php echo e($pageTitle); ?></strong></div>
        <div>
            <span style="color:#2a9d2a;font-weight:600;"><i class="fas fa-wallet"></i> <?php echo money($agent['wallet_balance'] ?? 0); ?></span>
            <span style="margin:0 10px;color:#888;">|</span>
            <?php echo e($agent['name']); ?>
            <a href="logout.php" class="jc-btn jc-btn-sm" style="background:#fdecec;color:#8a1a1a;margin-left:10px;">Logout</a>
        </div>
    </header>
    <div class="jc-admin-content">
        <?php if ($flash): ?><div class="jc-alert jc-alert-<?php echo e($flash['type']); ?>"><?php echo e($flash['msg']); ?></div><?php endif; ?>
<?php endif; ?>
