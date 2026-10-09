import { BAR_LENGTH, BEAT, renderVoice, scoreBar } from "./musicScore.js";

const STORAGE_KEY = "poker-audio-v2";
const defaults = {
  music: true,
  effects: true,
  musicVolume: 0.32,
  effectsVolume: 0.6,
};

const clamp = (value, fallback) =>
  Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;

function readPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === "object")
      return {
        music: typeof saved.music === "boolean" ? saved.music : defaults.music,
        effects:
          typeof saved.effects === "boolean" ? saved.effects : defaults.effects,
        musicVolume: clamp(saved.musicVolume, defaults.musicVolume),
        effectsVolume: clamp(saved.effectsVolume, defaults.effectsVolume),
      };
    if (localStorage.getItem("poker-sound") === "false")
      return { ...defaults, music: false, effects: false };
  } catch {
    /* Storage can be unavailable in private browsers. */
  }
  return { ...defaults };
}

let preferences = readPreferences();
let context;
let musicGain;
let effectsGain;
let scheduler;
let suspendTimer;
let tableActive = false;
let started = false;
let musicPlaying = false;
let unlocked = false;
let nextBar = 0;
let nextEvent = 0;
let barStart = 0;
let events = [];
const musicSources = new Set();
const effectsSources = new Set();
const listeners = new Set();
const cooldown = new Map();
let snapshot = {
  ...preferences,
  playing: false,
  unlocked: false,
  available: true,
};

