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
    
    if ($action === 'add') {
        $name = sanitize($_POST['name']);
        $mobile = sanitize($_POST['mobile']);
        $address = sanitize($_POST['address']);
        
        // Check if mobile exists
        $check = $conn->prepare("SELECT id FROM masons WHERE mobile = ?");
        $check->bind_param("s", $mobile);
        $check->execute();
        if ($check->get_result()->num_rows > 0) {
            setMessage('danger', 'Mobile number already exists');
        } else {
            // Create user account with default password
            $defaultPassword = password_hash('12345', PASSWORD_DEFAULT);
            $stmt = $conn->prepare("INSERT INTO users (name, mobile, password, role, address) VALUES (?, ?, ?, 'mason', ?)");
            $stmt->bind_param("ssss", $name, $mobile, $defaultPassword, $address);
            $stmt->execute();
            $userId = $conn->insert_id;
            
            // Create mason record
            $stmt = $conn->prepare("INSERT INTO masons (user_id, name, mobile, address) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("isss", $userId, $name, $mobile, $address);
            if ($stmt->execute()) {
                setMessage('success', 'Mason added successfully');
            } else {
                setMessage('danger', 'Error adding mason');
            }
        }
        redirect('masons.php');
    }
    
    if ($action === 'edit') {
        $id = (int)$_POST['id'];
        $name = sanitize($_POST['name']);
        $mobile = sanitize($_POST['mobile']);
        $address = sanitize($_POST['address']);
        $status = sanitize($_POST['status']);
        
        $stmt = $conn->prepare("UPDATE masons SET name = ?, mobile = ?, address = ?, status = ? WHERE id = ?");
        $stmt->bind_param("ssssi", $name, $mobile, $address, $status, $id);
        if ($stmt->execute()) {
            // Update user account too
            $stmt2 = $conn->prepare("UPDATE users SET name = ?, mobile = ?, address = ?, status = ? WHERE id = (SELECT user_id FROM masons WHERE id = ?)");
            $stmt2->bind_param("ssssi", $name, $mobile, $address, $status, $id);
            $stmt2->execute();
            setMessage('success', 'Mason updated successfully');
        } else {
            setMessage('danger', 'Error updating mason');
        }
        redirect('masons.php');
    }
    
    if ($action === 'delete') {
        $id = (int)$_POST['id'];
        $stmt = $conn->prepare("DELETE FROM masons WHERE id = ?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            setMessage('success', 'Mason deleted successfully');
        }
        redirect('masons.php');
    }
    
    if ($action === 'import') {
        if (isset($_FILES['excel_file']) && $_FILES['excel_file']['error'] === 0) {
            $file = $_FILES['excel_file']['tmp_name'];
            $handle = fopen($file, 'r');
            $header = fgetcsv($handle); // Skip header row
            $imported = 0;
            $defaultPassword = password_hash('12345', PASSWORD_DEFAULT);
            
            while (($data = fgetcsv($handle)) !== FALSE) {
                if (count($data) >= 3) {
                    $name = sanitize($data[0]);
                    $mobile = sanitize($data[1]);
                    $address = sanitize($data[2] ?? '');
                    
                    // Check if mobile exists
                    $check = $conn->prepare("SELECT id FROM masons WHERE mobile = ?");
                    $check->bind_param("s", $mobile);
                    $check->execute();
                    if ($check->get_result()->num_rows === 0) {
                        // Create user
                        $stmt = $conn->prepare("INSERT INTO users (name, mobile, password, role, address) VALUES (?, ?, ?, 'mason', ?)");
                        $stmt->bind_param("ssss", $name, $mobile, $defaultPassword, $address);
                        $stmt->execute();
                        $userId = $conn->insert_id;
                        
                        // Create mason
                        $stmt = $conn->prepare("INSERT INTO masons (user_id, name, mobile, address) VALUES (?, ?, ?, ?)");
                        $stmt->bind_param("isss", $userId, $name, $mobile, $address);
                        $stmt->execute();
                        $imported++;
                    }
                }
            }
            fclose($handle);
            setMessage('success', "$imported masons imported successfully");
        } else {
            setMessage('danger', 'Error uploading file');
        }
        redirect('masons.php');
    }
    
    if ($action === 'reset_password') {
        $id = (int)$_POST['id'];
        $defaultPassword = password_hash('12345', PASSWORD_DEFAULT);
        $stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = (SELECT user_id FROM masons WHERE id = ?)");
        $stmt->bind_param("si", $defaultPassword, $id);
        if ($stmt->execute()) {
            setMessage('success', 'Password reset to 12345');
        }
        redirect('masons.php');
    }
}

// Search
$search = sanitize($_GET['search'] ?? '');
$where = "";
if ($search) {
    $where = "WHERE name LIKE '%$search%' OR mobile LIKE '%$search%' OR address LIKE '%$search%'";
}

