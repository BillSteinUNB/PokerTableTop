// An original, quiet 16-bar lounge loop. Notes use MIDI pitch and beat positions.
// The melody leaves whole bars open; alternate choruses thin the arrangement.
export const TEMPO = 86;
export const BEAT = 60 / TEMPO;
export const BAR_LENGTH = 4 * BEAT;

const harmony = [
  {
    bass: 36,
    chord: [52, 59, 62, 67],
    melody: [
      [0.5, 76, 0.7],
      [2, 74, 0.55],
      [2.6, 71, 0.8],
    ],
  },
  {
    bass: 33,
    chord: [55, 59, 60, 64],
    melody: [
      [1.6, 72, 0.6],
      [2.6, 71, 0.85],
    ],
  },
  { bass: 38, chord: [53, 60, 64, 69], melody: [] },
  {
    bass: 31,
    chord: [53, 59, 64, 69],
    melody: [
      [1, 69, 0.5],
      [1.6, 71, 0.5],
      [2.6, 74, 0.75],
    ],
  },
  {
    bass: 40,
    chord: [56, 62, 65, 71],
    melody: [
      [0.6, 74, 0.7],
      [2, 71, 0.6],
    ],
  },
  {
    bass: 33,
    chord: [55, 59, 60, 64],
    melody: [
      [1.6, 72, 0.65],
      [2.6, 76, 0.8],
    ],
  },
  { bass: 38, chord: [54, 60, 64, 69], melody: [] },
  {
    bass: 31,
    chord: [53, 59, 64, 69],
    melody: [
      [2, 74, 0.5],
      [2.6, 71, 0.55],
      [3.6, 69, 0.3],
    ],
  },
  {
    bass: 29,
    chord: [52, 57, 60, 67],
    melody: [
      [0.6, 69, 0.6],
      [2, 72, 0.9],
    ],
  },
  {
    bass: 29,
    chord: [53, 56, 62, 67],
    melody: [
      [1.6, 71, 0.6],
      [2.6, 68, 0.9],
    ],
  },
  { bass: 40, chord: [55, 59, 62, 66], melody: [] },
  {
    bass: 33,
    chord: [55, 61, 64, 70],
    melody: [
      [1.6, 73, 0.5],
      [2.6, 70, 0.9],
    ],
  },
  {
    bass: 38,
    chord: [53, 60, 64, 69],
    melody: [
      [0.6, 69, 0.8],
      [2.6, 72, 0.6],
    ],
  },
  {
    bass: 31,
    chord: [53, 59, 64, 69],
    melody: [
      [1, 71, 0.7],
      [2.6, 69, 0.8],
    ],
  },
  { bass: 36, chord: [52, 59, 62, 67], melody: [[0.6, 67, 1.8]] },
  { bass: 31, chord: [53, 59, 64, 69], melody: [] },
];

export function scoreBar(barNumber) {
  const index = barNumber % harmony.length;
  const chorus = Math.floor(barNumber / harmony.length);
  const { bass, chord, melody } = harmony[index];
  const events = [];
  const add = (voice, beat, note, length, velocity = 1, pan = 0) =>
    events.push({ voice, beat, note, length, velocity, pan });

  // Root/fifth two-feel, with a short approach into each fourth bar.
  add("bass", 0, bass, 1.5, 0.88);
  add("bass", 2.03, bass + (index % 4 === 3 ? 12 : 7), 1.25, 0.7);
  if (index % 4 === 2)
    add("bass", 3.6, harmony[(index + 1) % 16].bass + 1, 0.32, 0.4);
  chord.forEach((note, i) => {
    add("keys", 0.035 + i * 0.016, note, 1.45, 0.6, (i - 1.5) * 0.17);
    if (index % 4 !== 2)
      add("keys", 2.6 + i * 0.012, note, 0.82, 0.36, (i - 1.5) * 0.17);
  });
  if (chorus % 3 !== 1 || index >= 8) {
    melody.forEach(([beat, note, length]) =>
      add("lead", beat, note, length, 0.56, 0.12),
    );
  }
  for (let beat = 0; beat < 4; beat++) {
    add("hat", beat, 0, 0.055, beat % 2 ? 0.42 : 0.25, 0.24);
    if (beat % 2 === 0) add("hat", beat + 0.6, 0, 0.035, 0.17, 0.24);
  }
  add("kick", 0, 0, 0.12, 0.45);
  add("brush", 1.01, 0, 0.13, 0.44, -0.15);
  add("brush", 3.01, 0, 0.1, 0.36, -0.15);
  return events.sort((a, b) => a.beat - b.beat);
}

