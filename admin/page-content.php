<?php
require_once '../includes/config.php';

if (!isLoggedIn() || !isAdmin()) {
    redirect('login.php');
}

$conn = getDBConnection();
$message = getMessage();

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $page_slug = sanitize($_POST['page_slug']);
    $page_title = sanitize($_POST['page_title']);
    $page_subtitle = sanitize($_POST['page_subtitle']);
    $content = $_POST['content'];
    $meta_title = sanitize($_POST['meta_title']);
    $meta_description = sanitize($_POST['meta_description']);
    $meta_keywords = sanitize($_POST['meta_keywords']);
    
    // Check if page exists
    $check = $conn->prepare("SELECT id FROM page_content WHERE page_slug = ?");
    $check->bind_param("s", $page_slug);
    $check->execute();
    $result = $check->get_result();
    
    if ($result->num_rows > 0) {
        $stmt = $conn->prepare("UPDATE page_content SET page_title=?, page_subtitle=?, content=?, meta_title=?, meta_description=?, meta_keywords=? WHERE page_slug=?");
        $stmt->bind_param("sssssss", $page_title, $page_subtitle, $content, $meta_title, $meta_description, $meta_keywords, $page_slug);
    } else {
        $stmt = $conn->prepare("INSERT INTO page_content (page_slug, page_title, page_subtitle, content, meta_title, meta_description, meta_keywords) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sssssss", $page_slug, $page_title, $page_subtitle, $content, $meta_title, $meta_description, $meta_keywords);
    }
    $stmt->execute();
    
    setMessage('success', 'Page content updated successfully');
    redirect('page-content.php?page=' . $page_slug);
}

// Get current page
$currentPage = isset($_GET['page']) ? sanitize($_GET['page']) : 'about';
$pageData = null;

$stmt = $conn->prepare("SELECT * FROM page_content WHERE page_slug = ?");
$stmt->bind_param("s", $currentPage);
$stmt->execute();
$result = $stmt->get_result();
$pageData = $result->fetch_assoc();

// Default values if page doesn't exist
if (!$pageData) {
    $pageData = [
        'page_slug' => $currentPage,
        'page_title' => ucfirst($currentPage),
        'page_subtitle' => '',
        'content' => '',
        'meta_title' => '',
        'meta_description' => '',
        'meta_keywords' => ''
    ];
}

// Available pages
$pages = ['about' => 'About Us', 'contact' => 'Contact Us', 'enquiry' => 'Business Enquiry', 'privacy' => 'Privacy Policy', 'terms' => 'Terms & Conditions'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Content - JP Tiles Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
    <style>
        .page-tabs { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
        .page-tabs a { padding: 10px 20px; background: #2d2d2d; color: #fff; border-radius: 5px; text-decoration: none; }
        .page-tabs a.active { background: #c9a227; }
        .page-tabs a:hover { background: #c9a227; }
    </style>
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'sidebar.php'; ?>

        <main class="admin-content">
            <div class="admin-header">
                <h1><i class="fas fa-file-alt"></i> Page Content Management</h1>
            </div>

            <?php if ($message): ?>
            <div class="alert alert-<?php echo $message['type']; ?>">
                <?php echo $message['text']; ?>
            </div>
            <?php endif; ?>

            <!-- Page Tabs -->
            <div class="page-tabs">
                <?php foreach ($pages as $slug => $name): ?>
                <a href="?page=<?php echo $slug; ?>" class="<?php echo $currentPage === $slug ? 'active' : ''; ?>">
                    <?php echo $name; ?>
                </a>
                <?php endforeach; ?>
            </div>

            <!-- Edit Form -->
            <div class="admin-card">
                <h3>Edit: <?php echo $pages[$currentPage] ?? ucfirst($currentPage); ?></h3>
                <form method="POST">
                    <input type="hidden" name="page_slug" value="<?php echo htmlspecialchars($currentPage); ?>">
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div class="form-group">
                            <label>Page Title</label>
                            <input type="text" name="page_title" value="<?php echo htmlspecialchars($pageData['page_title']); ?>" required>
                        </div>
                        <div class="form-group">
                            <label>Page Subtitle</label>
                            <input type="text" name="page_subtitle" value="<?php echo htmlspecialchars($pageData['page_subtitle']); ?>">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Page Content</label>
                        <textarea name="content" rows="10"><?php echo htmlspecialchars($pageData['content']); ?></textarea>
                        <small style="color: #666;">You can use HTML tags for formatting</small>
                    </div>
                    
                    <div class="admin-card" style="background: #1a1a1a; margin-top: 20px;">
                        <h4><i class="fas fa-search"></i> SEO Settings for this Page</h4>
                        <div class="form-group">
                            <label>Meta Title</label>
                            <input type="text" name="meta_title" value="<?php echo htmlspecialchars($pageData['meta_title']); ?>">
                        </div>
                        <div class="form-group">
                            <label>Meta Description</label>
                            <textarea name="meta_description" rows="2"><?php echo htmlspecialchars($pageData['meta_description']); ?></textarea>
                        </div>
                        <div class="form-group">
                            <label>Meta Keywords</label>
                            <input type="text" name="meta_keywords" value="<?php echo htmlspecialchars($pageData['meta_keywords']); ?>">
                        </div>
                    </div>
                    
                    <div style="text-align: right; margin-top: 20px;">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Save Page Content
                        </button>
                    </div>
                </form>
            </div>
        </main>
    </div>
</body>
</html>
<?php $conn->close(); ?>
