<?php
require_once '../includes/config.php';

if (!isLoggedIn() || !isAdmin()) {
    redirect('login.php');
}

$conn = getDBConnection();

// Handle form submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['add_employee'])) {
        $name = sanitize($_POST['name']);
        $mobile = sanitize($_POST['mobile']);
        $email = sanitize($_POST['email']);
        $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
        $permissions = isset($_POST['permissions']) ? json_encode($_POST['permissions']) : '[]';
        
        $check = $conn->prepare("SELECT id FROM users WHERE mobile = ?");
        $check->bind_param("s", $mobile);
        $check->execute();
        if ($check->get_result()->num_rows > 0) {
            setMessage('danger', 'Mobile number already exists!');
        } else {
            $stmt = $conn->prepare("INSERT INTO users (name, mobile, email, password, role, permissions) VALUES (?, ?, ?, ?, 'employee', ?)");
            $stmt->bind_param("sssss", $name, $mobile, $email, $password, $permissions);
            if ($stmt->execute()) {
                setMessage('success', 'Admin added successfully!');
            }
        }
    }
    
    if (isset($_POST['update_employee'])) {
        $id = (int)$_POST['employee_id'];
        $name = sanitize($_POST['name']);
        $mobile = sanitize($_POST['mobile']);
        $email = sanitize($_POST['email']);
        $permissions = isset($_POST['permissions']) ? json_encode($_POST['permissions']) : '[]';
        $status = sanitize($_POST['status']);
        
        $stmt = $conn->prepare("UPDATE users SET name = ?, mobile = ?, email = ?, permissions = ?, status = ? WHERE id = ? AND role = 'employee'");
        $stmt->bind_param("sssssi", $name, $mobile, $email, $permissions, $status, $id);
        $stmt->execute();
        
        if (!empty($_POST['password'])) {
            $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
            $stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
            $stmt->bind_param("si", $password, $id);
            $stmt->execute();
        }
        setMessage('success', 'Admin updated!');
    }
    
    if (isset($_POST['delete_employee'])) {
        $id = (int)$_POST['employee_id'];
        $stmt = $conn->prepare("DELETE FROM users WHERE id = ? AND role = 'employee'");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        setMessage('success', 'Admin deleted!');
    }
    
    redirect('employees.php');
}

