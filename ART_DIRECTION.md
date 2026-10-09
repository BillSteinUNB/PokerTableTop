# Art direction

The design preserves the original **pixel arcade** idea. Bold stepped edges, chunky animal sprites, mint/lilac/pink accents, dark purple rooms, and a low-resolution green felt table keep it playful rather than realistic.

- `public/assets/art/pixel-clubhouse.png`: generated with the built-in imagegen tool for this project, then copied into the repository. Used on the home screen with nearest-neighbor-style CSS rendering. The earlier realistic draft was discarded.
- `src/components/PixelArt.jsx`: original editable SVG pixel sprites, card suits, and card/chip rendering. Avatars include fox, bear, cat, frog, owl, rabbit, raccoon, and penguin.
- `src/App.css`: stepped table edges, pixel floor, dealing, chip-scoop, blinking, turn and winner animations. All animation respects `prefers-reduced-motion`.
- `src/services/audio.js`: short synthesized square-wave sounds; no missing placeholder audio. Sound is opt-in.
- Locally bundled Press Start 2P and Space Grotesk from Fontsource. No external font requests.
- The old assets remain in `public/assets/cards`, `public/assets/chips`, and `public/assets/sprites` as reference material; they are not required by the new renderer.

## Final image-generation prompt

Use case: stylized-concept. Asset type: actual game background for a retro pixel-art browser poker arcade. Create a VERY LOW RESOLUTION-looking 16-bit pixel art cozy neon poker clubhouse. Clearly visible BIG square pixels everywhere, limited palette, no smooth gradients, no photorealism, no painted texture. It should look like a 320 by 180 pixel game scene upscaled with nearest-neighbor filtering. Wide 3:2 scene. Dark navy and plum walls, cyan and pink neon accents, warm yellow pixel lamps, rain on a city window, a purple sofa, a leafy potted plant, little arcade cabinet, posters showing simple card-suit symbols with NO text. One emerald-green poker table in lower right, chunky wooden frame, small colorful poker chip stacks. Charming clean handcrafted SNES-era adventure game background, playful rather than casino realism. Strong pixel outlines, stepped diagonal edges, simplified geometrical forms, dithering only in a few shadow regions. Upper left and center-left dark negative space for overlay typography. No text, no lettering, no people, no logos, no UI.
