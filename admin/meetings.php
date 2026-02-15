<?php
require_once '../includes/config.php';

if (!isLoggedIn() || !isAdminOrEmployee()) {
    redirect('login.php');
}

if (!hasPermission('manage_meetings')) {
    setMessage('danger', 'Access denied');
    redirect('index.php');
}

$conn = getDBConnection();
$message = getMessage();
$categories = getCustomerCategories();

// Get all customers for selection
$allCustomers = $conn->query("SELECT m.*, cc.name as category_name FROM masons m LEFT JOIN customer_categories cc ON m.category_id = cc.id WHERE m.status = 'active' ORDER BY cc.name, m.name");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['add_meeting'])) {
        $title = sanitize($_POST['title']);
        $description = sanitize($_POST['description']);
        $meeting_date = sanitize($_POST['meeting_date']);
        $meeting_time = sanitize($_POST['meeting_time']);
        $venue = sanitize($_POST['venue']);
        $created_by = $_SESSION['user_id'];
        
        $stmt = $conn->prepare("INSERT INTO meetings (title, description, meeting_date, meeting_time, venue, created_by) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sssssi", $title, $description, $meeting_date, $meeting_time, $venue, $created_by);
        if ($stmt->execute()) {
            $meeting_id = $conn->insert_id;
            
            // Invite selected customers (individual selection)
            if (isset($_POST['invite_customers']) && is_array($_POST['invite_customers'])) {
                foreach ($_POST['invite_customers'] as $cust_id) {
                    $cust_id = (int)$cust_id;
                    $conn->query("INSERT IGNORE INTO meeting_invites (meeting_id, customer_id) VALUES ($meeting_id, $cust_id)");
                }
            }
            
            setMessage('success', 'Meeting created with ' . count($_POST['invite_customers'] ?? []) . ' invites');
        }
        redirect('meetings.php');
    }
    
    if (isset($_POST['delete_meeting'])) {
        $id = (int)$_POST['id'];
        $conn->query("DELETE FROM meeting_invites WHERE meeting_id = $id");
        $conn->query("DELETE FROM meetings WHERE id = $id");
        setMessage('success', 'Meeting deleted');
        redirect('meetings.php');
    }
    
    if (isset($_POST['mark_attendance'])) {
        $meeting_id = (int)$_POST['meeting_id'];
        $customer_id = (int)$_POST['customer_id'];
        $conn->query("UPDATE meeting_invites SET attended = 1, attendance_time = NOW() WHERE meeting_id = $meeting_id AND customer_id = $customer_id");
        setMessage('success', 'Attendance marked');
        redirect("meetings.php?view=$meeting_id");
    }
    
    if (isset($_POST['add_attendee'])) {
        $meeting_id = (int)$_POST['meeting_id'];
        $mobile = sanitize($_POST['mobile']);
        
        $customer = $conn->query("SELECT id FROM masons WHERE mobile = '$mobile'")->fetch_assoc();
        if ($customer) {
            $conn->query("INSERT IGNORE INTO meeting_invites (meeting_id, customer_id, attended, attendance_time) VALUES ($meeting_id, {$customer['id']}, 1, NOW())");
            setMessage('success', 'Attendee added');
        } else {
            setMessage('danger', 'Customer not found');
        }
        redirect("meetings.php?view=$meeting_id");
    }
    
    // Send email invites to selected customers
    if (isset($_POST['send_email_invites'])) {
        $meeting_id = (int)$_POST['meeting_id'];
        $meeting = $conn->query("SELECT * FROM meetings WHERE id = $meeting_id")->fetch_assoc();
        
        if ($meeting) {
            // Get SMTP settings
            $settings = $conn->query("SELECT * FROM settings WHERE setting_key IN ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'sender_email', 'sender_name')")->fetch_all(MYSQLI_ASSOC);
            $smtp = [];
            foreach ($settings as $s) {
                $smtp[$s['setting_key']] = $s['setting_value'];
            }
            
            $sent_count = 0;
            $failed_count = 0;
            
            // Get customers to email (those with email addresses who haven't been emailed yet)
            $customers_to_email = $conn->query("SELECT m.id, m.name, m.email, mi.id as invite_id 
                                                 FROM meeting_invites mi 
                                                 JOIN masons m ON mi.customer_id = m.id 
                                                 WHERE mi.meeting_id = $meeting_id 
                                                 AND m.email IS NOT NULL AND m.email != '' 
                                                 AND (mi.email_sent IS NULL OR mi.email_sent = 0)");
            
            while ($cust = $customers_to_email->fetch_assoc()) {
                // Send email
                $to = $cust['email'];
                $subject = "Meeting Invitation: " . $meeting['title'];
                $message_body = "
                <html>
                <head><title>Meeting Invitation</title></head>
                <body style='font-family: Arial, sans-serif; padding: 20px;'>
                    <div style='max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;'>
                        <h2 style='color: #c9a227; margin-bottom: 20px;'>JP Tiles - Meeting Invitation</h2>
                        <p>Dear <strong>{$cust['name']}</strong>,</p>
                        <p>You are cordially invited to attend the following meeting:</p>
                        <div style='background: #fff; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #c9a227;'>
                            <h3 style='margin: 0 0 10px 0; color: #333;'>{$meeting['title']}</h3>
                            <p style='margin: 5px 0;'><strong>Date:</strong> " . date('d M Y', strtotime($meeting['meeting_date'])) . "</p>
                            <p style='margin: 5px 0;'><strong>Time:</strong> " . date('h:i A', strtotime($meeting['meeting_time'])) . "</p>
                            <p style='margin: 5px 0;'><strong>Venue:</strong> {$meeting['venue']}</p>
                            " . ($meeting['description'] ? "<p style='margin: 10px 0 0 0; color: #666;'>{$meeting['description']}</p>" : "") . "
                        </div>
                        <p>We look forward to seeing you there!</p>
                        <p style='margin-top: 30px; color: #666;'>Best Regards,<br><strong>JP Tiles Team</strong></p>
                    </div>
                </body>
                </html>";
                
                $headers = "MIME-Version: 1.0\r\n";
                $headers .= "Content-type: text/html; charset=UTF-8\r\n";
                $headers .= "From: " . ($smtp['sender_name'] ?? 'JP Tiles') . " <" . ($smtp['sender_email'] ?? 'noreply@jptiles.in') . ">\r\n";
                
                if (@mail($to, $subject, $message_body, $headers)) {
                    $conn->query("UPDATE meeting_invites SET email_sent = 1, email_sent_at = NOW() WHERE id = {$cust['invite_id']}");
                    $sent_count++;
                } else {
                    $failed_count++;
                }
            }
            
            if ($sent_count > 0) {
                setMessage('success', "Email invites sent to $sent_count customers" . ($failed_count > 0 ? " ($failed_count failed)" : ""));
            } else if ($failed_count > 0) {
                setMessage('danger', "Failed to send emails to $failed_count customers");
            } else {
                setMessage('warning', 'No customers with email addresses to send invites to, or all have already been sent');
            }
        }
        redirect("meetings.php?view=$meeting_id");
    }
}

