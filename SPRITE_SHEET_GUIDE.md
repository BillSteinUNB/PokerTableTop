# 🎨 Sprite Sheet Creation Guide

This guide will help you create pixel-art sprite sheets for the poker game.

## Playing Cards Sprite Sheet

### Dimensions & Layout

```
┌─────────────────────────────────────────────────────────────┐
│  A♥   2♥   3♥   4♥   5♥   6♥   7♥   8♥   9♥  10♥   J♥   Q♥   K♥  │ Row 0 (Hearts)
│  A♦   2♦   3♦   4♦   5♦   6♦   7♦   8♦   9♦  10♦   J♦   Q♦   K♦  │ Row 1 (Diamonds)
│  A♣   2♣   3♣   4♣   5♣   6♣   7♣   8♣   9♣  10♣   J♣   Q♣   K♣  │ Row 2 (Clubs)
│  A♠   2♠   3♠   4♠   5♠   6♠   7♠   8♠   9♠  10♠   J♠   Q♠   K♠  │ Row 3 (Spades)
└─────────────────────────────────────────────────────────────┘
```

### Specifications

- **Individual Card Size:** 64 × 89 pixels
- **Total Sprite Sheet:** 832 × 356 pixels
- **Columns:** 13 (one per rank)
- **Rows:** 4 (one per suit)
- **Format:** PNG with transparency
- **Color Depth:** 8-bit or 24-bit
- **Background:** Transparent

### Design Tips

1. **Keep it Simple:** Use a limited color palette (8-16 colors)
2. **Clear Symbols:** Make suit symbols easily recognizable
3. **Corner Indices:** Include rank and suit in corners
4. **Border:** 1-2 pixel border around each card
5. **Consistency:** Keep same style across all cards

### Example Card Structure (64×89 pixels)

```
┌──────────────────┐
│ A            ♥   │  ← Corner rank & suit
│                  │
│                  │
│       ♥         │  ← Large center suit
│                  │
│                  │
│   ♥            A │  ← Inverted corner
└──────────────────┘
```

### Color Palette Suggestions

**Classic Style:**
- White: #FFFFFF (background)
- Black: #000000 (clubs, spades, borders)
- Red: #FF0000 (hearts, diamonds)
- Light Gray: #E0E0E0 (shadows)

**Retro Arcade Style:**
- Cream: #FFF8DC (background)
- Dark Blue: #1a1a2e (clubs, spades)
- Bright Red: #FF1744 (hearts, diamonds)
- Gold: #FFD700 (accents)

## Poker Chips Sprite Sheet

### Dimensions & Layout

```
┌──────────────────────────────────────────┐
│  [$1]   [$5]   [$10]  [$25]  [$100]     │
│ White   Red    Blue   Green   Black      │
└──────────────────────────────────────────┘
```

### Specifications

- **Individual Chip Size:** 32 × 32 pixels
- **Total Sprite Sheet:** 160 × 32 pixels
- **Columns:** 5 (one per denomination)
- **Rows:** 1
- **Format:** PNG with transparency
- **View:** Top-down perspective

### Design Tips

1. **Circular Shape:** Chips should be round (32px circle fits well)
2. **Edge Detail:** Show chip thickness with shading
3. **Color Coding:** Use standard casino colors
4. **Center Design:** Add denomination number or symbol
5. **Edge Spots:** Add colored spots around the rim (optional)

### Example Chip Structure (32×32 pixels)

```
     ○○○○○○○
   ○○      ○○
  ○   [$5]   ○    ← Denomination in center
 ○  ●      ●  ○   ← Edge spots (optional)
 ○            ○
 ○  ●      ●  ○
  ○          ○
   ○○      ○○
     ○○○○○○○
```

### Casino Standard Colors

| Value | Color      | Hex Code |
|-------|------------|----------|
| $1    | White      | #FFFFFF  |
| $5    | Red        | #FF0000  |
| $10   | Blue       | #0066FF  |
| $25   | Green      | #00AA00  |
| $100  | Black      | #000000  |

### Adding Details

**Simple chip (beginner):**
- Solid color circle
- White text with denomination
- Black outline

**Detailed chip (advanced):**
- Base color circle
- Inner and outer rings
- Edge spots in contrasting colors
- Center inlay with denomination
- Highlight/shadow for 3D effect

