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

- `index.html` — the page. Brand mark, wordmark, sun, moon and the two glasses are inline SVG symbols at the top.
- `css/site.css` — palette, type, the two themes (`day` for Rubycello, `night` for Pecaño), layout, and the hero geometry as custom properties on `.stage`.
- `js/hero.js` — the lazy Susan. Reads the geometry from `.stage`, orbits the bottles and the sun and moon, flips the theme mid-turn, runs the autoplay and the controls.
- `js/story.js` — scroll parallax for the origin section.
- `assets/bottles/` — the two bottles, transparent PNGs, 862px tall.
- `assets/photos/` — Jeff's August 2026 harvest and first-batch shots, plus the 2013 bottle shot.

## Tuning the hero

The numbers that shape the table live on `.stage` in `css/site.css` and are read by the script, so the layout can be tuned without touching JavaScript:

| Property | What it sets |
|---|---|
| `--ring-rx`, `--ring-ry` | the bottles' orbit, as fractions of the stage width |
| `--bottle-h` | front bottle height |
| `--back-scale` | how small a bottle gets at the back |
| `--glass-h` | glass height |
| `--sky-cy`, `--sky-ry` | the sun and moon's ring |
| `--stage-aspect` | stage height as a fraction of its width |

Timing lives at the top of `js/hero.js`: `TURN_MS` (one half revolution) and `FACE_AT` (when, within the turn, the theme and the serve swap). Autoplay interval is `data-autoplay` on the hero section, in milliseconds; `data-start="night"` opens on Pecaño instead of Rubycello.

## Placeholders

- The two glasses are drawn in SVG until the cocktail shoot. Replace the `cs-glass-rocks` and `cs-glass-cordial` symbols, or swap the `.glass` elements for photographs on transparent backgrounds.
- The sun and moon are drawn in SVG (`cs-sun`, `cs-moon`).
- Bottle labels are the mockups until the real labels exist.
- Footer email and phone are placeholders.
- Nav links point at sections and pages that do not exist yet.
- No age gate yet.
