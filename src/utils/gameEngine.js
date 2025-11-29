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
  smallBlind: 1,
  bigBlind: 2,
  buyIn: 200,
  startingAccountBalance: 1000,
  winMultiplier: 2.5,
  minBuyIn: 1,
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
  const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };

  const gamePlayers = players.map((player, index) => ({
    ...player,
    id: player.id || index,
    accountBalance: player.accountBalance !== undefined ? player.accountBalance : mergedSettings.startingAccountBalance,
    chips: 0, // Will be set during buy-in
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
    settings: mergedSettings,
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

  // Handle buy-ins: Players buy in from their account balance
  const playersAfterBuyIn = players.map(player => {
    const buyInAmount = Math.min(
      settings.buyIn,
      Math.max(settings.minBuyIn, player.accountBalance)
    );

    return {
      ...player,
      chips: buyInAmount,
      accountBalance: player.accountBalance - buyInAmount,
      hand: [],
      currentBet: 0,
      totalBet: 0,
      folded: buyInAmount === 0, // Can't play if no chips to buy in
      allIn: false,
      hasActed: false
    };
  });

  // Reset player states
  const resetPlayers = playersAfterBuyIn.map(player => ({
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

  // Track big blind position for live bet feature
  const bigBlindPosition = bigBlindPos;

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
    bigBlindPosition: bigBlindPosition,
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
      const callAmount = currentBet - player.currentBet;

      // Validate there's something to call
      if (callAmount <= 0) {
        return {
          ...gameState,
          lastAction: { type: 'error', message: 'Nothing to call - use check instead' }
        };
      }

      // Calculate actual call amount (might be less if player doesn't have enough chips)
      const actualCallAmount = Math.min(callAmount, player.chips);

      updatedPlayers[currentPlayerIndex] = {
        ...player,
        chips: player.chips - actualCallAmount,
        currentBet: player.currentBet + actualCallAmount,
        totalBet: player.totalBet + actualCallAmount,
        allIn: player.chips - actualCallAmount === 0,
        hasActed: true
      };
      updatedPot += actualCallAmount;
      actionTaken = {
        type: 'call',
        playerIndex: currentPlayerIndex,
        playerName: player.name,
        amount: actualCallAmount
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
      // Exception: all-in for less than minimum is allowed
      const minRaiseSize = gameState.lastRaiseAmount > 0 ? gameState.lastRaiseAmount : gameState.settings.bigBlind;
      const minRaiseTotal = currentBet + minRaiseSize;
      const isAllIn = amount === player.chips + player.currentBet;

      if (amount < minRaiseTotal && !isAllIn) {
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
  const { players, currentBet, roundState, bigBlindPosition } = gameState;

  const activePlayers = players.filter(p => !p.folded);

  // If only one player left, round is complete
  if (activePlayers.length === 1) {
    return true;
  }

  // Special case: Big blind live bet in pre-flop
  // If we're in pre-flop and big blind hasn't acted yet, round is not complete
  if (roundState === ROUND_STATES.PRE_FLOP && bigBlindPosition !== undefined) {
    const bigBlindPlayer = players[bigBlindPosition];
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
    return p.currentBet === currentBet; // Player must match current bet
  });
}

/**
 * Advance to next player
 * @param {Object} gameState - Current game state
 * @returns {Object} Updated game state
 */
function advanceToNextPlayer(gameState) {
  const { players, currentPlayerIndex } = gameState;

  // First, check if there are ANY players who can still act
  const playersWhoCanAct = players.filter(p => !p.folded && !p.allIn);

  if (playersWhoCanAct.length === 0) {
    // No one can act - advance to next round immediately
    console.log('[advanceToNextPlayer] No players can act, advancing to next round');
    return advanceToNextRound(gameState);
  }

  if (playersWhoCanAct.length === 1) {
    // Only one player can act - check if betting round is complete
    const onlyPlayer = playersWhoCanAct[0];
    if (onlyPlayer.hasActed) {
      console.log('[advanceToNextPlayer] Only one player can act and has acted, advancing to next round');
      return advanceToNextRound(gameState);
    }
  }

  // Double-check if betting round is already complete before advancing
  // This prevents advancing to a player when the round should end
  if (isBettingRoundComplete(gameState)) {
    console.log('[advanceToNextPlayer] Betting round complete, advancing to next round');
    return advanceToNextRound(gameState);
  }

  // Find next active player who can act
  let nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
  let attempts = 0;

  while (players[nextPlayerIndex].folded || players[nextPlayerIndex].allIn) {
    nextPlayerIndex = (nextPlayerIndex + 1) % players.length;
    attempts++;

    // Safety check: prevent infinite loop
    if (attempts >= players.length) {
      console.log('[advanceToNextPlayer] Looped through all players, advancing to next round');
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
  const playersWhoCanActNow = resetPlayers.filter(p => !p.folded && !p.allIn);
  let firstToAct;

  if (playersWhoCanActNow.length === 2) {
    // Heads-up: dealer acts first post-flop
    firstToAct = gameState.dealerPosition;
    let attempts = 0;
    while (resetPlayers[firstToAct].folded || resetPlayers[firstToAct].allIn) {
      firstToAct = (firstToAct + 1) % players.length;
      attempts++;
      if (attempts >= players.length) {
        // Safety: if we can't find anyone, recursively advance (e.g. deal next street)
        console.error('[advanceToNextRound] Could not find first player to act (heads-up), advancing');
        return advanceToNextRound({
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
                cardsDealt
            }
        });
      }
    }
  } else {
    // Multi-way: first active player after dealer
    firstToAct = (gameState.dealerPosition + 1) % players.length;
    let attempts = 0;
    while (resetPlayers[firstToAct].folded || resetPlayers[firstToAct].allIn) {
      firstToAct = (firstToAct + 1) % players.length;
      attempts++;
      if (attempts >= players.length) {
        // Safety: if we can't find anyone, recursively advance
        console.error('[advanceToNextRound] Could not find first player to act (multi-way), advancing');
        return advanceToNextRound({
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
                cardsDealt
            }
        });
      }
    }
  }

  return {
    ...gameState,
    players: resetPlayers,
    deck: newDeck,
    communityCards: newCommunityCards,
    currentBet: 0,
    lastRaiseAmount: 0,
    roundState: newRoundState,
    currentPlayerIndex: firstToAct,
    bigBlindPosition: undefined, // Clear big blind position after pre-flop
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
    // Edge case: Everyone folded (e.g. via debug force next hand)
    // End the hand gracefully
    return {
        ...gameState,
        roundState: ROUND_STATES.SHOWDOWN,
        pot: 0,
        currentBet: 0,
        lastAction: {
            type: 'showdown',
            winners: [],
            winningHand: null,
            message: 'All players folded'
        }
    };
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

  // Update players with winnings and add to account balance
  const updatedPlayers = players.map((p, index) => {
    const wonAmount = winnings[index];
    return {
      ...p,
      chips: p.chips + wonAmount,
      accountBalance: p.accountBalance + wonAmount
    };
  });

  // Identify all winners (anyone who won chips)
  const allWinners = updatedPlayers
    .filter((p, i) => winnings[i] > 0)
    .map(p => ({ id: p.id, name: p.name }));

  // Calculate reveal order (betting order from last aggressor)
  // For now, use simple order: active players in seat order
  const revealOrder = activePlayers.map(p =>
    players.findIndex(player => player.id === p.id)
  );

  // Generate hand descriptions for each active player
  const handDescriptions = activePlayers.map(p => {
    const hand = evaluateHand([...p.hand, ...communityCards]);
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

  const totalPot = players.reduce((sum, p) => sum + p.totalBet, 0);

  // Check if anyone reached the win condition (2.5x buy-in)
  const winThreshold = gameState.settings.buyIn * gameState.settings.winMultiplier;
  const playersWhoReachedGoal = updatedPlayers.filter(p => p.chips >= winThreshold);

  return {
    ...gameState,
    players: updatedPlayers,
    pot: 0,
    currentBet: 0,
    roundState: ROUND_STATES.SHOWDOWN,
    revealOrder: revealOrder,
    handDescriptions: handDescriptions,
    playersWhoReachedGoal: playersWhoReachedGoal,
    lastAction: {
      type: 'showdown',
      winners: allWinners,
      winningHand: mainPotWinningHand,
      potWon: totalPot,
      potShare: 0,
      playersWhoReachedGoal: playersWhoReachedGoal
    }
  };
}

/**
 * Move to next hand
 * @param {Object} gameState - Current game state
 * @returns {Object} Updated game state ready for new hand
 */
export function moveToNextHand(gameState) {
  const { players, dealerPosition, settings } = gameState;

  // Check if anyone reached the win condition
  if (gameState.playersWhoReachedGoal && gameState.playersWhoReachedGoal.length > 0) {
    // Someone reached the goal!
    const winner = gameState.playersWhoReachedGoal[0]; // First player to reach goal wins
    return {
      ...gameState,
      roundState: ROUND_STATES.HAND_COMPLETE,
      lastAction: {
        type: 'game-over',
        winner: winner,
        message: `${winner.name} reached $${settings.buyIn * settings.winMultiplier} and wins!`,
        reason: 'goal-reached'
      }
    };
  }

  // Check if game is over (all players out of money)
  const playersWithMoney = players.filter(p => p.accountBalance > 0 || p.chips > 0);

  if (playersWithMoney.length <= 1) {
    // Game over - we have a winner by elimination!
    return {
      ...gameState,
      roundState: ROUND_STATES.HAND_COMPLETE,
      lastAction: {
        type: 'game-over',
        winner: playersWithMoney.length === 1 ? playersWithMoney[0] : null,
        message: playersWithMoney.length === 1
          ? `${playersWithMoney[0].name} wins - all others eliminated!`
          : 'Game over - no players remaining',
        reason: 'elimination'
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
