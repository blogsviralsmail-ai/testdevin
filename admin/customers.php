<?php
require_once '../includes/config.php';

if (!isLoggedIn() || !isAdminOrEmployee()) {
    redirect('login.php');
}

if (!hasPermission('view_customers') && !hasPermission('add_customer')) {
    setMessage('danger', 'Access denied');
    redirect('index.php');
}

$conn = getDBConnection();
$message = getMessage();
$categories = getCustomerCategories();

// Handle form submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
        if ($action === 'add' && hasPermission('add_customer')) {
            $name = sanitize($_POST['name']);
            $mobile = sanitize($_POST['mobile']);
            $email = sanitize($_POST['email'] ?? '');
            $address = sanitize($_POST['address']);
            $category_id = (int)$_POST['category_id'];
        
            // Handle photo upload
            $photo = null;
            if (isset($_FILES['photo']) && $_FILES['photo']['error'] === 0) {
                $uploadDir = '../uploads/customers/';
                if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
                $ext = pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION);
                $photo = 'customer_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
                move_uploaded_file($_FILES['photo']['tmp_name'], $uploadDir . $photo);
            }
        
            $check = $conn->prepare("SELECT id FROM masons WHERE mobile = ?");
            $check->bind_param("s", $mobile);
            $check->execute();
            if ($check->get_result()->num_rows > 0) {
                setMessage('danger', 'Mobile number already exists');
            } else {
                $defaultPassword = password_hash('12345', PASSWORD_DEFAULT);
                $stmt = $conn->prepare("INSERT INTO users (name, mobile, email, password, role, address) VALUES (?, ?, ?, ?, 'mason', ?)");
                $stmt->bind_param("sssss", $name, $mobile, $email, $defaultPassword, $address);
                $stmt->execute();
                $userId = $conn->insert_id;
            
                $stmt = $conn->prepare("INSERT INTO masons (user_id, name, mobile, email, address, photo, category_id, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, 1)");
                $stmt->bind_param("isssssi", $userId, $name, $mobile, $email, $address, $photo, $category_id);
                if ($stmt->execute()) {
                    setMessage('success', 'Customer added successfully');
                }
            }
            redirect('customers.php');
        }
    
        if ($action === 'edit' && isAdmin()) {
            $id = (int)$_POST['id'];
            $name = sanitize($_POST['name']);
            $mobile = sanitize($_POST['mobile']);
            $email = sanitize($_POST['email'] ?? '');
            $address = sanitize($_POST['address']);
            $category_id = (int)$_POST['category_id'];
            $customer_tier = sanitize($_POST['customer_tier'] ?? 'Silver');
            $reference_by = sanitize($_POST['reference_by'] ?? 'Direct');
            $status = sanitize($_POST['status']);
            
            // Validate tier
            if (!in_array($customer_tier, ['Platinum', 'Gold', 'Silver', 'Brown'])) {
                $customer_tier = 'Silver';
            }
            if (empty($reference_by)) {
                $reference_by = 'Direct';
            }
        
            // Handle photo upload
            $photoUpdate = "";
            if (isset($_FILES['photo']) && $_FILES['photo']['error'] === 0) {
                $uploadDir = '../uploads/customers/';
                if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
                $ext = pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION);
                $photo = 'customer_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
                move_uploaded_file($_FILES['photo']['tmp_name'], $uploadDir . $photo);
                $photoUpdate = ", photo = '$photo'";
            }
        
            $stmt = $conn->prepare("UPDATE masons SET name = ?, mobile = ?, email = ?, address = ?, category_id = ?, customer_tier = ?, reference_by = ?, status = ? $photoUpdate WHERE id = ?");
            $stmt->bind_param("ssssisssi", $name, $mobile, $email, $address, $category_id, $customer_tier, $reference_by, $status, $id);
            if ($stmt->execute()) {
                $stmt2 = $conn->prepare("UPDATE users SET name = ?, mobile = ?, email = ?, address = ?, status = ? WHERE id = (SELECT user_id FROM masons WHERE id = ?)");
                $stmt2->bind_param("sssssi", $name, $mobile, $email, $address, $status, $id);
                $stmt2->execute();
                setMessage('success', 'Customer updated');
            }
            redirect('customers.php');
        }
    
    if ($action === 'delete' && isAdmin()) {
        $id = (int)$_POST['id'];
        $conn->query("DELETE FROM users WHERE id = (SELECT user_id FROM masons WHERE id = $id)");
        $conn->query("DELETE FROM masons WHERE id = $id");
        setMessage('success', 'Customer deleted');
        redirect('customers.php');
    }
    
    // Bulk delete action
    if ($action === 'bulk_delete' && isAdmin()) {
        $selectedIds = isset($_POST['selected_ids']) ? $_POST['selected_ids'] : '';
        if (!empty($selectedIds)) {
            $ids = array_map('intval', explode(',', $selectedIds));
            $idList = implode(',', $ids);
            $count = count($ids);
            
            $conn->query("DELETE FROM users WHERE id IN (SELECT user_id FROM masons WHERE id IN ($idList))");
            $conn->query("DELETE FROM masons WHERE id IN ($idList)");
            
            setMessage('success', "$count customers deleted successfully");
        } else {
            setMessage('danger', 'No customers selected');
        }
        redirect('customers.php');
    }
    
    if ($action === 'import' && hasPermission('add_customer')) {
        if (isset($_FILES['excel_file']) && $_FILES['excel_file']['error'] === 0) {
            $file = $_FILES['excel_file']['tmp_name'];
            $handle = fopen($file, 'r');
            fgetcsv($handle);
            $imported = 0;
            $defaultPassword = password_hash('12345', PASSWORD_DEFAULT);
            
            while (($data = fgetcsv($handle)) !== FALSE) {
                if (count($data) >= 3) {
                    $name = sanitize($data[0]);
                    $mobile = sanitize($data[1]);
                    $address = sanitize($data[2] ?? '');
                    $cat_name = sanitize($data[3] ?? 'Customer');
                    
                    $cat_result = $conn->query("SELECT id FROM customer_categories WHERE name = '$cat_name'");
                    $cat_id = $cat_result->num_rows > 0 ? $cat_result->fetch_assoc()['id'] : 6;
                    
                    $check = $conn->prepare("SELECT id FROM masons WHERE mobile = ?");
                    $check->bind_param("s", $mobile);
                    $check->execute();
                    if ($check->get_result()->num_rows === 0) {
                        $stmt = $conn->prepare("INSERT INTO users (name, mobile, password, role, address) VALUES (?, ?, ?, 'mason', ?)");
                        $stmt->bind_param("ssss", $name, $mobile, $defaultPassword, $address);
                        $stmt->execute();
                        $userId = $conn->insert_id;
                        
                        $stmt = $conn->prepare("INSERT INTO masons (user_id, name, mobile, address, category_id, is_verified) VALUES (?, ?, ?, ?, ?, 1)");
                        $stmt->bind_param("isssi", $userId, $name, $mobile, $address, $cat_id);
                        $stmt->execute();
                        $imported++;
                    }
                }
            }
            fclose($handle);
            setMessage('success', "$imported customers imported");
        }
        redirect('customers.php');
    }
    
    if ($action === 'reset_password' && isAdmin()) {
        $id = (int)$_POST['id'];
        $defaultPassword = password_hash('12345', PASSWORD_DEFAULT);
        $stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = (SELECT user_id FROM masons WHERE id = ?)");
        $stmt->bind_param("si", $defaultPassword, $id);
        $stmt->execute();
        setMessage('success', 'Password reset to 12345');
        redirect('customers.php');
    }
    
    if ($action === 'download') {
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="customers_' . date('Y-m-d') . '.csv"');
        $output = fopen('php://output', 'w');
        fputcsv($output, ['Name', 'Mobile', 'Address', 'Category', 'Total Visits', 'Total Rewards', 'Status']);
        
        $selectedIds = isset($_POST['selected_ids']) ? $_POST['selected_ids'] : '';
        if (!empty($selectedIds)) {
            $ids = array_map('intval', explode(',', $selectedIds));
            $idList = implode(',', $ids);
            $result = $conn->query("SELECT m.*, cc.name as category_name FROM masons m LEFT JOIN customer_categories cc ON m.category_id = cc.id WHERE m.id IN ($idList) ORDER BY m.name");
        } else {
            $result = $conn->query("SELECT m.*, cc.name as category_name FROM masons m LEFT JOIN customer_categories cc ON m.category_id = cc.id ORDER BY m.name");
        }
        
        while ($row = $result->fetch_assoc()) {
            fputcsv($output, [$row['name'], $row['mobile'], $row['address'], $row['category_name'] ?? 'N/A', $row['total_visits'], $row['total_rewards'], $row['status']]);
        }
        fclose($output);
        exit;
    }
}

