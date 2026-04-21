// Jai Collection - Storefront JS
(function () {
    // Qty widget (+/-)
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-qty]');
        if (!btn) return;
        var delta = parseInt(btn.getAttribute('data-qty'), 10);
        var input = btn.parentElement.querySelector('input[type="number"]');
        if (!input) return;
        var cur = Math.max(1, (parseInt(input.value, 10) || 1) + delta);
        input.value = cur;
        input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Variant selector
    document.querySelectorAll('[data-variant-group]').forEach(function (group) {
        group.addEventListener('click', function (e) {
            var btn = e.target.closest('button[data-variant-id]');
            if (!btn) return;
            group.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            var vid = btn.getAttribute('data-variant-id');
            var hidden = document.querySelector('input[name="variant_id"]');
            if (hidden) hidden.value = vid;
            var priceEl = document.querySelector('[data-variant-price]');
            if (priceEl && btn.dataset.price) priceEl.textContent = btn.dataset.price;
        });
    });

    // Thumbnail gallery
    document.querySelectorAll('[data-thumb]').forEach(function (thumb) {
        thumb.addEventListener('click', function () {
            var main = document.querySelector('[data-main-image]');
            if (main) main.src = thumb.src;
            document.querySelectorAll('[data-thumb]').forEach(function (t) { t.classList.remove('active'); });
            thumb.classList.add('active');
        });
    });

    // Auto-submit forms with [data-auto-submit] on change
    document.querySelectorAll('[data-auto-submit]').forEach(function (el) {
        el.addEventListener('change', function () { el.closest('form').submit(); });
    });

    // Confirm dialogs
    document.addEventListener('click', function (e) {
        var el = e.target.closest('[data-confirm]');
        if (el && !window.confirm(el.getAttribute('data-confirm'))) {
            e.preventDefault();
        }
    });
})();
