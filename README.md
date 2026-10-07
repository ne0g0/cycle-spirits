# Cycle Spirits

Homepage for Cycle Spirits (Pecaño and Rubycello). Static HTML, CSS and JavaScript, no build step.

## Run it

Any static server from the repo root. Two that are usually installed:

```
python3 -m http.server 8000
```

```
npx serve .
```

Then open http://localhost:8000.

## What is here

- `index.html` — the page. Brand mark, wordmark, sun, moon and the shared glass gradients are inline SVG at the top; each glass is inline SVG beside its bottle.
- `css/site.css` — palette, type, the two themes (`day` for Rubycello, `night` for Pecaño), layout, and the hero geometry as custom properties on `.stage`.
- `js/hero.js` — the lazy Susan. Reads the geometry from `.stage`, orbits the settings and the sun and moon, flips the theme mid-turn, pours the front glass, runs the autoplay and the controls.
- `js/story.js` — scroll parallax for the origin section.
- `assets/bottles/` — the two bottles, transparent PNGs, 862px tall.
- `assets/photos/` — Jeff's August 2026 harvest and first-batch shots, plus the 2013 bottle shot.

## How the hero works

Each bottle and its glass form one setting (`.setting`) and orbit the table together. A turn is a half revolution, always in the same direction, so the sun rises over the top and sets under the bottom, the moon likewise, and the settings take turns passing through the front. When a setting reaches the front the table rests and the glass pours: a stream from above, the liquid rising, the ice lifting with it. The glass drains as its bottle leaves the front.

The numbers that shape the table live on `.stage` in `css/site.css` and are read by the script:

| Property | What it sets |
|---|---|
| `--ring-rx`, `--ring-ry` | the settings' orbit, as fractions of the stage width |
| `--bottle-h` | front bottle height |
| `--back-scale` | how small a setting gets at the back |
| `--glass-ratio` (on `.glass-rocks`, `.glass-cordial`) | glass height as a fraction of the bottle |
| `--sky-cy`, `--sky-ry` | the sun and moon's ring |
| `--stage-aspect` | stage height as a fraction of its width |

Each glass carries its own numbers as data attributes on `.glass`: `data-top` and `data-h` are the interior's top and height in SVG units (the liquid rises inside that box), `data-level` the fill fraction, `data-st` where the stream starts (negative is above the glass), `data-ice-drop` how far the ice sits below its floating position when the glass is empty.

Timing lives at the top of `js/hero.js`: `TURN_MS` (one half revolution), `FACE_AT` (when, within the turn, the theme and the serve swap), `POUR_DELAY` and `POUR` (the pour's three phases), `DRAIN_MS`. Autoplay interval is `data-autoplay` on the hero section, in milliseconds; `data-start="night"` opens on Pecaño instead of Rubycello.

## Swapping in a photographed glass

The glasses are drawn until the cocktail shoot. To use a photograph:

1. Shoot the empty glass straight on, on a plain background, and cut it out to a transparent PNG.
2. In the glass's SVG, replace the drawn body (`.g-tint`, `.g-body`, `.g-edge`, `.g-hi`, `.g-rim`, `.g-rim-in`, and the stem, foot or base) with one `<image href="…" width="220" height="260">` placed where the drawing was, keeping the `viewBox`.
3. Redraw the `clipPath` to trace the inside of the photographed glass, and set `data-top` and `data-h` to its top and height.
4. Keep the `.liquid`, `.liquid-surface`, `.stream` and `.stream-core` layers. Give `.liquid` `mix-blend-mode: multiply` so the glass's highlights show through the drink.

## Placeholders

- The two glasses are drawn (see above).
- The sun and moon are drawn in SVG (`cs-sun`, `cs-moon`).
- Bottle labels are the mockups until the real labels exist.
- Footer email and phone are placeholders.
- Nav links point at sections and pages that do not exist yet.
- No age gate yet.
