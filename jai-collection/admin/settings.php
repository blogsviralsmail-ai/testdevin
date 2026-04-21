<?php
$pageTitle = 'Settings';
require_once __DIR__ . '/_header.php';
$pdo = getPDO();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrfVerify();
    $fields = [
        'site_name','site_tagline','site_email','site_phone','site_address',
        'default_commission_percent','default_shipping_fee','free_shipping_above','min_payout_amount',
        'cod_enabled','rogerpay_enabled','rogerpay_api_key','rogerpay_secret_key','rogerpay_base_url','rogerpay_mode',
        'facebook_url','instagram_url','whatsapp_number','youtube_url',
    ];
    foreach ($fields as $f) {
        if (array_key_exists($f, $_POST)) {
            setSetting($f, sanitize($_POST[$f]));
        }
    }
    // Logo upload
    if (!empty($_FILES['logo']['tmp_name'])) {
        $ext = strtolower(pathinfo($_FILES['logo']['name'], PATHINFO_EXTENSION));
        if (in_array($ext, ['jpg','jpeg','png','webp','svg'])) {
            $fn = 'logo_' . time() . '.' . $ext;
            $dest = UPLOAD_DIR . '/logo/' . $fn;
            if (!is_dir(dirname($dest))) mkdir(dirname($dest), 0755, true);
            move_uploaded_file($_FILES['logo']['tmp_name'], $dest);
            setSetting('logo_url', '/uploads/logo/' . $fn);
        }
    }
    // Toggles (unchecked checkboxes not submitted)
    setSetting('cod_enabled', isset($_POST['cod_enabled']) ? '1' : '0');
    setSetting('rogerpay_enabled', isset($_POST['rogerpay_enabled']) ? '1' : '0');
    setFlash('success', 'Settings saved.');
    redirect('settings.php');
}

// Clear cache
function g($k,$d='') { static $cache = null; if ($cache === null) { $cache = []; foreach (getPDO()->query("SELECT setting_key, setting_value FROM settings")->fetchAll() as $r) $cache[$r['setting_key']] = $r['setting_value']; } return $cache[$k] ?? $d; }
?>
<div class="jc-admin-actions"><h2>Site Settings</h2></div>

