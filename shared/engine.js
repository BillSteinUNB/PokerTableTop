import { shuffleDeck } from "./deck.js";
import { compareHands, evaluateHand } from "./handEvaluator.js";
import { validateProfile, validateSettings } from "./settings.js";

export const STREETS = ["preflop", "flop", "turn", "river"];
const publicCard = (card) => ({ rank: card.rank, suit: card.suit });
const createPlayer = (profile, chips, waitingForNextHand = false) => ({
  id: profile.id,
  name: profile.name,
  avatar: profile.avatar,
  isBot: !!profile.isBot,
  chips,
  hand: [],
  bet: 0,
  committed: 0,
  folded: waitingForNextHand,
  waitingForNextHand,
  actedAt: null,
  lastAction: "",
  handsWon: 0,
  eliminatedAt: null,
});

/** One rules engine for the server and offline practice. No transport or UI dependencies. */
export class PokerGame {
  constructor(players, settings = {}, options = {}) {
    this.settings = validateSettings(settings);
    if (players.length < 2 || players.length > this.settings.maxPlayers)
      throw new Error("A table needs 2–8 players.");
    this.players = players.map((p) =>
      createPlayer(p, this.settings.startingChips),
    );
    this.handNumber = 0;
    this.revision = 0;
    this.dealer = -1;
    this.street = "waiting";
    this.history = [];
    this.events = [];
    this.totalChips = this.players.length * this.settings.startingChips;
    this.deckFactory = options.deckFactory || shuffleDeck;
    this.startHand();
  }

  static restore(data) {
    const game = Object.assign(Object.create(PokerGame.prototype), data);
    game.deckFactory = shuffleDeck;
    game.smallBlindPosition ??= game.smallBlindSeat;
    game.players = game.players.map((p) => ({
      ...p,
      waitingForNextHand: p.waitingForNextHand ?? false,
    }));
    return game;
  }

  addPlayer(profile) {
    if (!this.playing && this.street !== "showdown")
      throw new Error("That game has finished. Wait for the next lobby.");
    if (this.players.length >= this.settings.maxPlayers)
      throw new Error("That table is full.");
    const validated = validateProfile(profile);
    if (
      typeof profile.id !== "string" ||
      !profile.id.trim() ||
      profile.id.length > 128
    )
      throw new Error("Invalid player identity.");
    if (this.players.some((p) => p.id === profile.id))
      throw new Error("That player already has a seat.");
    if (
      this.players.some(
        (p) => p.name.toLowerCase() === validated.name.toLowerCase(),
      )
    )
      throw new Error("That name already has a seat. Try another.");
    this.assertChips();
    this.players.push(
      createPlayer(
        { ...validated, id: profile.id, isBot: profile.isBot },
        this.settings.startingChips,
        true,
      ),
    );
    this.totalChips += this.settings.startingChips;
    this.assertChips();
    // A waiting seat cannot affect this hand or invalidate its pending action.
  }

  serialize() {
    const { deckFactory: _factory, ...data } = this;
    return data;
  }
  get pot() {
    return this.players.reduce((sum, p) => sum + p.committed, 0);
  }
  get active() {
    return this.players.filter((p) => !p.folded && p.hand.length);
  }
  get playing() {
    return STREETS.includes(this.street);
  }
  nextSeat(from, predicate) {
    for (let n = 1; n <= this.players.length; n++) {
      const index = (from + n + this.players.length) % this.players.length;
      if (predicate(this.players[index])) return index;
    }
    return -1;
  }

  log(text, kind = "action") {
    this.events.push({
      id: `${this.handNumber}-${this.events.length}`,
      text,
      kind,
    });
  }

