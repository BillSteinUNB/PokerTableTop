/**
 * Server-side Game Engine Wrapper
 * Uses the client-side game engine logic on the server
 */

import { createDeck, shuffleDeck, dealCards, getRankValue } from './utils/deck.js';
import { determineWinner } from './utils/handEvaluator.js';

const ROUND_STATES = {
  WAITING: 'waiting',
  PRE_FLOP: 'pre-flop',
  FLOP: 'flop',
  TURN: 'turn',
  RIVER: 'river',
  SHOWDOWN: 'showdown',
  HAND_COMPLETE: 'hand-complete'
};

export class GameEngine {
  constructor(players, settings) {
    this.settings = settings;
    this.players = players.map((player, index) => ({
      ...player,
      chips: settings.startingChips,
      hand: [],
      currentBet: 0,
      totalBet: 0,
      folded: false,
      allIn: false,
      hasActed: false
    }));

    this.dealerPosition = 0;
    this.currentPlayerIndex = 0;
    this.pot = 0;
    this.currentBet = 0;
    this.communityCards = [];
    this.deck = [];
    this.roundState = ROUND_STATES.WAITING;
    this.lastAction = null;

    // Start first hand
    this.startNewHand();
  }

  getGameState() {
    return {
      players: this.players,
      dealerPosition: this.dealerPosition,
      currentPlayerIndex: this.currentPlayerIndex,
      pot: this.pot,
      currentBet: this.currentBet,
      communityCards: this.communityCards,
      roundState: this.roundState,
      lastAction: this.lastAction,
      settings: this.settings
    };
  }

  startNewHand() {
    // Reset player states
    this.players = this.players.map(player => ({
      ...player,
      hand: [],
      currentBet: 0,
      totalBet: 0,
      folded: player.chips <= 0,
      allIn: false,
      hasActed: false
    }));

    // Create and shuffle deck
    this.deck = shuffleDeck(createDeck());

    // Deal 2 cards to each active player
    this.players.forEach(player => {
      if (!player.folded) {
        const { dealtCards, remainingDeck } = dealCards(this.deck, 2);
        player.hand = dealtCards;
        this.deck = remainingDeck;
      }
    });

    const activePlayers = this.players.filter(p => !p.folded);
    if (activePlayers.length < 2) {
      this.roundState = ROUND_STATES.WAITING;
      return;
    }

    // Calculate blind positions
    const smallBlindPos = (this.dealerPosition + 1) % this.players.length;
    const bigBlindPos = (this.dealerPosition + 2) % this.players.length;

    // Post blinds
    this.postBlind(smallBlindPos, this.settings.smallBlind);
    this.postBlind(bigBlindPos, this.settings.bigBlind);

    this.pot = this.settings.smallBlind + this.settings.bigBlind;
    this.currentBet = this.settings.bigBlind;

    // First to act (after big blind)
    if (activePlayers.length === 2) {
      this.currentPlayerIndex = this.dealerPosition;
    } else {
      this.currentPlayerIndex = (bigBlindPos + 1) % this.players.length;
    }

    this.roundState = ROUND_STATES.PRE_FLOP;
    this.communityCards = [];
    this.lastAction = { type: 'new-hand', dealerPosition: this.dealerPosition };
  }

  postBlind(position, amount) {
    const player = this.players[position];
    if (player && !player.folded) {
      const blindAmount = Math.min(amount, player.chips);
      player.chips -= blindAmount;
      player.currentBet = blindAmount;
      player.totalBet = blindAmount;
      player.allIn = player.chips === 0;
    }
  }

