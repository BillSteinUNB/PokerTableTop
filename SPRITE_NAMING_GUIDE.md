# Sprite Image Naming Guide

This project uses **individual sliced sprite images** instead of sprite sheets for easier management and flexibility.

## Directory Structure

```
public/assets/sprites/
├── cards/          # Individual card images
├── cardbacks/      # Card back images
├── chips/          # Individual chip images
└── characters/     # Character avatar images
```

## Card Images

**Location:** `/assets/sprites/cards/`

**Naming Convention:** `{rank}{Suit}.png`

- Rank: `ace`, `two`, `three`, `four`, `five`, `six`, `seven`, `eight`, `nine`, `ten`, `jack`, `queen`, `king`
- Suit: `Spade`, `Heart`, `Club`, `Diamond`

**Examples:**
- `aceSpade.png` - Ace of Spades
- `twoHeart.png` - Two of Hearts
- `kingDiamond.png` - King of Diamonds
- `tenClub.png` - Ten of Clubs

**Total Cards:** 52 (13 ranks × 4 suits)

**Dimensions:** 190px × 265px per card

## Card Backs

**Location:** `/assets/sprites/cardbacks/`

**Naming Convention:** `{style}Back.png`

**Files:**
- `classicBack.png` - Classic blue card back
- `redBack.png` - Red card back
- `blueBack.png` - Blue card back
- `greenBack.png` - Green card back
- `purpleBack.png` - Purple card back

**Total Card Backs:** 5

**Dimensions:** 190px × 265px per card back

## Chip Images

**Location:** `/assets/sprites/chips/`

**Naming Convention:** `{color}Chip{Number}.png`

- Color: `black`, `red`, `blue`, `green`, `white`
- Number: `One`, `Two`, `Three`, `Four`, `Five`, `Six`, `Seven`, `Eight`

**Chip Arrangements by Number:**
1. `One` - Single chip
2. `Two` - Small stack (2-3 chips)
3. `Three` - Tall stack (5+ chips)
4. `Four` - Angled stack
5. `Five` - Large single chip
6. `Six` - Two chips side by side
7. `Seven` - Short stack (3-4 chips)
8. `Eight` - Scattered chips

**Examples:**
- `blackChipOne.png` - Single black chip
- `redChipThree.png` - Tall red chip stack
- `blueChipFive.png` - Large blue chip

**Total Chips:** 40 (5 colors × 8 arrangements)

**Dimensions:** 128px × 128px per chip image

## Character Images

**Location:** `/assets/sprites/characters/`

**Naming Convention:** `character{Number}.png`

- Number: `One`, `Two`, `Three`, `Four`, `Five`, `Six`, `Seven`, `Eight`

**Characters:**
1. `characterOne.png` - Cool Cat
2. `characterTwo.png` - Lucky Dog
3. `characterThree.png` - Wise Owl
4. `characterFour.png` - Sly Fox
5. `characterFive.png` - Happy Bear
6. `characterSix.png` - Swift Rabbit
7. `characterSeven.png` - Brave Lion
8. `characterEight.png` - Clever Raccoon

**Total Characters:** 8

**Recommended Dimensions:** 96px × 96px (or larger, will be scaled)

## Fallback Rendering

The game includes CSS fallback rendering for all sprite types. If image files are missing:

- **Cards:** Display with CSS-rendered rank and suit symbols
- **Card Backs:** Display with colored gradients
- **Chips:** Display as colored circles with borders
- **Characters:** Display as emoji icons

This means **the game works perfectly without any sprite files** and will automatically upgrade to use sprites when you add them!

## Quick Setup Checklist

To add sprite images to your game:

- [ ] Create the four sprite directories in `public/assets/sprites/`
- [ ] Add 52 card images following the naming convention
- [ ] Add 5 card back images
- [ ] Add 40 chip images (or just the arrangements you want to use)
- [ ] Add 8 character images
- [ ] Refresh the game - sprites will load automatically!

## Image Format Recommendations

- **Format:** PNG (supports transparency)
- **Color Mode:** RGB or RGBA
- **Pixel Art:** Use sharp edges, no anti-aliasing
- **Export:** Ensure images are exported at exact dimensions listed above
- **File Size:** Optimize for web (use tools like TinyPNG)

## Why Individual Images?

Individual sliced images offer several advantages:

1. **Easier Management:** Each asset is a separate file - easy to update or replace
2. **Better Organization:** Files are organized by type in folders
3. **Selective Loading:** Browser only loads images that are actually used
4. **Simpler Code:** No complex sprite sheet position calculations
5. **Artist Friendly:** Easier for designers to work with individual files
6. **Version Control:** Git tracks changes to individual images better

## Legacy Note

This project was previously using sprite sheets with background-position CSS. We've migrated to individual images for better maintainability. The old sprite sheet approach has been completely removed.
