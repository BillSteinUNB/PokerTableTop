/**
 * Texas Hold'em Game Engine
 * Handles game flow, betting rounds, and game state management
 */

import { createDeck, shuffleDeck, dealCards } from './deck.js';
import { determineWinner } from './handEvaluator.js';

// Game round states
export const ROUND_STATES = {
  WAITING: 'waiting',
  PRE_FLOP: 'pre-flop',
  FLOP: 'flop',
  TURN: 'turn',
  RIVER: 'river',
  SHOWDOWN: 'showdown',
  HAND_COMPLETE: 'hand-complete'
};

// Default game settings
export const DEFAULT_SETTINGS = {
  smallBlind: 5,
  bigBlind: 10,
  startingChips: 1000,
  minPlayers: 2,
  maxPlayers: 8
};

/**
 * Initialize a new game
 * @param {Array} players - Array of player objects
 * @param {Object} settings - Game settings
 * @returns {Object} Initial game state
 */
export function initializeGame(players, settings = DEFAULT_SETTINGS) {
  const gamePlayers = players.map((player, index) => ({
    ...player,
    id: player.id || index,
    chips: player.chips !== undefined ? player.chips : settings.startingChips,
    hand: [],
    currentBet: 0,
    totalBet: 0,
    folded: false,
    allIn: false,
    hasActed: false
  }));

  return {
    players: gamePlayers,
    dealerPosition: 0,
    currentPlayerIndex: 0,
    pot: 0,
    currentBet: 0,
    lastRaiseAmount: 0,
    communityCards: [],
    deck: [],
    roundState: ROUND_STATES.WAITING,
    settings,
    lastAction: null,
    bettingRoundComplete: false
  };
}

/**
 * Start a new hand
 * @param {Object} gameState - Current game state
 * @returns {Object} Updated game state with new hand dealt
 */
export function startNewHand(gameState) {
  const { players, dealerPosition, settings } = gameState;

  // Reset player states
  const resetPlayers = players.map(player => ({
    ...player,
    hand: [],
    currentBet: 0,
    totalBet: 0,
    folded: player.chips <= 0, // Auto-fold players with no chips
    allIn: false,
    hasActed: false
  }));

  // Create and shuffle deck
  const deck = shuffleDeck(createDeck());

  // Deal 2 cards to each active player
  let remainingDeck = deck;
  const playersWithCards = resetPlayers.map(player => {
    if (player.folded) {
      return player;
    }

    const { dealtCards, remainingDeck: newDeck } = dealCards(remainingDeck, 2);
    remainingDeck = newDeck;

    return {
      ...player,
      hand: dealtCards
    };
  });

  // Determine blind positions
  const activePlayers = playersWithCards.filter(p => !p.folded);
  const numActivePlayers = activePlayers.length;

  if (numActivePlayers < 2) {
    return {
      ...gameState,
      roundState: ROUND_STATES.WAITING,
      lastAction: { type: 'error', message: 'Not enough players' }
    };
  }

  // Calculate positions (relative to dealer)
  const smallBlindPos = (dealerPosition + 1) % players.length;
  const bigBlindPos = (dealerPosition + 2) % players.length;

  // Find first player to act (first active player after big blind (or dealer in heads-up)
  let firstToAct;
  if (numActivePlayers === 2) {
    // In heads-up, dealer acts first pre-flop
    firstToAct = dealerPosition;
  } else {
    firstToAct = (bigBlindPos + 1) % players.length;
  }

  // Post blinds
  const playersWithBlinds = playersWithCards.map((player, index) => {
    if (index === smallBlindPos && !player.folded) {
      const smallBlindAmount = Math.min(settings.smallBlind, player.chips);
      return {
        ...player,
        chips: player.chips - smallBlindAmount,
        currentBet: smallBlindAmount,
        totalBet: smallBlindAmount,
        allIn: player.chips - smallBlindAmount === 0
      };
    } else if (index === bigBlindPos && !player.folded) {
      const bigBlindAmount = Math.min(settings.bigBlind, player.chips);
      return {
        ...player,
        chips: player.chips - bigBlindAmount,
        currentBet: bigBlindAmount,
        totalBet: bigBlindAmount,
        allIn: player.chips - bigBlindAmount === 0,
        hasActed: false // Big blind can still act if raised
      };
    }
    return player;
  });

  const pot = settings.smallBlind + settings.bigBlind;

  return {
    ...gameState,
    players: playersWithBlinds,
    deck: remainingDeck,
    communityCards: [],
    pot,
    currentBet: settings.bigBlind,
    lastRaiseAmount: settings.bigBlind - settings.smallBlind,
    roundState: ROUND_STATES.PRE_FLOP,
    currentPlayerIndex: firstToAct,
    bettingRoundComplete: false,
    lastAction: { type: 'new-hand', dealerPosition }
  };
}

