// Sizzle & Serve — sound: a tiny WebAudio synth.
// One file, one job: every noise the game makes, built from oscillators
// and filtered noise. No audio files, no network, and silence when the
// browser has no audio or the player muted it.

let context = null;
let muted = false;

/** True when the player asked for silence. */
export function isMuted() {
  return muted;
}

/** Flip the mute switch and return the new state. */
export function toggleMute() {
  muted = !muted;
  return muted;
}

function audio() {
  if (muted) return null;
  try {
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    }
    if (context.state === 'suspended') context.resume();
    return context;
  } catch {
    return null;
  }
}

/** A short tone: frequency, seconds, shape and volume. */
function tone(freq, seconds, type, volume, when) {
  const ctx = audio();
  if (!ctx) return;
  const start = ctx.currentTime + (when || 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + seconds + 0.02);
}

/** A burst of filtered noise, for sizzles and chops. */
function noise(seconds, volume, freq) {
  const ctx = audio();
  if (!ctx) return;
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

/** A station started cooking: a soft sizzle. */
export function playSizzle() {
  noise(0.25, 0.12, 3200);
}

/** An item landed on the plate: a quick pop. */
export function playPop() {
  tone(620, 0.09, 'sine', 0.16);
}

/** A dish was served: a happy two-note ding. */
export function playDing() {
  tone(880, 0.14, 'triangle', 0.18);
  tone(1318, 0.2, 'triangle', 0.16, 0.1);
}

/** An order walked out: a low, sad buzz. */
export function playBuzz() {
  tone(180, 0.3, 'sawtooth', 0.1);
  tone(140, 0.35, 'sawtooth', 0.1, 0.12);
}

/** The shift ended: a little three-note fanfare. */
export function playFanfare() {
  tone(523, 0.16, 'triangle', 0.18);
  tone(659, 0.16, 'triangle', 0.18, 0.14);
  tone(784, 0.3, 'triangle', 0.2, 0.28);
}
