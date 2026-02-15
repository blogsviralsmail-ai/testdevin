<?php
$logo = getSetting('logo', 'https://jptiles.in/wp-content/uploads/2025/01/Untitled-design-2025-01-31T170820.186.png');
$currentPage = basename($_SERVER['PHP_SELF']);
?>
<!-- Mobile Menu Button -->
<button class="mobile-menu-btn" onclick="toggleSidebar()" style="display: none; position: fixed; top: 15px; left: 15px; z-index: 1001; background: #1a1a1a; color: #c9a227; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer;"><i class="fas fa-bars"></i></button>
<div class="mobile-overlay" onclick="toggleSidebar()"></div>

<aside class="admin-sidebar" id="adminSidebar">
    <div class="logo">
        <img src="<?php echo $logo; ?>" alt="JP Tiles" style="height: 50px;">
    </div>
    <nav style="display: block; width: 100%; height: auto;">
        <ul style="display: flex; flex-direction: column; gap: 5px; list-style: none; padding: 0; margin: 0;">
            <li><a href="index.php" class="<?php echo $currentPage === 'index.php' ? 'active' : ''; ?>"><i class="fas fa-tachometer-alt"></i> Dashboard</a></li>
            
            <?php if (hasPermission('view_customers') || hasPermission('add_customer')): ?>
            <li><a href="customers.php" class="<?php echo $currentPage === 'customers.php' ? 'active' : ''; ?>"><i class="fas fa-users"></i> Customers</a></li>
            <?php endif; ?>
            
            <?php if (hasPermission('add_visit')): ?>
            <li><a href="visits.php" class="<?php echo $currentPage === 'visits.php' ? 'active' : ''; ?>"><i class="fas fa-clipboard-list"></i> Visit Entries</a></li>
            <?php endif; ?>
            
            <?php if (hasPermission('view_reports')): ?>
            <li><a href="reports.php" class="<?php echo $currentPage === 'reports.php' ? 'active' : ''; ?>"><i class="fas fa-chart-bar"></i> Reports</a></li>
            <?php endif; ?>
            
            <?php if (hasPermission('manage_meetings')): ?>
            <li><a href="meetings.php" class="<?php echo $currentPage === 'meetings.php' ? 'active' : ''; ?>"><i class="fas fa-calendar-alt"></i> Meetings</a></li>
            <?php endif; ?>
            
            <?php if (hasPermission('manage_gifts')): ?>
            <li><a href="gifts.php" class="<?php echo $currentPage === 'gifts.php' ? 'active' : ''; ?>"><i class="fas fa-gift"></i> Gift Tracking</a></li>
            <?php endif; ?>
            
            <?php if (hasPermission('send_sms')): ?>
            <li><a href="sms.php" class="<?php echo $currentPage === 'sms.php' ? 'active' : ''; ?>"><i class="fas fa-sms"></i> Bulk SMS</a></li>
            <?php endif; ?>
            
                        <?php if (isAdmin() || hasPermission('approve_visits')): ?>
                        <li><a href="pending-visits.php" class="<?php echo $currentPage === 'pending-visits.php' ? 'active' : ''; ?>"><i class="fas fa-clock"></i> Pending Visits</a></li>
                        <?php endif; ?>
            
                        <?php if (isAdmin()): ?>
                        <li><a href="qr-code.php" class="<?php echo $currentPage === 'qr-code.php' ? 'active' : ''; ?>"><i class="fas fa-qrcode"></i> QR Code</a></li>
            <li><a href="customer-categories.php" class="<?php echo $currentPage === 'customer-categories.php' ? 'active' : ''; ?>"><i class="fas fa-tags"></i> Customer Categories</a></li>
            <li><a href="employees.php" class="<?php echo $currentPage === 'employees.php' ? 'active' : ''; ?>"><i class="fas fa-users-cog"></i> Admins</a></li>
            <li><a href="offers.php" class="<?php echo $currentPage === 'offers.php' ? 'active' : ''; ?>"><i class="fas fa-percent"></i> Offers</a></li>
            <li><a href="winners.php" class="<?php echo $currentPage === 'winners.php' ? 'active' : ''; ?>"><i class="fas fa-trophy"></i> Winners</a></li>
                        <!-- Website Content Management -->
                        <li style="margin-top: 15px; padding: 5px 15px; color: #c9a227; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Website Content</li>
                        <li><a href="categories.php" class="<?php echo $currentPage === 'categories.php' ? 'active' : ''; ?>"><i class="fas fa-folder"></i> Product Categories</a></li>
                        <li><a href="products.php" class="<?php echo $currentPage === 'products.php' ? 'active' : ''; ?>"><i class="fas fa-box"></i> Products</a></li>
                        <li><a href="sliders.php" class="<?php echo $currentPage === 'sliders.php' ? 'active' : ''; ?>"><i class="fas fa-images"></i> Sliders</a></li>
                        <li><a href="gallery.php" class="<?php echo $currentPage === 'gallery.php' ? 'active' : ''; ?>"><i class="fas fa-photo-video"></i> Gallery</a></li>
                        <li><a href="catalogs.php" class="<?php echo $currentPage === 'catalogs.php' ? 'active' : ''; ?>"><i class="fas fa-file-pdf"></i> Catalogs</a></li>
                        <li><a href="category-images.php" class="<?php echo $currentPage === 'category-images.php' ? 'active' : ''; ?>"><i class="fas fa-th-large"></i> Category Images</a></li>
                        <li><a href="features.php" class="<?php echo $currentPage === 'features.php' ? 'active' : ''; ?>"><i class="fas fa-star"></i> Features/USP</a></li>
                        <li><a href="stats.php" class="<?php echo $currentPage === 'stats.php' ? 'active' : ''; ?>"><i class="fas fa-chart-line"></i> Stats</a></li>
                        <li><a href="faqs.php" class="<?php echo $currentPage === 'faqs.php' ? 'active' : ''; ?>"><i class="fas fa-question-circle"></i> FAQs</a></li>
                        <li><a href="page-content.php" class="<?php echo $currentPage === 'page-content.php' ? 'active' : ''; ?>"><i class="fas fa-file-alt"></i> Page Content</a></li>
                        <li><a href="enquiries.php" class="<?php echo $currentPage === 'enquiries.php' ? 'active' : ''; ?>"><i class="fas fa-envelope"></i> Enquiries</a></li>
                        <li><a href="contact-messages.php" class="<?php echo $currentPage === 'contact-messages.php' ? 'active' : ''; ?>"><i class="fas fa-comments"></i> Contact Messages</a></li>
                        <li><a href="settings.php" class="<?php echo $currentPage === 'settings.php' ? 'active' : ''; ?>"><i class="fas fa-cog"></i> Settings</a></li>
                        <?php endif; ?>
            
            <li><a href="profile.php" class="<?php echo $currentPage === 'profile.php' ? 'active' : ''; ?>"><i class="fas fa-user-circle"></i> My Profile</a></li>
            <li><a href="logout.php"><i class="fas fa-sign-out-alt"></i> Logout</a></li>
        </ul>
    </nav>
