/**
 * Navigation Bar and Progress Indicator Controller
 */
export function initNav({ onNavigate }) {
  const brandLink = document.querySelector('.nav-brand');
  const navLinks = document.querySelectorAll('.nav-link');
  const progressFill = document.querySelector('.scroll-progress-fill');

  if (brandLink) {
    brandLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof onNavigate === 'function') {
        onNavigate(0.0);
      }
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('href');
      let targetProgress = 0;

      switch (target) {
        case '#repairs':
          targetProgress = 0.28;
          break;
        case '#accessories':
          targetProgress = 0.67;
          break;
        case '#wifi':
          targetProgress = 0.79;
          break;
        case '#contact':
          targetProgress = 0.94;
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
