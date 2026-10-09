# Sign brightness

Jeff reported excessive brightness, especially at night, on October 9, 2026.
The webpage now dims the entire sign, including images, text, backgrounds, and fallback artwork.

| Daylight condition | Webpage output level |
| --- | --- |
| Sun at least 6 degrees above the horizon | 40% |
| Sun at the horizon | 15% |
| Sun at least 6 degrees below the horizon | 8% |

The level changes gradually between these points. It updates every 30 seconds and when the page becomes visible.
The CSS starts at 8% before scripts load. It retains that level if the brightness script fails to load.

## How daylight is determined

This control uses the clock, date, and calculated sun position at an approximate Richmond location.
It does not read a light sensor. Seasonal sunrise and sunset changes need no schedule updates.
The calculation uses an absolute timestamp. The browser timezone and daylight saving changes do not affect it.
The player clock must show the correct date and time. Clouds and local shade do not change the calculated level.

`brightness.js` contains the limits and coordinates.
`vendor/suncalc-1.9.0.js` is a local, pinned copy of [SunCalc 1.9.0](https://github.com/mourner/suncalc/tree/v1.9.0).
Its license is retained in `vendor/SunCalc-LICENSE.txt`. No remote service is needed during playback.
`window.towerBrightnessStatus` exposes the calculated altitude, phase, and level for inspection.

## Controller settings and physical verification

These values are webpage opacity settings over black. They are not calibrated nits, wattage measurements, or NovaStar controller percentages.
The controller brightness setting has not been changed. The presence of a physical light sensor has not been confirmed.
The recorded controller IP is unreachable from the current Mac. Jeff's existing remote connection is needed for hardware adjustment.

Check the actual sign during daylight, twilight, and darkness from about 200 feet.
Confirm the player clock and inspect the NovaStar brightness settings and any connected sensor.
Use controller limits for a hardware brightness cap. Measure electrical consumption if a wattage reduction must be quantified.
Keep the webpage dimming during that check, and adjust `day`, `horizon`, or `night` only if the field result requires it.

## Verification

Run `node --test tests/*.test.cjs` for the airtime and daylight checks.
Run `node tests/brightness-browser.cjs` with Playwright and a local server on port 8789.
The browser test checks dimming of MAKE slides, festival images, and fallback artwork.
It also checks night reloads, sunrise updates, unavailable scripts, and an unrelated browser timezone.

Use `BRIDGE_TEST_URL`, `BRIDGE_TEST_CHROME`, and `BRIDGE_TEST_OUTPUT` to select the server, browser, and screenshot directory.
The dimming continues after the festival expires and does not change its airtime allocation.