/**
 * Process a player action
 * @param {Object} gameState - Current game state
 * @param {string} action - Action type (fold, check, call, raise, all-in)
 * @param {number} amount - Bet amount (for raise)
 * @returns {Object} Updated game state
 */
export function processPlayerAction(gameState, action, amount = 0) {
  const { players, currentPlayerIndex, currentBet, pot, roundState } = gameState;
  const player = players[currentPlayerIndex];

  // Validate it's this player's turn
  if (player.folded || player.allIn) {
    return {
      ...gameState,
      lastAction: { type: 'error', message: 'Not your turn or already acted' }
    };
  }

  let updatedPlayers = [...players];
  let updatedPot = pot;
  let updatedCurrentBet = currentBet;
  let actionTaken = null;

  switch (action) {
    case 'fold':
      updatedPlayers[currentPlayerIndex] = {
        ...player,
        folded: true,
        hasActed: true
      };
      actionTaken = { type: 'fold', playerIndex: currentPlayerIndex, playerName: player.name };
      break;

    case 'check':
      // Can only check if current bet matches player's bet
      if (player.currentBet !== currentBet) {
        return {
          ...gameState,
          lastAction: { type: 'error', message: 'Cannot check, must call or fold' }
        };
      }
      updatedPlayers[currentPlayerIndex] = {
        ...player,
        hasActed: true
      };
      actionTaken = { type: 'check', playerIndex: currentPlayerIndex, playerName: player.name };
      break;

    case 'call':
      const callAmount = Math.min(currentBet - player.currentBet, player.chips);
      updatedPlayers[currentPlayerIndex] = {
        ...player,
        chips: player.chips - callAmount,
        currentBet: player.currentBet + callAmount,
        totalBet: player.totalBet + callAmount,
        allIn: player.chips - callAmount === 0,
        hasActed: true
      };
      updatedPot += callAmount;
      actionTaken = {
        type: 'call',
        playerIndex: currentPlayerIndex,
        playerName: player.name,
        amount: callAmount
      };
      break;

    case 'raise':
      // Calculate how much the player needs to add to their current bet
      const raiseAmount = amount - player.currentBet;
      
      // Validate raise amount
      // 1. Must be able to afford it
      if (amount > player.chips + player.currentBet) {
        return {
          ...gameState,
          lastAction: { type: 'error', message: 'Insufficient chips for raise' }
        };
      }
      
      // 2. Must meet minimum raise (current bet + last raise size, or current bet + big blind)
      const minRaiseSize = gameState.lastRaiseAmount > 0 ? gameState.lastRaiseAmount : gameState.settings.bigBlind;
      const minRaiseTotal = currentBet + minRaiseSize;
      
      if (amount < minRaiseTotal) {
        return {
          ...gameState,
          lastAction: { type: 'error', message: `Minimum raise is ${minRaiseTotal}` }
        };
      }

      const actualRaiseAmount = Math.min(raiseAmount, player.chips);
      updatedPlayers[currentPlayerIndex] = {
        ...player,
        chips: player.chips - actualRaiseAmount,
        currentBet: player.currentBet + actualRaiseAmount,
        totalBet: player.totalBet + actualRaiseAmount,
        allIn: player.chips - actualRaiseAmount === 0,
        hasActed: true
      };

      // Reset hasActed for other players (they need to respond to raise)
      updatedPlayers = updatedPlayers.map((p, idx) => {
        if (idx !== currentPlayerIndex && !p.folded && !p.allIn) {
          return { ...p, hasActed: false };
        }
        return p;
      });

      updatedPot += actualRaiseAmount;
      const newBet = player.currentBet + actualRaiseAmount;
      const raiseSize = newBet - updatedCurrentBet;
      updatedCurrentBet = newBet;

      actionTaken = {
        type: 'raise',
        playerIndex: currentPlayerIndex,
        playerName: player.name,
        amount: updatedCurrentBet,
        raiseSize: raiseSize
      };
      break;

    case 'all-in':
      const allInAmount = player.chips;
      updatedPlayers[currentPlayerIndex] = {
        ...player,
        chips: 0,
        currentBet: player.currentBet + allInAmount,
        totalBet: player.totalBet + allInAmount,
        allIn: true,
        hasActed: true
      };

      // Calculate new bet after all-in
      const newAllInBet = player.currentBet + allInAmount;
      let allInRaiseSize = 0;

      // If all-in is a raise (increases current bet), reset hasActed for other players
      if (newAllInBet > currentBet) {
        updatedPlayers = updatedPlayers.map((p, idx) => {
          if (idx !== currentPlayerIndex && !p.folded && !p.allIn) {
            return { ...p, hasActed: false };
          }
          return p;
        });
        allInRaiseSize = newAllInBet - updatedCurrentBet;
        updatedCurrentBet = newAllInBet;
      }

      updatedPot += allInAmount;
      actionTaken = {
        type: 'all-in',
        playerIndex: currentPlayerIndex,
        playerName: player.name,
        amount: allInAmount,
        raiseSize: allInRaiseSize
      };
      break;

    default:
      return {
        ...gameState,
        lastAction: { type: 'error', message: 'Invalid action' }
      };
  }

  let newState = {
    ...gameState,
    players: updatedPlayers,
    pot: updatedPot,
    currentBet: updatedCurrentBet,
    lastAction: actionTaken
  };
  
  // Track last raise size for minimum raise calculation (for raise and all-in actions)
  if (action === 'raise' || action === 'all-in') {
    if (actionTaken.raiseSize && actionTaken.raiseSize > 0) {
      newState.lastRaiseAmount = actionTaken.raiseSize;
    }
  }

  // Check if betting round is complete
  if (isBettingRoundComplete(newState)) {
    return advanceToNextRound(newState);
  }

  // Move to next player
  return advanceToNextPlayer(newState);
}

