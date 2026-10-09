import { renderVoice } from "./musicScore.js";
import { getMusicTrack } from "./musicTracks.js";
import { renderCardSound } from "./cardSound.js";

const STORAGE_KEY = "poker-audio-v2";
const defaults = {
  music: true,
  effects: true,
  musicTrack: "jazz",
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
        musicTrack: getMusicTrack(saved.musicTrack).id,
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
let playback;
const retiring = new Set();
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

function schedule(current) {
  if (playback !== current || !context || context.state !== "running") return;
  const { arrangement } = current;
  // A stalled browser skips ahead rather than playing a backlog of notes.
  if (current.barStart + arrangement.barLength < context.currentTime) {
    current.barStart = context.currentTime + 0.06;
    current.nextEvent = 0;
    current.events = arrangement.scoreBar(current.nextBar);
  }
  while (
    current.barStart +
      current.events[current.nextEvent].beat * arrangement.beat <
    context.currentTime + 0.18
  ) {
    const event = current.events[current.nextEvent];
    const time = current.barStart + event.beat * arrangement.beat;
    if (time >= context.currentTime)
      arrangement.renderVoice(
        context,
        current.gain,
        event,
        time,
        track(current.sources),
      );
    current.nextEvent++;
    if (current.nextEvent === current.events.length) {
      current.nextEvent = 0;
      current.nextBar++;
      current.barStart += arrangement.barLength;
      current.events = arrangement.scoreBar(current.nextBar);
    }
  }
}

function disposePlayback(current) {
  clearTimeout(current.cleanup);
  // Disconnect even if a hidden tab suspended the audio clock during the fade.
  current.gain.disconnect();
  current.sources.forEach((stop) => stop());
  current.sources.clear();
  retiring.delete(current);
}

function stopMusic() {
  clearInterval(scheduler);
  scheduler = undefined;
  if (!playback) return;
  const current = playback;
  playback = undefined;
  musicPlaying = false;
  fade(current.gain.gain, 0);
  current.fadeEnd = context.currentTime + 0.18;
  retiring.add(current);
  current.cleanup = setTimeout(() => disposePlayback(current), 200);
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
  else {
    if (playback?.arrangement.id !== preferences.musicTrack) stopMusic();
    fade(musicGain.gain, preferences.musicVolume);
    if (playback) {
      publish();
      return;
    }
    const arrangement = getMusicTrack(preferences.musicTrack);
    const gain = context.createGain();
    gain.gain.value = 0;
    gain.connect(musicGain);
    // Give the previous arrangement time to fade completely before opening a
    // fresh bus. Rapid changes cannot reopen old voices or share a scheduler.
    const barStart =
      Math.max(
        context.currentTime,
        ...[...retiring].map((old) => old.fadeEnd),
      ) + 0.08;
    gain.gain.setValueAtTime(0, barStart);
    gain.gain.linearRampToValueAtTime(1, barStart + 0.6);
    playback = {
      arrangement,
      gain,
      sources: new Set(),
      barStart,
      nextBar: 0,
      nextEvent: 0,
      events: arrangement.scoreBar(0),
    };
    musicPlaying = true;
    const current = playback;
    schedule(current);
    scheduler = setInterval(() => schedule(current), 50);
  }
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
    [...retiring].forEach(disposePlayback);
    effectsSources.forEach((stop) => stop());
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
      musicTrack:
        changes.musicTrack === undefined
          ? preferences.musicTrack
          : getMusicTrack(changes.musicTrack).id,
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
      preferences.effectsVolume <= 0 ||
      !context ||
      context.state !== "running" ||
      document.hidden
    )
      return;
    const now = context.currentTime;
    const delay = kind === "deal" ? 0.045 : 0.12;
    if (now - (cooldown.get(kind) ?? -Infinity) < delay) return;
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
      renderCardSound(context, effectsGain, now, track(effectsSources));
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

// Restart the app when the player or its scores change so mounted React effects
// cannot retain a disposed player while a second service instance is imported.
if (import.meta.hot) {
  import.meta.hot.accept(() => window.location.reload());
  import.meta.hot.dispose(() => audio.stop());
}
