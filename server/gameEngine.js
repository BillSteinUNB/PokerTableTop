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
    this.lastRaiseAmount = 0;
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
      lastRaiseAmount: this.lastRaiseAmount,
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
    this.lastRaiseAmount = this.settings.bigBlind - this.settings.smallBlind;

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
        
        // Validate raise amount
        // 1. Must be able to afford it
        if (amount > player.chips + player.currentBet) {
          throw new Error('Insufficient chips for raise');
        }
        
        // 2. Must meet minimum raise (current bet + last raise size, or current bet + big blind)
        const minRaiseSize = this.lastRaiseAmount > 0 ? this.lastRaiseAmount : this.settings.bigBlind;
        const minRaiseTotal = this.currentBet + minRaiseSize;
        
        if (amount < minRaiseTotal) {
          throw new Error(`Minimum raise is ${minRaiseTotal}`);
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

        const oldBet = this.currentBet;
        this.currentBet = player.currentBet;
        const raiseSize = this.currentBet - oldBet;
        this.lastRaiseAmount = raiseSize;
        
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

        const oldBetAllIn = this.currentBet;
        if (player.currentBet > this.currentBet) {
          this.players.forEach((p, idx) => {
            if (idx !== this.currentPlayerIndex && !p.folded && !p.allIn) {
              p.hasActed = false;
            }
          });
          this.currentBet = player.currentBet;
          const allInRaiseSize = this.currentBet - oldBetAllIn;
          this.lastRaiseAmount = allInRaiseSize;
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
    // First, check if there are ANY players who can still act
    const playersWhoCanAct = this.players.filter(p => !p.folded && !p.allIn);
    
    if (playersWhoCanAct.length === 0) {
      // No one can act - advance to next round immediately
      console.log('[advanceToNextPlayer] No players can act, advancing to next round');
      this.advanceToNextRound();
      return;
    }

    if (playersWhoCanAct.length === 1) {
      // Only one player can act - check if betting round is complete
      const onlyPlayer = playersWhoCanAct[0];
      if (onlyPlayer.hasActed) {
        console.log('[advanceToNextPlayer] Only one player can act and has acted, advancing to next round');
        this.advanceToNextRound();
        return;
      }
    }

    // Find next active player who can act
    let nextIndex = (this.currentPlayerIndex + 1) % this.players.length;
    let attempts = 0;

    while (this.players[nextIndex].folded || this.players[nextIndex].allIn) {
      nextIndex = (nextIndex + 1) % this.players.length;
      attempts++;

      // Safety check: prevent infinite loop
      if (attempts >= this.players.length) {
        console.log('[advanceToNextPlayer] Looped through all players, advancing to next round');
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
    this.lastRaiseAmount = 0;

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

    // Check if any player can act (not folded and not all-in)
    const playersCanAct = this.players.filter(p => !p.folded && !p.allIn).length;

    if (playersCanAct === 0) {
      // All remaining players are all-in, recursively advance to next round
      this.advanceToNextRound();
      return;
    }

    // Find first player to act
    let firstToAct = (this.dealerPosition + 1) % this.players.length;
    let attempts = 0;
    while (this.players[firstToAct].folded || this.players[firstToAct].allIn) {
      firstToAct = (firstToAct + 1) % this.players.length;
      attempts++;
      // Safety check to prevent infinite loop
      if (attempts >= this.players.length) {
        this.advanceToNextRound();
        return;
      }
    }

    this.currentPlayerIndex = firstToAct;
  }

  handleShowdown() {
    // 1. Identify active players (not folded)
    const activePlayers = this.players.filter(p => !p.folded);

    if (activePlayers.length === 0) {
      // Edge case: Everyone folded
      this.roundState = ROUND_STATES.SHOWDOWN;
      this.pot = 0;
      this.currentBet = 0;
      this.lastAction = {
        type: 'showdown',
        winners: [],
        winningHand: null,
        message: 'All players folded'
      };
      return;
    }

    // 2. Sort active players by totalBet (ascending) to find side pot levels
    const betLevels = [...new Set(activePlayers.map(p => p.totalBet))]
      .sort((a, b) => a - b);

    let currentPotStart = 0;
    const winnings = new Array(this.players.length).fill(0);
    let mainPotWinningHand = null;

    // 3. Process each side pot level
    betLevels.forEach(level => {
      const potCap = level;
      const potAmount = this.players.reduce((sum, p) => {
        const contribution = Math.min(p.totalBet, potCap) - Math.min(p.totalBet, currentPotStart);
        return sum + Math.max(0, contribution);
      }, 0);

      if (potAmount > 0) {
        // Find eligible players for this side pot (active and bet at least this amount)
        const eligiblePlayers = activePlayers.filter(p => p.totalBet >= potCap);

        // Determine winner among eligible players
        const { winners, winningHand } = determineWinner(eligiblePlayers, this.communityCards);

        if (!mainPotWinningHand) {
          mainPotWinningHand = winningHand;
        }

        // Distribute pot evenly among winners, with remainder going to first winner(s)
        const share = Math.floor(potAmount / winners.length);
        const remainder = potAmount % winners.length;

        winners.forEach((winner, winnerIndex) => {
          const idx = this.players.findIndex(p => p.id === winner.id);
          if (idx !== -1) {
            winnings[idx] += share;
            // Award remainder chips to first winner(s)
            if (winnerIndex < remainder) {
              winnings[idx] += 1;
            }
          }
        });
      }

      currentPotStart = potCap;
    });

    // 4. Update players with winnings
    this.players.forEach((p, index) => {
      p.chips += winnings[index];
    });

    // 5. Identify all winners (anyone who won chips)
    const allWinners = this.players
      .filter((p, i) => winnings[i] > 0)
      .map(p => ({ id: p.id, name: p.name }));

    this.pot = 0;
    this.currentBet = 0;
    this.roundState = ROUND_STATES.SHOWDOWN;
    this.lastAction = {
      type: 'showdown',
      winners: allWinners,
      winningHand: mainPotWinningHand,
      potShare: 0
    };
  }

  nextHand() {
    // Check if game is over (only one player with chips or less)
    const playersWithChips = this.players.filter(p => p.chips > 0);

    if (playersWithChips.length <= 1) {
      // Game over - we have a tournament winner!
      this.roundState = ROUND_STATES.HAND_COMPLETE;
      this.lastAction = {
        type: 'game-over',
        winner: playersWithChips.length === 1 ? playersWithChips[0] : null,
        message: playersWithChips.length === 1
          ? `${playersWithChips[0].name} wins the tournament!`
          : 'Game over - no players remaining'
      };
      return;
    }

    // Move dealer button
    let newDealer = (this.dealerPosition + 1) % this.players.length;
    let attempts = 0;

    // Find next dealer with chips (with safety check to prevent infinite loop)
    while (this.players[newDealer].chips <= 0 && attempts < this.players.length) {
      newDealer = (newDealer + 1) % this.players.length;
      attempts++;
    }

    // Double-check we found a valid dealer
    if (attempts >= this.players.length) {
      this.roundState = ROUND_STATES.HAND_COMPLETE;
      this.lastAction = {
        type: 'game-over',
        winner: null,
        message: 'Game over - no valid dealers remaining'
      };
      return;
    }

    this.dealerPosition = newDealer;
    this.roundState = ROUND_STATES.WAITING;
    this.startNewHand();
  }
}