$view_id = (int)($_GET['view'] ?? 0);
$meetings = $conn->query("SELECT m.*, u.name as created_by_name, 
                          (SELECT COUNT(*) FROM meeting_invites WHERE meeting_id = m.id) as invited_count,
                          (SELECT COUNT(*) FROM meeting_invites WHERE meeting_id = m.id AND attended = 1) as attended_count
                          FROM meetings m 
                          LEFT JOIN users u ON m.created_by = u.id 
                          ORDER BY m.meeting_date DESC");
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meetings - JP Tiles Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'sidebar.php'; ?>
        <main class="admin-content">
            <div class="admin-header">
                <h1><i class="fas fa-calendar-alt"></i> Meetings</h1>
                <button onclick="document.getElementById('addModal').classList.add('active')" class="btn btn-primary"><i class="fas fa-plus"></i> New Meeting</button>
            </div>

            <?php if ($message): ?><div class="alert alert-<?php echo $message['type']; ?>"><?php echo $message['text']; ?></div><?php endif; ?>

            <?php if ($view_id): 
                $meeting = $conn->query("SELECT * FROM meetings WHERE id = $view_id")->fetch_assoc();
                                $invites = $conn->query("SELECT mi.*, m.name, m.mobile, m.email, cc.name as category_name 
                                                         FROM meeting_invites mi 
                                                         JOIN masons m ON mi.customer_id = m.id 
                                                         LEFT JOIN customer_categories cc ON m.category_id = cc.id 
                                                         WHERE mi.meeting_id = $view_id 
                                                         ORDER BY mi.attended DESC, m.name");
            ?>
            <div class="admin-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div>
                        <h2><?php echo $meeting['title']; ?></h2>
                        <p style="color: #666;"><?php echo formatDate($meeting['meeting_date']); ?> at <?php echo date('h:i A', strtotime($meeting['meeting_time'])); ?> | <?php echo $meeting['venue']; ?></p>
                    </div>
                    <a href="meetings.php" class="btn btn-outline"><i class="fas fa-arrow-left"></i> Back</a>
                </div>
                
                                <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                                    <form method="POST" style="display: flex; gap: 10px; flex: 1;">
                                        <input type="hidden" name="meeting_id" value="<?php echo $view_id; ?>">
                                        <input type="text" name="mobile" placeholder="Enter mobile to add attendee" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                                        <button type="submit" name="add_attendee" class="btn btn-primary"><i class="fas fa-user-plus"></i> Add</button>
                                    </form>
                                    <form method="POST" onsubmit="return confirm('Send email invites to all customers with email addresses?')">
                                        <input type="hidden" name="meeting_id" value="<?php echo $view_id; ?>">
                                        <button type="submit" name="send_email_invites" class="btn btn-primary" style="background: #28a745;"><i class="fas fa-envelope"></i> Send Email Invites</button>
                                    </form>
                                </div>
                
                                <table class="data-table">
                                    <thead><tr><th>Name</th><th>Mobile</th><th>Email</th><th>Category</th><th>Email Sent</th><th>Status</th><th>Action</th></tr></thead>
                                    <tbody>
                                        <?php while($inv = $invites->fetch_assoc()): ?>
                                        <tr>
                                            <td><strong><?php echo $inv['name']; ?></strong></td>
                                            <td><?php echo $inv['mobile']; ?></td>
                                            <td><?php echo $inv['email'] ?: '-'; ?></td>
                                            <td><?php echo $inv['category_name'] ?? 'N/A'; ?></td>
                                            <td>
                                                <?php if ($inv['email_sent']): ?>
                                                <span class="badge badge-success"><i class="fas fa-check"></i> Sent</span>
                                                <?php elseif ($inv['email']): ?>
                                                <span class="badge badge-warning">Pending</span>
                                                <?php else: ?>
                                                <span class="badge badge-secondary">No Email</span>
                                                <?php endif; ?>
                                            </td>
                                            <td>
                                                <?php if ($inv['attended']): ?>
                                                <span class="badge badge-success"><i class="fas fa-check"></i> Attended</span>
                                                <?php else: ?>
                                                <span class="badge badge-warning">Invited</span>
                                                <?php endif; ?>
                                            </td>
                                            <td>
                                                <?php if (!$inv['attended']): ?>
                                                <form method="POST" style="display:inline">
                                                    <input type="hidden" name="meeting_id" value="<?php echo $view_id; ?>">
                                                    <input type="hidden" name="customer_id" value="<?php echo $inv['customer_id']; ?>">
                                                    <button type="submit" name="mark_attendance" class="btn btn-primary" style="padding: 5px 10px;"><i class="fas fa-check"></i> Mark Present</button>
                                                </form>
                                                <?php endif; ?>
                                            </td>
                                        </tr>
                                        <?php endwhile; ?>
                                    </tbody>
                                </table>
            </div>
            <?php else: ?>
            <div class="admin-card">
                <table class="data-table">
                    <thead><tr><th>Meeting</th><th>Date/Time</th><th>Venue</th><th>Invited</th><th>Attended</th><th>Actions</th></tr></thead>
                    <tbody>
                        <?php while($m = $meetings->fetch_assoc()): ?>
                        <tr>
                            <td><strong><?php echo $m['title']; ?></strong><br><small style="color: #666;"><?php echo substr($m['description'], 0, 50); ?></small></td>
                            <td><?php echo formatDate($m['meeting_date']); ?><br><small><?php echo date('h:i A', strtotime($m['meeting_time'])); ?></small></td>
                            <td><?php echo $m['venue']; ?></td>
                            <td><?php echo $m['invited_count']; ?></td>
                            <td><span class="badge badge-success"><?php echo $m['attended_count']; ?></span></td>
                            <td>
                                <div class="action-btns">
                                    <a href="?view=<?php echo $m['id']; ?>" class="action-btn edit"><i class="fas fa-eye"></i></a>
                                    <form method="POST" style="display:inline" onsubmit="return confirm('Delete?')">
                                        <input type="hidden" name="id" value="<?php echo $m['id']; ?>">
                                        <button type="submit" name="delete_meeting" class="action-btn delete"><i class="fas fa-trash"></i></button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
            </div>
            <?php endif; ?>
        </main>
    </div>

    <div id="addModal" class="modal">
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header"><h3>Create Meeting</h3><button class="close-modal" onclick="document.getElementById('addModal').classList.remove('active')">&times;</button></div>
            <form method="POST">
                <div class="modal-body">
                    <div class="form-group"><label>Title *</label><input type="text" name="title" required></div>
                    <div class="form-group"><label>Description</label><textarea name="description" rows="2"></textarea></div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="form-group"><label>Date *</label><input type="date" name="meeting_date" required></div>
                        <div class="form-group"><label>Time *</label><input type="time" name="meeting_time" required></div>
                    </div>
                    <div class="form-group"><label>Venue *</label><input type="text" name="venue" required></div>
                    
                    <div class="form-group">
                        <label>Filter by Category</label>
                        <select id="categoryFilter" onchange="filterCustomers()">
                            <option value="">All Categories</option>
                            <?php foreach ($categories as $cat): ?>
                            <option value="<?php echo $cat['id']; ?>"><?php echo $cat['name']; ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Select Customers to Invite <button type="button" onclick="selectAll()" style="font-size: 12px; padding: 2px 8px; margin-left: 10px;">Select All</button> <button type="button" onclick="deselectAll()" style="font-size: 12px; padding: 2px 8px;">Deselect All</button></label>
                        <div id="customerList" style="max-height: 250px; overflow-y: auto; border: 1px solid #ddd; border-radius: 5px; padding: 10px;">
                            <?php $allCustomers->data_seek(0); while($cust = $allCustomers->fetch_assoc()): ?>
                            <label class="customer-item" data-category="<?php echo $cust['category_id']; ?>" style="display: flex; align-items: center; padding: 8px; border-bottom: 1px solid #eee; cursor: pointer;">
                                <input type="checkbox" name="invite_customers[]" value="<?php echo $cust['id']; ?>" style="margin-right: 10px;">
                                <span><strong><?php echo $cust['name']; ?></strong> (<?php echo $cust['mobile']; ?>) - <small style="color: #666;"><?php echo $cust['category_name'] ?? 'N/A'; ?></small></span>
                            </label>
                            <?php endwhile; ?>
                        </div>
                    </div>
                </div>
                <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="document.getElementById('addModal').classList.remove('active')">Cancel</button><button type="submit" name="add_meeting" class="btn btn-primary">Create</button></div>
            </form>
        </div>
    </div>
    
    <script>
    function filterCustomers() {
        const catId = document.getElementById('categoryFilter').value;
        document.querySelectorAll('.customer-item').forEach(item => {
            if (catId === '' || item.dataset.category === catId) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    function selectAll() {
        const catId = document.getElementById('categoryFilter').value;
        document.querySelectorAll('.customer-item').forEach(item => {
            if (catId === '' || item.dataset.category === catId) {
                item.querySelector('input').checked = true;
            }
        });
    }
    
    function deselectAll() {
        document.querySelectorAll('.customer-item input').forEach(cb => cb.checked = false);
    }
    </script>
</body>
</html>
<?php $conn->close(); ?>
