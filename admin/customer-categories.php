<?php
require_once '../includes/config.php';

if (!isLoggedIn() || !isAdmin()) {
    redirect('login.php');
}

$conn = getDBConnection();
$message = getMessage();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['add'])) {
        $name = sanitize($_POST['name']);
        $sort = (int)$_POST['sort_order'];
        $stmt = $conn->prepare("INSERT INTO customer_categories (name, sort_order) VALUES (?, ?)");
        $stmt->bind_param("si", $name, $sort);
        $stmt->execute();
        setMessage('success', 'Category added');
        redirect('customer-categories.php');
    }
    
    if (isset($_POST['update'])) {
        $id = (int)$_POST['id'];
        $name = sanitize($_POST['name']);
        $sort = (int)$_POST['sort_order'];
        $status = sanitize($_POST['status']);
        $stmt = $conn->prepare("UPDATE customer_categories SET name = ?, sort_order = ?, status = ? WHERE id = ?");
        $stmt->bind_param("sisi", $name, $sort, $status, $id);
        $stmt->execute();
        setMessage('success', 'Category updated');
        redirect('customer-categories.php');
    }
    
    if (isset($_POST['delete'])) {
        $id = (int)$_POST['id'];
        $conn->query("DELETE FROM customer_categories WHERE id = $id");
        setMessage('success', 'Category deleted');
        redirect('customer-categories.php');
    }
}

$categories = $conn->query("SELECT cc.*, (SELECT COUNT(*) FROM masons WHERE category_id = cc.id) as customer_count FROM customer_categories cc ORDER BY sort_order");
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customer Categories - JP Tiles Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'sidebar.php'; ?>
        <main class="admin-content">
            <div class="admin-header">
                <h1><i class="fas fa-tags"></i> Customer Categories</h1>
                <button onclick="document.getElementById('addModal').classList.add('active')" class="btn btn-primary"><i class="fas fa-plus"></i> Add Category</button>
            </div>

            <?php if ($message): ?><div class="alert alert-<?php echo $message['type']; ?>"><?php echo $message['text']; ?></div><?php endif; ?>

            <div class="admin-card">
                <table class="data-table">
                    <thead><tr><th>Name</th><th>Customers</th><th>Sort Order</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        <?php while($cat = $categories->fetch_assoc()): ?>
                        <tr>
                            <td><strong><?php echo $cat['name']; ?></strong></td>
                            <td><?php echo $cat['customer_count']; ?></td>
                            <td><?php echo $cat['sort_order']; ?></td>
                            <td><span class="badge badge-<?php echo $cat['status'] === 'active' ? 'success' : 'danger'; ?>"><?php echo ucfirst($cat['status']); ?></span></td>
                            <td>
                                <div class="action-btns">
                                    <button onclick="editCat(<?php echo htmlspecialchars(json_encode($cat)); ?>)" class="action-btn edit"><i class="fas fa-edit"></i></button>
                                    <form method="POST" style="display:inline" onsubmit="return confirm('Delete?')"><input type="hidden" name="id" value="<?php echo $cat['id']; ?>"><button type="submit" name="delete" class="action-btn delete"><i class="fas fa-trash"></i></button></form>
                                </div>
                            </td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
            </div>
        </main>
    </div>

    <div id="addModal" class="modal">
        <div class="modal-content">
            <div class="modal-header"><h3>Add Category</h3><button class="close-modal" onclick="document.getElementById('addModal').classList.remove('active')">&times;</button></div>
            <form method="POST">
                <div class="modal-body">
                    <div class="form-group"><label>Name *</label><input type="text" name="name" required></div>
                    <div class="form-group"><label>Sort Order</label><input type="number" name="sort_order" value="0"></div>
                </div>
                <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="document.getElementById('addModal').classList.remove('active')">Cancel</button><button type="submit" name="add" class="btn btn-primary">Add</button></div>
            </form>
        </div>
    </div>

    <div id="editModal" class="modal">
        <div class="modal-content">
            <div class="modal-header"><h3>Edit Category</h3><button class="close-modal" onclick="document.getElementById('editModal').classList.remove('active')">&times;</button></div>
            <form method="POST">
                <input type="hidden" name="id" id="edit_id">
                <div class="modal-body">
                    <div class="form-group"><label>Name *</label><input type="text" name="name" id="edit_name" required></div>
                    <div class="form-group"><label>Sort Order</label><input type="number" name="sort_order" id="edit_sort"></div>
                    <div class="form-group"><label>Status</label><select name="status" id="edit_status"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
                </div>
                <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="document.getElementById('editModal').classList.remove('active')">Cancel</button><button type="submit" name="update" class="btn btn-primary">Update</button></div>
            </form>
        </div>
    </div>

    <script>
        function editCat(c) {
            document.getElementById('edit_id').value = c.id;
            document.getElementById('edit_name').value = c.name;
            document.getElementById('edit_sort').value = c.sort_order;
            document.getElementById('edit_status').value = c.status;
            document.getElementById('editModal').classList.add('active');
        }
    </script>
</body>
</html>
<?php $conn->close(); ?>
