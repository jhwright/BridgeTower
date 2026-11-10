const fs = require('fs');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { PNG } = require('pngjs');
const out = process.env.BRIDGE_TEST_OUTPUT || require('path').resolve('.test-output');
fs.mkdirSync(out, { recursive: true });
const url = process.env.BRIDGE_TEST_URL || 'http://127.0.0.1:8789/';

// The rotation is MAKE only. No truck offer and no festival slot can appear,
// even at times when the old schedule reserved slots for them.
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BRIDGE_TEST_CHROME || undefined, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 768, height: 192 }, timezoneId: 'Asia/Tokyo' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.clock.install({ time: new Date('2026-10-15T15:00:00-07:00') });
    await page.clock.pauseAt(new Date('2026-10-15T15:00:00-07:00'));
    await page.goto(url);
    await page.waitForSelector('.slide.on');
    assert.equal(await page.evaluate(() => typeof truckSlide), 'undefined');
    assert.equal(await page.evaluate(() => typeof festivalSlide), 'undefined');

    async function countAllocations(startTime) {
      return page.evaluate((startStr) => {
        const savedNow = Date.now;
        const startMs = new Date(startStr).getTime();
        const counts = {};
        try {
          for (let i = 0; i < 100; i++) {
            Date.now = () => startMs + i * 6000;
            currentSlide = null;
            sign.replaceChildren();
            step(true);
            clearTimeout(stepTimer);
            const c = currentSlide.dataset.content;
            counts[c] = (counts[c] || 0) + 1;
          }
        } finally {
          clearTimeout(stepTimer);
          Date.now = savedNow;
        }
        return counts;
      }, startTime);
    }
    // Old festival peak, old off-peak, and after the festival end date.
    for (const t of ['2026-10-15T15:00:00-07:00', '2026-10-15T12:00:00-07:00', '2026-11-10T12:00:00-08:00']) {
      assert.deepEqual(await countAllocations(t), { make: 100 }, t);
    }

    // Real timed transitions keep six-second MAKE slots across a reload.
    await page.evaluate(() => { currentSlide = null; sign.replaceChildren(); step(true); });
    await page.waitForSelector('.slide.on');
    await page.clock.runFor(6650);
    assert.equal(await page.locator('.slide.on').getAttribute('data-content'), 'make');
    await page.reload();
    await page.waitForSelector('.slide.on');
    assert.equal(await page.locator('.slide.on').getAttribute('data-content'), 'make');

    async function maxChannel(time, opacity, name) {
      await page.clock.setSystemTime(new Date(time));
      await page.evaluate(() => {
        clearTimeout(stepTimer); clearTimeout(resizeTimer);
        W = 768; H = 192; currentSlide = null; sign.replaceChildren();
        updateBrightness();
        const el = LAYOUTS[0]('connection', [C.black, C.white, C.marigold]);
        el.style.transition = 'none'; el.classList.add('on'); sign.replaceChildren(el);
      });
      assert.equal(await page.locator('#sign').evaluate(el => getComputedStyle(el).opacity), opacity);
      const png = PNG.sync.read(await page.screenshot({ path: `${out}/make-${name}.png` }));
      let max = 0;
      for (let i = 0; i < png.data.length; i += 4) max = Math.max(max, png.data[i], png.data[i + 1], png.data[i + 2]);
      return max;
    }
    const nightMax = await maxChannel('2026-11-10T22:00:00-08:00', '0.1', 'night');
    assert.ok(nightMax >= 24 && nightMax <= 27, `night max channel ${nightMax}`);
    const dayMax = await maxChannel('2026-11-10T12:00:00-08:00', '0.9375', 'day');
    assert.ok(dayMax >= 237 && dayMax <= 241, `day max channel ${dayMax}`);

    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ makeOnly: 'passed', reload: 'passed', nightMax, dayMax, browserErrors: errors }));
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e.message || e); process.exit(1); });
