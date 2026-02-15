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
        
        $conn->query("UPDATE enquiries SET status = '$status' WHERE id = $id");
        setMessage('success', 'Status updated');
        redirect('enquiries.php');
    }
    
    if ($action === 'delete') {
        $id = (int)$_POST['id'];
        $conn->query("DELETE FROM enquiries WHERE id = $id");
        setMessage('success', 'Enquiry deleted');
        redirect('enquiries.php');
    }
}

// Filter
$status_filter = sanitize($_GET['status'] ?? '');
$where = "1=1";
if ($status_filter) {
    $where .= " AND status = '$status_filter'";
}

$enquiries = $conn->query("SELECT * FROM enquiries WHERE $where ORDER BY created_at DESC");
$logo = getSetting('logo', '');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enquiries - JP Tiles Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'sidebar.php'; ?>

        <main class="admin-content">
            <div class="admin-header">
                <h1>Enquiries</h1>
            </div>

            <?php if ($message): ?>
            <div class="alert alert-<?php echo $message['type']; ?>">
                <?php echo $message['text']; ?>
            </div>
            <?php endif; ?>

            <!-- Filters -->
            <div class="admin-card">
                <form method="GET" style="display: flex; gap: 10px;">
                    <select name="status" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                        <option value="">All Status</option>
                        <option value="new" <?php echo $status_filter === 'new' ? 'selected' : ''; ?>>New</option>
                        <option value="contacted" <?php echo $status_filter === 'contacted' ? 'selected' : ''; ?>>Contacted</option>
                        <option value="closed" <?php echo $status_filter === 'closed' ? 'selected' : ''; ?>>Closed</option>
                    </select>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-filter"></i> Filter</button>
                    <a href="enquiries.php" class="btn btn-outline">Clear</a>
                </form>
            </div>

            <!-- Enquiries List -->
            <div class="admin-card">
                <h3>All Enquiries (<?php echo $enquiries->num_rows; ?>)</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Contact</th>
                            <th>Subject</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while($enq = $enquiries->fetch_assoc()): ?>
                        <tr>
                            <td><strong><?php echo $enq['name']; ?></strong></td>
                            <td>
                                <?php echo $enq['email']; ?><br>
                                <small><?php echo $enq['phone']; ?></small>
                            </td>
                            <td>
                                <?php echo $enq['subject'] ?: 'General Enquiry'; ?><br>
                                <small style="color: #666;"><?php echo substr($enq['message'], 0, 50); ?>...</small>
                            </td>
                            <td><?php echo formatDate($enq['created_at']); ?></td>
                            <td>
                                <form method="POST" style="display: inline;">
                                    <input type="hidden" name="action" value="update_status">
                                    <input type="hidden" name="id" value="<?php echo $enq['id']; ?>">
                                    <select name="status" onchange="this.form.submit()" style="padding: 5px; border-radius: 5px; border: 1px solid #ddd;">
                                        <option value="new" <?php echo $enq['status'] === 'new' ? 'selected' : ''; ?>>New</option>
                                        <option value="contacted" <?php echo $enq['status'] === 'contacted' ? 'selected' : ''; ?>>Contacted</option>
                                        <option value="closed" <?php echo $enq['status'] === 'closed' ? 'selected' : ''; ?>>Closed</option>
                                    </select>
                                </form>
                            </td>
                            <td>
                                <div class="action-btns">
                                    <button onclick="viewEnquiry(<?php echo htmlspecialchars(json_encode($enq)); ?>)" class="action-btn edit" title="View">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <form method="POST" style="display: inline;" onsubmit="return confirm('Are you sure?')">
                                        <input type="hidden" name="action" value="delete">
                                        <input type="hidden" name="id" value="<?php echo $enq['id']; ?>">
                                        <button type="submit" class="action-btn delete" title="Delete">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
            </div>
        </main>
    </div>

    <!-- View Modal -->
    <div id="viewModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Enquiry Details</h3>
                <button class="close-modal" onclick="document.getElementById('viewModal').classList.remove('active')">&times;</button>
            </div>
            <div class="modal-body">
                <p><strong>Name:</strong> <span id="view_name"></span></p>
                <p><strong>Email:</strong> <span id="view_email"></span></p>
                <p><strong>Phone:</strong> <span id="view_phone"></span></p>
                <p><strong>Subject:</strong> <span id="view_subject"></span></p>
                <p><strong>Message:</strong></p>
                <div id="view_message" style="background: #f5f5f5; padding: 15px; border-radius: 5px;"></div>
                <p style="margin-top: 15px;"><strong>Date:</strong> <span id="view_date"></span></p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline" onclick="document.getElementById('viewModal').classList.remove('active')">Close</button>
            </div>
        </div>
    </div>

    <script>
        function viewEnquiry(enq) {
            document.getElementById('view_name').textContent = enq.name;
            document.getElementById('view_email').textContent = enq.email;
            document.getElementById('view_phone').textContent = enq.phone || 'N/A';
            document.getElementById('view_subject').textContent = enq.subject || 'General Enquiry';
            document.getElementById('view_message').textContent = enq.message;
            document.getElementById('view_date').textContent = enq.created_at;
            document.getElementById('viewModal').classList.add('active');
        }
    </script>
</body>
</html>
<?php $conn->close(); ?>