/**
 * Check if betting round is complete
 * @param {Object} gameState - Current game state
 * @returns {boolean} True if betting round is complete
 */
function isBettingRoundComplete(gameState) {
  const { players, currentBet } = gameState;

  const activePlayers = players.filter(p => !p.folded);

  // If only one player left, round is complete
  if (activePlayers.length === 1) {
    return true;
  }

  // All active players have acted and matched current bet (or are all-in)
  return activePlayers.every(p => {
    if (p.allIn) return true;
    if (!p.hasActed) return false;
    return p.currentBet === currentBet;
  });
}

/**
 * Advance to next player
 * @param {Object} gameState - Current game state
 * @returns {Object} Updated game state
 */
function advanceToNextPlayer(gameState) {
  const { players, currentPlayerIndex } = gameState;

  let nextPlayerIndex = (currentPlayerIndex + 1) % players.length;

  // Find next active player
  while (players[nextPlayerIndex].folded || players[nextPlayerIndex].allIn) {
    nextPlayerIndex = (nextPlayerIndex + 1) % players.length;

    // Safety check: if we've looped all the way around
    if (nextPlayerIndex === currentPlayerIndex) {
      return advanceToNextRound(gameState);
    }
  }

  return {
    ...gameState,
    currentPlayerIndex: nextPlayerIndex
  };
}

/**
 * Advance to next betting round
 * @param {Object} gameState - Current game state
 * @returns {Object} Updated game state
 */
