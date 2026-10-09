import test from "node:test";
import assert from "node:assert/strict";
import { PokerGame } from "../shared/engine.js";
import { createDeck } from "../shared/deck.js";
import { chooseBotAction } from "../shared/bot.js";

const profile = (i) => ({ id: `p${i}`, name: `Player ${i}`, avatar: "fox" });
const makeGame = (count = 2, settings = {}, options = {}) =>
  new PokerGame(
    Array.from({ length: count }, (_, i) => profile(i)),
    {
      startingChips: 1000,
      smallBlind: 5,
      bigBlind: 10,
      maxPlayers: 8,
      blindIncreaseEvery: 0,
      ...settings,
    },
    { deckFactory: createDeck, ...options },
  );
const copy = (value) => JSON.parse(JSON.stringify(value));
const act = (game, action, amount) =>
  game.act(game.players[game.actor].id, action, amount);
function advance(game, street = "showdown") {
  let actions = 0;
  while (game.playing && game.street !== street) {
    const legal = game.legalActions(game.players[game.actor].id);
    act(game, legal.canCheck ? "check" : "call");
    assert.ok(++actions < 100, "A checked-down hand must finish");
  }
  assert.equal(game.street, street);
}
function assertBlindOrder(game) {
  assert.notEqual(game.dealer, game.bigBlindSeat);
  if (game.players.filter((p) => p.hand.length).length > 2) {
    assert.notEqual(game.dealer, game.smallBlindSeat);
    assert.equal(
      game.nextSeat(game.dealer, (p) => p.hand.length > 0),
      game.smallBlindSeat === -1 ? game.bigBlindSeat : game.smallBlindSeat,
      "The first dealt seat after the button must be the first live blind",
    );
  } else {
    assert.equal(game.dealer, game.smallBlindSeat);
  }
}

test("a new seat cannot alter the current hand, legal action, private cards or chip contributions", () => {
  const game = makeGame(3);
  act(game, "raise", 40);
  const before = copy(game.serialize());
  const actorId = game.players[game.actor].id;
  const legal = game.legalActions(actorId);
  game.addPlayer({
    ...profile(3),
    chips: 999999,
    hand: createDeck().slice(0, 2),
    bet: 100,
    committed: 100,
    waitingForNextHand: false,
    name: "  Late   Arrival  ",
    avatar: "unknown",
  });
  const {
    players: beforePlayers,
    totalChips: beforeTotal,
    ...beforeHand
  } = before;
  const { players, totalChips, ...afterHand } = copy(game.serialize());
  assert.deepEqual(afterHand, beforeHand);
  assert.deepEqual(players.slice(0, 3), beforePlayers);
  assert.equal(totalChips, beforeTotal + 1000);
  assert.deepEqual(game.legalActions(actorId), legal);
  const late = game.view("p3");
  assert.equal(late.players[3].name, "Late Arrival");
  assert.equal(late.players[3].avatar, "fox");
  assert.equal(late.players[3].chips, 1000);
  assert.equal(late.players[3].waitingForNextHand, true);
  assert.equal(late.players[3].folded, true);
  assert.equal(late.players[3].allIn, false);
  assert.deepEqual(late.players[3].hand, []);
  assert.equal(late.legal, null);
  assert.ok(
    late.players.slice(0, 3).every((p) => p.hand.every((c) => c === null)),
  );
  assert.throws(() => game.act("p3", "fold"), /not your turn/);
  game.act(actorId, "call", undefined, before.revision);
  assert.equal(game.players[3].chips, 1000);
  assert.equal(game.players[3].committed, 0);
  game.assertChips();
});

test("invalid, duplicate, full and finished joins are rejected without partial changes", () => {
  const game = makeGame();
  for (const candidate of [
    null,
    { ...profile(2), name: "" },
    { ...profile(2), id: "" },
    { ...profile(2), id: "x".repeat(129) },
    { ...profile(2), id: "p0" },
    { ...profile(2), name: " PLAYER 0 " },
  ]) {
    const before = copy(game.serialize());
    assert.throws(() => game.addPlayer(candidate));
    assert.deepEqual(game.serialize(), before);
  }
  const full = makeGame(2, { maxPlayers: 2 });
  const fullBefore = copy(full.serialize());
  assert.throws(() => full.addPlayer(profile(2)), /full/);
  assert.deepEqual(full.serialize(), fullBefore);
  advance(game);
  game.players[0].chips += game.players[1].chips;
  game.players[1].chips = 0;
  game.startHand();
  const finishedBefore = copy(game.serialize());
  assert.throws(() => game.addPlayer(profile(2)), /finished/);
  assert.deepEqual(game.serialize(), finishedBefore);
});

