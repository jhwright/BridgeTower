# SF Leonard Cohen Festival campaign

Jeff selected **PDF option #3, Date block**, and authorized installation on October 8, 2026.
The artwork says `SF LEONARD COHEN / FESTIVAL / NOV 5–8`. This option has no URL.

The campaign starts when the site update reaches the player. It ends on November 9, 2026 at midnight Pacific.

| Pacific time | Festival screen time |
| --- | --- |
| Monday through Friday, 15:00 inclusive to 19:00 exclusive | 33% |
| All other operating times | 10% |

## Schedule

`campaign.js` divides wall time into six-second slots. Each ten-minute block contains 100 slots.
It distributes 33 or 10 festival slots across that block. These counts produce exactly 198 or 60 festival seconds.

The slot number depends on wall time. A reload resumes the current slot for its remaining duration.
The engine uses cuts into and out of festival slots. MAKE slides retain their crossfades between MAKE slots.

The schedule uses Pacific time even when the controller uses another timezone.
The explicit 2026 offsets change from UTC-7 to UTC-8 on November 1 at 09:00 UTC.
These offsets cover this campaign. Update the clock configuration before reuse for another season.

The player clock must show the correct date and time.
`window.towerSignStatus` exposes the current allocation, slot, and Pacific time for browser inspection.
The sign does not show these diagnostics.

## Artwork and layouts

The production image is the exact 768 x 192 PNG from PDF option #3.
The image fills the live viewport. A text fallback retains the message if the image request fails.

All 50 MAKE messages use the eight layouts in `sign-layouts.js`.
The layouts measure text with the same letter spacing that they display.
They reserve proportional edge margins and measure tags, arrows, padding, and gaps.
They use white when a brand color produces less than 4.5:1 text contrast against its background.
The local Plus Jakarta Sans font keeps display and measurement independent of external font services.

## Verification

The schedule suite checks every complete ten-minute block during the campaign.
It also checks weekdays, weekends, 15:00 and 19:00 boundaries, the DST change, reloads, disabling, and expiry.

The browser suite checks all 400 message/layout combinations at 768 x 192, 1536 x 384, and 1280 x 720.
It checks text bounds, overlap, contrast, a mid-slot reload, and campaign exit with the browser timezone set to Tokyo.
It exports one sample treatment per message for review.

Run the schedule suite:

```sh
node --test tests/campaign.test.cjs
```

The browser suite requires Playwright and its Chromium browser. It uses the local server on port 8789.
Run the suite from the repository directory:

```sh
node tests/browser.cjs
```

Set `BRIDGE_TEST_CHROME` to an installed Chrome executable to use that browser.
Set `BRIDGE_TEST_URL` to use another server. Set `BRIDGE_TEST_OUTPUT` to select a directory for review images.

Physical readability at 200 feet still requires a daylight and dusk check. Browser checks cannot verify the physical sign.

## Disable or rollback

1. To remove the campaign, set `enabled: false` in `campaign.js`.
2. Commit and push that change to `main`.
3. Verify the published page and the player after its next reload.

To restore the earlier engine, revert the installation commit. Keep its hash in [issue #2](https://github.com/jhwright/BridgeTower/issues/2).

The festival ends automatically. Expiry needs no later deployment or scheduled job.
