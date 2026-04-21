<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

$pageTitle = $pageTitle ?? getSetting('site_name', SITE_NAME);
$logoUrl = getSetting('logo_url', '/uploads/logo/jai-collection-logo.png');
if (strpos($logoUrl, 'http') !== 0 && strpos($logoUrl, '/') === 0) { $logoUrl = SITE_URL . $logoUrl; }
$faviconUrl = getSetting('favicon_url', $logoUrl);
if (strpos($faviconUrl, 'http') !== 0 && strpos($faviconUrl, '/') === 0) { $faviconUrl = SITE_URL . $faviconUrl; }

// Build nav: top-level categories (limit 10 for nav), plus an "All" link.
$navCats = array_slice(getCategories(true, 0), 0, 10);
$customer = currentCustomer();
$flash = getFlash();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo e($pageTitle); ?> &middot; <?php echo e(getSetting('site_name', SITE_NAME)); ?></title>
    <meta name="description" content="<?php echo e(getSetting('site_tagline', SITE_TAGLINE)); ?>">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="<?php echo e(SITE_URL); ?>/assets/css/style.css">
    <link rel="stylesheet" href="<?php echo e(SITE_URL); ?>/assets/css/modern.css">
    <link rel="icon" href="<?php echo e($faviconUrl); ?>">
</head>
<body>

<div class="jc-topbar">
    <div class="container" style="display:flex;justify-content:space-between;align-items:center;">
        <div><i class="fas fa-truck"></i> Free shipping on orders above <?php echo money((float)getSetting('free_shipping_above', '999')); ?></div>
        <div>
            <?php if ($customer): ?>
                <a href="<?php echo e(SITE_URL); ?>/account/dashboard.php"><i class="fas fa-user"></i> <?php echo e($customer['name']); ?></a>
                <a href="<?php echo e(SITE_URL); ?>/account/logout.php">Logout</a>
            <?php else: ?>
                <a href="<?php echo e(SITE_URL); ?>/account/login.php">Login</a>
                <a href="<?php echo e(SITE_URL); ?>/account/register.php">Register</a>
            <?php endif; ?>
            <a href="<?php echo e(SITE_URL); ?>/agent/login.php"><i class="fas fa-handshake"></i> Agent</a>
        </div>
    </div>
</div>

<header class="jc-header">
    <div class="container jc-header-inner">
        <a href="<?php echo e(SITE_URL); ?>/" class="jc-logo">
            <img src="<?php echo e($logoUrl); ?>" alt="<?php echo e(SITE_NAME); ?>">
        </a>
        <form class="jc-search" action="<?php echo e(SITE_URL); ?>/search.php" method="get">
            <input type="text" name="q" placeholder="Search sarees, kurtis, daily essentials..." value="<?php echo e($_GET['q'] ?? ''); ?>">
            <button type="submit"><i class="fas fa-search"></i></button>
        </form>
        <div class="jc-header-actions">
            <a href="<?php echo e(SITE_URL); ?>/account/orders.php" title="My Orders">
                <i class="fas fa-box"></i> Orders
            </a>
            <a href="<?php echo e(SITE_URL); ?>/cart.php" title="Cart">
                <i class="fas fa-shopping-cart"></i> Cart
                <?php if (cartCount() > 0): ?><span class="jc-cart-badge"><?php echo cartCount(); ?></span><?php endif; ?>
            </a>
        </div>
    </div>
    <nav class="jc-catnav">
        <div class="container jc-catnav-inner">
            <a href="<?php echo e(SITE_URL); ?>/">Home</a>
            <?php foreach ($navCats as $c): ?>
                <a href="<?php echo e(SITE_URL); ?>/category.php?slug=<?php echo e($c['slug']); ?>"><?php echo e($c['name']); ?></a>
            <?php endforeach; ?>
            <a href="<?php echo e(SITE_URL); ?>/categories.php" style="font-weight:600;color:#e53935;">All Categories &raquo;</a>
        </div>
    </nav>
</header>

<main class="container" style="padding-top:20px;padding-bottom:40px;">

<?php if ($flash): ?>
<div class="jc-alert jc-alert-<?php echo e($flash['type']); ?>"><?php echo e($flash['msg']); ?></div>
<?php endif; ?>