test("joins at every street wait for the next deal, including showdown", () => {
  for (const street of ["preflop", "flop", "turn", "river", "showdown"]) {
    const game = makeGame();
    advance(game, street);
    const before = copy(game.serialize());
    game.addPlayer(profile(2));
    assert.equal(game.street, street);
    assert.equal(game.revision, before.revision);
    assert.deepEqual(game.result, before.result);
    assert.equal(game.players[2].hand.length, 0);
    advance(game);
    game.startHand();
    assert.equal(game.handNumber, 2);
    assert.equal(game.players[2].hand.length, 2);
    assert.equal(game.players[2].waitingForNextHand, false);
    assert.ok(game.view("p2").players[2].hand.every(Boolean));
    assert.deepEqual(game.view("p0").players[2].hand, [null, null]);
    assertBlindOrder(game);
    advance(game, "flop");
    assert.equal(game.actor, game.smallBlindSeat);
    game.assertChips();
  }
});

test("both heads-up button positions grow correctly with one or several newcomers", () => {
  for (const dealer of [0, 1]) {
    for (const added of [1, 2, 6]) {
      const game = makeGame();
      if (dealer === 1) {
        advance(game);
        game.startHand();
      }
      assert.equal(game.dealer, dealer);
      const previousBigBlind = game.bigBlindSeat;
      for (let i = 0; i < added; i++) game.addPlayer(profile(i + 2));
      advance(game);
      game.startHand();
      assert.equal(game.bigBlindSeat, previousBigBlind + 1);
      assert.equal(game.smallBlindSeat, previousBigBlind);
      assertBlindOrder(game);
      advance(game, "flop");
      assert.equal(game.actor, game.smallBlindSeat);
      game.assertChips();
    }
  }
});

test("an inserted seat before the small blind receives the button, not early flop action", () => {
  const game = makeGame(3);
  advance(game);
  game.startHand();
  assert.equal(game.dealer, 1);
  assert.equal(game.bigBlindSeat, 0);
  game.addPlayer(profile(3));
  advance(game);
  game.startHand();
  assert.equal(game.dealer, 3);
  assert.equal(game.smallBlindSeat, 0);
  assert.equal(game.bigBlindSeat, 1);
  assertBlindOrder(game);
  advance(game, "flop");
  assert.equal(game.actor, 0);
});

test("late arrivals preserve a dead small blind and can keep a table going after an elimination", () => {
  const game = makeGame(3);
  advance(game);
  game.players[0].chips += game.players[2].chips;
  game.players[2].chips = 0;
  game.addPlayer(profile(3));
  game.startHand();
  assert.equal(game.smallBlindSeat, -1);
  assert.equal(game.bigBlindSeat, 3);
  assertBlindOrder(game);
  advance(game, "flop");
  assert.equal(game.actor, 3);
  game.assertChips();

  const lastTwo = makeGame();
  advance(lastTwo);
  lastTwo.players[0].chips += lastTwo.players[1].chips;
  lastTwo.players[1].chips = 0;
  lastTwo.addPlayer(profile(2));
  lastTwo.startHand();
  assert.equal(lastTwo.street, "preflop");
  assert.equal(lastTwo.players[2].hand.length, 2);
  assert.equal(lastTwo.players[1].hand.length, 0);
  assertBlindOrder(lastTwo);
  lastTwo.assertChips();
});

