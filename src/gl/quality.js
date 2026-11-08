/**
 * DATA - Adaptive Quality Controller
 * Enforces frame budget by monitoring 60-frame rolling average.
 * Tiers per UPGRADE.md:
 * - Tier 0: High desktop (DPR up to 2.0, full lighting, composer-ready)
 * - Tier 1: Desktop no bloom (DPR up to 1.5)
 * - Tier 2: Mobile / low (DPR max 1.25 / 1.0)
 * URL param ?tier=0|1|2 forces tier.
 */

export class QualityManager {
  constructor({ renderer, lighting, onFreezeIdle, onTierChange }) {
    this.renderer = renderer;
    this.lighting = lighting;
    this.onFreezeIdle = onFreezeIdle;
    this.onTierChange = onTierChange;

    this.frameTimes = [];
    this.maxFrames = 60;
    this.thresholdMs = 22; // ~45fps threshold

    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const forcedTierParam = urlParams?.get('tier');

    const isMobile = typeof window !== 'undefined' && (window.innerWidth <= 768 || window.matchMedia('(max-width: 768px)').matches);

    if (forcedTierParam !== null && ['0', '1', '2'].includes(forcedTierParam)) {
      this.currentTier = parseInt(forcedTierParam, 10);
      this.isForced = true;
    } else {
      this.currentTier = isMobile ? 2 : 0;
      this.isForced = false;
    }
    this.applyTierSettings(this.currentTier);

    this.idleFrozen = false;
    this.lastTime = performance.now();
    this.cooldownFrames = 30; // Wait 30 frames after downgrade before checking again
    this.framesSinceDowngrade = 0;
  }

  applyTierSettings(tier) {
    const dpr = window.devicePixelRatio || 1;
    switch (tier) {
      case 0:
        this.renderer.setPixelRatio(Math.min(dpr, 2.0));
        break;
      case 1:
        this.renderer.setPixelRatio(Math.min(dpr, 1.5));
        break;
      case 2:
        this.renderer.setPixelRatio(Math.min(dpr, 1.0));
        break;
    }
    if (typeof this.onTierChange === 'function') {
      this.onTierChange(tier);
    }
  }

  getTier() {
    return this.currentTier;
  }

  tick() {
    if (this.isForced) return;

    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;

    // Filter out huge background tabs/inactive spikes
    if (delta > 200) return;

    this.frameTimes.push(delta);
    if (this.frameTimes.length > this.maxFrames) {
      this.frameTimes.shift();
    }

    if (this.frameTimes.length < this.maxFrames) return;

    if (this.framesSinceDowngrade < this.cooldownFrames) {
      this.framesSinceDowngrade++;
      return;
    }

    const sum = this.frameTimes.reduce((acc, val) => acc + val, 0);
    const avg = sum / this.frameTimes.length;

    if (avg > this.thresholdMs && this.currentTier < 2) {
      this.stepDown();
      this.framesSinceDowngrade = 0;
    }
  }

  stepDown() {
    if (this.currentTier < 2) {
      this.currentTier++;
      this.applyTierSettings(this.currentTier);
    }
  }

  isIdleFrozen() {
    return this.idleFrozen;
  }
}