function advanceToNextRound(gameState) {
  const { roundState, players, deck, communityCards } = gameState;

  // Check if only one player remaining
  const activePlayers = players.filter(p => !p.folded);
  if (activePlayers.length === 1) {
    return handleShowdown(gameState);
  }

  // Reset player bets for new round
  const resetPlayers = players.map(p => ({
    ...p,
    currentBet: 0,
    hasActed: false
  }));

  // Reset last raise amount for new round
  gameState.lastRaiseAmount = 0;

  let newRoundState;
  let newCommunityCards = [...communityCards];
  let newDeck = deck;
  let cardsDealt = 0;

  switch (roundState) {
    case ROUND_STATES.PRE_FLOP:
      // Deal flop (3 cards)
      const flopResult = dealCards(deck, 3);
      newCommunityCards = flopResult.dealtCards;
      newDeck = flopResult.remainingDeck;
      newRoundState = ROUND_STATES.FLOP;
      cardsDealt = 3;
      break;

    case ROUND_STATES.FLOP:
      // Deal turn (1 card)
      const turnResult = dealCards(deck, 1);
      newCommunityCards = [...communityCards, ...turnResult.dealtCards];
      newDeck = turnResult.remainingDeck;
      newRoundState = ROUND_STATES.TURN;
      cardsDealt = 1;
      break;

    case ROUND_STATES.TURN:
      // Deal river (1 card)
      const riverResult = dealCards(deck, 1);
      newCommunityCards = [...communityCards, ...riverResult.dealtCards];
      newDeck = riverResult.remainingDeck;
      newRoundState = ROUND_STATES.RIVER;
      cardsDealt = 1;
      break;

    case ROUND_STATES.RIVER:
      // Go to showdown
      return handleShowdown(gameState);

    default:
      return gameState;
  }

  // Check if any player can act (not folded and not all-in)
  const playersCanAct = resetPlayers.filter(p => !p.folded && !p.allIn).length;
  
  if (playersCanAct === 0) {
      // Recursively advance if no one can act
      const intermediateState = {
        ...gameState,
        players: resetPlayers,
        deck: newDeck,
        communityCards: newCommunityCards,
        currentBet: 0,
        roundState: newRoundState,
        currentPlayerIndex: 0, // Dummy
        bettingRoundComplete: false,
        lastAction: {
            type: 'deal-cards',
            roundState: newRoundState,
            cardsDealt,
            autoAdvance: true
        }
      };
      return advanceToNextRound(intermediateState);
  }

  // Find first player to act
  // In heads-up, dealer acts first on all post-flop streets
  // In multi-way, first active player after dealer acts first
  const activePlayers = resetPlayers.filter(p => !p.folded && !p.allIn);
  let firstToAct;

  if (activePlayers.length === 2) {
    // Heads-up: dealer acts first post-flop
    firstToAct = gameState.dealerPosition;
    while (resetPlayers[firstToAct].folded || resetPlayers[firstToAct].allIn) {
      firstToAct = (firstToAct + 1) % players.length;
    }
  } else {
    // Multi-way: first active player after dealer
    firstToAct = (gameState.dealerPosition + 1) % players.length;
    while (resetPlayers[firstToAct].folded || resetPlayers[firstToAct].allIn) {
      firstToAct = (firstToAct + 1) % players.length;
    }
  }

  return {
    ...gameState,
    players: resetPlayers,
    deck: newDeck,
    communityCards: newCommunityCards,
    currentBet: 0,
    roundState: newRoundState,
    currentPlayerIndex: firstToAct,
    bettingRoundComplete: false,
    lastAction: {
      type: 'deal-cards',
      roundState: newRoundState,
      cardsDealt
    }
  };
}

/**
 * Handle showdown and determine winner
 * @param {Object} gameState - Current game state
 * @returns {Object} Updated game state with winner info
 */