const frequency = (midi) => 440 * 2 ** ((midi - 69) / 12);
const noiseBuffers = new WeakMap();

function noiseBuffer(context) {
  if (noiseBuffers.has(context)) return noiseBuffers.get(context);
  const buffer = context.createBuffer(
    1,
    context.sampleRate,
    context.sampleRate,
  );
  const values = buffer.getChannelData(0);
  let seed = 1771;
  for (let i = 0; i < values.length; i++) {
    seed = (seed * 16807) % 2147483647;
    values[i] = (seed / 2147483647) * 2 - 1;
  }
  noiseBuffers.set(context, buffer);
  return buffer;
}

// Shared by the live scheduler and offline rendering, so sample exports exercise
// exactly the same instruments heard at the table.
export function renderVoice(
  context,
  destination,
  event,
  start,
  track = () => {},
) {
  const { voice, note, velocity = 1, pan = 0 } = event;
  const length = event.length * (event.seconds ? 1 : BEAT);
  const envelope = context.createGain();
  const filter = context.createBiquadFilter();
  const panner = context.createStereoPanner();
  panner.pan.value = pan;
  filter.type = "lowpass";
  filter.frequency.value =
    voice === "bass" ? 500 : voice === "keys" ? 1900 : 2500;
  filter.Q.value = 0.4;
  envelope.connect(filter);
  filter.connect(panner);
  panner.connect(destination);
  const sources = [];
  const end = start + length + 0.16;
  const source = (type, pitch, gain = 1) => {
    const oscillator = context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(pitch, start);
    const level = context.createGain();
    level.gain.value = gain;
    oscillator.connect(level);
    level.connect(envelope);
    oscillator.start(start);
    oscillator.stop(end);
    sources.push({ node: oscillator, extra: level });
    return oscillator;
  };
  let peak = 0.08;
  let attack = 0.012;
  if (["hat", "brush", "card", "chip"].includes(voice)) {
    const noise = context.createBufferSource();
    noise.buffer = noiseBuffer(context);
    noise.connect(envelope);
    noise.start(start, voice === "brush" ? 0.3 : 0.1);
    noise.stop(end);
    sources.push({ node: noise });
    filter.type = "bandpass";
    filter.frequency.value =
      voice === "card"
        ? 3400
        : voice === "chip"
          ? 2200
          : voice === "brush"
            ? 2600
            : 6200;
    filter.Q.value = voice === "chip" ? 4 : 0.7;
    peak = voice === "hat" ? 0.048 : voice === "brush" ? 0.037 : 0.19;
    attack = 0.002;
  } else if (voice === "kick") {
    const oscillator = source("sine", 86);
    oscillator.frequency.exponentialRampToValueAtTime(43, start + 0.08);
    peak = 0.13;
    attack = 0.004;
  } else if (voice === "bass") {
    source("sine", frequency(note), 0.9);
    source("triangle", frequency(note), 0.3);
    peak = 0.21;
    attack = 0.022;
  } else if (voice === "keys") {
    source("sine", frequency(note), 0.8);
    source("triangle", frequency(note) * 2, 0.13);
    peak = 0.11;
    attack = 0.009;
  } else {
    source("triangle", frequency(note), 0.8);
    source("sine", frequency(note) * 2, 0.12);
    peak = voice === "effect" ? 0.12 : 0.095;
  }
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(peak * velocity, start + attack);
  envelope.gain.exponentialRampToValueAtTime(
    Math.max(0.0001, peak * velocity * 0.25),
    start + Math.max(attack + 0.001, length * 0.8),
  );
  envelope.gain.exponentialRampToValueAtTime(0.0001, end - 0.01);
  let remaining = sources.length;
  const stop = () =>
    sources.forEach(({ node }) => {
      try {
        node.stop();
      } catch {
        /* Already ended. */
      }
    });
  const release = track(stop) || (() => {});
  sources.forEach(({ node, extra }) => {
    node.onended = () => {
      node.disconnect();
      extra?.disconnect();
      remaining--;
      if (!remaining) {
        envelope.disconnect();
        filter.disconnect();
        panner.disconnect();
        release();
      }
    };
  });
}