</aside>

<script>
function toggleSidebar() {
    document.getElementById('adminSidebar').classList.toggle('active');
    document.querySelector('.mobile-overlay').classList.toggle('active');
}

// Apply mobile styles on load and resize
function applyMobileStyles() {
    const sidebar = document.getElementById('adminSidebar');
    const content = document.querySelector('.admin-content');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    
    if (window.innerWidth <= 768) {
        // Mobile styles
        sidebar.style.position = 'fixed';
        sidebar.style.left = sidebar.classList.contains('active') ? '0' : '-260px';
        sidebar.style.top = '0';
        sidebar.style.width = '250px';
        sidebar.style.height = '100vh';
        sidebar.style.zIndex = '1000';
        sidebar.style.transition = 'left 0.3s ease';
        sidebar.style.overflowY = 'auto';
        
        // Fix nav ul display issue on mobile
        const navUl = sidebar.querySelector('nav ul');
        if (navUl) {
            navUl.style.display = 'flex';
            navUl.style.flexDirection = 'column';
            navUl.style.gap = '5px';
        }
        
        if (content) {
            content.style.marginLeft = '0';
            content.style.paddingTop = '70px';
            content.style.width = '100%';
        }
        if (menuBtn) menuBtn.style.display = 'flex';
    }else {
        // Desktop styles
        sidebar.style.position = 'fixed';
        sidebar.style.left = '0';
        sidebar.style.width = '250px';
        if (content) {
            content.style.marginLeft = '250px';
            content.style.paddingTop = '20px';
        }
        if (menuBtn) menuBtn.style.display = 'none';
    }
}

// Run on DOM ready and resize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyMobileStyles);
} else {
    applyMobileStyles();
}
window.addEventListener('resize', applyMobileStyles);
// Also run after a short delay to ensure all elements are loaded
setTimeout(applyMobileStyles, 100);

// Override toggle to also update styles
const originalToggle = toggleSidebar;
toggleSidebar = function() {
    document.getElementById('adminSidebar').classList.toggle('active');
    document.querySelector('.mobile-overlay').classList.toggle('active');
    applyMobileStyles();
}

// Close sidebar when clicking a link on mobile
document.querySelectorAll('.admin-sidebar nav a').forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            document.getElementById('adminSidebar').classList.remove('active');
            document.querySelector('.mobile-overlay').classList.remove('active');
            applyMobileStyles();
        }
    });
});
</script>
