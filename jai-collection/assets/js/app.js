// Jai Collection - Frontend helpers (copy-to-clipboard fallback, hero slider,
// small UX polish). Kept framework-free for predictable loading.

(function () {
  window.jcToast = function (msg) {
    let el = document.createElement('div');
    el.className = 'jc-toast';
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-show'));
    setTimeout(() => {
      el.classList.remove('is-show');
      setTimeout(() => el.remove(), 400);
    }, 1800);
  };

  // Robust copy: navigator.clipboard requires HTTPS; fall back to execCommand
  // on plain HTTP / older browsers. Always shows a toast so user gets feedback.
  window.jcCopy = function (text, btn) {
    const done = () => {
      jcToast('Copied to clipboard!');
      if (btn) {
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => { btn.innerHTML = original; }, 1600);
      }
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallback());
    } else {
      fallback();
    }
    function fallback() {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      try { document.execCommand('copy'); done(); }
      catch (e) { jcToast('Copy failed. Long-press to copy manually.'); }
      ta.remove();
    }
  };

  // Intercept [data-jc-copy] clicks: copy the data attribute or sibling input value.
  document.addEventListener('click', function (ev) {
    const btn = ev.target.closest('[data-jc-copy]');
    if (!btn) return;
    ev.preventDefault();
    const selector = btn.getAttribute('data-jc-copy');
    let text = btn.getAttribute('data-jc-copy-text') || '';
    if (!text && selector) {
      const el = document.querySelector(selector);
      if (el) text = el.value || el.textContent || '';
    }
    if (text) jcCopy(text, btn);
  });

  // ===== Hero slider =====
  function initHero(el) {
    const track = el.querySelector('.jc-hero-track');
    const slides = el.querySelectorAll('.jc-hero-slide');
    const dots = el.querySelectorAll('.jc-hero-dots button');
    const count = slides.length;
    if (count <= 1) return;
    let idx = 0, timer;
    function go(n) {
      idx = (n + count) % count;
      track.style.transform = 'translateX(-' + (idx * 100) + '%)';
      dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
    }
    el.querySelector('.jc-hero-arrow.prev').addEventListener('click', () => { go(idx - 1); reset(); });
    el.querySelector('.jc-hero-arrow.next').addEventListener('click', () => { go(idx + 1); reset(); });
    dots.forEach((d, i) => d.addEventListener('click', () => { go(i); reset(); }));
    function reset() { clearInterval(timer); timer = setInterval(() => go(idx + 1), 5000); }
    reset();
  }
  document.querySelectorAll('.jc-hero-carousel').forEach(initHero);

  // ===== Bulk select helper (admin lists) =====
  document.querySelectorAll('[data-jc-check-all]').forEach(src => {
    src.addEventListener('change', () => {
      const target = src.getAttribute('data-jc-check-all');
      document.querySelectorAll(target).forEach(cb => { cb.checked = src.checked; });
    });
  });

  // Bulk form submit confirmation
  document.querySelectorAll('[data-jc-bulk-confirm]').forEach(form => {
    form.addEventListener('submit', ev => {
      const sel = form.querySelectorAll('input[type=checkbox][name="ids[]"]:checked');
      const action = form.querySelector('select[name="bulk_action"]').value;
      if (!action) { ev.preventDefault(); jcToast('Choose an action first.'); return; }
      if (!sel.length) { ev.preventDefault(); jcToast('Select at least one row.'); return; }
      if (action === 'delete' && !confirm('Delete ' + sel.length + ' row(s)? This cannot be undone.')) ev.preventDefault();
    });
  });
})();
