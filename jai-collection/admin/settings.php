<?php
$pageTitle = 'Settings';
require_once __DIR__ . '/_header.php';
require_once __DIR__ . '/../includes/notify.php';
$pdo = getPDO();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrfVerify();
    // Fields that pass through sanitize() (strip_tags + trim). SAFE for plain text.
    $textFields = [
        // Site
        'site_name','site_tagline','site_email','site_phone','site_address',
        'homepage_heading','homepage_subheading',
        'footer_about','footer_copyright',
        // Commerce
        'default_commission_percent','default_shipping_fee','free_shipping_above','min_payout_amount',
        // Payments (non-secret config only)
        'rogerpay_base_url','rogerpay_mode',
        // SMTP (non-secret)
        'smtp_host','smtp_port','smtp_user','smtp_secure','smtp_from_email','smtp_from_name',
        // Social
        'facebook_url','instagram_url','whatsapp_number','youtube_url',
    ];
    foreach ($textFields as $f) {
        if (array_key_exists($f, $_POST)) { setSetting($f, sanitize($_POST[$f])); }
    }
    // Secret / key / token fields — store verbatim (strip_tags would corrupt HMAC keys
    // containing characters like '<' followed by alpha). Only trim whitespace.
    $secretFields = [
        'rogerpay_api_key','rogerpay_secret_key',
        'smtp_pass',
        'telegram_bot_token','telegram_chat_id',
    ];
    foreach ($secretFields as $f) {
        if (array_key_exists($f, $_POST)) { setSetting($f, trim((string)$_POST[$f])); }
    }
    // Logo upload — No SVG (SVG can embed <script>/onload handlers that execute
    // when a user navigates directly to /uploads/logo/logo_*.svg, stored XSS).
    if (!empty($_FILES['logo']['tmp_name'])) {
        $newFn = uploadImageFile($_FILES['logo'], 'logo', 'logo', ['jpg','jpeg','png','webp']);
        if ($newFn) { setSetting('logo_url', '/uploads/logo/' . $newFn); }
    }
    if (!empty($_FILES['favicon']['tmp_name'])) {
        $newFn = uploadImageFile($_FILES['favicon'], 'logo', 'favicon', ['ico','png','jpg','jpeg','webp']);
        if ($newFn) { setSetting('favicon_url', '/uploads/logo/' . $newFn); }
    }
    // Toggles
    setSetting('cod_enabled', isset($_POST['cod_enabled']) ? '1' : '0');
    setSetting('rogerpay_enabled', isset($_POST['rogerpay_enabled']) ? '1' : '0');
    setSetting('enable_registration', isset($_POST['enable_registration']) ? '1' : '0');
    setSetting('enable_hot_blink', isset($_POST['enable_hot_blink']) ? '1' : '0');

    // Optional SMTP test — only fire when the "Send Test" button was clicked.
    // Previously we checked just !empty($_POST['test_email']), which ran on
    // every form submit if the admin had left a value in the test-email input
    // (e.g. they typed one, clicked Save Settings, and the settings save was
    // hijacked into "test email sent" flash with no confirmation that the
    // settings themselves were persisted).
    if (!empty($_POST['send_test_email']) && !empty($_POST['test_email'])) {
        $ok = sendEmail($_POST['test_email'], 'Test email from ' . getSetting('site_name','Jai Collection'),
            '<p>This is a test email sent from your Admin → Settings page.</p><p>If you received this, SMTP is working correctly.</p>');
        setFlash($ok ? 'success' : 'error', $ok ? ('Test email sent to ' . $_POST['test_email']) : 'Test email failed. Check SMTP settings and error log.');
        redirect('settings.php');
    }
    if (!empty($_POST['test_telegram'])) {
        $ok = sendTelegram('🔔 Test message from <b>' . getSetting('site_name','Jai Collection') . '</b> admin panel.');
        setFlash($ok ? 'success' : 'error', $ok ? 'Telegram test sent.' : 'Telegram test failed. Check bot token / chat id.');
        redirect('settings.php');
    }

    setFlash('success', 'Settings saved.');
    redirect('settings.php');
}

