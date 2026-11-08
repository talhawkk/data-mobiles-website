/**
 * DATA - Adaptive Quality Controller
 * Enforces frame budget by monitoring 60-frame rolling average.
 * If avg delta > 22ms, steps down performance tiers:
 * Tier 0: Normal DPR (1.5 / 2.0)
 * Tier 1: DPR -> 1.25
 * Tier 2: DPR -> 1.0
 * Tier 3: Disable rim light
 * Tier 4: Freeze idle motion
 * Never steps back up.
 */

export class QualityManager {
  constructor({ renderer, lighting, onFreezeIdle }) {
    this.renderer = renderer;
    this.lighting = lighting;
    this.onFreezeIdle = onFreezeIdle;

    this.frameTimes = [];
    this.maxFrames = 60;
    this.thresholdMs = 22; // ~45fps threshold

    this.currentTier = 0; // 0: Normal, 1: DPR 1.25, 2: DPR 1.0, 3: Rim light off, 4: Idle frozen
    this.idleFrozen = false;
    this.lastTime = performance.now();
    this.cooldownFrames = 30; // Wait 30 frames after downgrade before checking again
    this.framesSinceDowngrade = 0;
  }

  tick() {
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

    if (avg > this.thresholdMs && this.currentTier < 4) {
      this.stepDown();
      this.framesSinceDowngrade = 0;
    }
  }

  stepDown() {
    this.currentTier++;
    switch (this.currentTier) {
      case 1:
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
        break;
      case 2:
        this.renderer.setPixelRatio(1.0);
        break;
      case 3:
        if (this.lighting && this.lighting.rimLight) {
          this.lighting.rimLight.visible = false;
        }
        break;
      case 4:
        this.idleFrozen = true;
        if (typeof this.onFreezeIdle === 'function') {
          this.onFreezeIdle();
        }
        break;
    }
  }

  isIdleFrozen() {
    return this.idleFrozen;
  }
}
