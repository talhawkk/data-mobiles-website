import { playHapticTick, toggleSound, isSoundMuted } from './audio.js';

/**
 * Navigation Bar and Progress Indicator Controller
 * Pristine Apple-Grade Light Studio Experience
 */
export function initNav({ onNavigate }) {
  const brandLink = document.querySelector('.nav-brand');
  const navLinks = document.querySelectorAll('.nav-link');
  const progressFill = document.querySelector('.scroll-progress-fill');
  const soundBtn = document.getElementById('sound-toggle-btn');

  // Ensure theme is locked to pure white studio
  document.documentElement.setAttribute('data-theme', 'light');

  // Sound Feedback Toggle
  if (soundBtn) {
    const updateSoundUI = (muted) => {
      soundBtn.classList.toggle('is-muted', muted);
      soundBtn.setAttribute('aria-label', muted ? 'Unmute sound effects' : 'Mute sound effects');
    };
    updateSoundUI(isSoundMuted());

    soundBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const enabled = toggleSound();
      updateSoundUI(!enabled);
    });
  }

  if (brandLink) {
    brandLink.addEventListener('click', (e) => {
      e.preventDefault();
      playHapticTick(900, 0.04);
      if (typeof onNavigate === 'function') {
        onNavigate(0.0);
      }
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      playHapticTick(750, 0.035);
      const target = link.getAttribute('href');
      let targetProgress = 0;

      switch (target) {
        case '#repairs':
          targetProgress = 0.23;
          break;
        case '#accessories':
          targetProgress = 0.68;
          break;
        case '#wifi':
          targetProgress = 0.83;
          break;
        case '#contact':
          targetProgress = 0.95;
          break;
        default:
          targetProgress = 0;
      }

      if (typeof onNavigate === 'function') {
        onNavigate(targetProgress);
      }
    });
  });

  return {
    updateProgress(progress) {
      if (progressFill) {
        progressFill.style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;
      }
    },
  };
}
