    <div style="text-align:center; padding:24px 0; color:var(--gray); font-size:13px; margin-top:40px; border-top:1px solid var(--border);">
        SafeChild v1.0 &mdash; Transparent Parental Control &mdash; Your child's safety, with their knowledge
    </div>
</div><!-- .main-content -->

<script>
// Mobile sidebar toggle
if (window.innerWidth <= 768) {
    document.getElementById('sidebarToggle').style.display = 'inline-flex';
}

// Auto-refresh alerts count
setInterval(function() {
    fetch('/safechild/admin/ajax/get_alert_count.php')
        .then(r => r.json())
        .then(data => {
            const badge = document.querySelector('.sidebar-nav .badge-danger');
            if (data.count > 0) {
                if (badge) {
                    badge.textContent = data.count;
                }
            }
        }).catch(() => {});
}, 30000);
</script>

<?php if (isset($extraScripts)) echo $extraScripts; ?>
</body>
</html>
