<?php
require_once '../includes/config.php';

if (!isLoggedIn() || !isAdminOrEmployee()) {
    redirect('login.php');
}

if (!hasPermission('send_sms')) {
    setMessage('danger', 'Access denied');
    redirect('index.php');
}

$conn = getDBConnection();
$message = getMessage();
$categories = getCustomerCategories();

// Get SMS settings
$sms_api_url = getSetting('sms_api_url', '');
$sms_api_key = getSetting('sms_api_key', '');
$sms_sender_id = getSetting('sms_sender_id', '');
$sms_dlt_entity_id = getSetting('sms_dlt_entity_id', '');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['save_settings']) && isAdmin()) {
        setSetting('sms_api_url', sanitize($_POST['sms_api_url']));
        setSetting('sms_api_key', sanitize($_POST['sms_api_key']));
        setSetting('sms_sender_id', sanitize($_POST['sms_sender_id']));
        setSetting('sms_dlt_entity_id', sanitize($_POST['sms_dlt_entity_id']));
        setMessage('success', 'SMS settings saved');
        redirect('sms.php');
    }
    
    if (isset($_POST['save_template']) && isAdmin()) {
        $name = sanitize($_POST['template_name']);
        $content = sanitize($_POST['template_content']);
        $template_id = sanitize($_POST['template_id']);
        
        $stmt = $conn->prepare("INSERT INTO sms_templates (name, content, template_id) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $name, $content, $template_id);
        $stmt->execute();
        setMessage('success', 'Template saved');
        redirect('sms.php');
    }
    
    if (isset($_POST['delete_template'])) {
        $id = (int)$_POST['id'];
        $conn->query("DELETE FROM sms_templates WHERE id = $id");
        setMessage('success', 'Template deleted');
        redirect('sms.php');
    }
    
    if (isset($_POST['send_sms'])) {
        $template_id = (int)$_POST['template_id'];
        $custom_message = sanitize($_POST['custom_message']);
        $category_filter = (int)$_POST['category_filter'];
        $selected_customers = isset($_POST['customers']) ? $_POST['customers'] : [];
        
        // Get template
        $template = null;
        $sms_content = $custom_message;
        $dlt_template_id = '';
        
        if ($template_id) {
            $template = $conn->query("SELECT * FROM sms_templates WHERE id = $template_id")->fetch_assoc();
            if ($template) {
                $sms_content = $template['content'];
                $dlt_template_id = $template['dlt_template_id'];
            }
        }
        
        if (empty($sms_content)) {
            setMessage('danger', 'Please select a template or enter a message');
            redirect('sms.php');
        }
        
        // Get recipients
        $where = "status = 'active'";
        if (!empty($selected_customers)) {
            $ids = implode(',', array_map('intval', $selected_customers));
            $where .= " AND id IN ($ids)";
        } elseif ($category_filter) {
            $where .= " AND category_id = $category_filter";
        }
        
        $recipients = $conn->query("SELECT id, name, mobile FROM masons WHERE $where");
        $sent_count = 0;
        $failed_count = 0;
        
        while ($r = $recipients->fetch_assoc()) {
            // Personalize message
            $personalized = str_replace('{name}', $r['name'], $sms_content);
            
            // Send SMS via API
            $success = false;
            $response = '';
            
            if (!empty($sms_api_url) && !empty($sms_api_key)) {
                $api_url = $sms_api_url;
                $api_url = str_replace('{api_key}', urlencode($sms_api_key), $api_url);
                $api_url = str_replace('{sender_id}', urlencode($sms_sender_id), $api_url);
                $api_url = str_replace('{mobile}', urlencode($r['mobile']), $api_url);
                $api_url = str_replace('{message}', urlencode($personalized), $api_url);
                $api_url = str_replace('{dlt_entity_id}', urlencode($sms_dlt_entity_id), $api_url);
                $api_url = str_replace('{dlt_template_id}', urlencode($dlt_template_id), $api_url);
                
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $api_url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, 30);
                $response = curl_exec($ch);
                $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                
                $success = ($http_code >= 200 && $http_code < 300);
            }
            
            // Log SMS
            $status = $success ? 'sent' : 'failed';
            $stmt = $conn->prepare("INSERT INTO sms_logs (mason_id, mobile, message, template_id, status, response, sent_by) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $sent_by = $_SESSION['user_id'];
            $stmt->bind_param("issisis", $r['id'], $r['mobile'], $personalized, $template_id, $status, $response, $sent_by);
            $stmt->execute();
            
            if ($success) $sent_count++;
            else $failed_count++;
        }
        
        if (empty($sms_api_url)) {
            setMessage('warning', "SMS API not configured. $sent_count messages logged but not sent.");
        } else {
            setMessage('success', "Sent: $sent_count, Failed: $failed_count");
        }
        redirect('sms.php');
    }
}

