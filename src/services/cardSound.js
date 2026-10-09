const DURATION = 0.105;
const buffers = new WeakMap();

function paperNoise(context) {
  if (buffers.has(context)) return buffers.get(context);
  const buffer = context.createBuffer(
    1,
    Math.ceil(context.sampleRate * DURATION),
    context.sampleRate,
  );
  const samples = buffer.getChannelData(0);
  let seed = 29417;
  for (let i = 0; i < samples.length; i++) {
    seed = (seed * 16807) % 2147483647;
    samples[i] = (seed / 2147483647) * 2 - 1;
  }
  buffers.set(context, buffer);
  return buffer;
}

// One short paper flick per dealt card. The small second envelope peak gives
// the card a soft contact sound without adding a pitched note or another source.
export function renderCardSound(context, destination, start, track = () => {}) {
  const source = context.createBufferSource();
  const paper = context.createBiquadFilter();
  const soften = context.createBiquadFilter();
  const envelope = context.createGain();
  source.buffer = paperNoise(context);
  paper.type = "bandpass";
  paper.frequency.setValueAtTime(1700, start);
  paper.frequency.exponentialRampToValueAtTime(1050, start + DURATION);
  paper.Q.value = 0.55;
  soften.type = "lowpass";
  soften.frequency.value = 3600;
  soften.Q.value = 0.4;
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(0.11, start + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.015, start + 0.047);
  envelope.gain.linearRampToValueAtTime(0.045, start + 0.054);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.099);
  envelope.gain.linearRampToValueAtTime(0, start + DURATION);
  source.connect(paper);
  paper.connect(soften);
  soften.connect(envelope);
  envelope.connect(destination);

  let disposed = false;
  let release;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    source.onended = null;
    source.disconnect();
    paper.disconnect();
    soften.disconnect();
    envelope.disconnect();
    release?.();
  };
  const stop = () => {
    if (disposed) return;
    try {
      source.stop();
    } catch {
      /* Already ended. */
    }
    // Disconnect immediately even if a suspended audio clock delays onended.
    dispose();
  };
  release = track(stop);
  source.onended = dispose;
  source.start(start);
  source.stop(start + DURATION);
  return stop;
}
