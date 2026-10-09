let context;
let enabled = false;
export const audio = {
  setEnabled(value) {
    enabled = value;
    if (value) audio.unlock();
  },
  unlock() {
    if (!enabled) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    context ||= new AudioContextClass();
    context.resume().catch(() => {});
  },
  play(kind) {
    if (!enabled || !context || context.state !== "running") return;
    const notes = {
      deal: [500, 700],
      turn: [660, 880],
      win: [523, 659, 784, 1047],
      click: [440],
    }[kind] || [440];
    notes.forEach((frequency, i) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + i * 0.08;
      oscillator.type = "square";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.022, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.09);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.1);
    });
  },
};
