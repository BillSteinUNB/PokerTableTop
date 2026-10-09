import assert from "node:assert/strict";
import test from "node:test";
import { MUSIC_TRACKS, getMusicTrack } from "../src/services/musicTracks.js";
import * as original from "../src/services/musicScore.js";

test("the music catalog defaults to traditional jazz and keeps the original intact", () => {
  assert.deepEqual(
    MUSIC_TRACKS.map(({ id }) => id),
    ["jazz", "ambient", "arcade"],
  );
  for (const id of [undefined, null, "", "unknown", "__proto__", {}]) {
    assert.equal(getMusicTrack(id), getMusicTrack("jazz"));
  }
  const arcade = getMusicTrack("arcade");
  assert.equal(arcade.beat, original.BEAT);
  assert.equal(arcade.barLength, original.BAR_LENGTH);
  assert.equal(arcade.scoreBar, original.scoreBar);
  assert.equal(arcade.renderVoice, original.renderVoice);
});

test("every arrangement produces bounded deterministic events in scheduler order", () => {
  const percussive = new Set([
    "hat",
    "kick",
    "brush",
    "sweep",
    "brushTap",
    "softKick",
  ]);
  for (const { id } of MUSIC_TRACKS) {
    const track = getMusicTrack(id);
    assert.ok(track.beat > 0.5 && track.beat < 1);
    assert.equal(track.barLength, 4 * track.beat);
    // Include several complete choruses: variations must obey the same contract.
    for (let bar = 0; bar < 96; bar++) {
      const events = track.scoreBar(bar);
      assert.ok(events.length > 0 && events.length < 64, `${id}, bar ${bar}`);
      assert.deepEqual(events, track.scoreBar(bar));
      let lastBeat = -1;
      for (const event of events) {
        assert.ok(
          Number.isFinite(event.beat) &&
            event.beat >= lastBeat &&
            event.beat >= 0 &&
            event.beat < 4,
        );
        assert.ok(
          Number.isFinite(event.length) &&
            event.length > 0 &&
            event.length <= 8,
        );
        assert.ok(
          Number.isFinite(event.velocity) &&
            event.velocity > 0 &&
            event.velocity <= 1,
        );
        assert.ok(Number.isFinite(event.pan) && Math.abs(event.pan) <= 1);
        assert.ok(Number.isInteger(event.note));
        if (!percussive.has(event.voice))
          assert.ok(event.note >= 24 && event.note <= 84);
        lastBeat = event.beat;
      }
    }
  }
});

test("new tracks are different compositions with space and their own instruments", () => {
  const jazz = getMusicTrack("jazz");
  const ambient = getMusicTrack("ambient");
  const arcade = getMusicTrack("arcade");
  assert.equal(new Set([jazz.beat, ambient.beat, arcade.beat]).size, 3);
  const bars = (track) =>
    Array.from({ length: 16 }, (_, bar) => track.scoreBar(bar));
  const jazzBars = bars(jazz);
  const ambientBars = bars(ambient);
  const bassRoots = (track, voice) =>
    bars(track).map(
      (events) => events.find((event) => event.voice === voice).note,
    );
  assert.notDeepEqual(bassRoots(jazz, "upright"), bassRoots(arcade, "bass"));
  assert.notDeepEqual(
    bassRoots(ambient, "roundBass"),
    bassRoots(jazz, "upright"),
  );
  assert.notDeepEqual(
    bassRoots(ambient, "roundBass"),
    bassRoots(arcade, "bass"),
  );
  assert.ok(
    jazzBars.every((events) => events.some(({ voice }) => voice === "piano")),
  );
  assert.ok(
    jazzBars
      .flat()
      .every(({ voice }) => !["lead", "hat", "glow", "pad"].includes(voice)),
  );
  assert.ok(
    ambientBars.some((events) => events.some(({ voice }) => voice === "pad")),
  );
  assert.ok(
    ambientBars.filter((events) =>
      events.every(({ voice }) => voice !== "glow"),
    ).length >= 5,
  );
  assert.ok(ambientBars.flat().length < jazzBars.flat().length);
  assert.notDeepEqual(jazz.scoreBar(1), jazz.scoreBar(33));
  assert.notDeepEqual(ambient.scoreBar(0), ambient.scoreBar(16));
});