$templates = $conn->query("SELECT * FROM sms_templates ORDER BY name");
$customers = $conn->query("SELECT m.*, cc.name as category_name FROM masons m LEFT JOIN customer_categories cc ON m.category_id = cc.id WHERE m.status = 'active' ORDER BY m.name");
$logs = $conn->query("SELECT sl.*, m.name as customer_name FROM sms_logs sl LEFT JOIN masons m ON sl.customer_id = m.id ORDER BY sl.created_at DESC LIMIT 100");
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bulk SMS - JP Tiles Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
    <style>
        .tabs { display: flex; gap: 10px; margin-bottom: 20px; }
        .tab { padding: 10px 20px; background: #f5f5f5; border: none; cursor: pointer; border-radius: 5px; }
        .tab.active { background: #c9a227; color: white; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .customer-list { max-height: 300px; overflow-y: auto; border: 1px solid #ddd; border-radius: 5px; padding: 10px; }
        .customer-item { display: flex; align-items: center; gap: 10px; padding: 8px; border-bottom: 1px solid #eee; }
        .customer-item:last-child { border-bottom: none; }
        .customer-item input { width: auto; }
    </style>
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'sidebar.php'; ?>
        <main class="admin-content">
            <div class="admin-header">
                <h1><i class="fas fa-sms"></i> Bulk SMS</h1>
            </div>

            <?php if ($message): ?><div class="alert alert-<?php echo $message['type']; ?>"><?php echo $message['text']; ?></div><?php endif; ?>

            <div class="tabs">
                <button class="tab active" onclick="showTab('send')">Send SMS</button>
                <button class="tab" onclick="showTab('templates')">Templates</button>
                <button class="tab" onclick="showTab('logs')">Logs</button>
                <?php if (isAdmin()): ?><button class="tab" onclick="showTab('settings')">Settings</button><?php endif; ?>
            </div>

            <!-- Send SMS Tab -->
            <div id="send" class="tab-content active">
                <div class="admin-card">
                    <form method="POST">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div>
                                <div class="form-group">
                                    <label>Select Template</label>
                                    <select name="template_id" id="template_select" onchange="loadTemplate(this.value)">
                                        <option value="">-- Custom Message --</option>
                                        <?php $templates->data_seek(0); while($t = $templates->fetch_assoc()): ?>
                                        <option value="<?php echo $t['id']; ?>" data-content="<?php echo htmlspecialchars($t['content']); ?>"><?php echo $t['name']; ?></option>
                                        <?php endwhile; ?>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Message (use {name} for personalization)</label>
                                    <textarea name="custom_message" id="message_content" rows="5" placeholder="Enter your message here..."></textarea>
                                </div>
                                <div class="form-group">
                                    <label>Filter by Category</label>
                                    <select name="category_filter">
                                        <option value="">All Categories</option>
                                        <?php foreach ($categories as $cat): ?>
                                        <option value="<?php echo $cat['id']; ?>"><?php echo $cat['name']; ?></option>
                                        <?php endforeach; ?>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label>Or Select Specific Customers</label>
                                <div class="customer-list">
                                    <?php $customers->data_seek(0); while($c = $customers->fetch_assoc()): ?>
                                    <label class="customer-item">
                                        <input type="checkbox" name="customers[]" value="<?php echo $c['id']; ?>">
                                        <span><strong><?php echo $c['name']; ?></strong> (<?php echo $c['mobile']; ?>) - <?php echo $c['category_name'] ?? 'N/A'; ?></span>
                                    </label>
                                    <?php endwhile; ?>
                                </div>
                            </div>
                        </div>
                        <br>
                        <button type="submit" name="send_sms" class="btn btn-primary"><i class="fas fa-paper-plane"></i> Send SMS</button>
                    </form>
                </div>
            </div>

            <!-- Templates Tab -->
            <div id="templates" class="tab-content">
                <div class="admin-card">
                    <?php if (isAdmin()): ?>
                    <form method="POST" style="margin-bottom: 20px; padding: 20px; background: #f9f9f9; border-radius: 10px;">
                        <h3>Add Template</h3>
                        <div class="form-group"><label>Template Name</label><input type="text" name="template_name" required></div>
                        <div class="form-group"><label>Content (use {name} for personalization)</label><textarea name="template_content" rows="3" required></textarea></div>
                        <div class="form-group"><label>DLT Template ID</label><input type="text" name="template_id" placeholder="For DLT compliance"></div>
                        <button type="submit" name="save_template" class="btn btn-primary">Save Template</button>
                    </form>
                    <?php endif; ?>
                    
                    <table class="data-table">
                        <thead><tr><th>Name</th><th>Content</th><th>DLT ID</th><th>Actions</th></tr></thead>
                        <tbody>
                            <?php $templates->data_seek(0); while($t = $templates->fetch_assoc()): ?>
                            <tr>
                                <td><strong><?php echo $t['name']; ?></strong></td>
                                <td><?php echo substr($t['content'], 0, 100); ?>...</td>
                                <td><?php echo $t['template_id'] ?: 'N/A'; ?></td>
                                <td>
                                    <?php if (isAdmin()): ?>
                                    <form method="POST" style="display:inline" onsubmit="return confirm('Delete?')">
                                        <input type="hidden" name="id" value="<?php echo $t['id']; ?>">
                                        <button type="submit" name="delete_template" class="action-btn delete"><i class="fas fa-trash"></i></button>
                                    </form>
                                    <?php endif; ?>
                                </td>
                            </tr>
                            <?php endwhile; ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Logs Tab -->
            <div id="logs" class="tab-content">
                <div class="admin-card">
                    <table class="data-table">
                        <thead><tr><th>Customer</th><th>Mobile</th><th>Message</th><th>Status</th><th>Date</th></tr></thead>
                        <tbody>
                            <?php while($l = $logs->fetch_assoc()): ?>
                            <tr>
                                <td><?php echo $l['customer_name'] ?? 'N/A'; ?></td>
                                <td><?php echo $l['mobile']; ?></td>
                                <td><?php echo substr($l['message'], 0, 50); ?>...</td>
                                <td><span class="badge badge-<?php echo $l['status'] === 'sent' ? 'success' : 'danger'; ?>"><?php echo ucfirst($l['status']); ?></span></td>
                                <td><?php echo formatDate($l['created_at']); ?></td>
                            </tr>
                            <?php endwhile; ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Settings Tab -->
            <?php if (isAdmin()): ?>
            <div id="settings" class="tab-content">
                <div class="admin-card">
                    <h3>SMS API Configuration (DLT Compliant)</h3>
                    <form method="POST">
                        <div class="form-group">
                            <label>API URL Template</label>
                            <input type="text" name="sms_api_url" value="<?php echo $sms_api_url; ?>" placeholder="https://api.example.com/send?apikey={api_key}&sender={sender_id}&mobile={mobile}&message={message}">
                            <small style="color: #666;">Use placeholders: {api_key}, {sender_id}, {mobile}, {message}, {dlt_entity_id}, {dlt_template_id}</small>
                        </div>
                        <div class="form-group"><label>API Key</label><input type="text" name="sms_api_key" value="<?php echo $sms_api_key; ?>"></div>
                        <div class="form-group"><label>Sender ID</label><input type="text" name="sms_sender_id" value="<?php echo $sms_sender_id; ?>"></div>
                        <div class="form-group"><label>DLT Entity ID</label><input type="text" name="sms_dlt_entity_id" value="<?php echo $sms_dlt_entity_id; ?>"></div>
                        <button type="submit" name="save_settings" class="btn btn-primary">Save Settings</button>
                    </form>
                </div>
            </div>
            <?php endif; ?>
        </main>
    </div>

    <script>
        function showTab(tab) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.querySelector('.tab[onclick*="' + tab + '"]').classList.add('active');
            document.getElementById(tab).classList.add('active');
        }
        
        function loadTemplate(id) {
            const select = document.getElementById('template_select');
            const option = select.options[select.selectedIndex];
            const content = option.dataset.content || '';
            document.getElementById('message_content').value = content;
        }
    </script>
</body>
</html>
<?php $conn->close(); ?>