<form method="post" enctype="multipart/form-data">
    <?php echo csrfField(); ?>

    <div class="jc-panel" style="margin-bottom:20px;">
        <h3 style="margin-top:0;color:#0d2d66;">Site Info</h3>
        <div class="jc-row">
            <div class="jc-form-group"><label>Site Name</label><input class="jc-input" name="site_name" value="<?php echo e(g('site_name')); ?>"></div>
            <div class="jc-form-group"><label>Tagline</label><input class="jc-input" name="site_tagline" value="<?php echo e(g('site_tagline')); ?>"></div>
        </div>
        <div class="jc-row">
            <div class="jc-form-group"><label>Support Email</label><input class="jc-input" name="site_email" value="<?php echo e(g('site_email')); ?>"></div>
            <div class="jc-form-group"><label>Support Phone</label><input class="jc-input" name="site_phone" value="<?php echo e(g('site_phone')); ?>"></div>
        </div>
        <div class="jc-form-group"><label>Business Address</label><textarea class="jc-textarea" name="site_address"><?php echo e(g('site_address')); ?></textarea></div>
        <div class="jc-form-group">
            <label>Logo</label>
            <input class="jc-input" type="file" name="logo" accept="image/*">
            <?php $lu = g('logo_url'); if ($lu): $lu = strpos($lu,'http')===0 ? $lu : SITE_URL.$lu; ?>
                <img src="<?php echo e($lu); ?>" style="height:60px;margin-top:6px;">
            <?php endif; ?>
        </div>
    </div>

    <div class="jc-panel" style="margin-bottom:20px;">
        <h3 style="margin-top:0;color:#0d2d66;">Commerce</h3>
        <div class="jc-row">
            <div class="jc-form-group"><label>Default Commission %</label><input class="jc-input" type="number" step="0.01" name="default_commission_percent" value="<?php echo e(g('default_commission_percent','5')); ?>"></div>
            <div class="jc-form-group"><label>Min Payout Amount</label><input class="jc-input" type="number" step="0.01" name="min_payout_amount" value="<?php echo e(g('min_payout_amount','200')); ?>"></div>
        </div>
        <div class="jc-row">
            <div class="jc-form-group"><label>Default Shipping Fee</label><input class="jc-input" type="number" step="0.01" name="default_shipping_fee" value="<?php echo e(g('default_shipping_fee','60')); ?>"></div>
            <div class="jc-form-group"><label>Free Shipping Above</label><input class="jc-input" type="number" step="0.01" name="free_shipping_above" value="<?php echo e(g('free_shipping_above','999')); ?>"></div>
        </div>
    </div>

    <div class="jc-panel" style="margin-bottom:20px;">
        <h3 style="margin-top:0;color:#0d2d66;">Payments</h3>
        <div class="jc-form-group">
            <label><input type="checkbox" name="cod_enabled" value="1" <?php if (g('cod_enabled','1')==='1') echo 'checked'; ?>> Enable Cash on Delivery</label>
        </div>
        <div class="jc-form-group">
            <label><input type="checkbox" name="rogerpay_enabled" value="1" <?php if (g('rogerpay_enabled','0')==='1') echo 'checked'; ?>> Enable RogerPay</label>
        </div>
        <div class="jc-row">
            <div class="jc-form-group"><label>RogerPay API Key</label><input class="jc-input" name="rogerpay_api_key" value="<?php echo e(g('rogerpay_api_key')); ?>"></div>
            <div class="jc-form-group"><label>RogerPay Secret Key</label><input class="jc-input" type="password" name="rogerpay_secret_key" value="<?php echo e(g('rogerpay_secret_key')); ?>"></div>
        </div>
        <div class="jc-row">
            <div class="jc-form-group"><label>RogerPay Base URL</label><input class="jc-input" name="rogerpay_base_url" value="<?php echo e(g('rogerpay_base_url','https://api.rogerpay.in')); ?>"></div>
            <div class="jc-form-group">
                <label>Mode</label>
                <select class="jc-select" name="rogerpay_mode">
                    <option value="live" <?php if (g('rogerpay_mode')==='live') echo 'selected'; ?>>Live</option>
                    <option value="test" <?php if (g('rogerpay_mode')==='test') echo 'selected'; ?>>Test</option>
                </select>
            </div>
        </div>
        <p style="color:#888;font-size:13px;">
            Callback URL (configure in RogerPay dashboard): <code><?php echo e(SITE_URL); ?>/api/rogerpay-callback.php</code><br>
            Webhook URL: <code><?php echo e(SITE_URL); ?>/api/rogerpay-webhook.php</code>
        </p>
    </div>

    <div class="jc-panel" style="margin-bottom:20px;">
        <h3 style="margin-top:0;color:#0d2d66;">Social</h3>
        <div class="jc-row">
            <div class="jc-form-group"><label>Facebook URL</label><input class="jc-input" name="facebook_url" value="<?php echo e(g('facebook_url')); ?>"></div>
            <div class="jc-form-group"><label>Instagram URL</label><input class="jc-input" name="instagram_url" value="<?php echo e(g('instagram_url')); ?>"></div>
        </div>
        <div class="jc-row">
            <div class="jc-form-group"><label>YouTube URL</label><input class="jc-input" name="youtube_url" value="<?php echo e(g('youtube_url')); ?>"></div>
            <div class="jc-form-group"><label>WhatsApp Number (with country code, no +)</label><input class="jc-input" name="whatsapp_number" value="<?php echo e(g('whatsapp_number')); ?>"></div>
        </div>
    </div>

    <button class="jc-btn jc-btn-primary" type="submit">Save Settings</button>
</form>

<?php require_once __DIR__ . '/_footer.php'; ?>
