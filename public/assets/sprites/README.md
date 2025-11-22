# Sprite Sheets Directory

Place your sprite sheet images here.

## Required Files

### cards.png
- **Dimensions:** 832 × 356 pixels (recommended)
- **Individual card:** 64 × 89 pixels
- **Layout:** 13 columns × 4 rows
- **Format:** PNG with transparency

### chips.png
- **Dimensions:** 160 × 32 pixels (recommended)
- **Individual chip:** 32 × 32 pixels
- **Layout:** 5 columns × 1 row
- **Format:** PNG with transparency

## Creating Sprite Sheets

You can create sprite sheets using:
- [Aseprite](https://www.aseprite.org/)
- [Piskel](https://www.piskelapp.com/) (free, online)
- [GIMP](https://www.gimp.org/)
- Any image editor that supports grids

## Temporary Solution

Until you create your sprite sheets, you can:

1. **Use solid colors:** The components will still render but without images
2. **Download placeholder sprites:** Search for "pixel art playing cards sprite sheet" and "pixel art poker chips sprite sheet"
3. **Generate with AI:** Use tools like DALL-E or Midjourney with prompts like:
   - "pixel art playing card sprite sheet, 52 cards, retro arcade style"
   - "pixel art poker chips sprite sheet, 5 denominations, top-down view"

## Testing

Once you add your sprite sheets:
1. Restart the dev server (`npm run dev`)
2. Check the browser console for any loading errors
3. Verify sprite positions align correctly

If sprites don't align, adjust the configuration in `src/utils/spriteConfig.js`
