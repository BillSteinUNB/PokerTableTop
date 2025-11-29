/**
 * Server-side Game Engine Wrapper
 * Uses the client-side game engine logic on the server
 */

import { createDeck, shuffleDeck, dealCards, getRankValue } from './utils/deck.js';
import { determineWinner, evaluateHand } from './utils/handEvaluator.js';

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
    // Merge with defaults
    const defaultSettings = {
      smallBlind: 1,
      bigBlind: 2,
      buyIn: 200,
      startingAccountBalance: 1000,
      winMultiplier: 2.5,
      minBuyIn: 1,
      minPlayers: 2,
      maxPlayers: 8
    };
    this.settings = { ...defaultSettings, ...settings };

    this.players = players.map((player, index) => ({
      ...player,
      accountBalance: player.accountBalance !== undefined ? player.accountBalance : this.settings.startingAccountBalance,
      chips: 0, // Will be set during buy-in
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
      settings: this.settings,
      revealOrder: this.revealOrder,
      handDescriptions: this.handDescriptions
    };
  }

  startNewHand() {
    // Handle buy-ins: Players buy in from their account balance
    this.players = this.players.map(player => {
      const buyInAmount = Math.min(
        this.settings.buyIn,
        Math.max(this.settings.minBuyIn, player.accountBalance)
      );

      return {
        ...player,
        chips: buyInAmount,
        accountBalance: player.accountBalance - buyInAmount,
        hand: [],
        currentBet: 0,
        totalBet: 0,
        folded: buyInAmount === 0,
        allIn: false,
        hasActed: false
      };
    });

    const activePlayers = this.players.filter(p => !p.folded);
    if (activePlayers.length < 2) {
      this.roundState = ROUND_STATES.WAITING;
      return;
    }

    // Collect antes (before dealing cards)
    let anteTotal = 0;
    if (this.settings.ante && this.settings.ante > 0) {
      activePlayers.forEach(player => {
        const anteAmount = Math.min(this.settings.ante, player.chips);
        player.chips -= anteAmount;
        player.totalBet += anteAmount;
        anteTotal += anteAmount;
        if (player.chips === 0) {
          player.allIn = true;
        }
      });
    }

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

    // Calculate blind positions
    const smallBlindPos = (this.dealerPosition + 1) % this.players.length;
    const bigBlindPos = (this.dealerPosition + 2) % this.players.length;

    // Track big blind position for live bet feature
    this.bigBlindPosition = bigBlindPos;

    // Post blinds
    this.postBlind(smallBlindPos, this.settings.smallBlind);
    this.postBlind(bigBlindPos, this.settings.bigBlind);

    this.pot = anteTotal + this.settings.smallBlind + this.settings.bigBlind;
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
      player.totalBet += blindAmount;
      player.allIn = player.chips === 0;
      // Big blind hasn't acted yet (for live bet feature)
      if (position === this.bigBlindPosition) {
        player.hasActed = false;
      }
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
        const callAmount = this.currentBet - player.currentBet;

        // Validate there's something to call
        if (callAmount <= 0) {
          throw new Error('Nothing to call - use check instead');
        }

        // Calculate actual call amount (might be less if player doesn't have enough chips)
        const actualCallAmount = Math.min(callAmount, player.chips);

        player.chips -= actualCallAmount;
        player.currentBet += actualCallAmount;
        player.totalBet += actualCallAmount;
        player.allIn = player.chips === 0;
        player.hasActed = true;
        this.pot += actualCallAmount;
        this.lastAction = { type: 'call', playerIndex: this.currentPlayerIndex, playerName: player.name, amount: actualCallAmount };
        break;

      case 'bet':
        // First bet in a round (when currentBet is 0)
        if (this.currentBet !== 0) {
          throw new Error('Cannot bet - use raise instead');
        }

        // Validate bet amount
        // 1. Must be able to afford it
        if (amount > player.chips) {
          throw new Error('Insufficient chips for bet');
        }

        // 2. Must be at least big blind (unless going all-in with less)
        if (amount < this.settings.bigBlind && amount < player.chips) {
          throw new Error(`Minimum bet is ${this.settings.bigBlind}`);
        }

        const betAmount = Math.min(amount, player.chips);
        player.chips -= betAmount;
        player.currentBet += betAmount;
        player.totalBet += betAmount;
        player.allIn = player.chips === 0;
        player.hasActed = true;
        this.pot += betAmount;

        // Reset hasActed for other players
        this.players.forEach((p, idx) => {
          if (idx !== this.currentPlayerIndex && !p.folded && !p.allIn) {
            p.hasActed = false;
          }
        });

        this.currentBet = player.currentBet;
        this.lastRaiseAmount = this.currentBet;

        this.lastAction = { type: 'bet', playerIndex: this.currentPlayerIndex, playerName: player.name, amount: this.currentBet };
        break;

      case 'raise':
        const raiseAmount = amount - player.currentBet;

        // Validate raise amount
        // 1. Must be able to afford it
        if (amount > player.chips + player.currentBet) {
          throw new Error('Insufficient chips for raise');
        }

        // 2. Must meet minimum raise (current bet + last raise size, or current bet + big blind)
        // Exception: all-in for less than minimum is allowed
        const minRaiseSize = this.lastRaiseAmount > 0 ? this.lastRaiseAmount : this.settings.bigBlind;
        const minRaiseTotal = this.currentBet + minRaiseSize;
        const isAllIn = amount === player.chips + player.currentBet;

        if (amount < minRaiseTotal && !isAllIn) {
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

    // Special case: Big blind live bet in pre-flop
    // If we're in pre-flop and big blind hasn't acted yet, round is not complete
    if (this.roundState === ROUND_STATES.PRE_FLOP && this.bigBlindPosition !== undefined) {
      const bigBlindPlayer = this.players[this.bigBlindPosition];
      if (bigBlindPlayer && !bigBlindPlayer.folded && !bigBlindPlayer.allIn && !bigBlindPlayer.hasActed) {
        return false;
      }
    }

    // All active players have acted and matched current bet (or are all-in)
    // This ensures:
    // 1. All-in players are considered complete (they can't act further)
    // 2. Players who haven't acted yet mean round is incomplete
    // 3. Players who have acted must match the current bet (or be all-in with less)
    return activePlayers.every(p => {
      if (p.allIn) return true; // All-in players are done regardless of bet amount
      if (!p.hasActed) return false; // Player still needs to act
      return p.currentBet === this.currentBet; // Player must match current bet
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

    // Double-check if betting round is already complete before advancing
    // This prevents advancing to a player when the round should end
    if (this.isBettingRoundComplete()) {
      console.log('[advanceToNextPlayer] Betting round complete, advancing to next round');
      this.advanceToNextRound();
      return;
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

    // 4. Update players with winnings and add to account balance
    this.players.forEach((p, index) => {
      const wonAmount = winnings[index];
      p.chips += wonAmount;
      p.accountBalance += wonAmount;
    });

    // 5. Identify all winners (anyone who won chips)
    const allWinners = this.players
      .filter((p, i) => winnings[i] > 0)
      .map(p => ({ id: p.id, name: p.name }));

    // 6. Calculate reveal order (betting order from last aggressor)
    const revealOrder = activePlayers.map(p =>
      this.players.findIndex(player => player.id === p.id)
    );

    // 7. Generate hand descriptions for each active player
    const handDescriptions = activePlayers.map(p => {
      const hand = evaluateHand([...p.hand, ...this.communityCards]);
      let description = hand.name;

      // Add more detail for specific hands
      if (hand.name === 'One Pair') {
        const pairRank = hand.cards[0].rank;
        description = `Pair of ${pairRank}s`;
      } else if (hand.name === 'Two Pair') {
        const ranks = hand.tiebreakers.slice(0, 2);
        description = `Two Pair: ${ranks[0]}s & ${ranks[1]}s`;
      } else if (hand.name === 'Three of a Kind') {
        const rank = hand.tiebreakers[0];
        description = `Three ${rank}s`;
      } else if (hand.name === 'Straight') {
        const high = hand.tiebreakers[0];
        description = `Straight to ${high}`;
      } else if (hand.name === 'Flush') {
        const suit = hand.cards[0].suit;
        description = `${suit.charAt(0).toUpperCase()}${suit.slice(1)} Flush`;
      } else if (hand.name === 'Full House') {
        const three = hand.tiebreakers[0];
        const two = hand.tiebreakers[1];
        description = `${three}s full of ${two}s`;
      } else if (hand.name === 'Four of a Kind') {
        const rank = hand.tiebreakers[0];
        description = `Four ${rank}s`;
      } else if (hand.name === 'Straight Flush') {
        const high = hand.tiebreakers[0];
        description = `Straight Flush to ${high}`;
      }

      return {
        playerId: p.id,
        description: description,
        ranking: hand.ranking
      };
    });

    const totalPot = this.players.reduce((sum, p) => sum + p.totalBet, 0);

    // Check if anyone reached the win condition (2.5x buy-in)
    const winThreshold = this.settings.buyIn * this.settings.winMultiplier;
    const playersWhoReachedGoal = this.players.filter(p => p.chips >= winThreshold);

    this.pot = 0;
    this.currentBet = 0;
    this.roundState = ROUND_STATES.SHOWDOWN;
    this.revealOrder = revealOrder;
    this.handDescriptions = handDescriptions;
    this.playersWhoReachedGoal = playersWhoReachedGoal;
    this.lastAction = {
      type: 'showdown',
      winners: allWinners,
      winningHand: mainPotWinningHand,
      potWon: totalPot,
      potShare: 0,
      playersWhoReachedGoal: playersWhoReachedGoal
    };
  }

  nextHand() {
    // Check if anyone reached the win condition
    if (this.playersWhoReachedGoal && this.playersWhoReachedGoal.length > 0) {
      // Someone reached the goal!
      const winner = this.playersWhoReachedGoal[0];
      this.roundState = ROUND_STATES.HAND_COMPLETE;
      this.lastAction = {
        type: 'game-over',
        winner: winner,
        message: `${winner.name} reached $${this.settings.buyIn * this.settings.winMultiplier} and wins!`,
        reason: 'goal-reached'
      };
      return;
    }

    // Check if game is over (all players out of money)
    const playersWithMoney = this.players.filter(p => p.accountBalance > 0 || p.chips > 0);

    if (playersWithMoney.length <= 1) {
      // Game over - we have a winner by elimination!
      this.roundState = ROUND_STATES.HAND_COMPLETE;
      this.lastAction = {
        type: 'game-over',
        winner: playersWithMoney.length === 1 ? playersWithMoney[0] : null,
        message: playersWithMoney.length === 1
          ? `${playersWithMoney[0].name} wins - all others eliminated!`
          : 'Game over - no players remaining',
        reason: 'elimination'
      };
      return;
    }

    // Move dealer button
    let newDealer = (this.dealerPosition + 1) % this.players.length;
    let attempts = 0;

    // Find next dealer with money (chips or account balance)
    // Check both chips and accountBalance since chips might be 0 after showdown
    while ((this.players[newDealer].chips <= 0 && this.players[newDealer].accountBalance <= 0) && attempts < this.players.length) {
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
