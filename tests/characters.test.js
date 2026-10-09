import assert from "node:assert/strict";
import test from "node:test";
import { CHARACTERS } from "../shared/characters.js";
import { AVATARS, validateProfile } from "../shared/settings.js";

test("character catalog has unique stable IDs and useful picker metadata", () => {
  assert.equal(CHARACTERS.length, 20);
  assert.equal(new Set(AVATARS).size, CHARACTERS.length);
  assert.deepEqual(
    AVATARS,
    CHARACTERS.map(({ id }) => id),
  );
  assert.equal(
    CHARACTERS.filter(({ category }) => category === "animals").length,
    14,
  );
  assert.equal(
    CHARACTERS.filter(({ category }) => category === "people").length,
    6,
  );
  for (const character of CHARACTERS) {
    assert.match(character.id, /^[a-z]+(?:-[a-z]+)*$/);
    assert.ok(character.name.trim().length > 0);
    assert.ok(["animals", "people"].includes(character.category));
  }
});

test("every character survives the same profile validation used by online rooms", () => {
  for (const { id } of CHARACTERS) {
    assert.deepEqual(validateProfile({ name: "  Player One  ", avatar: id }), {
      name: "Player One",
      avatar: id,
    });
  }
});

test("existing profile IDs retain their meaning and unknown IDs remain safe", () => {
  const legacy = [
    "fox",
    "bear",
    "cat",
    "frog",
    "owl",
    "rabbit",
    "raccoon",
    "penguin",
  ];
  assert.deepEqual(AVATARS.slice(0, legacy.length), legacy);
  for (const avatar of [undefined, null, "future-character", "__proto__", {}]) {
    assert.equal(validateProfile({ name: "Player", avatar }).avatar, "fox");
  }
});
