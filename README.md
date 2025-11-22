# 🎰 Pixel Poker - Retro Arcade Card Game

A pixel-art arcade-style poker game built with React and CSS, featuring sprite sheets for cards and chips with a classic game table aesthetic.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
PokerTableTop/
├── public/
│   └── assets/
│       └── sprites/          # Sprite sheet images go here
│           ├── cards.png     # Playing cards sprite sheet
│           └── chips.png     # Poker chips sprite sheet
├── src/
│   ├── assets/
│   │   ├── sprites/          # Alternative location for sprites
│   │   └── fonts/            # Custom pixel fonts
│   ├── components/
│   │   ├── Card/
│   │   │   ├── Card.jsx      # Playing card component
│   │   │   └── Card.css      # Card styling
│   │   ├── Chip/
│   │   │   ├── Chip.jsx      # Poker chip component
│   │   │   └── Chip.css      # Chip styling
│   │   ├── GameTable/
│   │   │   ├── GameTable.jsx # Main table layout
│   │   │   └── GameTable.css # Table styling
│   │   ├── DealerArea/
│   │   │   ├── DealerArea.jsx # Dealer & community cards
│   │   │   └── DealerArea.css
│   │   ├── PlayerArea/
│   │   │   ├── PlayerArea.jsx # Player hand & chips
│   │   │   └── PlayerArea.css
│   │   └── Controls/
│   │       ├── Controls.jsx   # Game action buttons
│   │       └── Controls.css
│   ├── utils/
│   │   └── spriteConfig.js   # Sprite sheet configuration
│   ├── App.jsx               # Main app component
│   ├── App.css               # App-level styles
│   ├── main.jsx              # Entry point
│   └── index.css             # Global styles
├── index.html
├── vite.config.js
└── package.json
```

## 🎨 Sprite Sheet Guidelines

### Playing Cards Sprite Sheet (`cards.png`)

**Recommended dimensions:**
- Individual card: 64x89 pixels
- Full sprite sheet: 832x356 pixels (13 columns × 4 rows)

**Layout:**
```
Row 0: Hearts   [A♥][2♥][3♥][4♥][5♥][6♥][7♥][8♥][9♥][10♥][J♥][Q♥][K♥]
Row 1: Diamonds [A♦][2♦][3♦][4♦][5♦][6♦][7♦][8♦][9♦][10♦][J♦][Q♦][K♦]
Row 2: Clubs    [A♣][2♣][3♣][4♣][5♣][6♣][7♣][8♣][9♣][10♣][J♣][Q♣][K♣]
Row 3: Spades   [A♠][2♠][3♠][4♠][5♠][6♠][7♠][8♠][9♠][10♠][J♠][Q♠][K♠]
```

**Tips for creating card sprites:**
1. Use pixel art style with clear, crisp edges
2. Include a 1-2 pixel border around each card
3. Use classic card suits and designs
4. Keep colors vibrant but limited (8-16 color palette)
5. Save as PNG with transparency

### Poker Chips Sprite Sheet (`chips.png`)

**Recommended dimensions:**
- Individual chip: 32x32 pixels
- Full sprite sheet: 160x32 pixels (5 columns × 1 row)

**Layout:**
```
[$1 White] [$5 Red] [$10 Blue] [$25 Green] [$100 Black]
```

**Tips for creating chip sprites:**
1. Use circular shapes (32x32 fits a circle well)
2. Add edge details to show chip thickness
3. Include denomination symbols or numbers
4. Use standard casino chip colors:
   - White/Gray: $1
   - Red: $5
   - Blue: $10
   - Green: $25
   - Black: $100
5. Add highlights and shadows for 3D effect

### Creating Sprite Sheets

**Tools recommended:**
- [Aseprite](https://www.aseprite.org/) - Pixel art editor (paid)
- [Piskel](https://www.piskelapp.com/) - Free online pixel art tool
- [GIMP](https://www.gimp.org/) - Free image editor
- [Photoshop](https://www.adobe.com/products/photoshop.html) with pixel art settings

**Quick creation steps:**
1. Create individual card/chip designs
2. Arrange them in a grid with consistent spacing
3. Export as PNG (no compression)
4. Place in `/public/assets/sprites/`
5. Update `src/utils/spriteConfig.js` if dimensions differ

### Temporary Placeholder Images

Until you create your sprite sheets, the app will work but cards/chips won't display images. To create quick placeholders:

**For cards:**
```bash
# Create a 832x356 placeholder
# You can use any image editor or online tool
```

**For chips:**
```bash
# Create a 160x32 placeholder
```

## 🎮 Component Usage Examples

### Using the Card Component

```jsx
import Card from './components/Card/Card';