$masons = $conn->query("SELECT * FROM masons $where ORDER BY created_at DESC");
$logo = getSetting('logo', '');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mason List - JP Tiles Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'sidebar.php'; ?>

        <main class="admin-content">
            <div class="admin-header">
                <h1>Mason List</h1>
                <div>
                    <button onclick="document.getElementById('importModal').classList.add('active')" class="btn btn-outline">
                        <i class="fas fa-file-excel"></i> Import Excel
                    </button>
                    <button onclick="document.getElementById('addModal').classList.add('active')" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Add Mason
                    </button>
                </div>
            </div>

            <?php if ($message): ?>
            <div class="alert alert-<?php echo $message['type']; ?>">
                <?php echo $message['text']; ?>
            </div>
            <?php endif; ?>

            <!-- Search -->
            <div class="admin-card">
                <form method="GET" style="display: flex; gap: 10px;">
                    <input type="text" name="search" placeholder="Search by name, mobile or address..." value="<?php echo $search; ?>" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    <button type="submit" class="btn btn-primary"><i class="fas fa-search"></i> Search</button>
                    <?php if ($search): ?>
                    <a href="masons.php" class="btn btn-outline">Clear</a>
                    <?php endif; ?>
                </form>
            </div>

            <!-- Mason List -->
            <div class="admin-card">
                <h3>All Masons (<?php echo $masons->num_rows; ?>)</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Mobile</th>
                            <th>Address</th>
                            <th>Visits</th>
                            <th>Total Amount</th>
                            <th>Rewards</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while($mason = $masons->fetch_assoc()): ?>
                        <tr>
                            <td><strong><?php echo $mason['name']; ?></strong></td>
                            <td><?php echo $mason['mobile']; ?></td>
                            <td><?php echo $mason['address']; ?></td>
                            <td><?php echo $mason['total_visits']; ?></td>
                            <td><?php echo formatCurrency($mason['total_amount']); ?></td>
                            <td><span class="badge badge-success"><?php echo formatCurrency($mason['total_rewards']); ?></span></td>
                            <td>
                                <span class="badge badge-<?php echo $mason['status'] === 'active' ? 'success' : 'danger'; ?>">
                                    <?php echo ucfirst($mason['status']); ?>
                                </span>
                            </td>
                            <td>
                                <div class="action-btns">
                                    <a href="mason-detail.php?id=<?php echo $mason['id']; ?>" class="action-btn edit" title="View Details">
                                        <i class="fas fa-eye"></i>
                                    </a>
                                    <button onclick="editMason(<?php echo htmlspecialchars(json_encode($mason)); ?>)" class="action-btn edit" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <form method="POST" style="display: inline;" onsubmit="return confirm('Reset password to 12345?')">
                                        <input type="hidden" name="action" value="reset_password">
                                        <input type="hidden" name="id" value="<?php echo $mason['id']; ?>">
                                        <button type="submit" class="action-btn edit" title="Reset Password">
                                            <i class="fas fa-key"></i>
                                        </button>
                                    </form>
                                    <form method="POST" style="display: inline;" onsubmit="return confirm('Are you sure?')">
                                        <input type="hidden" name="action" value="delete">
                                        <input type="hidden" name="id" value="<?php echo $mason['id']; ?>">
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

    <!-- Add Modal -->
    <div id="addModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Add New Mason</h3>
                <button class="close-modal" onclick="document.getElementById('addModal').classList.remove('active')">&times;</button>
            </div>
            <form method="POST">
                <div class="modal-body">
                    <input type="hidden" name="action" value="add">
                    <div class="form-group">
                        <label>Name *</label>
                        <input type="text" name="name" required>
                    </div>
                    <div class="form-group">
                        <label>Mobile Number *</label>
                        <input type="text" name="mobile" required pattern="[0-9]{10}" title="Enter 10 digit mobile number">
                    </div>
                    <div class="form-group">
                        <label>Address</label>
                        <textarea name="address" rows="3"></textarea>
                    </div>
                    <p style="color: #666; font-size: 14px;"><i class="fas fa-info-circle"></i> Default password will be: 12345</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('addModal').classList.remove('active')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Mason</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Edit Modal -->
    <div id="editModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Edit Mason</h3>
                <button class="close-modal" onclick="document.getElementById('editModal').classList.remove('active')">&times;</button>
            </div>
            <form method="POST">
                <div class="modal-body">
                    <input type="hidden" name="action" value="edit">
                    <input type="hidden" name="id" id="edit_id">
                    <div class="form-group">
                        <label>Name *</label>
                        <input type="text" name="name" id="edit_name" required>
                    </div>
                    <div class="form-group">
                        <label>Mobile Number *</label>
                        <input type="text" name="mobile" id="edit_mobile" required>
                    </div>
                    <div class="form-group">
                        <label>Address</label>
                        <textarea name="address" id="edit_address" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select name="status" id="edit_status">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('editModal').classList.remove('active')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Mason</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Import Modal -->
    <div id="importModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Import Masons from Excel/CSV</h3>
                <button class="close-modal" onclick="document.getElementById('importModal').classList.remove('active')">&times;</button>
            </div>
            <form method="POST" enctype="multipart/form-data">
                <div class="modal-body">
                    <input type="hidden" name="action" value="import">
                    <div class="form-group">
                        <label>Select CSV File *</label>
                        <input type="file" name="excel_file" accept=".csv" required>
                    </div>
                    <p style="color: #666; font-size: 14px;">
                        <i class="fas fa-info-circle"></i> CSV format: Name, Mobile, Address (first row as header)<br>
                        <a href="sample-mason.csv" download>Download Sample CSV</a>
                    </p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('importModal').classList.remove('active')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Import</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        function editMason(mason) {
            document.getElementById('edit_id').value = mason.id;
            document.getElementById('edit_name').value = mason.name;
            document.getElementById('edit_mobile').value = mason.mobile;
            document.getElementById('edit_address').value = mason.address;
            document.getElementById('edit_status').value = mason.status;
            document.getElementById('editModal').classList.add('active');
        }
    </script>
</body>
</html>
<?php $conn->close(); ?>
