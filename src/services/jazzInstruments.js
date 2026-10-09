const frequency = (midi) => 440 * 2 ** ((midi - 69) / 12);
const noiseBuffers = new WeakMap();

function noiseBuffer(context) {
  if (noiseBuffers.has(context)) return noiseBuffers.get(context);
  const buffer = context.createBuffer(
    1,
    context.sampleRate,
    context.sampleRate,
  );
  const samples = buffer.getChannelData(0);
  let seed = 92137;
  for (let i = 0; i < samples.length; i++) {
    seed = (seed * 16807) % 2147483647;
    samples[i] = (seed / 2147483647) * 2 - 1;
  }
  noiseBuffers.set(context, buffer);
  return buffer;
}

// Each struck instrument has individually decaying partials: the bright attack
// falls away before its fundamental. Nothing is held at a fixed organ-like
// level. Even the quiet echo taps belong to the voice's stop/release handle.
export function createVoiceRenderer(beat, outputTrim = 1) {
  return function renderVoice(
    context,
    destination,
    event,
    start,
    track = () => {},
  ) {
    const { voice, note, velocity = 1, pan = 0 } = event;
    const length = Math.max(0.025, event.length * (event.seconds ? 1 : beat));
    const sources = [];
    const nodes = [];
    const filter = context.createBiquadFilter();
    const level = context.createGain();
    const panner = context.createStereoPanner();
    panner.pan.value = pan;
    filter.type = "lowpass";
    filter.Q.value = 0.45;
    filter.frequency.value = 2800;
    filter.connect(level);
    level.connect(panner);
    panner.connect(destination);
    nodes.push(filter, level, panner);

    const register = (source, amplitude) => {
      source.connect(amplitude);
      amplitude.connect(filter);
      sources.push(source);
      nodes.push(source, amplitude);
    };
    const partial = (
      ratio,
      volume,
      decay,
      attack = 0.006,
      offset = 0,
      tail = 0.18,
      detune = 0,
    ) => {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      const time = start + offset;
      const pitch = frequency(note) * ratio;
      const hold = Math.max(attack + 0.005, length);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(pitch * 2 ** (detune / 1200), time);
      envelope.gain.setValueAtTime(0, time);
      envelope.gain.linearRampToValueAtTime(volume, time + attack);
      envelope.gain.exponentialRampToValueAtTime(
        Math.max(0.00001, volume * Math.exp(-hold / decay)),
        time + hold,
      );
      envelope.gain.exponentialRampToValueAtTime(0.00001, time + hold + tail);
      register(oscillator, envelope);
      oscillator.start(time);
      oscillator.stop(time + hold + tail + 0.02);
    };
    const noise = (volume, duration, attack = 0.006) => {
      const source = context.createBufferSource();
      const envelope = context.createGain();
      source.buffer = noiseBuffer(context);
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(volume, start + attack);
      envelope.gain.exponentialRampToValueAtTime(0.00001, start + duration);
      register(source, envelope);
      source.start(start, 0.17);
      source.stop(start + duration + 0.02);
    };

    if (voice === "piano") {
      level.gain.value = 0.12 * velocity;
      filter.frequency.value = 1700 + velocity * 1900;
      // Slight inharmonicity and fast-decaying upper modes soften to a warm
      // piano body, instead of leaving a bright synth lead between attacks.
      partial(1, 1, 1.55);
      partial(2.002, 0.48, 0.9, 0.004);
      partial(3.009, 0.19, 0.5, 0.003);
      partial(4.02, 0.075, 0.3, 0.003);
      partial(6.045, 0.022, 0.16, 0.002);
      noise(0.032, 0.028, 0.002);
    } else if (voice === "upright") {
      level.gain.value = 0.205 * velocity;
      filter.frequency.value = 1100;
      partial(1, 0.95, 1.2, 0.008, 0, 0.12);
      partial(2.002, 0.32, 0.48, 0.004, 0, 0.1);
      partial(3.008, 0.1, 0.22, 0.003, 0, 0.08);
      noise(0.1, 0.035, 0.002);
    } else if (voice === "electric") {
      level.gain.value = 0.125 * velocity;
      filter.frequency.value = 2000;
      partial(1, 1, 2.4, 0.009, 0, 0.4);
      partial(2.001, 0.28, 1.2, 0.006, 0, 0.35);
      partial(3.003, 0.075, 0.55, 0.005, 0, 0.3);
      partial(7.01, 0.018, 0.12, 0.004, 0, 0.2);
      // A single dark reflection adds depth without a separate effect graph.
      partial(1, 0.12, 1.6, 0.012, beat * 0.75, 0.35);
    } else if (voice === "pad") {
      level.gain.value = 0.036 * velocity;
      filter.frequency.value = 900;
      partial(1, 0.7, 9, 0.65, 0, 1.1, -4);
      partial(1, 0.7, 9, 0.8, 0, 1.1, 4);
      partial(2, 0.11, 4, 0.7, 0, 0.9);
    } else if (voice === "glow") {
      level.gain.value = 0.095 * velocity;
      filter.frequency.value = 2200;
      // A rounded, mallet-like arcade accent, with two quiet dotted echoes.
      [0, 0.75, 1.5].forEach((delay, i) => {
        const volume = [1, 0.22, 0.08][i];
        partial(1, volume, 1.3, 0.012, delay * beat, 0.4);
        partial(3, 0.085 * volume, 0.26, 0.006, delay * beat, 0.25);
      });
    } else if (voice === "roundBass") {
      level.gain.value = 0.18 * velocity;
      filter.frequency.value = 450;
      partial(1, 1, 2.6, 0.024, 0, 0.35);
      partial(2, 0.17, 1.1, 0.02, 0, 0.25);
    } else if (voice === "softKick") {
      level.gain.value = 0.12 * velocity;
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(75, start);
      oscillator.frequency.exponentialRampToValueAtTime(44, start + 0.1);
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(1, start + 0.006);
      envelope.gain.exponentialRampToValueAtTime(0.00001, start + 0.24);
      register(oscillator, envelope);
      oscillator.start(start);
      oscillator.stop(start + 0.26);
    } else {
      const sweep = voice === "sweep";
      level.gain.value = (sweep ? 0.055 : 0.052) * velocity;
      filter.type = "bandpass";
      filter.frequency.value = sweep ? 1800 : 2900;
      filter.Q.value = sweep ? 0.5 : 0.7;
      noise(1, sweep ? length : 0.1, sweep ? 0.05 : 0.003);
    }

    level.gain.value *= outputTrim;
    let remaining = sources.length;
    let stopped = false;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      sources.forEach((source) => {
        try {
          source.stop();
        } catch {
          /* Source has already ended. */
        }
      });
    };
    const release = track(stop) || (() => {});
    sources.forEach((source) => {
      source.onended = () => {
        remaining--;
        if (!remaining) {
          nodes.forEach((node) => node.disconnect());
          release();
        }
      };
    });
  };
}
