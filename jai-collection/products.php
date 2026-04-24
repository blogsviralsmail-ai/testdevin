<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/functions.php';

$pageTitle = 'All Products';
$page = max(1, (int)($_GET['page'] ?? 1));
$perPage = 24;
$prods = getProducts(['only_active' => 1, 'limit' => $perPage, 'offset' => ($page-1)*$perPage]);
$total = countProducts(['only_active' => 1]);
$totalPages = max(1, (int)ceil($total / $perPage));
require_once __DIR__ . '/includes/header.php';
?>
<div class="jc-section-title"><h2>All Products <span style="font-size:13px;color:#888;font-weight:400;">(<?php echo $total; ?>)</span></h2></div>
<div class="jc-grid">
    <?php foreach ($prods as $p): include __DIR__ . '/includes/_product_card.php'; endforeach; ?>
</div>
<?php if ($totalPages > 1): ?>
<div style="margin-top:30px;text-align:center;">
    <?php for ($i = 1; $i <= $totalPages; $i++): ?>
        <a href="?page=<?php echo $i; ?>" class="jc-btn jc-btn-sm <?php echo $i === $page ? 'jc-btn-primary' : 'jc-btn-outline'; ?>" style="margin:2px;"><?php echo $i; ?></a>
    <?php endfor; ?>
</div>
<?php endif; ?>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
