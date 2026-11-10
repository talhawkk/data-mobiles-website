import { playHapticTick } from './audio.js';

/**
 * Navigation Bar and Progress Indicator Controller
 * Pristine Apple-Grade Light Studio Experience
 */
export function initNav({ onNavigate }) {
  const brandLinks = document.querySelectorAll('.nav-brand');
  const desktopLinks = document.querySelectorAll('.top-nav .nav-link');
  const drawerLinks = document.querySelectorAll('.mobile-drawer-link');
  const progressFill = document.querySelector('.scroll-progress-fill');
  const menuToggle = document.getElementById('mobile-menu-toggle');
  const drawer = document.getElementById('mobile-menu-drawer');
  const backdrop = document.getElementById('mobile-menu-backdrop');
  const drawerClose = document.getElementById('mobile-drawer-close');

  // Ensure theme is locked to pure white studio
  document.documentElement.setAttribute('data-theme', 'light');

  function openDrawer() {
    if (!drawer) return;
    drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('mobile-menu-open');
    playHapticTick(850, 0.04);
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('mobile-menu-open');
    playHapticTick(600, 0.03);
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', (e) => {
      e.preventDefault();
      if (drawer && drawer.classList.contains('open')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });
  }

  if (drawerClose) {
    drawerClose.addEventListener('click', (e) => {
      e.preventDefault();
      closeDrawer();
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', () => {
      closeDrawer();
    });
  }

  // Handle ESC key to close drawer
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer && drawer.classList.contains('open')) {
      closeDrawer();
    }
  });

  brandLinks.forEach((brandLink) => {
    brandLink.addEventListener('click', (e) => {
      e.preventDefault();
      closeDrawer();
      playHapticTick(900, 0.04);
      if (typeof onNavigate === 'function') {
        onNavigate(0.0);
      }
    });
  });

  function getTargetProgress(target) {
    switch (target) {
      case '#repairs':
        return 0.23;
      case '#accessories':
        return 0.68;
      case '#wifi':
        return 0.83;
      case '#about':
      case '#atelier':
      case '#contact':
        return 0.95;
      default:
        return 0;
    }
  }

  desktopLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      playHapticTick(750, 0.035);
      const target = link.getAttribute('href');
      const targetProgress = getTargetProgress(target);
      if (typeof onNavigate === 'function') {
        onNavigate(targetProgress);
      }
    });
  });

  drawerLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('href') || link.getAttribute('data-target');
      const targetProgress = getTargetProgress(target);
      closeDrawer();
      playHapticTick(750, 0.035);
      setTimeout(() => {
        if (typeof onNavigate === 'function') {
          onNavigate(targetProgress);
        }
      }, 150);
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
