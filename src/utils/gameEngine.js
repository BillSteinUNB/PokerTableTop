/**
 * Texas Hold'em Game Engine
 * Handles game flow, betting rounds, and game state management
 */

import { createDeck, shuffleDeck, dealCards } from './deck';
import { determineWinner } from './handEvaluator';

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
    chips: settings.startingChips,
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

  // Find first player after big blind (or dealer in heads-up)
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
      const raiseAmount = amount - player.currentBet;
      if (raiseAmount < currentBet || amount > player.chips + player.currentBet) {
        return {
          ...gameState,
          lastAction: { type: 'error', message: 'Invalid raise amount' }
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
      updatedCurrentBet = player.currentBet + actualRaiseAmount;
      actionTaken = {
        type: 'raise',
        playerIndex: currentPlayerIndex,
        playerName: player.name,
        amount: updatedCurrentBet
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

      // If all-in raise, reset hasActed for other players
      if (player.currentBet + allInAmount > currentBet) {
        updatedPlayers = updatedPlayers.map((p, idx) => {
          if (idx !== currentPlayerIndex && !p.folded && !p.allIn) {
            return { ...p, hasActed: false };
          }
          return p;
        });
        updatedCurrentBet = player.currentBet + allInAmount;
      }

      updatedPot += allInAmount;
      actionTaken = {
        type: 'all-in',
        playerIndex: currentPlayerIndex,
        playerName: player.name,
        amount: allInAmount
      };
      break;

    default:
      return {
        ...gameState,
        lastAction: { type: 'error', message: 'Invalid action' }
      };
  }

  const newState = {
    ...gameState,
    players: updatedPlayers,
    pot: updatedPot,
    currentBet: updatedCurrentBet,
    lastAction: actionTaken
  };

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

  // Find first player to act (first active player after dealer)
  let firstToAct = (gameState.dealerPosition + 1) % players.length;
  while (resetPlayers[firstToAct].folded || resetPlayers[firstToAct].allIn) {
    firstToAct = (firstToAct + 1) % players.length;
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
  const { players, communityCards, pot } = gameState;

  const { winners, winningHand } = determineWinner(players, communityCards);

  // Split pot among winners
  const potShare = Math.floor(pot / winners.length);

  const updatedPlayers = players.map(player => {
    const isWinner = winners.some(w => w.id === player.id);
    if (isWinner) {
      return {
        ...player,
        chips: player.chips + potShare
      };
    }
    return player;
  });

  return {
    ...gameState,
    players: updatedPlayers,
    pot: 0,
    currentBet: 0,
    roundState: ROUND_STATES.SHOWDOWN,
    lastAction: {
      type: 'showdown',
      winners: winners.map(w => ({ id: w.id, name: w.name })),
      winningHand,
      potShare
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

  // Move dealer button
  let newDealerPosition = (dealerPosition + 1) % players.length;

  // Find next dealer with chips
  while (players[newDealerPosition].chips <= 0) {
    newDealerPosition = (newDealerPosition + 1) % players.length;
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
  const { players, currentPlayerIndex, currentBet } = gameState;
  const player = players[currentPlayerIndex];

  if (!player || player.folded || player.allIn) {
    return [];
  }

  const actions = ['fold'];

  const callAmount = currentBet - player.currentBet;

  // Can check if no bet to call
  if (callAmount === 0) {
    actions.push('check');
  } else if (callAmount >= player.chips) {
    // If calling would use all chips, it's an all-in
    actions.push('all-in');
  } else {
    actions.push('call');
  }

  // Can raise if player has chips left after calling
  if (player.chips > callAmount) {
    actions.push('raise');
  }

  // Can always go all-in if you have chips
  if (player.chips > 0 && callAmount < player.chips) {
    actions.push('all-in');
  }

  return actions;
}

/**
 * Get minimum raise amount
 * @param {Object} gameState - Current game state
 * @returns {number} Minimum raise amount
 */
export function getMinRaise(gameState) {
  const { currentBet, settings } = gameState;
  return currentBet > 0 ? currentBet * 2 : settings.bigBlind;
}
