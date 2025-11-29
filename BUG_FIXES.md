# Poker Game Logic Bug Fixes

## Summary
Fixed critical bugs in the poker game engine that were preventing players from raising the pot or going all-in under certain conditions.

## Bugs Identified and Fixed

### Bug #1: Reference to Undefined Variable (CRITICAL)
**Location:** `src/utils/gameEngine.js` - Lines 277 & 304 (original)

**Problem:** 
The code was trying to set `newState.lastRaiseAmount` before the `newState` variable was declared. This would cause a runtime error whenever a player tried to raise or go all-in.

```javascript
// BEFORE (BROKEN):
case 'raise':
  // ... code ...
  newState.lastRaiseAmount = raiseSize;  // ❌ newState doesn't exist yet!
  break;

let newState = {  // ❌ Declared AFTER being used
  ...gameState,
  // ...
};
```

**Fix:**
Moved the `lastRaiseAmount` tracking to AFTER `newState` is created, and stored the `raiseSize` in the `actionTaken` object so it can be accessed later.

```javascript
// AFTER (FIXED):
case 'raise':
  // ... code ...
  actionTaken = {
    type: 'raise',
    raiseSize: raiseSize  // ✅ Store in actionTaken
  };
  break;

let newState = {
  ...gameState,
  // ...
};

// ✅ Now set lastRaiseAmount AFTER newState exists
if (action === 'raise' || action === 'all-in') {
  if (actionTaken.raiseSize && actionTaken.raiseSize > 0) {
    newState.lastRaiseAmount = actionTaken.raiseSize;
  }
}
```

---

### Bug #2: Incorrect Raise Validation Logic
**Location:** `src/utils/gameEngine.js` - Line 239 (original)

**Problem:**
The raise validation was checking if `raiseAmount < currentBet`, which doesn't make sense. This would incorrectly reject valid raises.

```javascript
// BEFORE (BROKEN):
if (raiseAmount < currentBet || amount > player.chips + player.currentBet) {
  // ❌ Wrong comparison - raiseAmount is the chips being added,
  //    not the total bet amount
  return { ...gameState, lastAction: { type: 'error', message: 'Invalid raise amount' }};
}
```

**Fix:**
Properly validate that:
1. The player can afford the raise
2. The raise meets the minimum raise requirement (current bet + last raise size, or current bet + big blind)

```javascript
// AFTER (FIXED):
// 1. Must be able to afford it
if (amount > player.chips + player.currentBet) {
  return {
    ...gameState,
    lastAction: { type: 'error', message: 'Insufficient chips for raise' }
  };
}

// 2. Must meet minimum raise (current bet + last raise size, or current bet + big blind)
const minRaiseSize = gameState.lastRaiseAmount > 0 
  ? gameState.lastRaiseAmount 
  : gameState.settings.bigBlind;
const minRaiseTotal = currentBet + minRaiseSize;

if (amount < minRaiseTotal) {
  return {
    ...gameState,
    lastAction: { type: 'error', message: `Minimum raise is ${minRaiseTotal}` }
  };
}
```

---

### Bug #3: Incorrect Valid Actions Logic
**Location:** `src/utils/gameEngine.js` - Lines 671-677 (original)

**Problem:**
The `getValidActions` function was only checking if `player.chips > callAmount` to determine if raise/all-in were valid. This didn't account for the minimum raise requirement, so players might see "raise" as an option even when they couldn't afford the minimum raise.

```javascript
// BEFORE (BROKEN):
// Can raise if player has chips left after calling
if (player.chips > callAmount) {
  actions.push('raise');  // ❌ Doesn't check if they can afford min raise
}

// Can go all-in if you have chips and calling isn't already all-in
if (player.chips > callAmount) {
  actions.push('all-in');  // ❌ Same condition as raise
}
```

**Fix:**
Calculate the minimum raise requirement and only allow "raise" if the player has enough chips to meet it. Allow "all-in" whenever the player has any chips (since you can always go all-in with whatever you have).

```javascript
// AFTER (FIXED):
// Calculate minimum raise requirements
const minRaiseSize = lastRaiseAmount > 0 ? lastRaiseAmount : settings.bigBlind;
const minRaiseTotal = currentBet + minRaiseSize;
const chipsNeededForMinRaise = minRaiseTotal - player.currentBet;

// Can raise if player has enough chips to meet minimum raise
if (player.chips >= chipsNeededForMinRaise) {
  actions.push('raise');  // ✅ Only if they can afford min raise
}

// Can go all-in if you have chips (always available if you have chips)
if (player.chips > 0) {
  actions.push('all-in');  // ✅ Always available with any chips
}
```

---

## Impact

These fixes ensure that:
1. ✅ Players can raise when they have enough chips to meet the minimum raise
2. ✅ Players can go all-in whenever they have chips
3. ✅ The game correctly tracks the last raise amount for calculating minimum raises
4. ✅ Proper error messages are shown when a raise is invalid
5. ✅ The UI correctly shows which actions are available to the player

## Testing Recommendations

1. Test raising with various chip amounts
2. Test going all-in in different scenarios
3. Test that minimum raise requirements are enforced correctly
4. Test that the UI shows correct available actions
5. Test edge cases like:
   - Player with exactly enough chips for minimum raise
   - Player with less than minimum raise but more than call
   - Multiple raises in a row (re-raises)
   - All-in that constitutes a raise vs. all-in that's just a call
