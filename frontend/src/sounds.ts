let context: AudioContext | undefined;

function audio() {
  context ??= new AudioContext();
  if (context.state === 'suspended') void context.resume();
  return context;
}

export function unlockAudio() {
  try { audio(); } catch { /* Sound is optional if the browser blocks audio. */ }
}

function tone(ctx: AudioContext, frequency: number, start: number, duration: number, wave: OscillatorType, volume: number, endFrequency = frequency) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
  gain.gain.setValueAtTime(0.001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.01);
}

export function playReveal() {
  try {
    const ctx = audio(); const now = ctx.currentTime;
    // One bright bell strike with a short metallic shimmer.
    tone(ctx, 587, now, 0.72, 'sine', 0.19);
    tone(ctx, 1179, now, 0.42, 'sine', 0.095);
    tone(ctx, 2308, now, 0.19, 'sine', 0.045);
  } catch { /* Sound is optional if the browser blocks audio. */ }
}

export function playStrike() {
  try {
    const ctx = audio(); const now = ctx.currentTime;
    // Close, dissonant low notes give the strike its buzzer character.
    tone(ctx, 122, now, 0.78, 'sawtooth', 0.13, 112);
    tone(ctx, 129, now, 0.78, 'square', 0.075, 119);
    tone(ctx, 61, now, 0.7, 'sine', 0.15, 56);
  } catch { /* Sound is optional if the browser blocks audio. */ }
}
