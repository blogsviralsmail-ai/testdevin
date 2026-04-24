<?php
// Standalone printable barcode labels page. Opens in a new tab from
// admin/product-edit.php — renders `qty` copies of the product's barcode
// in a grid sized for standard A4 label sheets so the admin can send it
// directly to a printer without extra styling.
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/functions.php';
requireAdmin();

$pdo = getPDO();
$id  = (int)($_GET['id'] ?? 0);
$qty = max(1, min(200, (int)($_GET['qty'] ?? 12)));

$stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
$stmt->execute([$id]);
$product = $stmt->fetch();
if (!$product) { http_response_code(404); die('Product not found'); }

$code  = trim($product['barcode'] ?? '') ?: trim($product['sku'] ?? '') ?: ('JC' . $id);
$price = money(productEffectivePrice($product, null));
$name  = $product['name'];
?><!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Barcode — <?php echo e($name); ?></title>
<style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; margin: 0; padding: 12px; background: #f3f3f3; }
    .toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; }
    .toolbar input { padding: 6px 10px; border: 1px solid #ccc; border-radius: 4px; width: 80px; }
    .toolbar button, .toolbar a { padding: 8px 14px; background: #0d2d66; color: #fff; text-decoration: none; border: 0; border-radius: 4px; cursor: pointer; font-size: 13px; }
    .toolbar a.secondary { background: #666; }
    .sheet { background: #fff; padding: 14px; border-radius: 8px; max-width: 800px; margin: 0 auto; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .label { border: 1px dashed #aaa; padding: 8px; text-align: center; font-size: 11px; }
    .label .name { font-weight: 600; color: #222; margin: 0 0 3px; min-height: 26px; overflow: hidden; }
    .label .price { color: #e53935; font-weight: 700; margin-top: 2px; }
    .label svg { max-width: 100%; height: 42px; }
    @media print {
        body { background: #fff; padding: 0; }
        .toolbar { display: none; }
        .sheet { padding: 0; box-shadow: none; border-radius: 0; max-width: 100%; }
        .label { border: 1px dashed #ccc; }
    }
</style>
</head>
<body>
<div class="toolbar">
    <strong>Product:</strong> <?php echo e($name); ?>
    <form method="get" style="display:inline-flex;gap:6px;align-items:center;">
        <input type="hidden" name="id" value="<?php echo (int)$id; ?>">
        <label style="font-size:13px;">Copies:</label>
        <input type="number" min="1" max="200" name="qty" value="<?php echo (int)$qty; ?>">
        <button type="submit">Update</button>
    </form>
    <button onclick="window.print()"><i class="fas fa-print"></i> Print</button>
    <a href="product-edit.php?id=<?php echo (int)$id; ?>" class="secondary">Back</a>
</div>
<div class="sheet">
    <div class="grid">
        <?php for ($i = 0; $i < $qty; $i++): ?>
            <div class="label">
                <div class="name"><?php echo e($name); ?></div>
                <svg class="bc"></svg>
                <div class="price"><?php echo $price; ?></div>
            </div>
        <?php endfor; ?>
    </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
<script>
document.querySelectorAll('svg.bc').forEach(function(el){
    try { JsBarcode(el, <?php echo json_encode($code); ?>, { format: 'CODE128', width: 1.6, height: 40, margin: 0, fontSize: 11 }); } catch (e) {}
});
</script>
</body>
</html>