$search = sanitize($_GET['search'] ?? '');
$cat_filter = (int)($_GET['category'] ?? 0);
$where = "1=1";
if ($search) $where .= " AND (m.name LIKE '%$search%' OR m.mobile LIKE '%$search%' OR m.address LIKE '%$search%')";
if ($cat_filter) $where .= " AND m.category_id = $cat_filter";

$customers = $conn->query("SELECT m.*, cc.name as category_name FROM masons m LEFT JOIN customer_categories cc ON m.category_id = cc.id WHERE $where ORDER BY m.created_at DESC");
?>
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8">
    
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customers - JP Tiles Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
    <style>
        .tier-badge { padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; display: inline-block; }
        .tier-platinum { background: linear-gradient(135deg, #E5E4E2, #A9A9A9); color: #333; }
        .tier-gold { background: linear-gradient(135deg, #FFD700, #FFA500); color: #333; }
        .tier-silver { background: linear-gradient(135deg, #C0C0C0, #A8A8A8); color: #333; }
        .tier-brown { background: linear-gradient(135deg, #8B4513, #A0522D); color: #fff; }
    </style>
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'sidebar.php'; ?>
        <main class="admin-content">
            <div class="admin-header">
                <h1>Customers</h1>
                <div>
                    <?php if (hasPermission('view_customers') && isAdmin()): ?>
                    <form method="POST" style="display:inline" id="bulkDeleteForm" onsubmit="return confirmBulkDelete()">
                        <input type="hidden" name="action" value="bulk_delete">
                        <input type="hidden" name="selected_ids" id="delete_selected_ids">
                        <button type="submit" class="btn btn-danger"><i class="fas fa-trash"></i> Delete Selected</button>
                    </form>
                    <?php endif; ?>
                    <?php if (hasPermission('view_customers')): ?>
                    <form method="POST" style="display:inline" id="downloadForm"><input type="hidden" name="action" value="download"><input type="hidden" name="selected_ids" id="selected_ids"><button type="submit" class="btn btn-outline"><i class="fas fa-download"></i> Download Selected</button></form>
                    <?php endif; ?>
                    <?php if (hasPermission('add_customer')): ?>
                    <button onclick="document.getElementById('importModal').classList.add('active')" class="btn btn-outline"><i class="fas fa-file-excel"></i> Import</button>
                    <button onclick="document.getElementById('addModal').classList.add('active')" class="btn btn-primary"><i class="fas fa-plus"></i> Add Customer</button>
                    <?php endif; ?>
                </div>
            </div>

            <?php if ($message): ?><div class="alert alert-<?php echo $message['type']; ?>"><?php echo $message['text']; ?></div><?php endif; ?>

            <?php if (hasPermission('view_customers')): ?>
            <div class="admin-card">
                <form method="GET" style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <input type="text" name="search" placeholder="Search..." value="<?php echo $search; ?>" style="flex: 1; min-width: 200px; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    <select name="category" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                        <option value="">All Categories</option>
                        <?php foreach ($categories as $cat): ?>
                        <option value="<?php echo $cat['id']; ?>" <?php echo $cat_filter == $cat['id'] ? 'selected' : ''; ?>><?php echo $cat['name']; ?></option>
                        <?php endforeach; ?>
                    </select>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-search"></i></button>
                    <a href="customers.php" class="btn btn-outline">Clear</a>
                </form>
            </div>
            <?php endif; ?>

            <?php if (hasPermission('view_customers')): ?>
            <div class="admin-card">
                <h3>All Customers (<?php echo $customers->num_rows; ?>)</h3>
                <div style="margin-bottom: 10px;">
                    <button type="button" class="btn btn-outline btn-sm" onclick="selectAllCustomers()"><i class="fas fa-check-square"></i> Select All</button>
                    <button type="button" class="btn btn-outline btn-sm" onclick="deselectAllCustomers()"><i class="fas fa-square"></i> Deselect All</button>
                    <span id="selectedCount" style="margin-left: 10px; color: #666;">0 selected</span>
                </div>
                <div style="overflow-x: auto;">
                <table class="data-table">
                    <thead>
                        <tr><th><input type="checkbox" id="selectAll" onchange="toggleAllCustomers(this)"></th><th>Photo</th><th>Name</th><th>Mobile</th><th>Email</th><th>Category</th><th>Tier</th><th>Reference</th><th>Address</th><th>Visits</th><th>Rewards</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        <?php while($c = $customers->fetch_assoc()): ?>
                        <tr>
                            <td><input type="checkbox" class="customer-checkbox" value="<?php echo $c['id']; ?>" onchange="updateSelectedCount()"></td>
                            <td>
                                <?php if ($c['photo']): ?>
                                <img src="../uploads/customers/<?php echo $c['photo']; ?>" class="customer-photo" alt="<?php echo $c['name']; ?>">
                                <?php else: ?>
                                <div class="customer-photo" style="background: #f0f0f0; display: flex; align-items: center; justify-content: center;"><i class="fas fa-user" style="color: #999;"></i></div>
                                <?php endif; ?>
                            </td>
                            <td><strong><?php echo $c['name']; ?></strong></td>
                            <td><?php echo $c['mobile']; ?></td>
                            <td><?php echo $c['email'] ?: '-'; ?></td>
                            <td><span class="badge badge-info"><?php echo $c['category_name'] ?? 'N/A'; ?></span></td>
                            <td><?php 
                                $tier = $c['customer_tier'] ?? 'Silver';
                                $tierClass = 'tier-' . strtolower($tier);
                            ?><span class="tier-badge <?php echo $tierClass; ?>"><?php echo $tier; ?></span></td>
                            <td><?php echo $c['reference_by'] ?? 'Direct'; ?></td>
                            <td><?php echo $c['address']; ?></td>
                            <td><?php echo $c['total_visits']; ?></td>
                            <td><span class="badge badge-success"><?php echo $c['total_rewards']; ?></span></td>
                            <td><span class="badge badge-<?php echo $c['status'] === 'active' ? 'success' : 'danger'; ?>"><?php echo ucfirst($c['status']); ?></span></td>
                            <td>
                                <div class="action-btns">
                                    <?php if (isAdmin()): ?>
                                    <a href="customer-detail.php?id=<?php echo $c['id']; ?>" class="action-btn edit" title="View"><i class="fas fa-eye"></i></a>
                                    <button onclick="editCustomer(<?php echo htmlspecialchars(json_encode($c)); ?>)" class="action-btn edit" title="Edit"><i class="fas fa-edit"></i></button>
                                    <form method="POST" style="display:inline" onsubmit="return confirm('Reset password?')"><input type="hidden" name="action" value="reset_password"><input type="hidden" name="id" value="<?php echo $c['id']; ?>"><button type="submit" class="action-btn edit" title="Reset Password"><i class="fas fa-key"></i></button></form>
                                    <form method="POST" style="display:inline" onsubmit="return confirm('Delete?')"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?php echo $c['id']; ?>"><button type="submit" class="action-btn delete"><i class="fas fa-trash"></i></button></form>
                                    <?php endif; ?>
                                </div>
                            </td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
                </div>
            </div>
            <?php else: ?>
            <div class="admin-card">
                <p style="text-align: center; padding: 40px; color: #666;"><i class="fas fa-user-plus" style="font-size: 40px; margin-bottom: 15px; display: block;"></i>You have permission to add customers only. Use the "Add Customer" button above to add new customers.</p>
            </div>
            <?php endif; ?>
        </main>
    </div>

    <!-- Add Modal -->
    <div id="addModal" class="modal">
        <div class="modal-content">
            <div class="modal-header"><h3>Add Customer</h3><button class="close-modal" onclick="document.getElementById('addModal').classList.remove('active')">&times;</button></div>
            <form method="POST" enctype="multipart/form-data">
                <div class="modal-body">
                    <input type="hidden" name="action" value="add">
                    <div class="form-group" style="text-align: center;">
                        <label class="photo-upload-preview" onclick="document.getElementById('add_photo').click()">
                            <i class="fas fa-camera" id="add_photo_icon"></i>
                            <img id="add_photo_preview" style="display: none;">
                        </label>
                        <input type="file" name="photo" id="add_photo" accept="image/*" style="display: none;" onchange="previewPhoto(this, 'add_photo_preview', 'add_photo_icon')">
                        <small style="color: #666;">Click to add photo</small>
                    </div>
                    <div class="form-group"><label>Name *</label><input type="text" name="name" required></div>
                    <div class="form-group"><label>Mobile *</label><input type="text" name="mobile" required pattern="[0-9]{10}"></div>
                    <div class="form-group"><label>Email</label><input type="email" name="email"></div>
                    <div class="form-group"><label>Category *</label><select name="category_id" required>
                        <?php foreach ($categories as $cat): ?><option value="<?php echo $cat['id']; ?>"><?php echo $cat['name']; ?></option><?php endforeach; ?>
                    </select></div>
                    <div class="form-group"><label>Address</label><textarea name="address" rows="2"></textarea></div>
                    <p style="color: #666; font-size: 14px;"><i class="fas fa-info-circle"></i> Default password: 12345</p>
                </div>
                <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="document.getElementById('addModal').classList.remove('active')">Cancel</button><button type="submit" class="btn btn-primary">Add</button></div>
            </form>
        </div>
    </div>

    <!-- Edit Modal -->
    <div id="editModal" class="modal">
        <div class="modal-content">
            <div class="modal-header"><h3>Edit Customer</h3><button class="close-modal" onclick="document.getElementById('editModal').classList.remove('active')">&times;</button></div>
            <form method="POST" enctype="multipart/form-data">
                <div class="modal-body">
                    <input type="hidden" name="action" value="edit">
                    <input type="hidden" name="id" id="edit_id">
                    <div class="form-group" style="text-align: center;">
                        <label class="photo-upload-preview" onclick="document.getElementById('edit_photo').click()">
                            <i class="fas fa-camera" id="edit_photo_icon"></i>
                            <img id="edit_photo_preview" style="display: none;">
                        </label>
                        <input type="file" name="photo" id="edit_photo" accept="image/*" style="display: none;" onchange="previewPhoto(this, 'edit_photo_preview', 'edit_photo_icon')">
                        <small style="color: #666;">Click to change photo</small>
                    </div>
                    <div class="form-group"><label>Name *</label><input type="text" name="name" id="edit_name" required></div>
                    <div class="form-group"><label>Mobile *</label><input type="text" name="mobile" id="edit_mobile" required></div>
                    <div class="form-group"><label>Email</label><input type="email" name="email" id="edit_email"></div>
                    <div class="form-group"><label>Category *</label><select name="category_id" id="edit_category">
                        <?php foreach ($categories as $cat): ?><option value="<?php echo $cat['id']; ?>"><?php echo $cat['name']; ?></option><?php endforeach; ?>
                    </select></div>
                    <div class="form-group"><label>Customer Tier</label><select name="customer_tier" id="edit_tier">
                        <option value="Platinum">Platinum</option>
                        <option value="Gold">Gold</option>
                        <option value="Silver" selected>Silver</option>
                        <option value="Brown">Brown</option>
                    </select></div>
                    <div class="form-group"><label>Reference By</label><input type="text" name="reference_by" id="edit_reference" placeholder="Direct"></div>
                    <div class="form-group"><label>Address</label><textarea name="address" id="edit_address" rows="2"></textarea></div>
                    <div class="form-group"><label>Status</label><select name="status" id="edit_status"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
                </div>
                <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="document.getElementById('editModal').classList.remove('active')">Cancel</button><button type="submit" class="btn btn-primary">Update</button></div>
            </form>
        </div>
    </div>

    <!-- Import Modal -->
    <div id="importModal" class="modal">
        <div class="modal-content">
            <div class="modal-header"><h3>Import Customers</h3><button class="close-modal" onclick="document.getElementById('importModal').classList.remove('active')">&times;</button></div>
            <form method="POST" enctype="multipart/form-data">
                <div class="modal-body">
                    <input type="hidden" name="action" value="import">
                    <div class="form-group"><label>CSV File *</label><input type="file" name="excel_file" accept=".csv" required></div>
                    <p style="color: #666; font-size: 14px;"><i class="fas fa-info-circle"></i> Format: Name, Mobile, Address, Category</p>
                </div>
                <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="document.getElementById('importModal').classList.remove('active')">Cancel</button><button type="submit" class="btn btn-primary">Import</button></div>
            </form>
        </div>
    </div>

    <script>
        function editCustomer(c) {
            document.getElementById('edit_id').value = c.id;
            document.getElementById('edit_name').value = c.name;
            document.getElementById('edit_mobile').value = c.mobile;
            document.getElementById('edit_email').value = c.email || '';
            document.getElementById('edit_address').value = c.address;
            document.getElementById('edit_category').value = c.category_id || '';
            document.getElementById('edit_tier').value = c.customer_tier || 'Silver';
            document.getElementById('edit_reference').value = c.reference_by || 'Direct';
            document.getElementById('edit_status').value = c.status;
            
            const preview = document.getElementById('edit_photo_preview');
            const icon = document.getElementById('edit_photo_icon');
            if (c.photo) {
                preview.src = '../uploads/customers/' + c.photo;
                preview.style.display = 'block';
                icon.style.display = 'none';
            } else {
                preview.style.display = 'none';
                icon.style.display = 'block';
            }
            
            document.getElementById('editModal').classList.add('active');
        }
        
        function previewPhoto(input, previewId, iconId) {
            const preview = document.getElementById(previewId);
            const icon = document.getElementById(iconId);
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                    icon.style.display = 'none';
                }
                reader.readAsDataURL(input.files[0]);
            }
        }
        
        function selectAllCustomers() {
            document.querySelectorAll('.customer-checkbox').forEach(cb => cb.checked = true);
            document.getElementById('selectAll').checked = true;
            updateSelectedCount();
        }
        
        function deselectAllCustomers() {
            document.querySelectorAll('.customer-checkbox').forEach(cb => cb.checked = false);
            document.getElementById('selectAll').checked = false;
            updateSelectedCount();
        }
        
        function toggleAllCustomers(checkbox) {
            document.querySelectorAll('.customer-checkbox').forEach(cb => cb.checked = checkbox.checked);
            updateSelectedCount();
        }
        
        function updateSelectedCount() {
            const checked = document.querySelectorAll('.customer-checkbox:checked');
            document.getElementById('selectedCount').textContent = checked.length + ' selected';
        }
        
        function confirmBulkDelete() {
            const checked = document.querySelectorAll('.customer-checkbox:checked');
            if (checked.length === 0) {
                alert('Please select at least one customer to delete');
                return false;
            }
            const ids = Array.from(checked).map(cb => cb.value).join(',');
            document.getElementById('delete_selected_ids').value = ids;
            return confirm('Are you sure you want to delete ' + checked.length + ' selected customers? This action cannot be undone.');
        }
        
        document.getElementById('downloadForm').addEventListener('submit', function(e) {
            const checked = document.querySelectorAll('.customer-checkbox:checked');
            if (checked.length === 0) {
                e.preventDefault();
                alert('Please select at least one customer to download');
                return false;
            }
            const ids = Array.from(checked).map(cb => cb.value).join(',');
            document.getElementById('selected_ids').value = ids;
        });
    </script>
</body>
</html>
<?php $conn->close(); ?>