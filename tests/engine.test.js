import test from "node:test";
import assert from "node:assert/strict";
import { PokerGame } from "../shared/engine.js";
import { evaluateHand, compareHands } from "../shared/handEvaluator.js";
import { createDeck, shuffleDeck } from "../shared/deck.js";
import { validateSettings } from "../shared/settings.js";
import { chooseBotAction } from "../shared/bot.js";

const players = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: `p${i}`,
    name: `Player ${i}`,
    avatar: "fox",
  }));
const makeGame = (count = 3, settings = {}) =>
  new PokerGame(players(count), {
    startingChips: 1000,
    smallBlind: 5,
    bigBlind: 10,
    maxPlayers: 8,
    blindIncreaseEvery: 0,
    ...settings,
  });
const act = (game, action, amount) =>
  game.act(game.players[game.actor].id, action, amount);
const cards = (value) =>
  value.split(" ").map((s) => ({
    rank: s.slice(0, -1),
    suit: { s: "spades", h: "hearts", d: "diamonds", c: "clubs" }[s.at(-1)],
  }));
function rigSettlement(game, contributions, hands, board, folded = []) {
  game.players.forEach((p, i) =>
    Object.assign(p, {
      chips: 1000 - contributions[i],
      committed: contributions[i],
      bet: contributions[i],
      hand: cards(hands[i]),
      folded: folded.includes(i),
    }),
  );
  game.board = cards(board);
}