$employees = $conn->query("SELECT * FROM users WHERE role = 'employee' ORDER BY created_at DESC");
$message = getMessage();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Management - Admin Panel</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
    <style>
        .permission-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px; }
        .permission-item { display: flex; align-items: center; gap: 8px; padding: 8px; background: #f5f5f5; border-radius: 5px; }
        .permission-item input { width: auto; }
        .badge-permissions { display: flex; flex-wrap: wrap; gap: 5px; }
        .badge-permissions span { font-size: 11px; padding: 2px 8px; background: #e3f2fd; color: #1976d2; border-radius: 10px; }
    </style>
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'sidebar.php'; ?>
        
        <div class="admin-content">
            <div class="admin-header">
                <h2><i class="fas fa-users-cog"></i> Admin Management</h2>
                <button class="btn btn-primary" onclick="openModal('addModal')"><i class="fas fa-plus"></i> Add Admin</button>
            </div>
            
            <?php if ($message): ?>
            <div class="alert alert-<?php echo $message['type']; ?>"><?php echo $message['text']; ?></div>
            <?php endif; ?>
            
            <div class="admin-card">
                <p style="margin-bottom: 20px; color: #666;"><i class="fas fa-info-circle"></i> Admins have limited access based on permissions.</p>
                
                <table class="data-table">
                    <thead>
                        <tr><th>Name</th><th>Mobile</th><th>Email</th><th>Permissions</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                                        <tbody>
                                            <?php while($emp = $employees->fetch_assoc()): 
                                                $perms = json_decode($emp['permissions'] ?: '[]', true);
                                            ?>
                                            <tr>
                                                <td><strong><?php echo $emp['name']; ?></strong></td>
                                                <td><?php echo $emp['mobile']; ?></td>
                                                <td><?php echo $emp['email'] ?: '-'; ?></td>
                                                <td>
                                                    <div class="badge-permissions">
                                                        <?php 
                                                        $permLabels = ['add_customer' => 'Add Customer', 'add_visit' => 'Add Visit', 'approve_visits' => 'Approve Visits', 'view_customers' => 'View Customers', 'view_reports' => 'Reports', 'manage_meetings' => 'Meetings', 'manage_gifts' => 'Gifts', 'send_sms' => 'SMS'];
                                                        foreach ($perms as $p): if (isset($permLabels[$p])): ?>
                                                        <span><?php echo $permLabels[$p]; ?></span>
                                                        <?php endif; endforeach; ?>
                                                    </div>
                                                </td>
                                                <td><span class="badge badge-<?php echo $emp['status'] === 'active' ? 'success' : 'danger'; ?>"><?php echo ucfirst($emp['status']); ?></span></td>
                                                <td>
                                                    <div class="action-btns">
                                                        <button class="action-btn edit" onclick="editEmployee(<?php echo htmlspecialchars(json_encode($emp)); ?>)"><i class="fas fa-edit"></i></button>
                                                        <form method="POST" style="display:inline" onsubmit="return confirm('Delete?')">
                                                            <input type="hidden" name="employee_id" value="<?php echo $emp['id']; ?>">
                                                            <button type="submit" name="delete_employee" class="action-btn delete"><i class="fas fa-trash"></i></button>
                                                        </form>
                                                    </div>
                                                </td>
                                            </tr>
                                            <?php endwhile; ?>
                                        </tbody>
                </table>
            </div>
        </div>
    </div>
    
        <!-- Add Modal -->
        <div class="modal" id="addModal">
            <div class="modal-content">
                <div class="modal-header"><h3>Add Admin</h3><button class="close-modal" onclick="closeModal('addModal')">&times;</button></div>
                <form method="POST">
                    <div class="modal-body">
                        <div class="form-group"><label>Name *</label><input type="text" name="name" required></div>
                        <div class="form-group"><label>Mobile *</label><input type="text" name="mobile" required pattern="[0-9]{10}"></div>
                        <div class="form-group"><label>Email *</label><input type="email" name="email" required></div>
                        <div class="form-group"><label>Password *</label><input type="password" name="password" required minlength="5"></div>
                    <div class="form-group">
                        <label>Permissions</label>
                        <div class="permission-grid">
                            <label class="permission-item"><input type="checkbox" name="permissions[]" value="add_customer"><span>Add Customer</span></label>
                            <label class="permission-item"><input type="checkbox" name="permissions[]" value="add_visit"><span>Add Visit</span></label>
                            <label class="permission-item"><input type="checkbox" name="permissions[]" value="approve_visits"><span>Approve Visits</span></label>
                            <label class="permission-item"><input type="checkbox" name="permissions[]" value="view_customers"><span>View Customers</span></label>
                            <label class="permission-item"><input type="checkbox" name="permissions[]" value="view_reports"><span>View Reports</span></label>
                            <label class="permission-item"><input type="checkbox" name="permissions[]" value="manage_meetings"><span>Meetings</span></label>
                            <label class="permission-item"><input type="checkbox" name="permissions[]" value="manage_gifts"><span>Gifts</span></label>
                            <label class="permission-item"><input type="checkbox" name="permissions[]" value="send_sms"><span>Send SMS</span></label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('addModal')">Cancel</button>
                    <button type="submit" name="add_employee" class="btn btn-primary">Add</button>
                </div>
            </form>
        </div>
    </div>
    
        <!-- Edit Modal -->
        <div class="modal" id="editModal">
            <div class="modal-content">
                <div class="modal-header"><h3>Edit Admin</h3><button class="close-modal" onclick="closeModal('editModal')">&times;</button></div>
                <form method="POST">
                    <input type="hidden" name="employee_id" id="edit_id">
                    <div class="modal-body">
                        <div class="form-group"><label>Name *</label><input type="text" name="name" id="edit_name" required></div>
                        <div class="form-group"><label>Mobile *</label><input type="text" name="mobile" id="edit_mobile" required></div>
                        <div class="form-group"><label>Email *</label><input type="email" name="email" id="edit_email" required></div>
                        <div class="form-group"><label>New Password</label><input type="password" name="password"></div>
                    <div class="form-group"><label>Status</label><select name="status" id="edit_status"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
                    <div class="form-group">
                        <label>Permissions</label>
                        <div class="permission-grid" id="edit_permissions">
                            <label class="permission-item"><input type="checkbox" name="permissions[]" value="add_customer" id="perm_add_customer"><span>Add Customer</span></label>
                            <label class="permission-item"><input type="checkbox" name="permissions[]" value="add_visit" id="perm_add_visit"><span>Add Visit</span></label>
                            <label class="permission-item"><input type="checkbox" name="permissions[]" value="approve_visits" id="perm_approve_visits"><span>Approve Visits</span></label>
                            <label class="permission-item"><input type="checkbox" name="permissions[]" value="view_customers" id="perm_view_customers"><span>View Customers</span></label>
                            <label class="permission-item"><input type="checkbox" name="permissions[]" value="view_reports" id="perm_view_reports"><span>Reports</span></label>
                            <label class="permission-item"><input type="checkbox" name="permissions[]" value="manage_meetings" id="perm_manage_meetings"><span>Meetings</span></label>
                            <label class="permission-item"><input type="checkbox" name="permissions[]" value="manage_gifts" id="perm_manage_gifts"><span>Gifts</span></label>
                            <label class="permission-item"><input type="checkbox" name="permissions[]" value="send_sms" id="perm_send_sms"><span>SMS</span></label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('editModal')">Cancel</button>
                    <button type="submit" name="update_employee" class="btn btn-primary">Update</button>
                </div>
            </form>
        </div>
    </div>
    
        <script>
            function openModal(id) { document.getElementById(id).classList.add('active'); }
            function closeModal(id) { document.getElementById(id).classList.remove('active'); }
            function editEmployee(emp) {
                document.getElementById('edit_id').value = emp.id;
                document.getElementById('edit_name').value = emp.name;
                document.getElementById('edit_mobile').value = emp.mobile;
                document.getElementById('edit_email').value = emp.email || '';
                document.getElementById('edit_status').value = emp.status;
                document.querySelectorAll('#edit_permissions input').forEach(cb => cb.checked = false);
                const perms = JSON.parse(emp.permissions || '[]');
                perms.forEach(p => { const cb = document.getElementById('perm_' + p); if (cb) cb.checked = true; });
                openModal('editModal');
            }
        </script>
</body>
</html>
<?php $conn->close(); ?>
