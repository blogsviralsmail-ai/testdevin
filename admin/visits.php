<?php
require_once '../includes/config.php';

if (!isLoggedIn() || !isAdminOrEmployee()) {
    redirect('login.php');
}

if (!hasPermission('add_visit')) {
    setMessage('danger', 'Access denied');
    redirect('index.php');
}

$conn = getDBConnection();
$message = getMessage();

// Handle form submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
        if ($action === 'add') {
            $mobile = sanitize($_POST['mobile']);
            $visit_date = sanitize($_POST['visit_date']);
            $visit_time = sanitize($_POST['visit_time']);
            $items = sanitize($_POST['items_description']);
            $rewards = (float)$_POST['rewards'];
            $notes = sanitize($_POST['notes']);
        
            // Find customer by mobile
            $stmt = $conn->prepare("SELECT id FROM masons WHERE mobile = ?");
            $stmt->bind_param("s", $mobile);
            $stmt->execute();
            $result = $stmt->get_result();
        
            if ($customer = $result->fetch_assoc()) {
                $mason_id = $customer['id'];
                $created_by = $_SESSION['user_id'];
            
                // Insert visit (no amount field)
                $stmt = $conn->prepare("INSERT INTO mason_visits (mason_id, visit_date, visit_time, items_description, rewards, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt->bind_param("isssdsi", $mason_id, $visit_date, $visit_time, $items, $rewards, $notes, $created_by);
            
                if ($stmt->execute()) {
                    // Update customer totals (no amount)
                    $conn->query("UPDATE masons SET total_visits = total_visits + 1, total_rewards = total_rewards + $rewards WHERE id = $mason_id");
                    setMessage('success', 'Visit entry added successfully');
                } else {
                    setMessage('danger', 'Error adding visit entry');
                }
            } else {
                setMessage('danger', 'Customer not found with this mobile number');
            }
            redirect('visits.php');
        }
    
                if ($action === 'delete') {
                    $id = (int)$_POST['id'];
        
                    // Get visit details first
                    $visit = $conn->query("SELECT * FROM mason_visits WHERE id = $id")->fetch_assoc();
                    if ($visit) {
                        // Delete visit
                        $conn->query("DELETE FROM mason_visits WHERE id = $id");
                        // Update customer totals (no amount)
                        $conn->query("UPDATE masons SET total_visits = total_visits - 1, total_rewards = total_rewards - {$visit['rewards']} WHERE id = {$visit['mason_id']}");
                        setMessage('success', 'Visit entry deleted');
                    }
                    redirect('visits.php');
                }
        
                if ($action === 'bulk_delete') {
                    $ids = $_POST['visit_ids'] ?? [];
                    if (!empty($ids)) {
                        $deleted = 0;
                        foreach ($ids as $id) {
                            $id = (int)$id;
                            $visit = $conn->query("SELECT * FROM mason_visits WHERE id = $id")->fetch_assoc();
                            if ($visit) {
                                $conn->query("DELETE FROM mason_visits WHERE id = $id");
                                $conn->query("UPDATE masons SET total_visits = total_visits - 1, total_rewards = total_rewards - {$visit['rewards']} WHERE id = {$visit['mason_id']}");
                                $deleted++;
                            }
                        }
                        setMessage('success', "$deleted visit entries deleted successfully");
                    } else {
                        setMessage('danger', 'No visits selected');
                    }
                    redirect('visits.php');
                }
}

// Filters
$search = sanitize($_GET['search'] ?? '');
$date_from = sanitize($_GET['date_from'] ?? '');
$date_to = sanitize($_GET['date_to'] ?? '');

$where = "1=1";
if ($search) {
    $where .= " AND (m.name LIKE '%$search%' OR m.mobile LIKE '%$search%')";
}
if ($date_from) {
    $where .= " AND mv.visit_date >= '$date_from'";
}
if ($date_to) {
    $where .= " AND mv.visit_date <= '$date_to'";
}

