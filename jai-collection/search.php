<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/functions.php';

$q = sanitize($_GET['q'] ?? '');
$pageTitle = $q ? ('Search: ' . $q) : 'Search';
$prods = $q ? getProducts(['only_active' => 1, 'search' => $q, 'limit' => 48]) : [];

require_once __DIR__ . '/includes/header.php';
?>
<h1 style="font-size:20px;color:var(--jc-blue-dark);">Search Results<?php if ($q): ?>: "<?php echo e($q); ?>" (<?php echo count($prods); ?>)<?php endif; ?></h1>
<div class="jc-grid">
    <?php foreach ($prods as $p): include __DIR__ . '/includes/_product_card.php'; endforeach; ?>
    <?php if ($q && !$prods): ?><p style="grid-column:1/-1;color:#888;">No products matched your search.</p><?php endif; ?>
</div>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
