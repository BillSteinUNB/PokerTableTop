# 🎨 Simple Sprite Sheet Setup

## ✅ Game Works Without Sprites!

The game now works **perfectly without any sprite sheets**! Cards and chips use CSS fallbacks that look great. When you're ready, add sprite sheets and they'll automatically be used.

## 📁 What You Need (Optional)

Just drop these files in the right folders - that's it!

### **Option 1: Single Card Sprite Sheet** (Simplest!)

```
public/assets/sprites/CardSprite.png
```

**Dimensions**: 2470 × 1325 pixels
**Grid**: 13 columns × 5 rows
**Each card**: 190 × 265 pixels

**Layout**:
```
Row 0: A♠ 2♠ 3♠ ... K♠  (Spades)
Row 1: A♥ 2♥ 3♥ ... K♥  (Hearts)
Row 2: A♣ 2♣ 3♣ ... K♣  (Clubs)
Row 3: A♦ 2♦ 3♦ ... K♦  (Diamonds)
Row 4: [Card Backs] → Classic, Red, Blue, Green, Purple
```

### **Option 2: Chip Sprite Sheets** (5 separate files)

```
public/assets/sprites/BlackChips.jpg
public/assets/sprites/RedChips.jpg
public/assets/sprites/BlueChips.jpg
public/assets/sprites/GreenChips.jpg
public/assets/sprites/WhiteChips.jpg
```

**Each file**: 512 × 256 pixels
**Grid**: 4 columns × 2 rows
**Each arrangement**: 128 × 128 pixels

**Layout** (same for all colors):
```
Row 0: [Single chip] [Small stack] [Tall stack] [Angled stack]
Row 1: [Large chip]  [Two chips]   [Short stack] [Scattered]
```

### **Option 3: Character Faces** (8 images)

```
public/assets/sprites/characters/
├── cat.png      (Cool Cat)
├── robot.png    (Robot)
├── cowboy.png   (Cowboy)
├── pirate.png   (Pirate)
├── ninja.png    (Ninja)
├── wizard.png   (Wizard)
├── knight.png   (Knight)
└── alien.png    (Alien)
```

Any size works - they'll auto-scale. 64×64px or 128×128px recommended.

## 🚀 Quick Test

1. **Run the game**:
   ```bash
   npm run dev
   ```

2. **Click "Create Lobby" → "🎮 DEMO MODE"**

3. **See it in action!**
   - Cards show with ranks and suits (CSS fallback)
   - Chips show as colored circles (CSS fallback)
   - Everything works perfectly!

4. **Add sprite sheets when ready**:
   - Drop files in folders above
   - Refresh browser
   - Sprites automatically replace CSS versions!

## 💡 Pro Tips

**Don't have sprite sheets yet?**
- The CSS fallbacks look great!
- Game is fully playable
- Take your time creating sprites

**Want to test with real sprites?**
- Add just the card sprite sheet first
- Or just the chips
- Or just character faces
- They work independently!

**Making sprites yourself?**
- Use any pixel art tool (Aseprite, Piskel, GIMP)
- Follow the grid layout above
- No spacing between sprites
- PNG for cards (transparency OK)
- JPG or PNG for chips

## 🎯 Current Status

✅ Cards: Working with CSS (will use CardSprite.png if available)
✅ Chips: Working with CSS (will use *Chips.jpg if available)
✅ Characters: Working with emoji (will use character/*.png if available)

**The game is ready to play right now!** Sprites are just visual upgrades.

---

Need help? Check `SPRITE_SHEET_GUIDE.md` for detailed sprite creation instructions!
