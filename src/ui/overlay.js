import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText.js';
import { INSPECT_LABELS } from '../config.js';
import { playHapticTick, playSnap, playSwitch } from './audio.js';

gsap.registerPlugin(SplitText);

/**
 * Overlay View Controller
 * Manages DOM text reveals, SplitText line masks,
 * and 3D projected inspect labels.
 */
export function initOverlay({ phone, camera, getSize, onNavigate }) {
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

  // Prepare word split on rebuild title and subline (U5 Item 3)
  const rebuildTitle = document.querySelector('.rebuild-title');
  const rebuildSubline = document.querySelector('.rebuild-subline');

  if (rebuildTitle) {
    const splitTitle = new SplitText(rebuildTitle, {
      type: 'words',
      wordsClass: 'word-mask',
    });
    splitTitle.words.forEach((word) => {
      const inner = document.createElement('span');
      inner.className = 'word-mask-inner';
      inner.innerHTML = word.innerHTML;
      word.innerHTML = '';
      word.appendChild(inner);
    });
    splitInstances.push(splitTitle);
  }

  if (rebuildSubline) {
    const splitSubline = new SplitText(rebuildSubline, {
      type: 'words',
      wordsClass: 'word-mask',
    });
    splitSubline.words.forEach((word) => {
      const inner = document.createElement('span');
      inner.className = 'word-mask-inner';
      inner.innerHTML = word.innerHTML;
      word.innerHTML = '';
      word.appendChild(inner);
    });
    splitInstances.push(splitSubline);
  }

  // Section references
  const sections = {
    hero: document.querySelector('.section-hero'),
    teardownIntro: document.querySelector('.section-teardown-intro'),
    inspect: document.querySelector('.section-inspect'),
    rebuild: document.querySelector('.section-rebuild'),
    accessories: document.querySelector('.section-accessories'),
    wifi: document.querySelector('.section-wifi'),
    contact: document.querySelector('.section-contact'),
  };

  const labelCards = document.querySelectorAll('.inspect-label-card');
  const elbowLine = document.querySelector('.inspect-elbow-line');
  const anchorDot = document.querySelector('.inspect-anchor-dot');
  const anchorNum = document.querySelector('.inspect-anchor-num');
  const railItems = document.querySelectorAll('.rail-item');

  // Interactive Index Rail Navigation (UPGRADE.md U3)
  const INSPECT_PROGRESS_MAP = {
    battery: 0.23,
    board: 0.30,
    camera: 0.37,
    port: 0.44,
    screen: 0.52,
  };

  railItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      playSnap();
      const id = item.dataset.id;
      if (id && INSPECT_PROGRESS_MAP[id] !== undefined && typeof onNavigate === 'function') {
        onNavigate(INSPECT_PROGRESS_MAP[id]);
      }
    });
  });

  const accRailItems = document.querySelectorAll('.acc-rail-item');
  const ACC_PROGRESS_MAP = [0.68, 0.72, 0.75, 0.78];
  accRailItems.forEach((item, idx) => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      playHapticTick(720, 0.03);
      if (typeof onNavigate === 'function') {
        onNavigate(ACC_PROGRESS_MAP[idx] || 0.68);
      }
    });
  });

  const wifiPlanRows = document.querySelectorAll('.wifi-plan-row');
  const WIFI_PROGRESS_MAP = [0.83, 0.86, 0.89];
  wifiPlanRows.forEach((row, idx) => {
    row.addEventListener('click', (e) => {
      e.stopPropagation();
      playHapticTick(680, 0.035);
      if (typeof onNavigate === 'function') {
        onNavigate(WIFI_PROGRESS_MAP[idx] || 0.83);
      }
    });
  });

  // Interactive Symptom Selection Chips
  const symptomTags = document.querySelectorAll('.symptom-tag');
  symptomTags.forEach((tag) => {
    tag.addEventListener('click', (e) => {
      e.stopPropagation();
      tag.classList.toggle('selected');
      playSwitch();
    });
  });

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

  let lastPlayedInspectId = null;

  // Update visible inspect label & rail item
  function setInspectLabel(id) {
    if (id && id !== lastPlayedInspectId) {
      playSnap();
      lastPlayedInspectId = id;
    } else if (!id) {
      lastPlayedInspectId = null;
    }
    activeInspectId = id;

    // Highlight active index rail item
    railItems.forEach((item) => {
      if (item.dataset.id === id) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    labelCards.forEach((card) => {
      if (card.dataset.id === id) {
        card.classList.add('active');
        card.style.opacity = '1';
        card.style.visibility = 'visible';
        card.style.display = 'block';
        const inners = card.querySelectorAll('.line-mask-inner');
        gsap.fromTo(
          inners,
          { yPercent: 110 },
          { yPercent: 0, duration: 0.5, ease: 'expo.out' }
        );
      } else {
        card.classList.remove('active');
        card.style.opacity = '0';
        card.style.visibility = 'hidden';
        card.style.display = 'none';
      }
    });

    if (!id) {
      if (elbowLine) elbowLine.setAttribute('d', 'M 0 0 L 0 0');
      if (anchorDot) anchorDot.setAttribute('cx', '-100');
      if (anchorNum) anchorNum.setAttribute('x', '-100');
    }
  }

  // Per-frame projection of active inspect label, 24px elbow line, and anchor marker
  function updateInspectPosition() {
    const hasCard = isInspectVisible && !!activeInspectId;
    document.body.classList.toggle('has-inspect-card', hasCard);

    if (!hasCard) {
      labelCards.forEach((card) => {
        card.classList.remove('active');
        card.style.opacity = '0';
        card.style.visibility = 'hidden';
        card.style.display = 'none';
      });
      if (elbowLine) elbowLine.setAttribute('d', 'M 0 0 L 0 0');
      if (anchorDot) anchorDot.setAttribute('cx', '-100');
      if (anchorNum) anchorNum.setAttribute('x', '-100');
      return;
    }

    const labelDef = INSPECT_LABELS.find((l) => l.id === activeInspectId);
    if (!labelDef) return;

    // Strictly ensure all other cards are hidden (no overlapping ghost text)
    labelCards.forEach((card) => {
      if (card.dataset.id !== activeInspectId) {
        card.classList.remove('active');
        card.style.opacity = '0';
        card.style.visibility = 'hidden';
        card.style.display = 'none';
      }
    });

    const activeCard = document.querySelector(`.inspect-label-card[data-id="${activeInspectId}"]`);
    if (!activeCard) return;

    const { width, height } = getSize();
    const isMobile = width < 1024;

    // Project 3D part anchor to 2D screen space
    const screenPos = phone.getPartScreenPosition(labelDef.part, camera, width, height);
    if (!screenPos.visible) {
      activeCard.classList.remove('active');
      activeCard.style.opacity = '0';
      activeCard.style.visibility = 'hidden';
      activeCard.style.display = 'none';
      return;
    }

    activeCard.classList.add('active');
    activeCard.style.opacity = '1';
    activeCard.style.visibility = 'visible';
    activeCard.style.display = 'block';

    if (!isMobile) {
      // Desktop: Dedicated info column placed comfortably right of the index rail (zero collision)
      const containerPad = Math.max(24, Math.min(width * 0.05, 64));
      const cardX = Math.max(containerPad + 180, Math.min(width * 0.18, 300));
      const cardY = Math.max(110, Math.min(height - 380, Math.round((height - 340) / 2)));

      activeCard.style.left = `${cardX}px`;
      activeCard.style.top = `${cardY}px`;

      // Clean, refined 28px horizontal indicator tick directly attached to 3D part anchor (no ugly cross-screen diagonal wire)
      if (elbowLine) {
        const pX = screenPos.x;
        const pY = screenPos.y;
        const tickX = pX - 28;
        elbowLine.setAttribute(
          'd',
          `M ${pX.toFixed(1)} ${pY.toFixed(1)} L ${tickX.toFixed(1)} ${pY.toFixed(1)}`
        );
      }

      if (anchorDot) {
        anchorDot.setAttribute('cx', screenPos.x.toFixed(1));
        anchorDot.setAttribute('cy', screenPos.y.toFixed(1));
      }

      if (anchorNum) {
        anchorNum.setAttribute('x', (screenPos.x - 48).toFixed(1));
        anchorNum.setAttribute('y', (screenPos.y + 4).toFixed(1));
        anchorNum.textContent = labelDef.number || '01';
      }
    } else {
      // Mobile: short 1px vertical stem (UPGRADE.md U9)
      if (elbowLine) {
        const pX = screenPos.x;
        const pY = screenPos.y;
        const stemEndY = pY + 22; // 22px short vertical stem
        elbowLine.setAttribute(
          'd',
          `M ${pX.toFixed(1)} ${pY.toFixed(1)} L ${pX.toFixed(1)} ${stemEndY.toFixed(1)}`
        );
      }

      if (anchorDot) {
        anchorDot.setAttribute('cx', screenPos.x.toFixed(1));
        anchorDot.setAttribute('cy', screenPos.y.toFixed(1));
      }

      if (anchorNum) {
        anchorNum.setAttribute('x', (screenPos.x + 8).toFixed(1));
        anchorNum.setAttribute('y', (screenPos.y - 8).toFixed(1));
        anchorNum.textContent = labelDef.number || '01';
      }
    }
  }

  function setAccessoryBeat(beatIndex) {
    accRailItems.forEach((item, idx) => {
      if (idx === beatIndex) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  function setWifiPlan(planIndex) {
    wifiPlanRows.forEach((row, idx) => {
      if (idx === planIndex) {
        row.classList.add('active');
      } else {
        row.classList.remove('active');
      }
    });
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

    if (sectionName === 'contact') {
      document.body.classList.toggle('finale-active', visibility && opacity > 0.3);
    }
  }

  return {
    revealHero,
    setInspectLabel,
    setAccessoryBeat,
    setWifiPlan,
    updateInspectPosition,
    setSectionState,
    sections,
  };
}