test("waiting seats cannot win side pots, refunds or odd chips", () => {
  for (const oddChips of [false, true]) {
    const game = makeGame(4);
    const contributions = oddChips ? [5, 5, 5, 0] : [100, 300, 600, 300];
    const hands = [
      ["A", "A"],
      ["K", "K"],
      ["Q", "Q"],
      ["J", "J"],
    ];
    game.players.forEach((p, i) =>
      Object.assign(p, {
        chips: 1000 - contributions[i],
        bet: contributions[i],
        committed: contributions[i],
        folded: i >= (oddChips ? 2 : 3),
        hand: hands[i].map((rank, j) => ({
          rank,
          suit: j ? "hearts" : "clubs",
        })),
      }),
    );
    game.board = (
      oddChips ? ["A", "K", "Q", "J", "10"] : ["2", "3", "7", "8", "9"]
    ).map((rank, i) => ({
      rank,
      suit: oddChips || i % 2 === 0 ? "spades" : "diamonds",
    }));
    const unchanged = PokerGame.restore(copy(game.serialize()));
    game.addPlayer(profile(4));
    game.settle(true);
    unchanged.settle(true);
    assert.deepEqual(game.result, unchanged.result);
    assert.deepEqual(
      game.players.slice(0, 4).map((p) => p.chips),
      unchanged.players.map((p) => p.chips),
    );
    assert.equal(game.players[4].chips, 1000);
    assert.equal(game.result.hands.p4, undefined);
    assert.deepEqual(game.view("p4").players[3].hand, [null, null]);
    game.assertChips();
  }
});

test("recovery preserves pending seats and accepts snapshots from before late joining", () => {
  const game = makeGame();
  act(game, "call");
  game.addPlayer(profile(2));
  const restored = PokerGame.restore(copy(game.serialize()));
  assert.deepEqual(restored.serialize(), game.serialize());
  assert.deepEqual(restored.view("p2"), game.view("p2"));
  assert.equal(restored.legalActions("p2"), null);
  advance(restored);
  restored.startHand();
  assert.equal(restored.players[2].waitingForNextHand, false);
  assert.equal(restored.players[2].hand.length, 2);
  restored.assertChips();

  const oldGame = makeGame(3);
  const legacy = copy(oldGame.serialize());
  legacy.players.forEach((p) => delete p.waitingForNextHand);
  const legacyRestored = PokerGame.restore(legacy);
  assert.deepEqual(legacyRestored.view("p0"), oldGame.view("p0"));
  legacyRestored.addPlayer(profile(3));
  advance(legacyRestored);
  legacyRestored.startHand();
  assert.equal(legacyRestored.players[3].hand.length, 2);
  legacyRestored.assertChips();
});

test("randomized arrivals preserve chips, current actions, privacy and progress", () => {
  let seed = 9205;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  const deckFactory = () => {
    const deck = createDeck();
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  };
  let joins = 0;
  for (let table = 0; table < 30; table++) {
    const game = makeGame(2 + (table % 3), {}, { deckFactory });
    for (let hand = 0; hand < 12 && game.street !== "finished"; hand++) {
      let actions = 0;
      while (game.playing) {
        const actor = game.players[game.actor].id;
        const revision = game.revision;
        const legal = game.legalActions(actor);
        if (game.players.length < 8 && random() < 0.12) {
          const arriving = profile(game.players.length);
          game.addPlayer(arriving);
          joins++;
          assert.equal(game.revision, revision);
          assert.equal(game.players[game.actor].id, actor);
          assert.deepEqual(game.legalActions(actor), legal);
          assert.equal(game.legalActions(arriving.id), null);
        }
        const view = game.view(actor);
        view.players.forEach((p) => {
          if (p.id !== actor) assert.ok(p.hand.every((card) => card === null));
          if (p.waitingForNextHand) {
            assert.equal(p.chips, 1000);
            assert.equal(p.bet, 0);
            assert.deepEqual(p.hand, []);
          }
        });
        const move = chooseBotAction(view, random);
        game.act(actor, move.action, move.amount, revision);
        game.assertChips();
        assert.ok(++actions < 500, "Every hand must progress");
      }
      if (game.players.length < 8 && random() < 0.5) {
        game.addPlayer(profile(game.players.length));
        joins++;
      }
      const waiting = game.players
        .filter((p) => p.waitingForNextHand)
        .map((p) => p.id);
      game.startHand();
      game.assertChips();
      assert.ok(game.players.every((p) => !p.waitingForNextHand));
      waiting.forEach((id) =>
        assert.equal(game.players.find((p) => p.id === id).hand.length, 2),
      );
      const cards = [...game.board, ...game.players.flatMap((p) => p.hand)];
      assert.equal(
        new Set(cards.map((card) => card.rank + card.suit)).size,
        cards.length,
      );
      if (waiting.length && game.street !== "finished") assertBlindOrder(game);
    }
  }
  assert.ok(joins > 100, "Exercise many joining positions and timings");
});