function publish() {
  const next = {
    ...preferences,
    playing: musicPlaying,
    unlocked,
    available:
      typeof window !== "undefined" &&
      !!(window.AudioContext || window.webkitAudioContext),
  };
  if (Object.keys(next).every((key) => next[key] === snapshot[key])) return;
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function fade(parameter, value, seconds = 0.18) {
  const now = context.currentTime;
  if (parameter.cancelAndHoldAtTime) parameter.cancelAndHoldAtTime(now);
  else {
    parameter.cancelScheduledValues(now);
    parameter.setValueAtTime(parameter.value, now);
  }
  parameter.linearRampToValueAtTime(value, now + seconds);
}

function track(set) {
  return (stop) => {
    set.add(stop);
    return () => set.delete(stop);
  };
}

function schedule() {
  if (!musicPlaying || !context || context.state !== "running") return;
  // A stalled browser skips ahead rather than playing a backlog of notes.
  if (barStart + BAR_LENGTH < context.currentTime) {
    barStart = context.currentTime + 0.06;
    nextEvent = 0;
    events = scoreBar(nextBar);
  }
  while (
    barStart + events[nextEvent].beat * BEAT <
    context.currentTime + 0.18
  ) {
    const event = events[nextEvent];
    const time = barStart + event.beat * BEAT;
    if (time >= context.currentTime)
      renderVoice(context, musicGain, event, time, track(musicSources));
    nextEvent++;
    if (nextEvent === events.length) {
      nextEvent = 0;
      nextBar++;
      barStart += BAR_LENGTH;
      events = scoreBar(nextBar);
    }
  }
}

function stopMusic() {
  clearInterval(scheduler);
  scheduler = undefined;
  if (!musicPlaying) return;
  musicPlaying = false;
  fade(musicGain.gain, 0);
  // Scheduled voices finish under the fade. On resume, old voices are cleared
  // before the bus opens again, including when the browser suspended its clock.
  publish();
}

function syncPlayback() {
  if (!context) {
    publish();
    return;
  }
  const visible = typeof document === "undefined" || !document.hidden;
  const shouldPlay =
    started &&
    tableActive &&
    visible &&
    preferences.music &&
    preferences.musicVolume > 0 &&
    context.state === "running";
  fade(
    effectsGain.gain,
    preferences.effects && visible ? preferences.effectsVolume : 0,
    0.04,
  );
  if (!shouldPlay) stopMusic();
  else if (!musicPlaying) {
    musicSources.forEach((stop) => stop());
    musicSources.clear();
    musicPlaying = true;
    barStart = context.currentTime + 0.08;
    nextEvent = 0;
    events = scoreBar(nextBar);
    fade(musicGain.gain, preferences.musicVolume, 0.6);
    schedule();
    scheduler = setInterval(schedule, 50);
  } else fade(musicGain.gain, preferences.musicVolume);
  publish();
}

function onVisibility() {
  clearTimeout(suspendTimer);
  if (document.hidden) {
    syncPlayback();
    const current = context;
    suspendTimer = setTimeout(() => {
      if (context === current && document.hidden)
        current?.suspend().catch(() => {});
    }, 220);
  } else if (context) audio.unlock();
}

export const audio = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return snapshot;
  },
  start() {
    if (started) return;
    started = true;
    clearTimeout(suspendTimer);
    document.addEventListener("pointerdown", audio.unlock, { passive: true });
    document.addEventListener("keydown", audio.unlock);
    document.addEventListener("visibilitychange", onVisibility);
    publish();
  },
  stop() {
    started = false;
    tableActive = false;
    stopMusic();
    clearTimeout(suspendTimer);
    document.removeEventListener("pointerdown", audio.unlock);
    document.removeEventListener("keydown", audio.unlock);
    document.removeEventListener("visibilitychange", onVisibility);
    musicSources.forEach((stop) => stop());
    effectsSources.forEach((stop) => stop());
    musicSources.clear();
    effectsSources.clear();
    cooldown.clear();
    if (context) {
      context.onstatechange = null;
      context.close().catch(() => {});
      context = undefined;
    }
    unlocked = false;
    publish();
  },
  setTableActive(value) {
    tableActive = !!value;
    syncPlayback();
  },
  setPreferences(changes) {
    preferences = {
      music:
        typeof changes.music === "boolean" ? changes.music : preferences.music,
      effects:
        typeof changes.effects === "boolean"
          ? changes.effects
          : preferences.effects,
      musicVolume: clamp(changes.musicVolume, preferences.musicVolume),
      effectsVolume: clamp(changes.effectsVolume, preferences.effectsVolume),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      /* Optional persistence. */
    }
    audio.unlock();
    syncPlayback();
  },
  setEnabled(value) {
    audio.setPreferences({ music: !!value, effects: !!value });
  },
  unlock() {
    if (
      typeof window === "undefined" ||
      (!preferences.music && !preferences.effects) ||
      document.hidden
    )
      return;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) {
      publish();
      return;
    }
    if (!context) {
      try {
        context = new Context();
        musicGain = context.createGain();
        effectsGain = context.createGain();
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -12;
        compressor.knee.value = 12;
        compressor.ratio.value = 3;
        musicGain.gain.value = 0;
        effectsGain.gain.value = preferences.effects
          ? preferences.effectsVolume
          : 0;
        musicGain.connect(compressor);
        effectsGain.connect(compressor);
        compressor.connect(context.destination);
        context.onstatechange = () => {
          unlocked = context?.state === "running";
          syncPlayback();
        };
      } catch {
        return;
      }
    }
    const current = context;
    if (current.state === "running") {
      unlocked = true;
      syncPlayback();
    } else
      current
        .resume()
        .then(() => {
          if (context === current) {
            unlocked = current.state === "running";
            syncPlayback();
          }
        })
        .catch(() => {});
  },
  play(kind) {
    if (
      !preferences.effects ||
      !context ||
      context.state !== "running" ||
      document.hidden
    )
      return;
    const now = context.currentTime;
    if (now - (cooldown.get(kind) ?? -Infinity) < 0.12) return;
    cooldown.set(kind, now);
    const render = (voice, note, offset, length, velocity = 1, pan = 0) =>
      renderVoice(
        context,
        effectsGain,
        { voice, note, length, velocity, pan, seconds: true },
        now + offset,
        track(effectsSources),
      );
    if (kind === "deal") {
      render("card", 0, 0, 0.06, 0.6, -0.12);
      render("card", 0, 0.085, 0.06, 0.45, 0.12);
    } else if (kind === "bet") {
      render("chip", 0, 0, 0.025, 0.65);
      render("effect", 83, 0.014, 0.06, 0.22);
      render("chip", 0, 0.07, 0.023, 0.4);
    } else if (kind === "fold") render("card", 0, 0, 0.07, 0.32);
    else if (kind === "check" || kind === "click")
      render("effect", kind === "check" ? 67 : 72, 0, 0.045, 0.3);
    else if (kind === "turn") {
      render("effect", 76, 0, 0.15, 0.55);
      render("effect", 79, 0.11, 0.2, 0.42);
    } else if (kind === "win")
      [72, 76, 79, 83].forEach((note, i) =>
        render("effect", note, i * 0.095, 0.3, 0.5),
      );
  },
};

if (import.meta.hot) import.meta.hot.dispose(() => audio.stop());