## Step-by-Step Creation

### Using Piskel (Free Online Tool)

1. Go to [piskelapp.com](https://www.piskelapp.com/)
2. Set canvas size to 832×356 for cards (or 160×32 for chips)
3. Use the grid tool (View > Grid > 64×89 for cards)
4. Draw first card/chip
5. Copy and modify for each variant
6. Export as PNG

### Using Aseprite (Recommended)

1. Create new sprite: 832×356 (or 160×32)
2. View > Grid > Grid Settings: 64×89
3. Use layers for organization
4. Draw each card in its grid cell
5. Export as PNG (File > Export)

### Using GIMP

1. File > New: 832×356 pixels
2. View > Show Grid
3. Edit > Preferences > Default Grid: 64×89
4. Create guides for each cell
5. Draw cards using selection tools
6. Export as PNG

## Quick Start Template

### Generate Placeholder Sprites with Code

If you want to quickly test the game before creating art, here's a simple HTML/Canvas approach:

```html
<!DOCTYPE html>
<html>
<body>
  <canvas id="cards" width="832" height="356"></canvas>
  <script>
    const canvas = document.getElementById('cards');
    const ctx = canvas.getContext('2d');

    const suits = ['♥', '♦', '♣', '♠'];
    const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const colors = ['red', 'red', 'black', 'black'];

    suits.forEach((suit, row) => {
      ranks.forEach((rank, col) => {
        const x = col * 64;
        const y = row * 89;

        // Draw card background
        ctx.fillStyle = 'white';
        ctx.fillRect(x, y, 64, 89);
        ctx.strokeStyle = 'black';
        ctx.strokeRect(x, y, 64, 89);

        // Draw rank and suit
        ctx.fillStyle = colors[row];
        ctx.font = '12px Arial';
        ctx.fillText(rank + suit, x + 5, y + 15);
      });
    });

    // Download
    setTimeout(() => {
      const link = document.createElement('a');
      link.download = 'cards.png';
      link.href = canvas.toDataURL();
      link.click();
    }, 100);
  </script>
</body>
</html>
```

Save as `generate-cards.html` and open in browser to download a basic sprite sheet.

## Testing Your Sprites

1. Save sprite sheets to `public/assets/sprites/`
2. Name them exactly: `cards.png` and `chips.png`
3. Run `npm run dev`
4. Check browser console for any errors
5. Verify alignment and spacing

### Common Issues

**Sprites don't align:**
- Check that dimensions match config in `src/utils/spriteConfig.js`
- Ensure no padding/spacing between sprites
- Verify PNG has no extra whitespace

**Images don't load:**
- Check file names are exact: `cards.png`, `chips.png`
- Verify files are in `public/assets/sprites/`
- Check browser console for 404 errors
- Clear browser cache

**Colors look wrong:**
- Ensure PNG is RGB or RGBA, not indexed color
- Check color profile (sRGB recommended)
- Verify no alpha transparency issues

## Resources

### Pixel Art Tools
- [Piskel](https://www.piskelapp.com/) - Free, online
- [Aseprite](https://www.aseprite.org/) - Paid, desktop ($20)
- [GraphicsGale](https://graphicsgale.com/) - Free, Windows
- [Krita](https://krita.org/) - Free, cross-platform

### Tutorials
- [Pixel Art Tutorial by Pedro Medeiros](https://blog.studiominiboss.com/pixelart)
- [Sprite Sheet Best Practices](https://www.codeandweb.com/what-is-a-sprite-sheet)
- [CSS Sprites Guide](https://css-tricks.com/css-sprites/)

### Inspiration
- Search "pixel art playing cards" on Google Images
- Check [itch.io](https://itch.io/game-assets/free/tag-cards) for free card assets
- Browse [OpenGameArt.org](https://opengameart.org/)

## Example Downloads

While you can't use these commercially, you can find reference sprites:
- Search for "retro playing cards pixel art" on game asset sites
- Look for "8-bit poker chips" for chip references
- Many are available under Creative Commons licenses for learning

---

**Good luck creating your sprites! 🎨**

Remember: Start simple, test often, and iterate. Your first sprite sheet doesn't need to be perfect!
