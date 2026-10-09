// Original piano-trio arrangement in B-flat. The bass alternates a two-feel
// with walking turnarounds; piano phrases leave space for the brushes.
export const BEAT = 60 / 92;
export const BAR_LENGTH = BEAT * 4;

const changes = [
  {
    root: 34,
    chord: [53, 57, 60, 62],
    line: [
      [0.64, 74, 0.7],
      [2.02, 72, 0.42],
      [2.65, 70, 0.8],
    ],
  },
  {
    root: 31,
    chord: [53, 56, 59, 62],
    line: [
      [1.02, 71, 0.48],
      [1.66, 74, 0.7],
    ],
  },
  { root: 36, chord: [51, 58, 62, 65], line: [] },
  {
    root: 29,
    chord: [51, 57, 62, 67],
    line: [
      [0.65, 69, 0.48],
      [1.65, 67, 0.7],
      [3.02, 65, 0.55],
    ],
  },
  {
    root: 34,
    chord: [53, 57, 60, 62],
    line: [
      [0.02, 62, 1.1],
      [2.66, 65, 0.58],
    ],
  },
  {
    root: 39,
    chord: [55, 58, 62, 65],
    line: [
      [0.65, 67, 0.5],
      [1.66, 70, 0.7],
      [3.02, 69, 0.5],
    ],
  },
  { root: 39, chord: [54, 58, 60, 65], line: [] },
  {
    root: 38,
    chord: [53, 57, 60, 62],
    line: [
      [1.02, 65, 0.7],
      [2.65, 62, 1],
    ],
  },
  {
    root: 38,
    chord: [53, 57, 60, 64],
    line: [
      [0.65, 69, 0.45],
      [1.65, 72, 0.7],
      [3.02, 69, 0.45],
    ],
  },
  {
    root: 31,
    chord: [53, 59, 64, 68],
    line: [
      [0.03, 68, 0.8],
      [2.03, 64, 0.75],
    ],
  },
  { root: 36, chord: [51, 58, 62, 65], line: [] },
  {
    root: 29,
    chord: [51, 57, 62, 67],
    line: [
      [1.65, 67, 0.6],
      [2.65, 69, 0.65],
    ],
  },
  {
    root: 33,
    chord: [55, 60, 63, 67],
    line: [
      [0.64, 72, 1.15],
      [2.65, 67, 0.65],
    ],
  },
  {
    root: 38,
    chord: [54, 60, 63, 69],
    line: [
      [1.03, 66, 0.7],
      [2.65, 69, 0.62],
    ],
  },
  { root: 31, chord: [53, 58, 62, 69], line: [[0.02, 70, 1.65]] },
  { root: 29, chord: [51, 57, 62, 67], line: [] },
];

export function scoreBar(barNumber) {
  const index = barNumber % changes.length;
  const chorus = Math.floor(barNumber / changes.length);
  const { root, chord, line } = changes[index];
  const nextRoot = changes[(index + 1) % changes.length].root;
  const events = [];
  const add = (voice, beat, note, length, velocity = 1, pan = 0) =>
    events.push({ voice, beat, note, length, velocity, pan });

  const walking = index % 4 === 3 || (chorus % 3 === 2 && index >= 8);
  add("upright", 0, root, walking ? 0.83 : 1.65, 0.83, -0.12);
  if (walking) {
    add("upright", 1.025, root + 7, 0.78, 0.61, -0.12);
    add("upright", 2.015, root + 12, 0.82, 0.7, -0.12);
    add(
      "upright",
      3.02,
      nextRoot + (index % 8 === 7 ? -1 : 1),
      0.8,
      0.58,
      -0.12,
    );
  } else {
    add("upright", 2.025, root + 7, 1.45, 0.68, -0.12);
  }

  const compBeats =
    index % 4 === 2 ? [1.66] : index % 4 === 1 ? [0.035, 3.02] : [0.035, 2.65];
  compBeats.forEach((beat, hit) => {
    chord.forEach((note, i) => {
      add(
        "piano",
        beat + i * 0.012,
        note,
        hit ? 0.82 : 1.4,
        (hit ? 0.39 : 0.48) + i * 0.023,
        (i - 1.5) * 0.1 - 0.1,
      );
    });
  });
  // Every third chorus gives the bass a little more room.
  if (chorus % 3 !== 2 || index % 4 === 0) {
    line.forEach(([beat, note, length], i) =>
      add("piano", beat, note, length, [0.72, 0.62, 0.67][i % 3], 0.17),
    );
  }
  for (let beat = 0; beat < 4; beat++) {
    add("sweep", beat + 0.012, 0, 0.54, beat % 2 ? 0.47 : 0.3, 0.27);
    if (beat % 2) add("brushTap", beat + 0.028, 0, 0.11, 0.58, 0.14);
  }
  add("softKick", 0.012, 0, 0.22, 0.37);
  if (index % 2 === 1) add("softKick", 2.02, 0, 0.18, 0.25);
  return events.sort((a, b) => a.beat - b.beat);
}
