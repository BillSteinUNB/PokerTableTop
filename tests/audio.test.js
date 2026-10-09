import assert from "node:assert/strict";
import test from "node:test";

let instance = 0;
const loadAudio = async () =>
  (await import(`../src/services/audio.js?preferences-test=${instance++}`))
    .audio;

function storageFor(t, initial = {}) {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const values = new Map(Object.entries(initial));
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else delete globalThis.localStorage;
  });
  return storage;
}

test("new and existing listeners default to traditional jazz without losing volume or mute choices", async (t) => {
  const storage = storageFor(t);
  assert.equal((await loadAudio()).getSnapshot().musicTrack, "jazz");
  const saved = {
    music: false,
    effects: true,
    musicVolume: 0.17,
    effectsVolume: 0.48,
  };
  storage.setItem("poker-audio-v2", JSON.stringify(saved));
  const snapshot = (await loadAudio()).getSnapshot();
  assert.equal(snapshot.musicTrack, "jazz");
  for (const [key, value] of Object.entries(saved))
    assert.equal(snapshot[key], value);

  storage.setItem("poker-audio-v2", "null");
  storage.setItem("poker-sound", "false");
  const legacy = (await loadAudio()).getSnapshot();
  assert.equal(legacy.musicTrack, "jazz");
  assert.equal(legacy.music, false);
  assert.equal(legacy.effects, false);
});

test("choosing a track while muted persists it without enabling either audio channel", async (t) => {
  const saved = {
    music: false,
    effects: false,
    musicVolume: 0,
    effectsVolume: 0.25,
  };
  const storage = storageFor(t, { "poker-audio-v2": JSON.stringify(saved) });
  const audio = await loadAudio();
  for (const musicTrack of ["ambient", "arcade", "jazz"]) {
    audio.setPreferences({ musicTrack });
    assert.deepEqual(JSON.parse(storage.getItem("poker-audio-v2")), {
      ...saved,
      musicTrack,
    });
    assert.equal(audio.getSnapshot().playing, false);
    assert.equal((await loadAudio()).getSnapshot().musicTrack, musicTrack);
  }
});

test("invalid saved or selected tracks fall back to jazz and volume changes retain the chosen track", async (t) => {
  const storage = storageFor(t, {
    "poker-audio-v2": JSON.stringify({ musicTrack: "removed-track" }),
  });
  const audio = await loadAudio();
  assert.equal(audio.getSnapshot().musicTrack, "jazz");
  audio.setPreferences({ musicTrack: "ambient" });
  audio.setPreferences({ musicVolume: 0.61, effects: false });
  assert.equal(audio.getSnapshot().musicTrack, "ambient");
  audio.setPreferences({ musicTrack: "not-a-track" });
  assert.equal(audio.getSnapshot().musicTrack, "jazz");
  assert.equal(audio.getSnapshot().musicVolume, 0.61);
  assert.equal(audio.getSnapshot().effects, false);
  storage.setItem("poker-audio-v2", "{broken");
  assert.equal((await loadAudio()).getSnapshot().musicTrack, "jazz");
});

test("unavailable local storage does not prevent track selection", async (t) => {
  const storage = storageFor(t);
  storage.getItem = storage.setItem = () => {
    throw new Error("Storage unavailable");
  };
  const audio = await loadAudio();
  assert.equal(audio.getSnapshot().musicTrack, "jazz");
  assert.doesNotThrow(() => audio.setPreferences({ musicTrack: "arcade" }));
  assert.equal(audio.getSnapshot().musicTrack, "arcade");
});
