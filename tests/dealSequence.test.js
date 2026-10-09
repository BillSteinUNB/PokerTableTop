import assert from "node:assert/strict";
import test from "node:test";
import {
  BOARD_STAGGER,
  DEAL_DURATION,
  DEAL_STAGGER,
  captureDealState,
  planDeal,
} from "../src/services/dealSequence.js";

const player = (id, overrides = {}) => ({
  id,
  hand: [null, null],
  chips: 100,
  ...overrides,
});
const game = (overrides = {}) => ({
  handNumber: 1,
  dealer: 0,
  street: "preflop",
  board: [],
  players: [player("a"), player("b"), player("c")],
  ...overrides,
});
const keys = (events) => events.map(({ key }) => key);
const board = (count) => Array.from({ length: count }, (_, id) => ({ id }));

test("hole cards arrive in two clockwise rounds from the seat after the dealer", () => {
  const deal = planDeal(null, game({ dealer: 1 }));
  assert.deepEqual(keys(deal), [
    "hole-c-0",
    "hole-a-0",
    "hole-b-0",
    "hole-c-1",
    "hole-a-1",
    "hole-b-1",
  ]);
  assert.deepEqual(
    deal.map(({ delay }) => delay),
    [0, 70, 140, 210, 280, 350],
  );
  const next = game({ handNumber: 2, dealer: 2 });
  assert.deepEqual(keys(planDeal(captureDealState(game()), next)), [
    "hole-a-0",
    "hole-b-0",
    "hole-c-0",
    "hole-a-1",
    "hole-b-1",
    "hole-c-1",
  ]);
});

test("empty seats are skipped while all-in players still receive their cards", () => {
  const current = game({
    players: [
      player("dealer", { hand: [], chips: 0, eliminatedAt: 1 }),
      player("waiting", { hand: [], waitingForNextHand: true }),
      player("all-in", { chips: 0, allIn: true }),
      player("active"),
    ],
  });
  assert.deepEqual(keys(planDeal(null, current)), [
    "hole-all-in-0",
    "hole-active-0",
    "hole-all-in-1",
    "hole-active-1",
  ]);
});

test("an eight-seat deal finishes within one and a half seconds", () => {
  const deal = planDeal(
    null,
    game({ players: Array.from({ length: 8 }, (_, id) => player(id)) }),
  );
  assert.equal(deal.length, 16);
  assert.equal(new Set(keys(deal)).size, 16);
  assert.ok(DEAL_STAGGER >= 70);
  assert.ok(deal.at(-1).delay + DEAL_DURATION <= 1500);
});

test("street changes deal only the new board cards, including all-in runouts", () => {
  for (const [beforeCount, afterCount, street] of [
    [0, 3, "flop"],
    [3, 4, "turn"],
    [4, 5, "river"],
    [3, 5, "showdown"],
    [0, 5, "showdown"],
  ]) {
    const before = captureDealState(game({ board: board(beforeCount) }));
    const events = planDeal(before, game({ board: board(afterCount), street }));
    assert.deepEqual(
      events,
      Array.from({ length: afterCount - beforeCount }, (_, index) => ({
        key: `board-${beforeCount + index}`,
        delay: index * BOARD_STAGGER,
      })),
    );
  }
});

test("ordinary updates, showdown reveals and a win by folding do not replay deals", () => {
  const before = captureDealState(game());
  assert.deepEqual(planDeal(before, game({ actor: 2 })), []);
  assert.deepEqual(
    planDeal(
      before,
      game({
        street: "showdown",
        result: { revealed: false },
        players: [player("a"), player("b", { folded: true }), player("c")],
      }),
    ),
    [],
  );
  const river = captureDealState(game({ street: "river", board: board(5) }));
  assert.deepEqual(
    planDeal(
      river,
      game({
        street: "showdown",
        board: board(5),
        result: { revealed: true },
        players: [player("a", { hand: [{ rank: "A" }, { rank: "K" }] })],
      }),
    ),
    [],
  );
});

test("joining after preflop or missing a hand start does not replay historical cards", () => {
  for (const street of ["flop", "turn", "river", "showdown", "finished"]) {
    const current = game({ street, board: board(3), handNumber: 2 });
    assert.deepEqual(planDeal(null, current), []);
    assert.deepEqual(planDeal(captureDealState(game()), current), []);
  }
  const before = game();
  const withJoiner = game({
    players: [
      ...before.players,
      player("joiner", { hand: [], waitingForNextHand: true }),
    ],
  });
  assert.deepEqual(planDeal(captureDealState(before), withJoiner), []);
  assert.ok(
    keys(
      planDeal(
        captureDealState(withJoiner),
        game({ handNumber: 2, players: [...before.players, player("joiner")] }),
      ),
    ).includes("hole-joiner-0"),
  );
});

test("captured state survives in-place game changes without retaining private card data", () => {
  const current = game();
  const saved = captureDealState(current);
  current.players[0].hand.push({ rank: "Q", suit: "hearts" });
  current.board.push({ rank: "A", suit: "spades" });
  current.handNumber++;
  assert.equal(saved.handNumber, 1);
  assert.equal(saved.boardCount, 0);
  assert.deepEqual(saved.players[0], { id: "a", handCount: 2 });
  assert.equal(captureDealState(null), null);
  assert.deepEqual(planDeal(saved, null), []);
});