  startHand() {
    if (this.street !== "waiting" && this.street !== "showdown")
      throw new Error("Finish the current hand first.");
    const funded = this.players.filter((p) => p.chips > 0);
    const admittingPlayers = this.players.some((p) => p.waitingForNextHand);
    if (funded.length < 2) {
      this.street = "finished";
      this.actor = -1;
      this.champion = funded[0]?.id || null;
      this.revision++;
      return;
    }
    this.handNumber++;
    const interval = this.settings.blindIncreaseEvery;
    this.level = interval ? Math.floor((this.handNumber - 1) / interval) : 0;
    // Cap growth at the total supply; all-in blinds still contribute only actual chips.
    this.bigBlind = Math.min(
      this.totalChips,
      this.settings.bigBlind * 2 ** Math.min(this.level, 20),
    );
    this.smallBlind = Math.min(
      this.totalChips,
      this.settings.smallBlind * 2 ** Math.min(this.level, 20),
    );
    if (this.handNumber === 1) {
      this.dealer = 0;
      this.smallBlindSeat =
        funded.length === 2
          ? this.dealer
          : this.nextSeat(this.dealer, (p) => p.chips > 0);
      this.bigBlindSeat = this.nextSeat(
        this.smallBlindSeat,
        (p) => p.chips > 0,
      );
    } else {
      const previousBigBlind = this.bigBlindSeat;
      this.bigBlindSeat = this.nextSeat(previousBigBlind, (p) => p.chips > 0);
      if (funded.length === 2) {
        this.dealer = this.nextSeat(this.bigBlindSeat, (p) => p.chips > 0);
        this.smallBlindSeat = this.dealer;
      } else {
        // Dead-button progression preserves the big-blind order after eliminations.
        this.dealer = this.smallBlindPosition;
        this.smallBlindSeat =
          this.players[previousBigBlind].chips > 0 ? previousBigBlind : -1;
      }
    }
    this.smallBlindPosition =
      this.smallBlindSeat === -1
        ? (this.bigBlindSeat - 1 + this.players.length) % this.players.length
        : this.smallBlindSeat;
    if (admittingPlayers && funded.length > 2) {
      // New seats may sit between the old button and the next small blind.
      // Keep the big-blind rotation, then place the button before that blind
      // position so the first live seat after it acts first on the flop.
      this.dealer =
        (this.smallBlindPosition - 1 + this.players.length) %
        this.players.length;
    }
    this.deck = this.deckFactory();
    this.board = [];
    this.result = null;
    this.events = [];
    this.currentBet = this.bigBlind;
    this.lastFullRaise = this.bigBlind;
    this.street = "preflop";
    for (const p of this.players) {
      Object.assign(p, {
        hand: [],
        bet: 0,
        committed: 0,
        folded: p.chips === 0,
        waitingForNextHand: false,
        actedAt: null,
        lastAction: "",
      });
    }
    // Deal clockwise, one card at a time.
    for (let round = 0; round < 2; round++) {
      for (let n = 1; n <= this.players.length; n++) {
        const p = this.players[(this.dealer + n) % this.players.length];
        if (!p.folded) p.hand.push(this.deck.pop());
      }
    }
    if (this.smallBlindSeat !== -1)
      this.pay(this.players[this.smallBlindSeat], this.smallBlind);
    this.pay(this.players[this.bigBlindSeat], this.bigBlind);
    this.log(
      `Hand ${this.handNumber} · blinds ${this.smallBlind} / ${this.bigBlind}`,
      "deal",
    );
    this.actor = this.nextSeat(
      this.bigBlindSeat,
      (p) => !p.folded && p.chips > 0,
    );
    this.revision++;
    this.progress(this.bigBlindSeat);
  }

  pay(player, amount) {
    const paid = Math.min(amount, player.chips);
    player.chips -= paid;
    player.bet += paid;
    player.committed += paid;
    return paid;
  }

  legalActions(id) {
    const p = this.players[this.actor];
    if (!this.playing || !p || p.id !== id) return null;
    const toCall = Math.max(0, this.currentBet - p.bet);
    const maxRaise = p.bet + p.chips;
    const reopened =
      p.actedAt === null ||
      p.actedAt === 0 ||
      this.currentBet - p.actedAt >= this.lastFullRaise;
    const opponentCanBet = this.active.some(
      (other) => other.id !== id && other.chips > 0,
    );
    const canRaise = reopened && opponentCanBet && maxRaise > this.currentBet;
    return {
      canCheck: toCall === 0,
      call: Math.min(toCall, p.chips),
      toCall,
      minRaise: this.currentBet + this.lastFullRaise,
      maxRaise,
      canRaise,
      canAllIn: maxRaise <= this.currentBet || canRaise,
    };
  }