// Face-up card
<Card suit="hearts" rank="A" scale={1.5} />

// Face-down card
<Card faceDown scale={1.5} />

// Clickable card
<Card
  suit="spades"
  rank="K"
  onClick={() => console.log('Card clicked!')}
/>
```

### Using the Chip Component

```jsx
import Chip from './components/Chip/Chip';

// Single chip
<Chip value={100} scale={1.5} />

// Stack of chips with count
<Chip value={25} count={5} scale={1.5} />
```

### Customizing Sprite Configuration

Edit `src/utils/spriteConfig.js` to match your sprite sheet dimensions:

```javascript
export const CARD_SPRITE_CONFIG = {
  spriteSheetPath: '/assets/sprites/cards.png',
  cardWidth: 64,      // Your card width
  cardHeight: 89,     // Your card height
  columns: 13,
  rows: 4,
  scale: 1
};
```

## 🎯 Features

- ✅ Pixel-art retro arcade aesthetic
- ✅ Sprite sheet-based rendering for performance
- ✅ Responsive design (desktop, tablet, mobile)
- ✅ Smooth animations and transitions
- ✅ Classic poker table layout
- ✅ Player action controls (Fold, Check, Call, Raise, All-in)
- ✅ Bet adjustment system
- ✅ Modular component architecture
- 🔄 Game logic (to be implemented)
- 🔄 Multi-player support (to be implemented)
- 🔄 Sound effects (to be implemented)

## 🎨 Styling & Theming

The project uses CSS custom properties for easy theming. Edit `src/index.css`:

```css
:root {
  --color-bg-primary: #1a1a2e;
  --color-bg-secondary: #2d2d44;
  --color-accent-gold: #ffd700;
  --color-accent-orange: #ff6b00;
  --color-felt-green: #0f5e3a;
  --color-wood-brown: #8b4513;
}
```

## 🔧 Customization

### Changing Table Colors

Edit `src/components/GameTable/GameTable.css`:
- `.table-felt` - Green playing surface
- `.poker-table` - Wood border color
- `.arcade-frame` - Outer frame styling

### Adding Custom Fonts

1. Add font files to `src/assets/fonts/`
2. Import in `src/index.css` or `src/App.css`
3. Update font-family references

### Adjusting Card/Chip Sizes

Modify the `scale` prop when using components:
```jsx
<Card suit="hearts" rank="A" scale={2} /> // 2x larger
<Chip value={100} scale={0.8} />          // 20% smaller
```

## 📝 Next Steps for Development

1. **Implement Game Logic**
   - Create game state management (Context API or Redux)
   - Implement poker hand evaluation
   - Add betting logic
   - Handle player turns

2. **Create Sprite Sheets**
   - Design 52 playing cards
   - Design poker chips
   - Add card back design
   - Optional: Add animations sprite sheets

3. **Add Sound Effects**
   - Card dealing sounds
   - Chip sounds
   - Button click sounds
   - Background music

4. **Multiplayer Support**
   - WebSocket integration
   - Room/lobby system
   - Player avatars

5. **Additional Features**
   - Hand history
   - Statistics tracking
   - Different poker variants
   - Tutorial mode

## 🎓 Learning Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [CSS Sprites Tutorial](https://css-tricks.com/css-sprites/)
- [Pixel Art Tutorial](https://blog.studiominiboss.com/pixelart)
- [Poker Rules](https://www.pokernews.com/poker-rules/)

## 📄 License

This project is open source and available for educational and personal use.

## 🤝 Contributing

Feel free to fork this project and add your own features! Some ideas:
- Different card designs
- Alternative table themes
- New game modes
- Improved animations
- Mobile touch optimizations

---

**Happy Coding! 🎰♠️♥️♣️♦️**