$visits = $conn->query("SELECT mv.*, m.name as mason_name, m.mobile as mason_mobile 
                        FROM mason_visits mv 
                        JOIN masons m ON mv.mason_id = m.id 
                        WHERE $where
                        ORDER BY mv.visit_date DESC, mv.visit_time DESC");

$logo = getSetting('logo', '');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visit Entries - JP Tiles Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'sidebar.php'; ?>

        <main class="admin-content">
            <div class="admin-header">
                <h1>Visit Entries</h1>
                <button onclick="document.getElementById('addModal').classList.add('active')" class="btn btn-primary">
                    <i class="fas fa-plus"></i> New Entry
                </button>
            </div>

            <?php if ($message): ?>
            <div class="alert alert-<?php echo $message['type']; ?>">
                <?php echo $message['text']; ?>
            </div>
            <?php endif; ?>

            <?php if (hasPermission('view_customers')): ?>
            <!-- Filters -->
            <div class="admin-card">
                <form method="GET" style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <input type="text" name="search" placeholder="Search mason name or mobile..." value="<?php echo $search; ?>" style="flex: 1; min-width: 200px; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    <input type="date" name="date_from" value="<?php echo $date_from; ?>" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    <input type="date" name="date_to" value="<?php echo $date_to; ?>" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    <button type="submit" class="btn btn-primary"><i class="fas fa-filter"></i> Filter</button>
                    <a href="visits.php" class="btn btn-outline">Clear</a>
                </form>
            </div>

                        <!-- Visits List -->
                        <div class="admin-card">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <h3>All Entries (<?php echo $visits->num_rows; ?>)</h3>
                                <button type="button" id="bulkDeleteBtn" class="btn btn-danger" style="display: none;" onclick="bulkDelete()">
                                    <i class="fas fa-trash"></i> Delete Selected (<span id="selectedCount">0</span>)
                                </button>
                            </div>
                            <form id="bulkDeleteForm" method="POST">
                                <input type="hidden" name="action" value="bulk_delete">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th style="width: 40px;"><input type="checkbox" id="selectAll" onclick="toggleSelectAll(this)"></th>
                                            <th>Customer</th>
                                            <th>Date & Time</th>
                                            <th>Items</th>
                                            <th>Rewards</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php while($visit = $visits->fetch_assoc()): ?>
                                        <tr>
                                            <td><input type="checkbox" name="visit_ids[]" value="<?php echo $visit['id']; ?>" class="visit-checkbox" onclick="updateSelectedCount()"></td>
                                            <td>
                                                <strong><?php echo $visit['mason_name']; ?></strong><br>
                                                <small><?php echo $visit['mason_mobile']; ?></small>
                                            </td>
                                            <td>
                                                <?php echo formatDate($visit['visit_date']); ?><br>
                                                <small><?php echo date('h:i A', strtotime($visit['visit_time'])); ?></small>
                                            </td>
                                            <td><?php echo $visit['items_description']; ?></td>
                                            <td><span class="badge badge-success"><?php echo $visit['rewards']; ?></span></td>
                                            <td>
                                                <button type="button" class="action-btn delete" title="Delete" onclick="deleteSingle(<?php echo $visit['id']; ?>)">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                        <?php endwhile; ?>
                                    </tbody>
                                </table>
                            </form>
                        </div>
            
                        <!-- Single Delete Form -->
                        <form id="singleDeleteForm" method="POST" style="display: none;">
                            <input type="hidden" name="action" value="delete">
                            <input type="hidden" name="id" id="deleteId">
                        </form>
            <?php else: ?>
            <div class="admin-card">
                <p style="text-align: center; padding: 40px; color: #666;"><i class="fas fa-clipboard-list" style="font-size: 40px; margin-bottom: 15px; display: block;"></i>You have permission to add visits only. Use the "New Entry" button above to add new visit entries.</p>
            </div>
            <?php endif; ?>
        </main>
    </div>

    <!-- Add Modal -->
    <div id="addModal" class="modal">
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3>New Visit Entry</h3>
                <button class="close-modal" onclick="document.getElementById('addModal').classList.remove('active')">&times;</button>
            </div>
            <form method="POST">
                <div class="modal-body">
                    <input type="hidden" name="action" value="add">
                    
                                        <div class="form-group">
                                            <label>Customer Mobile Number *</label>
                                            <input type="text" name="mobile" id="mason_mobile" required placeholder="Enter customer mobile number" onblur="searchMason(this.value)">
                                            <div id="mason_info" style="margin-top: 5px; padding: 10px; background: #f5f5f5; border-radius: 5px; display: none;"></div>
                                        </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="form-group">
                            <label>Visit Date *</label>
                            <input type="date" name="visit_date" value="<?php echo date('Y-m-d'); ?>" required>
                        </div>
                        <div class="form-group">
                            <label>Visit Time *</label>
                            <input type="time" name="visit_time" value="<?php echo date('H:i'); ?>" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Items Description *</label>
                        <textarea name="items_description" rows="3" required placeholder="Enter items purchased..."></textarea>
                    </div>
                    
                                        <div class="form-group">
                                                <label>Rewards *</label>
                                                <input type="number" name="rewards" step="0.01" required placeholder="0.00">
                                            </div>
                    
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea name="notes" rows="2" placeholder="Any additional notes..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('addModal').classList.remove('active')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Entry</button>
                </div>
            </form>
        </div>
    </div>

        <script>
            function searchMason(mobile) {
                if (mobile.length >= 10) {
                    fetch('ajax/search-mason.php?mobile=' + mobile)
                        .then(response => response.json())
                        .then(data => {
                            const infoDiv = document.getElementById('mason_info');
                            if (data.success) {
                                infoDiv.innerHTML = '<strong>' + data.mason.name + '</strong><br>' +
                                    'Address: ' + data.mason.address + '<br>' +
                                    'Total Visits: ' + data.mason.total_visits + ' | ' +
                                    'Total Rewards: ' + data.mason.total_rewards;
                                infoDiv.style.display = 'block';
                                infoDiv.style.background = '#e8f5e9';
                            } else {
                                infoDiv.innerHTML = '<span style="color: red;">Mason not found</span>';
                                infoDiv.style.display = 'block';
                                infoDiv.style.background = '#ffebee';
                            }
                        });
                }
            }
        
            function toggleSelectAll(checkbox) {
                const checkboxes = document.querySelectorAll('.visit-checkbox');
                checkboxes.forEach(cb => cb.checked = checkbox.checked);
                updateSelectedCount();
            }
        
            function updateSelectedCount() {
                const checkboxes = document.querySelectorAll('.visit-checkbox:checked');
                const count = checkboxes.length;
                document.getElementById('selectedCount').textContent = count;
                document.getElementById('bulkDeleteBtn').style.display = count > 0 ? 'inline-block' : 'none';
            
                // Update select all checkbox state
                const allCheckboxes = document.querySelectorAll('.visit-checkbox');
                const selectAll = document.getElementById('selectAll');
                if (allCheckboxes.length > 0) {
                    selectAll.checked = checkboxes.length === allCheckboxes.length;
                    selectAll.indeterminate = checkboxes.length > 0 && checkboxes.length < allCheckboxes.length;
                }
            }
        
            function bulkDelete() {
                const count = document.querySelectorAll('.visit-checkbox:checked').length;
                if (confirm('Are you sure you want to delete ' + count + ' selected visit(s)?')) {
                    document.getElementById('bulkDeleteForm').submit();
                }
            }
        
            function deleteSingle(id) {
                if (confirm('Are you sure you want to delete this visit?')) {
                    document.getElementById('deleteId').value = id;
                    document.getElementById('singleDeleteForm').submit();
                }
            }
        </script>
</body>
</html>
<?php $conn->close(); ?>
