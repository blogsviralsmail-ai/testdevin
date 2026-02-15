<?php
require_once '../includes/config.php';

if (!isLoggedIn() || !isAdmin()) {
    redirect('login.php');
}

$conn = getDBConnection();
$message = getMessage();

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $settings = [
        'site_name' => sanitize($_POST['site_name']),
        'site_tagline' => sanitize($_POST['site_tagline']),
        'site_description' => sanitize($_POST['site_description']),
        'phone_1' => sanitize($_POST['phone_1']),
        'phone_2' => sanitize($_POST['phone_2']),
        'email' => sanitize($_POST['email']),
        'address' => sanitize($_POST['address']),
        'facebook' => sanitize($_POST['facebook']),
        'instagram' => sanitize($_POST['instagram']),
        'youtube_url' => sanitize($_POST['youtube_url']),
        'twitter_url' => sanitize($_POST['twitter_url']),
        'whatsapp' => sanitize($_POST['whatsapp']),
        'logo' => sanitize($_POST['logo']),
        'rewards_rate' => sanitize($_POST['rewards_rate']),
        'offer_visible' => isset($_POST['offer_visible']) ? '1' : '0',
        'top_performers_visible' => isset($_POST['top_performers_visible']) ? '1' : '0',
        'website_url' => sanitize($_POST['website_url']),
        'meta_title' => sanitize($_POST['meta_title']),
        'meta_description' => sanitize($_POST['meta_description']),
        'meta_keywords' => sanitize($_POST['meta_keywords']),
        'google_maps_embed' => $_POST['google_maps_embed'],
        'copyright_text' => sanitize($_POST['copyright_text']),
        'footer_description' => sanitize($_POST['footer_description'])
    ];
    
    // Handle admin password change
    if (!empty($_POST['new_password']) && $_POST['new_password'] === $_POST['confirm_password']) {
        $settings['admin_password'] = $_POST['new_password'];
    }
    
    // Handle email settings
    if (isset($_POST['smtp_email'])) {
        $settings['smtp_email'] = sanitize($_POST['smtp_email']);
    }
    if (!empty($_POST['smtp_password'])) {
        $settings['smtp_password'] = $_POST['smtp_password'];
    }
    if (isset($_POST['default_customer_email'])) {
        $settings['default_customer_email'] = sanitize($_POST['default_customer_email']);
    }
    
    foreach ($settings as $key => $value) {
        updateSetting($key, $value);
    }
    
    setMessage('success', 'Settings updated successfully');
    redirect('settings.php');
}

// Get current settings
$site_name = getSetting('site_name', 'JP Tiles');
$site_tagline = getSetting('site_tagline', '#1 Trusted Brand Since 2013');
$site_description = getSetting('site_description', '');
$phone_1 = getSetting('phone_1', '');
$phone_2 = getSetting('phone_2', '');
$email = getSetting('email', '');
$address = getSetting('address', '');
$facebook = getSetting('facebook', '');
$instagram = getSetting('instagram', '');
$youtube_url = getSetting('youtube_url', '');
$twitter_url = getSetting('twitter_url', '');
$whatsapp = getSetting('whatsapp', '');
$logo = getSetting('logo', '');
$rewards_rate = getSetting('rewards_rate', '1');
$offer_visible = getSetting('offer_visible', '1');
$top_performers_visible = getSetting('top_performers_visible', '1');
$website_url = getSetting('website_url', 'https://jptiles.in');
$meta_title = getSetting('meta_title', 'JP Tiles - Premium Tiles & Sanitaryware');
$meta_description = getSetting('meta_description', '');
$meta_keywords = getSetting('meta_keywords', '');
$google_maps_embed = getSetting('google_maps_embed', '');
$copyright_text = getSetting('copyright_text', '2026 JP Tiles. All Rights Reserved.');
$footer_description = getSetting('footer_description', '');

