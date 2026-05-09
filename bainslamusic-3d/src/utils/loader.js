/**
 * Loading Manager
 */
export class LoadingManager {
  constructor() {
    this.loaderEl = document.getElementById('loader');
    this.progressBar = document.getElementById('progress-bar');
    this.statusEl = document.getElementById('loader-status');
  }

  updateProgress(percent) {
    if (this.progressBar) {
      this.progressBar.style.width = `${Math.min(100, percent)}%`;
    }
  }

  updateStatus(text) {
    if (this.statusEl) {
      this.statusEl.textContent = text;
    }
  }

  hide() {
    if (this.loaderEl) {
      this.loaderEl.classList.add('hidden');
    }
  }
}