  act(id, action, amount, expectedRevision = this.revision) {
    if (expectedRevision !== this.revision)
      throw new Error("The table changed. Please choose your action again.");
    const legal = this.legalActions(id);
    if (!legal) throw new Error("It is not your turn.");
    const p = this.players[this.actor];
    const seat = this.actor;
    let label;
    if (action === "fold") {
      p.folded = true;
      label = "Fold";
    } else if (action === "check") {
      if (!legal.canCheck) throw new Error("There is a bet to call.");
      label = "Check";
    } else if (action === "call") {
      if (!legal.call) throw new Error("Nothing to call. You can check.");
      const paid = this.pay(p, legal.call);
      label = p.chips ? `Call ${paid}` : `All-in ${p.bet}`;
    } else if (action === "raise" || action === "all-in") {
      const target = action === "all-in" ? legal.maxRaise : amount;
      if (
        !Number.isSafeInteger(target) ||
        target <= p.bet ||
        target > legal.maxRaise
      )
        throw new Error("Invalid raise amount.");
      if (target <= this.currentBet) {
        if (action !== "all-in")
          throw new Error("A raise must exceed the current bet.");
        this.pay(p, p.chips);
      } else {
        if (!legal.canRaise)
          throw new Error(
            "Betting has not reopened, or no opponent can call a raise.",
          );
        if (target < legal.minRaise && target !== legal.maxRaise)
          throw new Error(`Minimum raise is ${legal.minRaise}.`);
        const increase = target - this.currentBet;
        this.pay(p, target - p.bet);
        if (increase >= this.lastFullRaise) this.lastFullRaise = increase;
        this.currentBet = target;
      }
      label = p.chips ? `Raise to ${target}` : `All-in ${target}`;
    } else throw new Error("Unknown action.");
    p.actedAt = this.currentBet;
    p.lastAction = label;
    this.log(`${p.name} · ${label}`);
    this.revision++;
    this.progress(seat);
    this.assertChips();
  }

  progress(afterSeat) {
    if (this.active.length === 1) {
      this.settle(false);
      return;
    }
    const canAct = this.active.filter((p) => p.chips > 0);
    if (canAct.length <= 1)
      this.currentBet = Math.max(...this.active.map((p) => p.bet));
    // No betting into a dry side pot. The one remaining player must still call/fold when behind.
    if (
      canAct.length <= 1 &&
      (!canAct.length || canAct[0].bet >= this.currentBet)
    ) {
      while (this.board.length < 5) this.dealStreet();
      this.settle(true);
      return;
    }
    const needsAction = (p) =>
      !p.folded &&
      p.hand.length &&
      p.chips > 0 &&
      (p.actedAt === null || p.bet < this.currentBet);
    if (this.players.some(needsAction)) {
      this.actor = this.nextSeat(afterSeat, needsAction);
      return;
    }
    if (this.street === "river") {
      this.settle(true);
      return;
    }
    this.dealStreet();
    this.currentBet = 0;
    this.lastFullRaise = this.bigBlind;
    this.players.forEach((p) => {
      p.bet = 0;
      p.actedAt = null;
      p.lastAction = "";
    });
    this.actor = this.nextSeat(this.dealer, needsAction);
  }

  dealStreet() {
    this.deck.pop(); // Burn before every street.
    const count = this.board.length === 0 ? 3 : 1;
    for (let i = 0; i < count; i++) this.board.push(this.deck.pop());
    this.street =
      this.board.length === 3
        ? "flop"
        : this.board.length === 4
          ? "turn"
          : "river";
    this.log(
      this.street.charAt(0).toUpperCase() + this.street.slice(1),
      "street",
    );
  }

