# Knot Image Credits

Knot reference images are sourced from Wikimedia Commons and converted to WebP
for use in the TOAST app. SVG placeholder fallbacks are used until the WebP
files are committed (see `scripts/download-knot-images.js`).

## Images

| File | Knot | Wikimedia Source | License | Author |
| ---- | ---- | ---------------- | ------- | ------ |
| `bowline.webp` | Bowline | [Knot_bowline.jpg](https://commons.wikimedia.org/wiki/File:Knot_bowline.jpg) | CC BY-SA 3.0 | Cyrus Andiron |
| `clove_hitch.webp` | Clove Hitch | [Clove_hitch.jpg](https://commons.wikimedia.org/wiki/File:Clove_hitch.jpg) | CC BY-SA 3.0 | Cyrus Andiron |
| `sheet_bend.webp` | Sheet Bend | [Sheet_bend_-_WetCanvas.jpg](https://commons.wikimedia.org/wiki/File:Sheet_bend_-_WetCanvas.jpg) | CC BY-SA 3.0 | WetCanvas |
| `square_reef.webp` | Square (Reef) Knot | [Granny_vs_reef.jpg](https://commons.wikimedia.org/wiki/File:Granny_vs_reef.jpg) | CC BY-SA 3.0 | Cyrus Andiron |
| `overhand_stopper.webp` | Overhand / Stopper Knot | [Overhand_knot_retouched.jpg](https://commons.wikimedia.org/wiki/File:Overhand_knot_retouched.jpg) | Public Domain | — |
| `round_turn_two_half_hitches.webp` | Round Turn & Two Half Hitches | [Round_turn_and_two_half-hitches_knot.jpg](https://commons.wikimedia.org/wiki/File:Round_turn_and_two_half-hitches_knot.jpg) | CC BY-SA 3.0 | Cyrus Andiron |
| `taut_line_hitch.webp` | Taut-Line Hitch | [Tautline_hitch_knot.jpg](https://commons.wikimedia.org/wiki/File:Tautline_hitch_knot.jpg) | CC BY-SA 3.0 | Cyrus Andiron |
| `truckers_hitch.webp` | Trucker's Hitch | [Truckers_Hitch_Knot.jpg](https://commons.wikimedia.org/wiki/File:Truckers_Hitch_Knot.jpg) | CC BY-SA 3.0 | Cyrus Andiron |
| `prusik.webp` | Prusik Knot | [Prusik_knot.jpg](https://commons.wikimedia.org/wiki/File:Prusik_knot.jpg) | CC BY-SA 3.0 | Cyrus Andiron |

## Attribution

Images licensed under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/):

> Knot diagrams by Cyrus Andiron and other Wikimedia Commons contributors,
> licensed under CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/).
> Source: https://commons.wikimedia.org/

This attribution is displayed in the app's Settings screen under "Attributions".

## Adding New Images

If you replace or add a knot image:
1. Download the source file from Wikimedia Commons
2. Convert to WebP: `cwebp -q 85 input.jpg -o output.webp`
3. Commit to `src/assets/images/reference/knots/`
4. Add the `tryRequire()` entry in `src/assets/referenceImages.ts`
5. Update this file with the file name, source URL, license, and author
