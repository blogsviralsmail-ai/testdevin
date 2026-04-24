<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/functions.php';

$slug = sanitize($_GET['slug'] ?? '');
$cat = $slug ? getCategoryBySlug($slug) : null;
if (!$cat || $cat['status'] !== 'active') { http_response_code(404); die('Category not found'); }

$pageTitle = $cat['name'];
$page = max(1, (int)($_GET['page'] ?? 1));
$perPage = 24;

$prods = getProducts([
    'only_active' => 1,
    'category_id' => $cat['id'],
    'limit' => $perPage,
    'offset' => ($page - 1) * $perPage,
]);
$total = countProducts(['only_active' => 1, 'category_id' => $cat['id']]);
$totalPages = max(1, (int)ceil($total / $perPage));

require_once __DIR__ . '/includes/header.php';
?>

<nav style="font-size:13px;color:#666;margin-bottom:10px;">
    <a href="<?php echo e(SITE_URL); ?>/">Home</a> &raquo; <span><?php echo e($cat['name']); ?></span>
</nav>

<div class="jc-section-title">
    <h2><?php echo e($cat['name']); ?> <span style="font-size:13px;color:#888;font-weight:400;">(<?php echo $total; ?> products)</span></h2>
</div>

<?php if ($cat['description']): ?>
<p style="color:#666;margin-bottom:20px;"><?php echo e($cat['description']); ?></p>
<?php endif; ?>

<div class="jc-grid">
    <?php foreach ($prods as $p): include __DIR__ . '/includes/_product_card.php'; endforeach; ?>
    <?php if (!$prods): ?>
        <p style="grid-column:1/-1;color:#888;">No products in this category yet.</p>
    <?php endif; ?>
</div>

<?php if ($totalPages > 1): ?>
<div style="margin-top:30px;text-align:center;">
    <?php for ($i = 1; $i <= $totalPages; $i++): ?>
        <a href="?slug=<?php echo e($cat['slug']); ?>&page=<?php echo $i; ?>"
           class="jc-btn jc-btn-sm <?php echo $i === $page ? 'jc-btn-primary' : 'jc-btn-outline'; ?>"
           style="margin:2px;"><?php echo $i; ?></a>
    <?php endfor; ?>
</div>
<?php endif; ?>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