function g($k,$d='') { static $cache = null; if ($cache === null) { $cache = []; foreach (getPDO()->query("SELECT setting_key, setting_value FROM settings")->fetchAll() as $r) $cache[$r['setting_key']] = $r['setting_value']; } return $cache[$k] ?? $d; }
?>
<div class="jc-admin-actions"><h2>Site Settings</h2></div>

<form method="post" enctype="multipart/form-data">
    <?php echo csrfField(); ?>

    <div class="jc-panel" style="margin-bottom:20px;">
        <h3 style="margin-top:0;color:#0d2d66;"><i class="fas fa-globe"></i> Site Info</h3>
        <div class="jc-row">
            <div class="jc-form-group"><label>Site Name</label><input class="jc-input" name="site_name" value="<?php echo e(g('site_name')); ?>"></div>
            <div class="jc-form-group"><label>Tagline</label><input class="jc-input" name="site_tagline" value="<?php echo e(g('site_tagline')); ?>"></div>
        </div>
        <div class="jc-row">
            <div class="jc-form-group"><label>Support Email</label><input class="jc-input" name="site_email" value="<?php echo e(g('site_email')); ?>"></div>
            <div class="jc-form-group"><label>Support Phone</label><input class="jc-input" name="site_phone" value="<?php echo e(g('site_phone')); ?>"></div>
        </div>
        <div class="jc-form-group"><label>Business Address</label><textarea class="jc-textarea" name="site_address"><?php echo e(g('site_address')); ?></textarea></div>
        <div class="jc-row">
            <div class="jc-form-group">
                <label>Logo</label>
                <input class="jc-input" type="file" name="logo" accept="image/*">
                <?php $lu = g('logo_url'); if ($lu): $lu = strpos($lu,'http')===0 ? $lu : SITE_URL.$lu; ?>
                    <img src="<?php echo e($lu); ?>" style="height:60px;margin-top:6px;background:#f7f8fa;padding:6px;border-radius:6px;">
                <?php endif; ?>
            </div>
            <div class="jc-form-group">
                <label>Favicon</label>
                <input class="jc-input" type="file" name="favicon" accept="image/*,.ico">
                <?php $fu = g('favicon_url'); if ($fu): $fu = strpos($fu,'http')===0 ? $fu : SITE_URL.$fu; ?>
                    <img src="<?php echo e($fu); ?>" style="height:32px;margin-top:6px;background:#f7f8fa;padding:4px;border-radius:4px;">
                <?php endif; ?>
            </div>
        </div>
    </div>

    <div class="jc-panel" style="margin-bottom:20px;">
        <h3 style="margin-top:0;color:#0d2d66;"><i class="fas fa-home"></i> Homepage &amp; Footer</h3>
        <div class="jc-row">
            <div class="jc-form-group"><label>Homepage Heading</label><input class="jc-input" name="homepage_heading" value="<?php echo e(g('homepage_heading','Welcome to Jai Collection')); ?>"></div>
            <div class="jc-form-group"><label>Homepage Subheading</label><input class="jc-input" name="homepage_subheading" value="<?php echo e(g('homepage_subheading','Fashion. Home. Daily Essentials.')); ?>"></div>
        </div>
        <div class="jc-form-group"><label>Footer About</label><textarea class="jc-textarea" name="footer_about" rows="2"><?php echo e(g('footer_about')); ?></textarea></div>
        <div class="jc-form-group"><label>Footer Copyright</label><input class="jc-input" name="footer_copyright" value="<?php echo e(g('footer_copyright')); ?>"></div>
        <div class="jc-row">
            <div class="jc-form-group"><label><input type="checkbox" name="enable_registration" value="1" <?php if (g('enable_registration','1')==='1') echo 'checked'; ?>> Allow customer registration</label></div>
            <div class="jc-form-group"><label><input type="checkbox" name="enable_hot_blink" value="1" <?php if (g('enable_hot_blink','1')==='1') echo 'checked'; ?>> Show blinking "Hot Deals" strip on homepage</label></div>
        </div>
    </div>

    <div class="jc-panel" style="margin-bottom:20px;">
        <h3 style="margin-top:0;color:#0d2d66;"><i class="fas fa-store"></i> Commerce</h3>
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
        <h3 style="margin-top:0;color:#0d2d66;"><i class="fas fa-credit-card"></i> Payments</h3>
        <div class="jc-form-group">
            <label><input type="checkbox" name="cod_enabled" value="1" <?php if (g('cod_enabled','1')==='1') echo 'checked'; ?>> <strong>Enable Cash on Delivery (COD)</strong></label>
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
            Callback URL: <code><?php echo e(SITE_URL); ?>/api/rogerpay-callback.php</code><br>
            Webhook URL: <code><?php echo e(SITE_URL); ?>/api/rogerpay-webhook.php</code>
        </p>
    </div>

    <div class="jc-panel" style="margin-bottom:20px;">
        <h3 style="margin-top:0;color:#0d2d66;"><i class="fas fa-envelope"></i> Email (SMTP)</h3>
        <p style="color:#888;font-size:13px;margin-top:0;">Leave SMTP host blank to use the server's default <code>mail()</code> (if configured). For Gmail use host <code>smtp.gmail.com</code>, port <code>587</code>, secure <code>tls</code>, and an App Password.</p>
        <div class="jc-row">
            <div class="jc-form-group"><label>SMTP Host</label><input class="jc-input" name="smtp_host" value="<?php echo e(g('smtp_host')); ?>"></div>
            <div class="jc-form-group"><label>SMTP Port</label><input class="jc-input" name="smtp_port" value="<?php echo e(g('smtp_port','587')); ?>"></div>
        </div>
        <div class="jc-row">
            <div class="jc-form-group"><label>SMTP Username</label><input class="jc-input" name="smtp_user" value="<?php echo e(g('smtp_user')); ?>"></div>
            <div class="jc-form-group"><label>SMTP Password</label><input class="jc-input" type="password" name="smtp_pass" value="<?php echo e(g('smtp_pass')); ?>" autocomplete="new-password"></div>
        </div>
        <div class="jc-row">
            <div class="jc-form-group">
                <label>Security</label>
                <select class="jc-select" name="smtp_secure">
                    <option value="tls" <?php if (g('smtp_secure','tls')==='tls') echo 'selected'; ?>>STARTTLS (587)</option>
                    <option value="ssl" <?php if (g('smtp_secure')==='ssl') echo 'selected'; ?>>SSL (465)</option>
                    <option value="none" <?php if (g('smtp_secure')==='none') echo 'selected'; ?>>None</option>
                </select>
            </div>
            <div class="jc-form-group"><label>From Email</label><input class="jc-input" name="smtp_from_email" value="<?php echo e(g('smtp_from_email')); ?>"></div>
        </div>
        <div class="jc-form-group"><label>From Name</label><input class="jc-input" name="smtp_from_name" value="<?php echo e(g('smtp_from_name',g('site_name','Jai Collection'))); ?>"></div>
        <div class="jc-form-group">
            <label>Send Test Email</label>
            <div style="display:flex;gap:8px;">
                <input class="jc-input" type="email" name="test_email" placeholder="your@email.com" style="flex:1;">
                <button type="submit" name="send_test_email" value="1" class="jc-btn" style="background:#0d2d66;color:#fff;">Send Test</button>
            </div>
        </div>
    </div>

    <div class="jc-panel" style="margin-bottom:20px;">
        <h3 style="margin-top:0;color:#0d2d66;"><i class="fab fa-telegram"></i> Telegram Notifications</h3>
        <p style="color:#888;font-size:13px;margin-top:0;">Create a bot via @BotFather, then get your chat id from @userinfobot (or a group's chat id). New orders &amp; status changes will be pushed here.</p>
        <div class="jc-row">
            <div class="jc-form-group"><label>Bot Token</label><input class="jc-input" name="telegram_bot_token" value="<?php echo e(g('telegram_bot_token')); ?>" placeholder="123456:ABC-..."></div>
            <div class="jc-form-group"><label>Chat ID</label><input class="jc-input" name="telegram_chat_id" value="<?php echo e(g('telegram_chat_id')); ?>" placeholder="-1001234567890"></div>
        </div>
        <div class="jc-form-group">
            <button type="submit" name="test_telegram" value="1" class="jc-btn" style="background:#0088cc;color:#fff;">Send Telegram Test</button>
        </div>
    </div>

    <div class="jc-panel" style="margin-bottom:20px;">
        <h3 style="margin-top:0;color:#0d2d66;"><i class="fas fa-share-alt"></i> Social</h3>
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
