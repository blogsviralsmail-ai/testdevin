<?php
$navItems = [
    ['index.php', 'fa-tachometer-alt', 'Dashboard'],
    ['orders.php', 'fa-receipt', 'Orders'],
    ['categories.php', 'fa-sitemap', 'Categories'],
    ['products.php', 'fa-box', 'Products'],
    ['stock.php', 'fa-warehouse', 'Stock'],
    ['customers.php', 'fa-users', 'Customers'],
    ['agents.php', 'fa-handshake', 'Agents'],
    ['commissions.php', 'fa-percent', 'Commissions'],
    ['payouts.php', 'fa-money-check-alt', 'Payouts'],
    ['banners.php', 'fa-images', 'Banners'],
    ['coupons.php', 'fa-tags', 'Coupons'],
    ['shipping.php', 'fa-truck', 'Shipping'],
    ['settings.php', 'fa-cog', 'Settings'],
];
$current = basename($_SERVER['SCRIPT_NAME']);
?>
<nav class="jc-admin-nav">
    <?php foreach ($navItems as $it): ?>
        <a href="<?php echo e($it[0]); ?>" class="<?php echo $current === $it[0] ? 'active' : ''; ?>">
            <i class="fas <?php echo e($it[1]); ?>"></i> <span><?php echo e($it[2]); ?></span>
        </a>
    <?php endforeach; ?>
</nav>
