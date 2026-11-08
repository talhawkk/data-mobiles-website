import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText.js';
import { INSPECT_LABELS } from '../config.js';

gsap.registerPlugin(SplitText);

/**
 * Overlay View Controller
 * Manages DOM text reveals, SplitText line masks,
 * and 3D projected inspect labels.
 */
export function initOverlay({ phone, camera, getSize }) {
  // 1. Prepare SplitText on headings and sublines
  const splitTargets = document.querySelectorAll('.split-text');
  const splitInstances = [];

  splitTargets.forEach((target) => {
    // Create line masks
    const split = new SplitText(target, {
      type: 'lines',
      linesClass: 'line-mask',
    });

    // Wrap each line's content into an inner span for clean mask sliding
    split.lines.forEach((line) => {
      const inner = document.createElement('span');
      inner.className = 'line-mask-inner';
      inner.innerHTML = line.innerHTML;
      line.innerHTML = '';
      line.appendChild(inner);
    });

    splitInstances.push(split);
  });

  // Section references
  const sections = {
    hero: document.querySelector('.section-hero'),
    inspect: document.querySelector('.section-inspect'),
    rebuild: document.querySelector('.section-rebuild'),
    accessories: document.querySelector('.section-accessories'),
    wifi: document.querySelector('.section-wifi'),
    contact: document.querySelector('.section-contact'),
  };

  const labelCards = document.querySelectorAll('.inspect-label-card');
  const leaderLine = document.querySelector('.inspect-leader-line');

  let activeInspectId = null;
  let isInspectVisible = false;

  // Reveal hero entrance
  function revealHero() {
    const heroTitleInners = document.querySelectorAll('.section-hero .line-mask-inner');
    const heroWordmark = document.querySelector('.hero-wordmark');

    gsap.fromTo(
      heroTitleInners,
      { yPercent: 110 },
      {
        yPercent: 0,
        duration: 1.1,
        stagger: 0.06,
        ease: 'expo.out',
      }
    );

    if (heroWordmark) {
      gsap.fromTo(
        heroWordmark,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 1.4, ease: 'expo.out' }
      );
    }
  }

  // Update visible inspect label
  function setInspectLabel(id) {
    if (activeInspectId === id) return;
    activeInspectId = id;

    labelCards.forEach((card) => {
      if (card.dataset.id === id) {
        card.classList.add('active');
        const inners = card.querySelectorAll('.line-mask-inner');
        gsap.fromTo(
          inners,
          { yPercent: 110 },
          { yPercent: 0, duration: 0.7, ease: 'expo.out' }
        );
      } else {
        card.classList.remove('active');
      }
    });

    if (!id && leaderLine) {
      leaderLine.setAttribute('x1', '0');
      leaderLine.setAttribute('y1', '0');
      leaderLine.setAttribute('x2', '0');
      leaderLine.setAttribute('y2', '0');
    }
  }

  // Per-frame projection of active inspect label
  function updateInspectPosition() {
    if (!isInspectVisible || !activeInspectId) return;

    const labelDef = INSPECT_LABELS.find((l) => l.id === activeInspectId);
    if (!labelDef) return;

    const { width, height } = getSize();
    const isMobile = width <= 768;

    // Project 3D part anchor to 2D screen space
    const screenPos = phone.getPartScreenPosition(labelDef.part, camera, width, height);
    if (!screenPos.visible) return;

    const activeCard = document.querySelector(`.inspect-label-card[data-id="${activeInspectId}"]`);
    if (!activeCard) return;

    if (!isMobile) {
      // Desktop: label always in left column (phone is shifted right into right 55%).
      // Max width is 26vw; we pin the card at a fixed left margin.
      const cardWidth = activeCard.offsetWidth || Math.min(width * 0.26, 340);
      const cardX = 40; // fixed left margin — stays well inside left 45%
      const cardY = Math.min(height - 180, Math.max(100, screenPos.y - 40));

      activeCard.style.left = `${cardX}px`;
      activeCard.style.top = `${cardY}px`;

      if (leaderLine) {
        // Leader line: from the 3D part anchor → the RIGHT edge of the label card
        const lineEndX = cardX + cardWidth;
        const lineEndY = cardY + 20;
        leaderLine.setAttribute('x1', screenPos.x.toFixed(1));
        leaderLine.setAttribute('y1', screenPos.y.toFixed(1));
        leaderLine.setAttribute('x2', lineEndX.toFixed(1));
        leaderLine.setAttribute('y2', lineEndY.toFixed(1));
      }
    }
  }

  function setSectionState(sectionName, opacity, visibility) {
    const el = sections[sectionName];
    if (el) {
      el.style.opacity = opacity;
      el.style.visibility = visibility ? 'visible' : 'hidden';
      el.style.pointerEvents = visibility && opacity > 0.5 ? 'auto' : 'none';
    }

    if (sectionName === 'inspect') {
      isInspectVisible = visibility && opacity > 0.1;
      if (!isInspectVisible) {
        setInspectLabel(null);
      }
    }
  }

  return {
    revealHero,
    setInspectLabel,
    updateInspectPosition,
    setSectionState,
    sections,
  };
}
