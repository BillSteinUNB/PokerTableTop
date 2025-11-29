# Force Next Hand Debug Feature

## Overview
Added a debug tool for the **host only** to force skip to the next hand by automatically folding all remaining players.

## Purpose
This feature is designed for **debugging and testing** purposes. It allows the host to quickly advance through hands when testing game logic or recovering from stuck states.

## Features

### Button Appearance
- **Position:** Bottom-right corner (opposite to Exit button)
- **Color:** Orange (to indicate it's a debug tool)
- **Icon:** Fast-forward arrows
- **Label:** "Skip Hand"
- **Visibility:** Only visible to the lobby host

### Functionality
When clicked:
1. Shows confirmation dialog: "Skip to next hand? (All remaining players will fold)"
2. If confirmed, folds all players who haven't already folded or gone all-in
3. Advances to showdown/next hand
4. Notifies all players: "Host skipped to next hand"

## Implementation

### Files Created
1. **`src/components/ForceNextHandButton/ForceNextHandButton.jsx`** - Button component
2. **`src/components/ForceNextHandButton/ForceNextHandButton.css`** - Styling

### Files Modified
1. **`server/index.js`** - Added `forceNextHand` socket handler (host-only)
2. **`src/services/socket.js`** - Added `forceNextHand` method
3. **`src/context/GameContextMultiplayer.jsx`** - Added `forceNextHand` function
4. **`src/App.jsx`** - Integrated button into game view (host-only)

## Usage

### For Host:
1. Start or join a game as host
2. During gameplay, you'll see an orange "Skip Hand" button in bottom-right
3. Click it to force all remaining players to fold
4. Confirm the action
5. Game advances to next hand

### For Non-Host Players:
- Button is not visible
- Will see notification if host uses it: "Host skipped to next hand"

## Security

✅ **Server-side validation** - Only the lobby host can trigger this action  
✅ **Socket ID verification** - Server checks `lobby.hostId === socket.id`  
✅ **Error handling** - Non-hosts receive error: "Only host can force next hand"

## Use Cases

### Debugging
- Test hand transitions quickly
- Verify showdown logic
- Test chip distribution

### Recovery
- Unstick a frozen game state
- Skip past problematic hands
- Quick testing of multiple scenarios

### Testing
- Rapidly test different game states
- Verify all-in scenarios
- Test side pot calculations

## Technical Details

### Server Handler
```javascript
socket.on('forceNextHand', (callback) => {
  // Verify host
  if (lobby.hostId !== socket.id) {
    callback({ success: false, error: 'Only host can force next hand' });
    return;
  }

  // Fold all active players
  gameState.players.forEach((player, index) => {
    if (!player.folded && !player.allIn && player.chips > 0) {
      engine.currentPlayerIndex = index;
      engine.handlePlayerAction('fold', 0);
    }
  });

  // Broadcast update
  broadcastGameState(lobbyCode);
});
```

### Client Integration
- Button only renders if `lobbyData.isHost === true`
- Confirmation dialog prevents accidental clicks
- Error handling with user-friendly alerts

## Styling

### Button Style
```css
.force-next-hand-button {
  position: fixed;
  bottom: 20px;
  right: 20px;  /* Opposite to exit button */
  background-color: rgba(255, 140, 0, 0.7);  /* Orange for debug */
  border: 2px solid #ff8c00;
  /* ... */
}
```

### Visual Cues
- **Orange color** - Indicates debug/admin tool
- **Fast-forward icon** - Clear skip/advance meaning
- **Hover effect** - Brightens on hover
- **Active state** - Depresses on click

## Console Logging

The feature logs to console for debugging:
```
[Server] Host forcing next hand in lobby ABC123
[Server] Force folding Player1
[Server] Force folding Player2
[Socket] ✅ Forced next hand
```

## Limitations

⚠️ **Not for production use** - This is a debug tool  
⚠️ **Host only** - Regular players cannot access  
⚠️ **Requires confirmation** - Prevents accidental clicks  
⚠️ **Irreversible** - Cannot undo after confirming

## Future Enhancements

Potential improvements:
- Add keyboard shortcut (e.g., Ctrl+Shift+N)
- Option to skip multiple hands
- Ability to set specific player as winner
- Toggle to show/hide debug tools

---

**Status:** ✅ **IMPLEMENTED** - Ready for debugging and testing
