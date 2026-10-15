const fs = require('fs');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { PNG } = require('pngjs');
const out = process.env.BRIDGE_TEST_OUTPUT || require('path').resolve('.test-output');
fs.mkdirSync(out, { recursive: true });
const url = process.env.BRIDGE_TEST_URL || 'http://127.0.0.1:8789/';

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BRIDGE_TEST_CHROME || undefined, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 768, height: 192 }, timezoneId: 'Asia/Tokyo' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.clock.install({ time: new Date('2026-10-15T12:00:00-07:00') });
    await page.clock.pauseAt(new Date('2026-10-15T12:00:00-07:00'));
    await page.goto(url);
    await page.waitForSelector('.slide.on');

    // Assert truck appears through engine
    assert.equal(await page.evaluate(() => currentSlide.dataset.content), 'truck');
    assert.equal(await page.evaluate(() => currentSlide.getAttribute('aria-label')), "Free 18' E-Truck with Storage Rental");
    assert.deepEqual(await page.evaluate(() => Array.from(currentSlide.querySelectorAll('[data-fit-text]')).map(el => el.textContent.trim())), ["FREE 18' E-TRUCK", "WITH STORAGE RENTAL"]);

    // Reload and assert still truck
    await page.reload();
    await page.waitForSelector('.slide.on');
    assert.equal(await page.evaluate(() => currentSlide.dataset.content), 'truck');

    // Observe real timed transitions and the next truck slot, then reload mid-slot.
    await page.clock.runFor(6650);
    assert.equal(await page.locator('.slide.on').getAttribute('data-content'), 'make');
    await page.clock.runFor(47350);
    assert.equal(await page.locator('.slide.on').getAttribute('data-content'), 'festival');
    await page.clock.runFor(6000);
    assert.equal(await page.locator('.slide.on').getAttribute('data-content'), 'make');
    assert.equal(await page.locator('[data-content="festival"]').count(), 0);
    await page.clock.runFor(6650);
    assert.equal(await page.locator('.slide.on').getAttribute('data-content'), 'truck');
    await page.reload();
    await page.waitForSelector('.slide.on');
    assert.equal(await page.locator('.slide.on').getAttribute('data-content'), 'truck');

    // Layout verification at three viewport sizes
    async function verifyLayout(w, h) {
      await page.setViewportSize({ width: w, height: h });
      await page.evaluate(({ w, h }) => {
        clearTimeout(stepTimer);
        clearTimeout(resizeTimer);
        W = w;
        H = h;
        const el = truckSlide();
        el.classList.add('on');
        sign.replaceChildren(el);
      }, { w, h });
      await page.waitForSelector('.slide.on');
      const rects = await page.evaluate(() => {
        return Array.from(sign.querySelectorAll('.slide.on [data-fit-text]')).map(el => {
          const r = el.getBoundingClientRect();
          return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
        });
      });
      assert.equal(rects.length, 2);
      for (let i = 0; i < 2; i++) {
        assert.ok(rects[i].width > 0 && rects[i].height > 0, 'measure visible, attached text');
        assert.ok(rects[i].left >= 4 && rects[i].top >= 4, `line ${i} left ${rects[i].left} top ${rects[i].top}`);
        assert.ok(rects[i].right <= w - 4 && rects[i].bottom <= h - 4, `line ${i} right ${rects[i].right} bottom ${rects[i].bottom}`);
      }
      assert.ok(rects[0].bottom <= rects[1].top || rects[1].bottom <= rects[0].top, 'lines must not overlap');
      await page.screenshot({ path: `${out}/truck-${w}x${h}.png` });
    }
    await verifyLayout(768, 192);
    await verifyLayout(1536, 384);
    await verifyLayout(1280, 720);

    // Engine allocation checks
    async function countAllocations(startTime, expected) {
      const counts = await page.evaluate((startStr) => {
        const savedNow = Date.now;
        const startMs = new Date(startStr).getTime();
        const slotMs = 6000;
        const contentCounts = {};
        try {
          for (let i = 0; i < 100; i++) {
            Date.now = () => startMs + i * slotMs;
            currentSlide = null;
            sign.replaceChildren();
            step(true);
            clearTimeout(stepTimer);
            const c = currentSlide.dataset.content;
            contentCounts[c] = (contentCounts[c] || 0) + 1;
          }
        } finally {
          clearTimeout(stepTimer);
          Date.now = savedNow;
        }
        return contentCounts;
      }, startTime);
      assert.equal(counts.festival || 0, expected.festival, `festival ${startTime}`);
      assert.equal(counts.truck, expected.truck, `truck ${startTime}`);
      assert.equal(counts.make, expected.make, `make ${startTime}`);
    }
    await countAllocations('2026-10-15T15:00:00-07:00', { festival: 33, truck: 7, make: 60 });
    await countAllocations('2026-10-15T12:00:00-07:00', { festival: 10, truck: 9, make: 81 });
    await countAllocations('2026-11-09T00:00:00-08:00', { festival: 0, truck: 10, make: 90 });

    // Night dimming
    await page.setViewportSize({ width: 768, height: 192 });
    await page.clock.setSystemTime(new Date('2026-10-15T22:00:00-07:00'));
    await page.evaluate(() => {
      clearTimeout(stepTimer);
      clearTimeout(resizeTimer);
      W = 768;
      H = 192;
      currentSlide = null;
      sign.replaceChildren();
      updateBrightness();
      step(true);
    });
    await page.waitForSelector('.slide.on[data-content="truck"]');
    assert.equal(await page.locator('#sign').evaluate(el => getComputedStyle(el).opacity), '0.08');
    const nightPng = PNG.sync.read(await page.screenshot({ path: out + '/truck-night.png' }));
    let nightMax = 0;
    for (let i = 0; i < nightPng.data.length; i += 4) nightMax = Math.max(nightMax, nightPng.data[i], nightPng.data[i + 1], nightPng.data[i + 2]);
    assert.ok(nightMax >= 19 && nightMax <= 22, `night max channel ${nightMax}`);

    // Day dimming
    await page.clock.setSystemTime(new Date('2026-10-15T12:00:00-07:00'));
    await page.evaluate(() => {
      clearTimeout(stepTimer);
      clearTimeout(resizeTimer);
      W = 768;
      H = 192;
      currentSlide = null;
      sign.replaceChildren();
      updateBrightness();
      step(true);
    });
    await page.waitForSelector('.slide.on[data-content="truck"]');
    assert.equal(await page.locator('#sign').evaluate(el => getComputedStyle(el).opacity), '0.75');
    const dayPng = PNG.sync.read(await page.screenshot({ path: out + '/truck-day.png' }));
    let dayMax = 0;
    for (let i = 0; i < dayPng.data.length; i += 4) dayMax = Math.max(dayMax, dayPng.data[i], dayPng.data[i + 1], dayPng.data[i + 2]);
    assert.ok(dayMax >= 189 && dayMax <= 193, `day max channel ${dayMax}`);

    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ truck: 'passed', layouts: 'passed', engineAllocations: 'passed', nightMax, dayMax, browserErrors: errors }));
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e.message || e); process.exit(1); });
