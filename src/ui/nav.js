/**
 * Navigation Bar and Progress Indicator Controller
 * Includes theme switching (Light Studio <-> Obsidian Dark)
 */
export function initNav({ onNavigate }) {
  const brandLink = document.querySelector('.nav-brand');
  const navLinks = document.querySelectorAll('.nav-link');
  const progressFill = document.querySelector('.scroll-progress-fill');
  const themeToggle = document.getElementById('theme-toggle');
  const themeLabel = document.getElementById('theme-label');
  const themeColorMeta = document.getElementById('theme-color-meta');

  function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {}

    if (themeLabel) {
      themeLabel.textContent = theme === 'light' ? 'LIGHT' : 'DARK';
    }
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', theme === 'light' ? '#F6F7FA' : '#0B0B0C');
    }
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }

  // Initialize theme label on load
  const initialTheme = getTheme();
  if (themeLabel) {
    themeLabel.textContent = initialTheme === 'light' ? 'LIGHT' : 'DARK';
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = getTheme();
      const next = current === 'light' ? 'dark' : 'light';
      applyTheme(next);
    });
  }

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
    getTheme,
    setTheme: applyTheme,
  };
}
