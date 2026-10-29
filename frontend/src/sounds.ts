let context: AudioContext | undefined;
const clips = {
  reveal: '/sounds/good-answer.mp3',
  strike: '/sounds/wrong-answer.mp3',
} as const;
const data = Object.fromEntries(Object.entries(clips).map(([key, url]) => [key, fetch(url).then(response => {
  if (!response.ok) throw Error(`Could not load ${url}`);
  return response.arrayBuffer();
})])) as Record<keyof typeof clips, Promise<ArrayBuffer>>;
const decoded = new Map<keyof typeof clips, Promise<AudioBuffer>>();

function audio() {
  context ??= new AudioContext();
  if (context.state === 'suspended') void context.resume();
  return context;
}

export function unlockAudio() {
  try { audio(); } catch { /* Sound is optional if the browser blocks audio. */ }
}

async function play(kind: keyof typeof clips) {
  try {
    const ctx = audio();
    if (!decoded.has(kind)) decoded.set(kind, data[kind].then(bytes => ctx.decodeAudioData(bytes.slice(0))));
    const buffer = await decoded.get(kind)!;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  } catch { /* Game controls continue to work if audio cannot play. */ }
}

export function playReveal() { void play('reveal'); }
export function playStrike() { void play('strike'); }