// Email settings
$smtp_email = getSetting('smtp_email', '');
$smtp_password = getSetting('smtp_password', '');
$default_customer_email = getSetting('default_customer_email', 'jptiles13@gmail.com');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Settings - JP Tiles Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
    <style>
        .settings-tabs { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
        .settings-tabs .tab-btn { padding: 10px 20px; background: #2d2d2d; color: #fff; border: none; border-radius: 5px; cursor: pointer; }
        .settings-tabs .tab-btn.active { background: #c9a227; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        @media (max-width: 768px) {
            .settings-tabs { flex-direction: column; }
            .settings-tabs .tab-btn { width: 100%; text-align: left; }
        }
    </style>
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'sidebar.php'; ?>

        <main class="admin-content">
            <div class="admin-header">
                <h1>Website Settings</h1>
            </div>

            <?php if ($message): ?>
            <div class="alert alert-<?php echo $message['type']; ?>">
                <?php echo $message['text']; ?>
            </div>
            <?php endif; ?>

            <div class="settings-tabs">
                <button type="button" class="tab-btn active" onclick="showTab('general')"><i class="fas fa-cog"></i> General</button>
                <button type="button" class="tab-btn" onclick="showTab('contact')"><i class="fas fa-phone"></i> Contact</button>
                <button type="button" class="tab-btn" onclick="showTab('social')"><i class="fas fa-share-alt"></i> Social Media</button>
                <button type="button" class="tab-btn" onclick="showTab('seo')"><i class="fas fa-search"></i> SEO</button>
                                <button type="button" class="tab-btn" onclick="showTab('crm')"><i class="fas fa-gift"></i> CRM</button>
                                <button type="button" class="tab-btn" onclick="showTab('email')"><i class="fas fa-envelope"></i> Email</button>
                                <button type="button" class="tab-btn" onclick="showTab('security')"><i class="fas fa-lock"></i> Security</button>
            </div>

            <form method="POST">
                <!-- General Settings -->
                <div id="tab-general" class="tab-content active">
                    <div class="admin-card">
                        <h3><i class="fas fa-cog"></i> General Settings</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div class="form-group">
                                <label>Site Name</label>
                                <input type="text" name="site_name" value="<?php echo htmlspecialchars($site_name); ?>">
                            </div>
                            <div class="form-group">
                                <label>Site Tagline</label>
                                <input type="text" name="site_tagline" value="<?php echo htmlspecialchars($site_tagline); ?>">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Site Description</label>
                            <textarea name="site_description" rows="3"><?php echo htmlspecialchars($site_description); ?></textarea>
                        </div>
                        <div class="form-group">
                            <label>Logo URL</label>
                            <input type="text" name="logo" value="<?php echo htmlspecialchars($logo); ?>">
                            <?php if ($logo): ?>
                            <img src="<?php echo htmlspecialchars($logo); ?>" alt="Logo Preview" style="height: 50px; margin-top: 10px;">
                            <?php endif; ?>
                        </div>
                        <div class="form-group">
                            <label>Footer Description</label>
                            <textarea name="footer_description" rows="3"><?php echo htmlspecialchars($footer_description); ?></textarea>
                        </div>
                        <div class="form-group">
                            <label>Copyright Text</label>
                            <input type="text" name="copyright_text" value="<?php echo htmlspecialchars($copyright_text); ?>">
                        </div>
                    </div>
                </div>

                <!-- Contact Settings -->
                <div id="tab-contact" class="tab-content">
                    <div class="admin-card">
                        <h3><i class="fas fa-phone"></i> Contact Information</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div class="form-group">
                                <label>Phone 1</label>
                                <input type="text" name="phone_1" value="<?php echo htmlspecialchars($phone_1); ?>">
                            </div>
                            <div class="form-group">
                                <label>Phone 2</label>
                                <input type="text" name="phone_2" value="<?php echo htmlspecialchars($phone_2); ?>">
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" name="email" value="<?php echo htmlspecialchars($email); ?>">
                            </div>
                            <div class="form-group">
                                <label>WhatsApp Number (without +)</label>
                                <input type="text" name="whatsapp" value="<?php echo htmlspecialchars($whatsapp); ?>" placeholder="919828290049">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Address</label>
                            <textarea name="address" rows="2"><?php echo htmlspecialchars($address); ?></textarea>
                        </div>
                        <div class="form-group">
                            <label>Google Maps Embed Code</label>
                            <textarea name="google_maps_embed" rows="4" placeholder="Paste Google Maps iframe embed code here"><?php echo htmlspecialchars($google_maps_embed); ?></textarea>
                            <small style="color: #666;">Go to Google Maps > Share > Embed a map > Copy HTML</small>
                        </div>
                    </div>
                </div>

                <!-- Social Media -->
                <div id="tab-social" class="tab-content">
                    <div class="admin-card">
                        <h3><i class="fas fa-share-alt"></i> Social Media Links</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div class="form-group">
                                <label><i class="fab fa-facebook" style="color: #1877f2;"></i> Facebook URL</label>
                                <input type="text" name="facebook" value="<?php echo htmlspecialchars($facebook); ?>">
                            </div>
                            <div class="form-group">
                                <label><i class="fab fa-instagram" style="color: #e4405f;"></i> Instagram URL</label>
                                <input type="text" name="instagram" value="<?php echo htmlspecialchars($instagram); ?>">
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div class="form-group">
                                <label><i class="fab fa-youtube" style="color: #ff0000;"></i> YouTube URL</label>
                                <input type="text" name="youtube_url" value="<?php echo htmlspecialchars($youtube_url); ?>">
                            </div>
                            <div class="form-group">
                                <label><i class="fab fa-twitter" style="color: #1da1f2;"></i> Twitter URL</label>
                                <input type="text" name="twitter_url" value="<?php echo htmlspecialchars($twitter_url); ?>">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SEO Settings -->
                <div id="tab-seo" class="tab-content">
                    <div class="admin-card">
                        <h3><i class="fas fa-search"></i> SEO Settings</h3>
                        <div class="form-group">
                            <label>Meta Title</label>
                            <input type="text" name="meta_title" value="<?php echo htmlspecialchars($meta_title); ?>">
                            <small style="color: #666;">Recommended: 50-60 characters</small>
                        </div>
                        <div class="form-group">
                            <label>Meta Description</label>
                            <textarea name="meta_description" rows="3"><?php echo htmlspecialchars($meta_description); ?></textarea>
                            <small style="color: #666;">Recommended: 150-160 characters</small>
                        </div>
                        <div class="form-group">
                            <label>Meta Keywords</label>
                            <input type="text" name="meta_keywords" value="<?php echo htmlspecialchars($meta_keywords); ?>">
                            <small style="color: #666;">Comma separated keywords</small>
                        </div>
                    </div>
                </div>

                <!-- CRM Settings -->
                <div id="tab-crm" class="tab-content">
                    <div class="admin-card">
                        <h3><i class="fas fa-gift"></i> CRM Settings</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div class="form-group">
                                <label>Rewards Rate (% of amount)</label>
                                <input type="number" name="rewards_rate" value="<?php echo htmlspecialchars($rewards_rate); ?>" step="0.01">
                                <small style="color: #666;">Default reward calculation: Amount x Rate%</small>
                            </div>
                            <div class="form-group">
                                <label>Customer App Website URL</label>
                                <input type="url" name="website_url" value="<?php echo htmlspecialchars($website_url); ?>" placeholder="https://jptiles.in">
                                <small style="color: #666;">This URL will open when customer clicks "Visit Website" in mobile app</small>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                            <div class="form-group">
                                <label>Show Offers to Customers</label>
                                <div style="margin-top: 10px;">
                                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                        <input type="checkbox" name="offer_visible" <?php echo $offer_visible === '1' ? 'checked' : ''; ?>>
                                        <span>Display active offers in Customer portal</span>
                                    </label>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Show Top Performers to Customers</label>
                                <div style="margin-top: 10px;">
                                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                        <input type="checkbox" name="top_performers_visible" <?php echo $top_performers_visible === '1' ? 'checked' : ''; ?>>
                                        <span>Display top performers ranking in Customer portal</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                                <!-- Email Settings -->
                                <div id="tab-email" class="tab-content">
                                    <div class="admin-card">
                                        <h3><i class="fas fa-envelope"></i> Email Settings (For OTP)</h3>
                                        <p style="color: #666; margin-bottom: 20px;">Configure Gmail SMTP for sending OTP emails for password reset</p>
                                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                            <div class="form-group">
                                                <label>SMTP Email (Gmail)</label>
                                                <input type="email" name="smtp_email" value="<?php echo htmlspecialchars($smtp_email); ?>" placeholder="your-email@gmail.com">
                                                <small style="color: #666;">Gmail account for sending OTP emails</small>
                                            </div>
                                            <div class="form-group">
                                                <label>App Password</label>
                                                <input type="password" name="smtp_password" placeholder="<?php echo !empty($smtp_password) ? '********' : 'Enter App Password'; ?>">
                                                <small style="color: #666;">Get from <a href="https://myaccount.google.com/apppasswords" target="_blank">Google App Passwords</a>. Leave blank to keep current.</small>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label>Default Customer Email</label>
                                            <input type="email" name="default_customer_email" value="<?php echo htmlspecialchars($default_customer_email); ?>" placeholder="default@gmail.com">
                                            <small style="color: #666;">Default email for new customer registrations if they don't provide one</small>
                                        </div>
                                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px;">
                                            <h4 style="margin-bottom: 10px;"><i class="fas fa-info-circle"></i> How to get Gmail App Password:</h4>
                                            <ol style="margin-left: 20px; color: #666;">
                                                <li>Go to <a href="https://myaccount.google.com/security" target="_blank">Google Account Security</a></li>
                                                <li>Enable 2-Step Verification if not already enabled</li>
                                                <li>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank">App Passwords</a></li>
                                                <li>Create new App Password for "Mail"</li>
                                                <li>Copy the 16-character password and paste above</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>

                                <!-- Security Settings -->
                                <div id="tab-security" class="tab-content">
                                    <div class="admin-card">
                                        <h3><i class="fas fa-lock"></i> Change Admin Password</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div class="form-group">
                                <label>New Password</label>
                                <input type="password" name="new_password" placeholder="Enter new password">
                            </div>
                            <div class="form-group">
                                <label>Confirm Password</label>
                                <input type="password" name="confirm_password" placeholder="Confirm new password">
                            </div>
                        </div>
                        <small style="color: #666;">Leave blank to keep current password</small>
                    </div>
                </div>

                <div style="text-align: right; margin-top: 20px;">
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save Settings</button>
                </div>
            </form>
        </main>
    </div>

    <script>
    function showTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('tab-' + tabName).classList.add('active');
        event.target.classList.add('active');
    }
    </script>
</body>
</html>
<?php $conn->close(); ?>
