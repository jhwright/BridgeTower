# Sign brightness

Jeff reported excessive brightness, especially at night, on October 9, 2026.
The webpage now dims the entire sign, including images, text, backgrounds, and fallback artwork.

| Daylight condition | Webpage output level |
| --- | --- |
| Sun at least 6 degrees above the horizon | 93.75% |
| Sun at the horizon | 18.75% |
| Sun at least 6 degrees below the horizon | 10% |

On October 12, 2026, Jeff reported that 40% was too dim during daylight.
The October 12 settings were 75% day, 15% at the horizon, and 8% night.

On October 15, 2026, Jeff requested 25% more brightness at all times.
All three software levels were multiplied by 1.25: 93.75% day, 18.75% at the horizon, and 10% night.

The level changes gradually between these points. It updates every 30 seconds and when the page becomes visible.
The CSS starts at 10% before scripts load. It retains that level if the brightness script fails to load.

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
On October 15, 2026, the Taurus controller was set to fixed Manual brightness at 100% through RustDesk and ViPlex Express.
A fresh controller readback confirmed Manual, 100%. Its previous mode was Smart, with no entries in the adjustment table.
Keep the hardware at 100% and use `brightness.js` for all time-of-day image dimming.
The controller PC is accessible through RustDesk. The presence of a physical light sensor has not been confirmed.

Check the actual sign during daylight, twilight, and darkness from about 200 feet.
Confirm the player clock and inspect the NovaStar brightness settings and any connected sensor.
Keep the fixed 100% hardware baseline during software calibration. Measure electrical consumption if a wattage reduction must be quantified.
Keep the webpage dimming during that check, and adjust `day`, `horizon`, or `night` only if the field result requires it.

## Verification

Run `node --test tests/*.test.cjs` for the airtime and daylight checks.
Run `node tests/brightness-browser.cjs` with Playwright and a local server on port 8789.
The browser test checks dimming of MAKE slides, festival images, and fallback artwork.
It also checks night reloads, sunrise updates, unavailable scripts, and an unrelated browser timezone.

Use `BRIDGE_TEST_URL`, `BRIDGE_TEST_CHROME`, and `BRIDGE_TEST_OUTPUT` to select the server, browser, and screenshot directory.
The dimming continues after the festival expires and does not change its airtime allocation.