  handlePlayerAction(action, amount = 0) {
    const player = this.players[this.currentPlayerIndex];

    if (player.folded || player.allIn) {
      throw new Error('Cannot act - player folded or all-in');
    }

    switch (action) {
      case 'fold':
        player.folded = true;
        player.hasActed = true;
        this.lastAction = { type: 'fold', playerIndex: this.currentPlayerIndex, playerName: player.name };
        break;

      case 'check':
        if (player.currentBet !== this.currentBet) {
          throw new Error('Cannot check - must call or fold');
        }
        player.hasActed = true;
        this.lastAction = { type: 'check', playerIndex: this.currentPlayerIndex, playerName: player.name };
        break;

      case 'call':
        const callAmount = Math.min(this.currentBet - player.currentBet, player.chips);
        player.chips -= callAmount;
        player.currentBet += callAmount;
        player.totalBet += callAmount;
        player.allIn = player.chips === 0;
        player.hasActed = true;
        this.pot += callAmount;
        this.lastAction = { type: 'call', playerIndex: this.currentPlayerIndex, playerName: player.name, amount: callAmount };
        break;

      case 'raise':
        const raiseAmount = amount - player.currentBet;
        if (amount <= this.currentBet || amount > player.chips + player.currentBet) {
          throw new Error('Invalid raise amount');
        }
        const actualRaise = Math.min(raiseAmount, player.chips);
        player.chips -= actualRaise;
        player.currentBet += actualRaise;
        player.totalBet += actualRaise;
        player.allIn = player.chips === 0;
        player.hasActed = true;
        this.pot += actualRaise;

        // Reset hasActed for other players
        this.players.forEach((p, idx) => {
          if (idx !== this.currentPlayerIndex && !p.folded && !p.allIn) {
            p.hasActed = false;
          }
        });

        this.currentBet = player.currentBet;
        this.lastAction = { type: 'raise', playerIndex: this.currentPlayerIndex, playerName: player.name, amount: this.currentBet };
        break;

      case 'all-in':
        const allInAmount = player.chips;
        player.chips = 0;
        player.currentBet += allInAmount;
        player.totalBet += allInAmount;
        player.allIn = true;
        player.hasActed = true;
        this.pot += allInAmount;

        if (player.currentBet > this.currentBet) {
          this.players.forEach((p, idx) => {
            if (idx !== this.currentPlayerIndex && !p.folded && !p.allIn) {
              p.hasActed = false;
            }
          });
          this.currentBet = player.currentBet;
        }

        this.lastAction = { type: 'all-in', playerIndex: this.currentPlayerIndex, playerName: player.name, amount: allInAmount };
        break;

      default:
        throw new Error('Invalid action');
    }

    // Check if betting round is complete
    if (this.isBettingRoundComplete()) {
      this.advanceToNextRound();
    } else {
      this.advanceToNextPlayer();
    }
  }

  isBettingRoundComplete() {
    const activePlayers = this.players.filter(p => !p.folded);

    if (activePlayers.length === 1) {
      return true;
    }

    return activePlayers.every(p => {
      if (p.allIn) return true;
      if (!p.hasActed) return false;
      return p.currentBet === this.currentBet;
    });
  }

  advanceToNextPlayer() {
    let nextIndex = (this.currentPlayerIndex + 1) % this.players.length;

    while (this.players[nextIndex].folded || this.players[nextIndex].allIn) {
      nextIndex = (nextIndex + 1) % this.players.length;
      if (nextIndex === this.currentPlayerIndex) {
        this.advanceToNextRound();
        return;
      }
    }

    this.currentPlayerIndex = nextIndex;
  }

  advanceToNextRound() {
    const activePlayers = this.players.filter(p => !p.folded);
    if (activePlayers.length === 1) {
      this.handleShowdown();
      return;
    }

    // Reset player bets
    this.players.forEach(p => {
      p.currentBet = 0;
      p.hasActed = false;
    });

    this.currentBet = 0;

    switch (this.roundState) {
      case ROUND_STATES.PRE_FLOP:
        const { dealtCards: flop, remainingDeck: deckAfterFlop } = dealCards(this.deck, 3);
        this.communityCards = flop;
        this.deck = deckAfterFlop;
        this.roundState = ROUND_STATES.FLOP;
        break;

      case ROUND_STATES.FLOP:
        const { dealtCards: turn, remainingDeck: deckAfterTurn } = dealCards(this.deck, 1);
        this.communityCards.push(...turn);
        this.deck = deckAfterTurn;
        this.roundState = ROUND_STATES.TURN;
        break;

      case ROUND_STATES.TURN:
        const { dealtCards: river, remainingDeck: deckAfterRiver } = dealCards(this.deck, 1);
        this.communityCards.push(...river);
        this.deck = deckAfterRiver;
        this.roundState = ROUND_STATES.RIVER;
        break;

      case ROUND_STATES.RIVER:
        this.handleShowdown();
        return;
    }

    // Find first player to act
    let firstToAct = (this.dealerPosition + 1) % this.players.length;
    while (this.players[firstToAct].folded || this.players[firstToAct].allIn) {
      firstToAct = (firstToAct + 1) % this.players.length;
    }

    this.currentPlayerIndex = firstToAct;
  }

  handleShowdown() {
    const { winners, winningHand } = determineWinner(this.players, this.communityCards);
    const potShare = Math.floor(this.pot / winners.length);

    winners.forEach(winner => {
      const player = this.players.find(p => p.id === winner.id);
      if (player) {
        player.chips += potShare;
      }
    });

    this.pot = 0;
    this.currentBet = 0;
    this.roundState = ROUND_STATES.SHOWDOWN;
    this.lastAction = {
      type: 'showdown',
      winners: winners.map(w => ({ id: w.id, name: w.name })),
      winningHand,
      potShare
    };
  }

  nextHand() {
    // Move dealer button
    let newDealer = (this.dealerPosition + 1) % this.players.length;
    while (this.players[newDealer].chips <= 0) {
      newDealer = (newDealer + 1) % this.players.length;
    }
    this.dealerPosition = newDealer;
    this.roundState = ROUND_STATES.WAITING;
    this.startNewHand();
  }
}