function handleShowdown(gameState) {
  const { players, communityCards } = gameState;

  // 1. Identify active players (not folded)
  const activePlayers = players.filter(p => !p.folded);

  if (activePlayers.length === 0) {
    return gameState;
  }

  // 2. Sort active players by totalBet (ascending) to find side pot levels
  const betLevels = [...new Set(activePlayers.map(p => p.totalBet))]
    .sort((a, b) => a - b);

  let currentPotStart = 0;
  const winnings = new Array(players.length).fill(0);
  let mainPotWinningHand = null;

  betLevels.forEach(level => {
    const potCap = level;
    const potAmount = players.reduce((sum, p) => {
      const contribution = Math.min(p.totalBet, potCap) - Math.min(p.totalBet, currentPotStart);
      return sum + Math.max(0, contribution);
    }, 0);

    if (potAmount > 0) {
      // Find eligible players for this side pot (active and bet at least this amount)
      const eligiblePlayers = activePlayers.filter(p => p.totalBet >= potCap);

      // Determine winner among eligible
      const { winners, winningHand } = determineWinner(eligiblePlayers, communityCards);

      if (!mainPotWinningHand) {
        mainPotWinningHand = winningHand;
      }

      // Distribute pot evenly, with remainder going to first winner(s) closest to dealer button
      const share = Math.floor(potAmount / winners.length);
      const remainder = potAmount % winners.length;

      winners.forEach((winner, winnerIndex) => {
        const idx = players.findIndex(p => p.id === winner.id);
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

  // Update players with winnings
  const updatedPlayers = players.map((p, index) => ({
    ...p,
    chips: p.chips + winnings[index]
  }));

  // Identify all winners (anyone who won chips)
  const allWinners = updatedPlayers
    .filter((p, i) => winnings[i] > 0)
    .map(p => ({ id: p.id, name: p.name }));

  return {
    ...gameState,
    players: updatedPlayers,
    pot: 0,
    currentBet: 0,
    roundState: ROUND_STATES.SHOWDOWN,
    lastAction: {
      type: 'showdown',
      winners: allWinners,
      winningHand: mainPotWinningHand,
      potShare: 0
    }
  };
}

/**
 * Move to next hand
 * @param {Object} gameState - Current game state
 * @returns {Object} Updated game state ready for new hand
 */
export function moveToNextHand(gameState) {
  const { players, dealerPosition } = gameState;

  // Check if game is over (only one player with chips or less)
  const playersWithChips = players.filter(p => p.chips > 0);

  if (playersWithChips.length <= 1) {
    // Game over - we have a tournament winner!
    return {
      ...gameState,
      roundState: ROUND_STATES.HAND_COMPLETE,
      lastAction: {
        type: 'game-over',
        winner: playersWithChips.length === 1 ? playersWithChips[0] : null,
        message: playersWithChips.length === 1
          ? `${playersWithChips[0].name} wins the tournament!`
          : 'Game over - no players remaining'
      }
    };
  }

  // Move dealer button
  let newDealerPosition = (dealerPosition + 1) % players.length;
  let attempts = 0;

  // Find next dealer with chips (with safety check to prevent infinite loop)
  while (players[newDealerPosition].chips <= 0 && attempts < players.length) {
    newDealerPosition = (newDealerPosition + 1) % players.length;
    attempts++;
  }

  // Double-check we found a valid dealer (should never happen with check above, but safety first)
  if (attempts >= players.length) {
    return {
      ...gameState,
      roundState: ROUND_STATES.HAND_COMPLETE,
      lastAction: {
        type: 'game-over',
        winner: null,
        message: 'Game over - no valid dealers remaining'
      }
    };
  }

  const updatedState = {
    ...gameState,
    dealerPosition: newDealerPosition,
    roundState: ROUND_STATES.WAITING
  };

  return startNewHand(updatedState);
}

/**
 * Get valid actions for current player
 * @param {Object} gameState - Current game state
 * @returns {Array} Array of valid action names
 */
export function getValidActions(gameState) {
  const { players, currentPlayerIndex, currentBet, settings, lastRaiseAmount = 0 } = gameState;
  const player = players?.[currentPlayerIndex];

  // Validate player exists and is active
  if (!player || player.folded || player.allIn) {
    console.log('[getValidActions] No valid player or already acted:', {
      player: player?.name,
      folded: player?.folded,
      allIn: player?.allIn
    });
    return [];
  }

  const actions = ['fold'];
  const callAmount = currentBet - player.currentBet;

  console.log('[getValidActions] Player:', player.name, 'Chips:', player.chips, 'Current bet:', player.currentBet, 'Call amount:', callAmount);

  // Can check if no bet to call
  if (callAmount === 0) {
    actions.push('check');
  } else {
    // Always allow call if there is a bet (even if it puts you all-in)
    actions.push('call');
  }

  // Calculate minimum raise requirements
  const minRaiseSize = lastRaiseAmount > 0 ? lastRaiseAmount : settings.bigBlind;
  const minRaiseTotal = currentBet + minRaiseSize;
  const chipsNeededForMinRaise = minRaiseTotal - player.currentBet;

  // Can raise if player has enough chips to meet minimum raise
  // Player can raise if they have more chips than just calling
  if (player.chips > callAmount && player.chips >= chipsNeededForMinRaise) {
    actions.push('raise');
  }

  // Can go all-in if you have chips and you haven't called yet, OR if calling would put you all-in
  if (player.chips > 0) {
    actions.push('all-in');
  }

  console.log('[getValidActions] Valid actions:', actions);
  return actions;
}

/**
 * Get minimum raise amount
 * @param {Object} gameState - Current game state
 * @returns {number} Minimum raise amount
 */
export function getMinRaise(gameState) {
  const { currentBet, settings, lastRaiseAmount = 0 } = gameState;

  // Standard poker rules: minimum raise = current bet + last raise size
  // If no raise yet this round, minimum raise is one big blind
  const minRaiseSize = lastRaiseAmount > 0 ? lastRaiseAmount : settings.bigBlind;

  return currentBet + minRaiseSize;
}
