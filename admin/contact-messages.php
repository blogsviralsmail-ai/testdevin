<?php
require_once '../includes/config.php';

if (!isLoggedIn() || !isAdmin()) {
    redirect('login.php');
}

$conn = getDBConnection();
$message = getMessage();

// Handle form submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'update_status') {
        $id = (int)$_POST['id'];
        $status = sanitize($_POST['status']);
        
        $conn->query("UPDATE contact_messages SET status = '$status' WHERE id = $id");
        setMessage('success', 'Status updated');
        redirect('contact-messages.php');
    }
    
    if ($action === 'delete') {
        $id = (int)$_POST['id'];
        $conn->query("DELETE FROM contact_messages WHERE id = $id");
        setMessage('success', 'Message deleted');
        redirect('contact-messages.php');
    }
}

// Filter
$status_filter = sanitize($_GET['status'] ?? '');
$where = "1=1";
if ($status_filter) {
    $where .= " AND status = '$status_filter'";
}

$messages_list = $conn->query("SELECT * FROM contact_messages WHERE $where ORDER BY created_at DESC");
$logo = getSetting('logo', '');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact Messages - JP Tiles Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'sidebar.php'; ?>

        <main class="admin-content">
            <div class="admin-header">
                <h1><i class="fas fa-envelope"></i> Contact Messages</h1>
            </div>

            <?php if ($message): ?>
            <div class="alert alert-<?php echo $message['type']; ?>">
                <?php echo $message['text']; ?>
            </div>
            <?php endif; ?>

            <!-- Filters -->
            <div class="admin-card">
                <form method="GET" style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <select name="status" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                        <option value="">All Status</option>
                        <option value="new" <?php echo $status_filter === 'new' ? 'selected' : ''; ?>>New</option>
                        <option value="contacted" <?php echo $status_filter === 'contacted' ? 'selected' : ''; ?>>Contacted</option>
                        <option value="closed" <?php echo $status_filter === 'closed' ? 'selected' : ''; ?>>Closed</option>
                    </select>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-filter"></i> Filter</button>
                    <a href="contact-messages.php" class="btn btn-outline">Clear</a>
                </form>
            </div>

            <!-- Messages List -->
            <div class="admin-card">
                <h3>All Contact Messages (<?php echo $messages_list->num_rows; ?>)</h3>
                <div style="overflow-x: auto;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Contact</th>
                            <th>Subject</th>
                            <th>Message</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if($messages_list->num_rows > 0): ?>
                        <?php while($msg = $messages_list->fetch_assoc()): ?>
                        <tr>
                            <td><strong><?php echo htmlspecialchars($msg['name']); ?></strong></td>
                            <td>
                                <a href="mailto:<?php echo htmlspecialchars($msg['email']); ?>"><?php echo htmlspecialchars($msg['email']); ?></a><br>
                                <a href="tel:<?php echo htmlspecialchars($msg['phone']); ?>"><?php echo htmlspecialchars($msg['phone']); ?></a>
                            </td>
                            <td><?php echo htmlspecialchars($msg['subject'] ?? '-'); ?></td>
                            <td style="max-width: 300px;">
                                <div style="max-height: 100px; overflow-y: auto;">
                                    <?php echo nl2br(htmlspecialchars($msg['message'])); ?>
                                </div>
                            </td>
                            <td><?php echo date('d M Y, h:i A', strtotime($msg['created_at'])); ?></td>
                            <td>
                                <form method="POST" style="display: inline;">
                                    <input type="hidden" name="action" value="update_status">
                                    <input type="hidden" name="id" value="<?php echo $msg['id']; ?>">
                                    <select name="status" onchange="this.form.submit()" style="padding: 5px; border-radius: 5px; border: 1px solid #ddd; background: <?php echo $msg['status'] === 'new' ? '#fff3cd' : ($msg['status'] === 'contacted' ? '#cce5ff' : '#d4edda'); ?>;">
                                        <option value="new" <?php echo $msg['status'] === 'new' ? 'selected' : ''; ?>>New</option>
                                        <option value="contacted" <?php echo $msg['status'] === 'contacted' ? 'selected' : ''; ?>>Contacted</option>
                                        <option value="closed" <?php echo $msg['status'] === 'closed' ? 'selected' : ''; ?>>Closed</option>
                                    </select>
                                </form>
                            </td>
                            <td>
                                <a href="tel:<?php echo htmlspecialchars($msg['phone']); ?>" class="btn btn-sm btn-primary" title="Call"><i class="fas fa-phone"></i></a>
                                <a href="https://wa.me/91<?php echo preg_replace('/[^0-9]/', '', $msg['phone']); ?>" target="_blank" class="btn btn-sm btn-success" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>
                                <form method="POST" style="display: inline;" onsubmit="return confirm('Are you sure you want to delete this message?');">
                                    <input type="hidden" name="action" value="delete">
                                    <input type="hidden" name="id" value="<?php echo $msg['id']; ?>">
                                    <button type="submit" class="btn btn-sm btn-danger" title="Delete"><i class="fas fa-trash"></i></button>
                                </form>
                            </td>
                        </tr>
                        <?php endwhile; ?>
                        <?php else: ?>
                        <tr>
                            <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                                <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 15px; display: block; opacity: 0.3;"></i>
                                No contact messages yet
                            </td>
                        </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
                </div>
            </div>
        </main>
    </div>

    <style>
        .btn-sm { padding: 5px 10px; font-size: 12px; }
        .btn-success { background: #28a745; color: white; }
        .btn-success:hover { background: #218838; }
    </style>
</body>
</html>
