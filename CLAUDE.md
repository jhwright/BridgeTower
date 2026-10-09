# Bridge Tower sign

The sign is a 768 x 192 LED display beside I-580 in Richmond, California.
The NovaStar Taurus player loads https://jhwright.github.io/BridgeTower/ through a ViPlex web page widget.
Jeff specifies a viewing distance of about 200 feet.

## Architecture

The site has no build step. A push to `main` publishes the site through GitHub Pages.
`index.html` generates the MAKE rotation directly. It does not read `slides.json` or the CSV.
The page reloads every five minutes to receive updates.

All dimensions use the live browser viewport. The Taurus can use an internal viewport that differs from the physical display.
Do not add a fixed stage, contain scaling, or letterboxing to the live sign.

## Files

- `index.html`: the rotation engine and 50 MAKE messages.
- `sign-layouts.js`: eight layouts with measured text widths and proportional margins.
- `campaign.js`: the festival artwork, dates, and Pacific airtime schedule.
- `slides/cohen-festival-date-block-768x192.png`: Jeff's selected PDF option #3.
- `assets/`: the local MAKE font and its license. The live page needs no external CDN.
- `docs/slide-inventory.md`: the complete active message list.
- `docs/festival-campaign.md`: schedule, verification, and rollback instructions.

`slides.json`, the CSV, poetry HTML, and test HTML are legacy files. They are not in the active rotation.
The old `.claude/skills/update-sign.md` describes that legacy engine. Do not regenerate the current page from those instructions.

## Local verification

1. Run `python3 -m http.server 8789` from the repository directory.
2. Open `http://localhost:8789/` in a 768 x 192 browser viewport.
3. Run `node --test tests/campaign.test.cjs` for the schedule checks.
4. Use the browser checks in `docs/festival-campaign.md` for every message and layout.

Keep campaign transitions as cuts. Crossfades at campaign boundaries change the allocated screen time.
Preserve the selected artwork, message wording, shuffle, and Pacific schedule unless Jeff requests a change.

The shared task record is [issue #2](https://github.com/jhwright/BridgeTower/issues/2).
