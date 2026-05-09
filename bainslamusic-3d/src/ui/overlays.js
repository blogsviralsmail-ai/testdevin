/**
 * UI Manager - HTML overlay management
 */
export class UIManager {
  constructor(app) {
    this.app = app;
    this.sections = [
      'section-home',
      'section-about',
      'section-services',
      'section-videos',
      'section-contact'
    ];

    this.setupNavigation();
    this.setupButtons();
    this.setupContactForm();
  }

  setupNavigation() {
    // Nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = parseInt(link.dataset.section);
        this.app.goToSection(section);
      });
    });

    // Section dots
    document.querySelectorAll('.dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const section = parseInt(dot.dataset.section);
        this.app.goToSection(section);
      });
    });

    // Mobile nav toggle
    const toggle = document.getElementById('nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (toggle && navLinks) {
      toggle.addEventListener('click', () => {
        navLinks.classList.toggle('open');
        toggle.classList.toggle('active');
      });

      // Close mobile nav on link click
      navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          navLinks.classList.remove('open');
          toggle.classList.remove('active');
        });
      });
    }
  }

  setupButtons() {
    // CTA buttons with data-navigate
    document.querySelectorAll('[data-navigate]').forEach(btn => {
      btn.addEventListener('click', () => {
        const section = parseInt(btn.dataset.navigate);
        this.app.goToSection(section);
      });
    });
  }

  setupContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('form-name').value;
      const email = document.getElementById('form-email').value;
      const message = document.getElementById('form-message').value;

      // Since this is static, create a mailto link
      const mailtoLink = `mailto:ajeet@bainslamusic.com?subject=Message from ${encodeURIComponent(name)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`;
      window.open(mailtoLink, '_blank');

      // Visual feedback
      const btn = form.querySelector('.btn-primary');
      const originalText = btn.textContent;
      btn.textContent = 'Opening email...';
      btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
      }, 3000);
    });
  }

  updateSection(newIndex, oldIndex) {
    // Update overlay visibility
    this.sections.forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (i === newIndex) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      const idx = parseInt(link.dataset.section);
      link.classList.toggle('active', idx === newIndex);
    });

    // Update dots
    document.querySelectorAll('.dot').forEach(dot => {
      const idx = parseInt(dot.dataset.section);
      dot.classList.toggle('active', idx === newIndex);
    });
  }
}
