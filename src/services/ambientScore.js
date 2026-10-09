// A separate, slower D-minor composition. Long voicings and little fragments
// answer one another over a sparse half-time rhythm.
export const BEAT = 60 / 72;
export const BAR_LENGTH = BEAT * 4;

const changes = [
  { root: 38, chord: [53, 60, 64, 69], line: [[1.5, 76, 1.05]] },
  {
    root: 38,
    chord: [53, 57, 60, 64],
    line: [
      [0.75, 72, 0.9],
      [2.75, 69, 0.75],
    ],
  },
  { root: 31, chord: [53, 58, 60, 65], line: [] },
  { root: 31, chord: [53, 57, 58, 62], line: [[2.5, 65, 1.2]] },
  { root: 34, chord: [53, 57, 60, 62], line: [[1.5, 69, 1.3]] },
  { root: 36, chord: [52, 57, 62, 67], line: [] },
  {
    root: 29,
    chord: [52, 57, 60, 67],
    line: [
      [0.75, 67, 0.75],
      [2.5, 64, 0.95],
    ],
  },
  { root: 33, chord: [55, 58, 62, 64], line: [] },
  {
    root: 40,
    chord: [55, 58, 62, 65],
    line: [
      [1.5, 74, 0.9],
      [3.25, 70, 0.55],
    ],
  },
  { root: 33, chord: [55, 61, 64, 70], line: [[1.75, 73, 1.4]] },
  { root: 38, chord: [53, 57, 60, 64], line: [] },
  { root: 38, chord: [53, 60, 64, 69], line: [[2.5, 69, 1.1]] },
  {
    root: 34,
    chord: [53, 57, 60, 65],
    line: [
      [0.75, 72, 1.2],
      [2.75, 69, 0.7],
    ],
  },
  { root: 31, chord: [53, 57, 58, 62], line: [] },
  { root: 40, chord: [55, 58, 62, 65], line: [[1.5, 65, 1.1]] },
  { root: 33, chord: [55, 61, 64, 70], line: [] },
];

export function scoreBar(barNumber) {
  const index = barNumber % changes.length;
  const chorus = Math.floor(barNumber / changes.length);
  const { root, chord, line } = changes[index];
  const events = [];
  const add = (voice, beat, note, length, velocity = 1, pan = 0) =>
    events.push({ voice, beat, note, length, velocity, pan });

  add("roundBass", 0.01, root, 3.1, 0.69, -0.06);
  if (index % 4 === 3) add("roundBass", 3.25, root + 7, 0.6, 0.33, -0.06);
  // Pads enter every other measure, while keys supply the moving harmony.
  if (index % 2 === 0) {
    [chord[0], chord[2], chord[3]].forEach((note, i) =>
      add("pad", 0.05 + i * 0.022, note - 12, 6.7, 0.5, (i - 1) * 0.48),
    );
  }
  chord.forEach((note, i) =>
    add(
      "electric",
      0.045 + i * 0.035,
      note,
      2.6,
      0.43 + i * 0.027,
      (i - 1.5) * 0.19,
    ),
  );
  if (chorus % 2 === 0 || index >= 8) {
    line.forEach(([beat, note, length], i) =>
      add("glow", beat, note, length, i ? 0.42 : 0.51, 0.22),
    );
  }
  add("softKick", 0.025, 0, 0.27, 0.4);
  add("sweep", 2.03, 0, 0.75, 0.45, -0.24);
  if (index % 2 === 1) add("brushTap", 3.51, 0, 0.12, 0.28, 0.3);
  return events.sort((a, b) => a.beat - b.beat);
}