  settle(revealed) {
    const originalPot = this.pot;
    const awards = new Map();
    const pots = [];
    const refunds = [];
    const levels = [
      ...new Set(this.players.map((p) => p.committed).filter(Boolean)),
    ].sort((a, b) => a - b);
    let previous = 0;
    const evaluations = new Map(
      revealed
        ? this.active.map((p) => [
            p.id,
            evaluateHand([...p.hand, ...this.board]),
          ])
        : [],
    );
    for (const level of levels) {
      const contributors = this.players.filter((p) => p.committed >= level);
      const amount = (level - previous) * contributors.length;
      previous = level;
      if (contributors.length === 1) {
        contributors[0].chips += amount;
        refunds.push({ playerId: contributors[0].id, amount });
        continue;
      }
      let eligible = contributors.filter((p) => !p.folded);
      // Uncontested winner also receives dead money at every contribution level.
      if (!revealed) eligible = this.active;
      if (!eligible.length) throw new Error("Pot has no eligible player.");
      let winners = eligible;
      if (revealed && eligible.length > 1) {
        const best = eligible.reduce((a, b) =>
          compareHands(evaluations.get(a.id), evaluations.get(b.id)) >= 0
            ? a
            : b,
        );
        winners = eligible.filter(
          (p) =>
            compareHands(evaluations.get(p.id), evaluations.get(best.id)) === 0,
        );
      }
      // Odd chips go to the first winning seat clockwise from the dealer.
      winners.sort((a, b) => this.distance(a.id) - this.distance(b.id));
      winners.forEach((p, i) => {
        const share =
          Math.floor(amount / winners.length) +
          (i < amount % winners.length ? 1 : 0);
        p.chips += share;
        awards.set(p.id, (awards.get(p.id) || 0) + share);
      });
      pots.push({ amount, winners: winners.map((p) => p.id) });
    }
    this.result = {
      revealed,
      total:
        originalPot - refunds.reduce((sum, refund) => sum + refund.amount, 0),
      totalCommitted: originalPot,
      pots,
      refunds,
      winners: [...awards].map(([id, amount]) => ({
        id,
        amount,
        name: this.players.find((p) => p.id === id).name,
        handName: revealed ? evaluations.get(id)?.name : "Everyone folded",
      })),
      hands: Object.fromEntries(
        [...evaluations].map(([id, hand]) => [
          id,
          { name: hand.name, cards: hand.cards.map(publicCard) },
        ]),
      ),
    };
    for (const p of this.players) {
      if (awards.has(p.id)) p.handsWon++;
      if (!p.chips && p.eliminatedAt === null) p.eliminatedAt = this.handNumber;
      p.committed = 0;
      p.bet = 0;
    }
    this.log(
      this.result.winners.map((p) => `${p.name} wins ${p.amount}`).join(" · "),
      "win",
    );
    this.history.unshift({
      handNumber: this.handNumber,
      board: this.board.map(publicCard),
      winners: this.result.winners,
      total: this.result.total,
      events: [...this.events],
    });
    this.history = this.history.slice(0, 25);
    this.street = "showdown";
    this.actor = -1;
    this.currentBet = 0;
    this.assertChips();
  }

  distance(id) {
    const index = this.players.findIndex((p) => p.id === id);
    return (
      (index - this.dealer - 1 + this.players.length) % this.players.length
    );
  }
  assertChips() {
    if (
      this.players.some((p) => !Number.isSafeInteger(p.chips) || p.chips < 0) ||
      this.players.reduce((n, p) => n + p.chips, this.pot) !== this.totalChips
    )
      throw new Error("Chip conservation failed.");
  }

  view(playerId) {
    return {
      handNumber: this.handNumber,
      revision: this.revision,
      dealer: this.dealer,
      smallBlindSeat: this.smallBlindSeat,
      bigBlindSeat: this.bigBlindSeat,
      smallBlind: this.smallBlind,
      bigBlind: this.bigBlind,
      level: this.level,
      street: this.street,
      actor: this.actor,
      pot: this.pot,
      currentBet: this.currentBet,
      board: this.board.map(publicCard),
      result: this.result,
      champion: this.champion,
      history: this.history,
      events: this.events,
      legal: this.legalActions(playerId),
      players: this.players.map((p) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isBot: p.isBot,
        chips: p.chips,
        bet: p.bet,
        folded: p.folded,
        waitingForNextHand: p.waitingForNextHand,
        allIn: !p.chips && !p.folded && p.hand.length > 0,
        lastAction: p.lastAction,
        handsWon: p.handsWon,
        eliminatedAt: p.eliminatedAt,
        hand:
          p.id === playerId || (this.result?.revealed && !p.folded)
            ? p.hand.map(publicCard)
            : p.hand.map(() => null),
      })),
    };
  }
}
