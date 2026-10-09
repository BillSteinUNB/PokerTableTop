import assert from "node:assert/strict";
import test from "node:test";
import { renderCardSound } from "../src/services/cardSound.js";

function parameter(value = 0) {
  return {
    value,
    setValueAtTime() {},
    linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {},
    cancelAndHoldAtTime() {},
  };
}

class AudioContextStub {
  state = "running";
  currentTime = 1;
  sampleRate = 48000;
  destination = {};
  nodes = [];
  sources = [];
  buffers = [];

  node(properties = {}) {
    const node = {
      disconnected: false,
      connect() {},
      disconnect() {
        this.disconnected = true;
      },
      ...properties,
    };
    this.nodes.push(node);
    return node;
  }
  createBuffer(_channels, length) {
    const samples = new Float32Array(length);
    const buffer = { getChannelData: () => samples };
    this.buffers.push(buffer);
    return buffer;
  }
  createBufferSource() {
    const source = this.node({
      start(time) {
        this.startTime = time;
      },
      stop(time) {
        this.stopTime = time;
      },
    });
    this.sources.push(source);
    return source;
  }
  createBiquadFilter() {
    return this.node({ frequency: parameter(), Q: parameter() });
  }
  createGain() {
    return this.node({ gain: parameter() });
  }
  createDynamicsCompressor() {
    return this.node({
      threshold: parameter(),
      knee: parameter(),
      ratio: parameter(),
    });
  }
  close() {
    this.state = "closed";
    return Promise.resolve();
  }
}

test("one card sound ends within 110 ms and releases its entire graph", () => {
  const context = new AudioContextStub();
  const tracked = new Set();
  renderCardSound(context, context.destination, 2, (stop) => {
    tracked.add(stop);
    return () => tracked.delete(stop);
  });
  assert.equal(context.sources.length, 1);
  const source = context.sources[0];
  assert.equal(source.startTime, 2);
  assert.ok(source.stopTime > 2.09 && source.stopTime <= 2.11);
  assert.equal(tracked.size, 1);
  const samples = source.buffer.getChannelData(0);
  assert.ok(samples.some((sample) => Math.abs(sample) > 0.1));
  assert.ok(samples.every((sample) => Number.isFinite(sample)));
  source.onended();
  assert.equal(tracked.size, 0);
  assert.ok(context.nodes.every((node) => node.disconnected));
});

test("cancelling a card sound cleans up immediately even while the audio clock is suspended", () => {
  const context = new AudioContextStub();
  let releases = 0;
  const stop = renderCardSound(context, context.destination, 2, () => () => {
    releases++;
  });
  const end = context.sources[0].onended;
  context.state = "suspended";
  stop();
  stop();
  end();
  assert.equal(releases, 1);
  assert.ok(context.nodes.every((node) => node.disconnected));
});

test("staggered deals each play once and respect effects mute, volume, visibility and suspension", async (t) => {
  const descriptors = new Map(
    ["window", "document", "localStorage"].map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  const contexts = [];
  const document = {
    hidden: false,
    addEventListener() {},
    removeEventListener() {},
  };
  const preferences = JSON.stringify({ music: false, effects: true });
  const globals = {
    window: {
      AudioContext: class extends AudioContextStub {
        constructor() {
          super();
          contexts.push(this);
        }
      },
    },
    document,
    localStorage: { getItem: () => preferences, setItem() {} },
  };
  for (const [key, value] of Object.entries(globals))
    Object.defineProperty(globalThis, key, { configurable: true, value });
  let audio;
  t.after(() => {
    audio?.stop();
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  ({ audio } = await import("../src/services/audio.js?card-sound-test"));
  audio.play("deal");
  assert.equal(
    contexts.length,
    0,
    "sound cannot create an un-unlocked context",
  );
  audio.unlock();
  const context = contexts[0];
  for (let card = 0; card < 16; card++) {
    context.currentTime = 1 + card * 0.07;
    audio.play("deal");
    audio.play("deal");
  }
  assert.equal(context.sources.length, 16, "one sound per staggered card");
  context.currentTime += 1;
  audio.setPreferences({ effects: false });
  audio.play("deal");
  audio.setPreferences({ effects: true, effectsVolume: 0 });
  audio.play("deal");
  audio.setPreferences({ effectsVolume: 0.6 });
  document.hidden = true;
  audio.play("deal");
  document.hidden = false;
  context.state = "suspended";
  audio.play("deal");
  assert.equal(
    context.sources.length,
    16,
    "muted or inactive audio adds no voices",
  );
  context.state = "running";
  audio.play("deal");
  assert.equal(context.sources.length, 17);
  audio.stop();
  assert.ok(context.sources.every((source) => source.disconnected));
});
