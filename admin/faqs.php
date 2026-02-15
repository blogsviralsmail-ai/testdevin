<?php
require_once '../includes/config.php';

if (!isLoggedIn() || !isAdmin()) {
    redirect('login.php');
}

$conn = getDBConnection();
$message = getMessage();

// Handle delete
if (isset($_GET['delete'])) {
    $id = (int)$_GET['delete'];
    $conn->query("DELETE FROM faqs WHERE id = $id");
    setMessage('success', 'FAQ deleted successfully');
    redirect('faqs.php');
}

// Handle add/edit
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
    $question = sanitize($_POST['question']);
    $answer = sanitize($_POST['answer']);
    $sort_order = (int)$_POST['sort_order'];
    $is_active = isset($_POST['is_active']) ? 1 : 0;
    
    if ($id > 0) {
        $stmt = $conn->prepare("UPDATE faqs SET question=?, answer=?, sort_order=?, is_active=? WHERE id=?");
        $stmt->bind_param("ssiii", $question, $answer, $sort_order, $is_active, $id);
        $stmt->execute();
        setMessage('success', 'FAQ updated successfully');
    } else {
        $stmt = $conn->prepare("INSERT INTO faqs (question, answer, sort_order, is_active) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssii", $question, $answer, $sort_order, $is_active);
        $stmt->execute();
        setMessage('success', 'FAQ added successfully');
    }
    redirect('faqs.php');
}

// Get FAQ for editing
$editFaq = null;
if (isset($_GET['edit'])) {
    $id = (int)$_GET['edit'];
    $result = $conn->query("SELECT * FROM faqs WHERE id = $id");
    $editFaq = $result->fetch_assoc();
}

// Get all FAQs
$faqs = $conn->query("SELECT * FROM faqs ORDER BY sort_order ASC, id ASC");
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FAQ Management - JP Tiles Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'sidebar.php'; ?>

        <main class="admin-content">
            <div class="admin-header">
                <h1><i class="fas fa-question-circle"></i> FAQ Management</h1>
            </div>

            <?php if ($message): ?>
            <div class="alert alert-<?php echo $message['type']; ?>">
                <?php echo $message['text']; ?>
            </div>
            <?php endif; ?>

            <!-- Add/Edit Form -->
            <div class="admin-card">
                <h3><?php echo $editFaq ? 'Edit FAQ' : 'Add New FAQ'; ?></h3>
                <form method="POST">
                    <?php if ($editFaq): ?>
                    <input type="hidden" name="id" value="<?php echo $editFaq['id']; ?>">
                    <?php endif; ?>
                    
                    <div class="form-group">
                        <label>Question</label>
                        <input type="text" name="question" value="<?php echo $editFaq ? htmlspecialchars($editFaq['question']) : ''; ?>" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Answer</label>
                        <textarea name="answer" rows="4" required><?php echo $editFaq ? htmlspecialchars($editFaq['answer']) : ''; ?></textarea>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div class="form-group">
                            <label>Sort Order</label>
                            <input type="number" name="sort_order" value="<?php echo $editFaq ? $editFaq['sort_order'] : 0; ?>">
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <div style="margin-top: 10px;">
                                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                    <input type="checkbox" name="is_active" <?php echo (!$editFaq || $editFaq['is_active']) ? 'checked' : ''; ?>>
                                    <span>Active</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> <?php echo $editFaq ? 'Update FAQ' : 'Add FAQ'; ?>
                        </button>
                        <?php if ($editFaq): ?>
                        <a href="faqs.php" class="btn btn-secondary">Cancel</a>
                        <?php endif; ?>
                    </div>
                </form>
            </div>

            <!-- FAQs List -->
            <div class="admin-card">
                <h3>All FAQs</h3>
                <div class="table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Question</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php while ($faq = $faqs->fetch_assoc()): ?>
                            <tr>
                                <td><?php echo $faq['sort_order']; ?></td>
                                <td><?php echo htmlspecialchars($faq['question']); ?></td>
                                <td>
                                    <span class="badge <?php echo $faq['is_active'] ? 'badge-success' : 'badge-danger'; ?>">
                                        <?php echo $faq['is_active'] ? 'Active' : 'Inactive'; ?>
                                    </span>
                                </td>
                                <td>
                                    <a href="?edit=<?php echo $faq['id']; ?>" class="btn btn-sm btn-primary"><i class="fas fa-edit"></i></a>
                                    <a href="?delete=<?php echo $faq['id']; ?>" class="btn btn-sm btn-danger" onclick="return confirm('Are you sure?')"><i class="fas fa-trash"></i></a>
                                </td>
                            </tr>
                            <?php endwhile; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>
</body>
</html>
<?php $conn->close(); ?>