test("deck contains 52 unique cards and shuffle preserves them", () => {
  assert.equal(new Set(shuffleDeck().map((c) => c.rank + c.suit)).size, 52);
  const source = createDeck();
  shuffleDeck(source);
  assert.deepEqual(source, createDeck());
});
test("all hand ranks, wheel, seven-card best hand and kickers", () => {
  const hands = [
    "2s 5h 7d 9c Js",
    "2s 2h 7d 9c Js",
    "2s 2h 7d 7c Js",
    "2s 2h 2d 9c Js",
    "As 2h 3d 4c 5s",
    "2s 5s 7s 9s Js",
    "2s 2h 2d 9c 9s",
    "2s 2h 2d 2c Js",
    "5s 6s 7s 8s 9s",
    "10s Js Qs Ks As",
  ];
  hands.forEach((hand, i) =>
    assert.equal(evaluateHand(cards(hand)).ranking, i + 1),
  );
  assert.equal(evaluateHand(cards("As Ah Ad Ks Kh Kd 2c")).name, "Full House");
  assert.deepEqual(
    evaluateHand(cards("As Ah Ad Ks Kh Kd 2c")).tiebreakers,
    [14, 13],
  );
  assert.equal(
    compareHands(
      evaluateHand(cards("As Ah Ks Qd 2s")),
      evaluateHand(cards("Ac Ad Ks Jd 9s")),
    ),
    1,
  );
  assert.equal(evaluateHand(cards("As 2s 3s 4s 5s")).tiebreakers[0], 5);
});
test("heads-up button posts small blind, acts first preflop and last postflop", () => {
  const game = makeGame(2);
  assert.equal(game.dealer, game.smallBlindSeat);
  assert.equal(game.actor, game.dealer);
  assert.equal(game.pot, 15);
  assert.equal(game.legalActions("p0").minRaise, 20);
  act(game, "call");
  assert.equal(game.actor, game.bigBlindSeat);
  act(game, "check");
  assert.equal(game.street, "flop");
  assert.equal(game.actor, game.bigBlindSeat);
});
test("big blind retains option, minimum opening raise is two big blinds", () => {
  const game = makeGame();
  assert.equal(game.actor, 0);
  assert.throws(() => act(game, "raise", 15), /Minimum raise/);
  act(game, "call");
  act(game, "call");
  assert.equal(game.actor, 2);
  assert.equal(game.street, "preflop");
  act(game, "check");
  assert.equal(game.street, "flop");
  assert.equal(game.actor, 1);
});
test("illegal actions leave state unchanged and stale actions cannot run", () => {
  const game = makeGame();
  for (const [action, amount] of [
    ["raise", -1],
    ["raise", NaN],
    ["raise", Infinity],
    ["raise", 23.5],
    ["raise", 1001],
    ["check"],
    ["bogus"],
  ]) {
    const before = JSON.stringify(game.serialize());
    assert.throws(() => act(game, action, amount));
    assert.equal(JSON.stringify(game.serialize()), before);
  }
  assert.throws(() => game.act("p1", "fold"), /not your turn/);
  assert.throws(() => game.act("p0", "fold", 0, -1), /table changed/);
});
test("fold win keeps cards private and carries real stacks into the next hand", () => {
  const game = makeGame(2);
  act(game, "fold");
  assert.equal(game.street, "showdown");
  assert.deepEqual(
    game.players.map((p) => p.chips),
    [995, 1005],
  );
  assert.equal(game.result.winners[0].amount, 10);
  assert.equal(game.result.refunds[0].amount, 5);
  const opponent = game.view("p0").players[1];
  assert.deepEqual(opponent.hand, [null, null]);
  assert.deepEqual(game.view("p0").result.hands, {});
  game.startHand();
  assert.equal(game.dealer, 1);
  assert.deepEqual(
    game.players.map((p) => p.chips + p.committed),
    [995, 1005],
  );
  game.assertChips();
});
test("side pots use folded contributions and refund uncalled excess", () => {
  const game = makeGame(4);
  rigSettlement(
    game,
    [100, 300, 600, 300],
    ["As Ah", "Ks Kh", "Qs Qh", "Js Jh"],
    "2s 3h 7d 8c 9s",
    [3],
  );
  game.settle(true);
  assert.deepEqual(
    game.result.pots.map((p) => p.amount),
    [400, 600],
  );
  assert.deepEqual(
    game.result.winners.map((p) => [p.id, p.amount]),
    [
      ["p0", 400],
      ["p1", 600],
    ],
  );
  assert.deepEqual(game.result.refunds, [{ playerId: "p2", amount: 300 }]);
  assert.deepEqual(
    game.players.map((p) => p.chips),
    [1300, 1300, 700, 700],
  );
  game.assertChips();
});
test("tied side pots award odd chip clockwise from dealer", () => {
  const game = makeGame(3);
  rigSettlement(
    game,
    [5, 5, 5],
    ["2c 3c", "2d 3d", "4c 5c"],
    "As Ks Qs Js 10s",
    [2],
  );
  game.settle(true);
  assert.deepEqual(
    game.result.winners.map((p) => [p.id, p.amount]),
    [
      ["p1", 8],
      ["p0", 7],
    ],
  );
  game.assertChips();
});
test("short all-in does not reopen raises for prior callers", () => {
  const game = makeGame(4);
  // Actor 3 opens, player 0 calls, player 1 makes a short all-in, player 2 calls.
  game.players[1].chips = 125;
  game.totalChips -= 870;
  act(game, "raise", 100);
  act(game, "call");
  act(game, "all-in");
  act(game, "call");
  assert.equal(game.currentBet, 130);
  assert.equal(game.lastFullRaise, 90);
  assert.equal(game.legalActions("p3").canRaise, false);
  assert.throws(() => act(game, "all-in"), /not reopened/);
  act(game, "call");
  act(game, "call");
  assert.equal(game.street, "flop");
  game.assertChips();
});
test("cumulative short all-ins reopen raising without changing full raise size", () => {
  const game = makeGame(5);
  game.players[0].chips = 140;
  game.players[1].chips = 185;
  game.totalChips -= 1670;
  act(game, "raise", 100);
  act(game, "call");
  act(game, "all-in");
  act(game, "all-in");
  act(game, "call");
  assert.equal(game.currentBet, 190);
  assert.equal(game.lastFullRaise, 90);
  assert.equal(game.legalActions("p3").canRaise, true);
  assert.equal(game.legalActions("p3").minRaise, 280);
});
test("short all-in call runs board out with one funded player and no dry side-pot bets", () => {
  const game = makeGame(2);
  game.players[0].chips = 95;
  game.totalChips -= 900;
  act(game, "all-in");
  assert.equal(game.legalActions("p1").canRaise, false);
  act(game, "call");
  assert.equal(game.street, "showdown");
  assert.equal(game.board.length, 5);
  game.assertChips();
});
test("short blind cannot create chips or require unmatched calls", () => {
  const game = makeGame(2);
  act(game, "fold");
  game.players[0].chips = 3;
  game.players[1].chips = 1997;
  game.startHand();
  assert.equal(game.street, "showdown");
  assert.equal(game.result.total, 6);
  assert.equal(game.result.totalCommitted, 8);
  assert.equal(game.result.refunds[0].amount, 2);
  game.assertChips();
});
test("all-in players remain live at showdown and folded hole cards never leak", () => {
  const game = makeGame(3);
  act(game, "fold");
  act(game, "all-in");
  act(game, "call");
  const snapshot = game.view("p1");
  assert.equal(game.street, "showdown");
  assert.deepEqual(snapshot.players[0].hand, [null, null]);
  assert.ok(snapshot.players[2].hand.every(Boolean));
  assert.equal(JSON.stringify(snapshot).includes("deck"), false);
  assert.equal(snapshot.result.hands.p0, undefined);
});
test("blind levels advance by hands, eliminated seats are skipped, finish has champion", () => {
  const game = makeGame(3, { blindIncreaseEvery: 1 });
  act(game, "fold");
  act(game, "fold");
  game.players[1].chips += game.players[0].chips;
  game.players[0].chips = 0;
  game.startHand();
  assert.equal(game.bigBlind, 20);
  assert.notEqual(game.dealer, 0);
  assert.notEqual(game.bigBlindSeat, 0);
  act(game, "fold");
  game.players[1].chips += game.players[2].chips;
  game.players[2].chips = 0;
  game.startHand();
  assert.equal(game.street, "finished");
  assert.equal(game.champion, "p1");
});
test("serialization restores exact private state and legal actions", () => {
  const game = makeGame(6);
  act(game, "raise", 30);
  const restored = PokerGame.restore(
    JSON.parse(JSON.stringify(game.serialize())),
  );
  assert.deepEqual(restored.view("p4"), game.view("p4"));
  assert.deepEqual(restored.deck, game.deck);
  act(game, "call");
  act(restored, "call");
  assert.deepEqual(restored.view("p5"), game.view("p5"));
});
test("heads-up transition never charges the surviving big blind twice consecutively", () => {
  const game = makeGame(3);
  act(game, "fold");
  act(game, "fold");
  game.players[1].chips += game.players[0].chips;
  game.players[0].chips = 0;
  const previous = game.bigBlindSeat;
  game.startHand();
  assert.notEqual(game.bigBlindSeat, previous);
  assert.equal(game.dealer, previous);
});
test("an eliminated big blind produces a dead small blind at a multiway table", () => {
  const game = makeGame(5);
  while (game.playing) act(game, "fold");
  game.players[0].chips += game.players[2].chips;
  game.players[2].chips = 0;
  game.startHand();
  assert.equal(game.bigBlindSeat, 3);
  assert.equal(game.smallBlindSeat, -1);
  assert.equal(game.pot, 10);
  game.assertChips();
});
test("a player who checked may raise a short opening all-in", () => {
  const game = makeGame(3);
  act(game, "call");
  act(game, "call");
  act(game, "check");
  act(game, "check");
  game.totalChips -= game.players[2].chips - 5;
  game.players[2].chips = 5;
  act(game, "all-in");
  act(game, "call");
  assert.equal(game.actor, 1);
  assert.equal(game.legalActions("p1").canRaise, true);
  act(game, "raise", 15);
  game.assertChips();
});
test("settings reject chip inflation, fractions, and impossible blinds", () => {
  for (const input of [
    { startingChips: -1 },
    { turnSeconds: Infinity },
    { maxPlayers: 9 },
    { smallBlind: 5.5 },
    { smallBlind: 20, bigBlind: 10 },
    { startingChips: 200, bigBlind: 100 },
  ])
    assert.throws(() => validateSettings(input));
});
test("60 randomized tables preserve chips, private cards, and progress across up to 600 hands", () => {
  let seed = 713;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  for (let table = 0; table < 60; table++) {
    const game = makeGame(2 + (table % 7));
    for (let hand = 0; hand < 10 && game.street !== "finished"; hand++) {
      let actions = 0;
      while (game.playing) {
        const id = game.players[game.actor].id;
        const view = game.view(id);
        view.players.forEach((p) => {
          if (p.id !== id) assert.ok(p.hand.every((c) => c === null));
        });
        const move = chooseBotAction(view, random);
        act(game, move.action, move.amount);
        game.assertChips();
        assert.ok(++actions < 500, "Hand must finish");
      }
      assert.equal(game.street, "showdown");
      game.startHand();
      game.assertChips();
    }
  }
});
