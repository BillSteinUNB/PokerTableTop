import { evaluateHand, compareHands, determineWinner } from './handEvaluator.js';
import { initializeGame, startNewHand, processPlayerAction, getValidActions } from './gameEngine.js';
import { getRankValue } from './deck.js';

// --- Helper Functions ---
function createCard(rank, suit) {
  return { rank, suit };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

// --- Tests ---

console.log('--- Starting Deep Dive Simulation ---');

// 1. Hand Evaluation Tests
console.log('\n--- 1. Hand Evaluation Tests ---');

const royalFlush = [
  createCard('A', 'hearts'), createCard('K', 'hearts'), createCard('Q', 'hearts'),
  createCard('J', 'hearts'), createCard('10', 'hearts')
];
const straightFlush = [
  createCard('K', 'hearts'), createCard('Q', 'hearts'), createCard('J', 'hearts'),
  createCard('10', 'hearts'), createCard('9', 'hearts')
];
const fourOfAKind = [
  createCard('A', 'hearts'), createCard('A', 'diamonds'), createCard('A', 'clubs'),
  createCard('A', 'spades'), createCard('K', 'hearts')
];
const fullHouse = [
  createCard('A', 'hearts'), createCard('A', 'diamonds'), createCard('A', 'clubs'),
  createCard('K', 'spades'), createCard('K', 'hearts')
];

const evalRF = evaluateHand(royalFlush);
assert(evalRF.name === 'Royal Flush', 'Royal Flush identification');

const evalSF = evaluateHand(straightFlush);
assert(evalSF.name === 'Straight Flush', 'Straight Flush identification');

assert(compareHands(evalRF, evalSF) === 1, 'Royal Flush beats Straight Flush');

const evalFour = evaluateHand(fourOfAKind);
assert(compareHands(evalSF, evalFour) === 1, 'Straight Flush beats Four of a Kind');

const evalFull = evaluateHand(fullHouse);
assert(compareHands(evalFour, evalFull) === 1, 'Four of a Kind beats Full House');

// Test Kickers
const pair1 = [
  createCard('A', 'hearts'), createCard('A', 'diamonds'), createCard('K', 'clubs'),
  createCard('Q', 'spades'), createCard('J', 'hearts')
];
const pair2 = [
  createCard('A', 'clubs'), createCard('A', 'spades'), createCard('K', 'diamonds'),
  createCard('Q', 'hearts'), createCard('10', 'hearts')
];
const evalPair1 = evaluateHand(pair1);
const evalPair2 = evaluateHand(pair2);
assert(compareHands(evalPair1, evalPair2) === 1, 'Pair with better kicker wins');


// 2. Game Flow Simulation
console.log('\n--- 2. Game Flow Simulation ---');

const players = [
  { name: 'Alice', chips: 1000 },
  { name: 'Bob', chips: 1000 },
  { name: 'Charlie', chips: 1000 }
];

// Dealer: Alice(0). SB: Bob(1). BB: Charlie(2).
// Action starts with Alice(0) (UTG/Button).

let gameState = initializeGame(players);
gameState = startNewHand(gameState);

console.log('Initial Pot:', gameState.pot);
assert(gameState.pot === 15, 'Blinds posted (5+10)');
assert(gameState.currentBet === 10, 'Current bet is BB');

// Alice (UTG) calls 10
gameState = processPlayerAction(gameState, 'call');
assert(gameState.players[0].currentBet === 10, 'Alice called 10');
assert(gameState.pot === 25, 'Pot increased after call');

// Bob (SB) calls (needs 5 more)
gameState = processPlayerAction(gameState, 'call');
assert(gameState.pot === 30, 'Pot increased after SB call');

// Charlie (BB) checks
gameState = processPlayerAction(gameState, 'check');
assert(gameState.roundState === 'flop', 'Round advanced to Flop');
assert(gameState.communityCards.length === 3, 'Flop dealt');

// Flop
// Action starts after Button/Dealer.
// Dealer is Alice(0).
// First to act is SB (Bob, 1).
// Bob checks
gameState = processPlayerAction(gameState, 'check');

// Charlie checks
gameState = processPlayerAction(gameState, 'check');

// Alice bets 50
gameState = processPlayerAction(gameState, 'raise', 50); // Raise to 50
assert(gameState.currentBet === 50, 'Current bet is 50');

// Bob folds
gameState = processPlayerAction(gameState, 'fold');

// Charlie calls 50
gameState = processPlayerAction(gameState, 'call');

assert(gameState.roundState === 'turn', 'Round advanced to Turn');
assert(gameState.pot === 130, 'Pot is 30 + 50 + 50 = 130');


// 3. All-In Logic Test
console.log('\n--- 3. All-In Logic Test ---');
// Reset game
gameState = initializeGame(players);
gameState = startNewHand(gameState);
// Dealer: Alice(0). SB: Bob(1). BB: Charlie(2).
// Action: Alice(0).

// Alice goes All-In (1000)
gameState = processPlayerAction(gameState, 'all-in');
assert(gameState.players[0].chips === 0, 'Alice chips 0');
assert(gameState.players[0].allIn === true, 'Alice is All-In');
assert(gameState.currentBet === 1000, 'Current bet is 1000');

// Bob (SB) has 995. Calls All-In.
gameState = processPlayerAction(gameState, 'call'); 
assert(gameState.players[1].chips === 0, 'Bob chips 0');
assert(gameState.players[1].allIn === true, 'Bob is All-In');

// Charlie (BB) Folds
gameState = processPlayerAction(gameState, 'fold');

// Should advance to Showdown immediately since all active players are All-In
assert(gameState.roundState === 'showdown', 'Game skipped to Showdown');
assert(gameState.communityCards.length === 5, 'All cards dealt');


// 4. Side Pot Logic (Expected Failure?)
console.log('\n--- 4. Side Pot Logic Check ---');
// Player A: 100 chips
// Player B: 1000 chips
// Player C: 1000 chips
const shortStackPlayers = [
  { name: 'Shorty', chips: 100 },
  { name: 'Big1', chips: 1000 },
  { name: 'Big2', chips: 1000 }
];
gameState = initializeGame(shortStackPlayers);
gameState = startNewHand(gameState);
// Dealer: Shorty(0). SB: Big1(1). BB: Big2(2).
// Action: Shorty(0).

// Shorty raises to 100 (All-In)
gameState = processPlayerAction(gameState, 'raise', 100);
assert(gameState.players[0].allIn === true, 'Shorty All-In');

// Big1 calls 100.
gameState = processPlayerAction(gameState, 'call');

// Big2 calls 100.
gameState = processPlayerAction(gameState, 'call');

// Flop dealt.
// Shorty is All-In. Big1 and Big2 can bet.
// Action starts with Big1 (SB).

// Big1 bets 200.
gameState = processPlayerAction(gameState, 'raise', 200); // Bet 200
// Big2 calls 200.
gameState = processPlayerAction(gameState, 'call');

// Pot should be:
// Main Pot: 100 (Shorty) + 100 (Big1) + 100 (Big2) = 300.
// Side Pot: 200 (Big1) + 200 (Big2) = 400.
// Total Pot: 700.

// Turn
gameState = processPlayerAction(gameState, 'check'); // Big1
gameState = processPlayerAction(gameState, 'check'); // Big2

// River
gameState = processPlayerAction(gameState, 'check'); // Big1

// RIG HANDS BEFORE SHOWDOWN
gameState.players[0].hand = [createCard('A', 'spades'), createCard('A', 'clubs')];
gameState.players[1].hand = [createCard('K', 'spades'), createCard('K', 'clubs')];
gameState.players[2].hand = [createCard('Q', 'spades'), createCard('Q', 'clubs')];
gameState.communityCards = [
  createCard('2', 'hearts'), createCard('3', 'hearts'), createCard('4', 'hearts'),
  createCard('5', 'hearts'), createCard('7', 'diamonds')
];

// Final Check triggers Showdown
gameState = processPlayerAction(gameState, 'check'); // Big2

console.log('Total Pot (Before Distribution):', 700); // We know it was 700

// Shorty (0) had best hand (Aces). Big1 (1) had 2nd best (Kings).
// Shorty bet 100. Big1 bet 300. Big2 bet 300.
// Main Pot (Shorty eligible): 100*3 = 300. Shorty wins.
// Side Pot (Big1 vs Big2): 200*2 = 400. Big1 wins.

const shortyChips = gameState.players[0].chips;
console.log(`Shorty Final Chips: ${shortyChips}`);

if (shortyChips === 300) {
    console.log('✅ PASSED: Shorty won Main Pot (300).');
} else {
    console.error(`❌ FAILED: Shorty has ${shortyChips}, expected 300.`);
    process.exit(1);
}

const big1Chips = gameState.players[1].chips;
console.log(`Big1 Final Chips: ${big1Chips}`);

// Big1 started with 1000. Bet 300. Remaining: 700. Won 400. Total: 1100.
if (big1Chips === 1100) {
    console.log('✅ PASSED: Big1 won Side Pot (400).');
} else {
    console.error(`❌ FAILED: Big1 has ${big1Chips}, expected 1100.`);
    process.exit(1);
}

console.log('\n--- Simulation Complete ---');
