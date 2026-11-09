/**
 * DATA Atelier - Pure Web Audio Haptic & Mechanical Sound Synthesizer
 * Zero external audio files. 100% synthesized in-memory via Web Audio API.
 * Provides Apple/Teenage Engineering grade tactile feedback.
 */

let audioCtx = null;
let isMuted = false;

// Initialize or resume AudioContext on first user interaction
function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Check saved user sound preference (default to enabled on interaction)
try {
  const saved = localStorage.getItem('data_sound_enabled');
  if (saved !== null) {
    isMuted = saved === 'false';
  }
} catch (e) {
  // localStorage blocked or unavailable
}

/**
 * Toggle sound on / off
 */
export function toggleSound() {
  isMuted = !isMuted;
  try {
    localStorage.setItem('data_sound_enabled', String(!isMuted));
  } catch (e) {}
  
  if (!isMuted) {
    getAudioContext();
    playHapticTick(600, 0.04);
  }
  return !isMuted;
}

export function isSoundMuted() {
  return isMuted;
}

/**
 * Crisp mechanical haptic click (Leica dial / digital crown click)
 */
export function playHapticTick(freq = 820, gainVal = 0.035) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== 'running') return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.025);

    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.028);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.03);
  } catch (e) {}
}

/**
 * Deep magnetic snap (when 3D part docks or locks into inspection focus)
 */
export function playSnap() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== 'running') return;

  try {
    const t = ctx.currentTime;
    
    // Low body thud
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(160, t);
    osc1.frequency.exponentialRampToValueAtTime(45, t + 0.08);
    gain1.gain.setValueAtTime(0.06, t);
    gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.085);

    // High mechanical click
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1400, t);
    osc2.frequency.exponentialRampToValueAtTime(300, t + 0.03);
    gain2.gain.setValueAtTime(0.025, t);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t);
    osc2.stop(t + 0.04);
  } catch (e) {}
}

/**
 * Subtle tactile switch click for tabs & filters
 */
export function playSwitch() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== 'running') return;

  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(650, t + 0.018);

    gain.gain.setValueAtTime(0.03, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.022);
  } catch (e) {}
}

/**
 * Initialize audio interaction listeners
 */
export function initAudio() {
  const unlockAudio = () => {
    getAudioContext();
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
}
