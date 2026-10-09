const fs = require('fs');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { PNG } = require('pngjs');
const out = process.env.BRIDGE_TEST_OUTPUT || require('path').resolve('.test-output');
fs.mkdirSync(out, {recursive:true});
const url = process.env.BRIDGE_TEST_URL || 'http://127.0.0.1:8789/';

(async () => {
  const browser = await chromium.launch({executablePath:process.env.BRIDGE_TEST_CHROME || undefined,headless:true});
  const page = await browser.newPage({viewport:{width:768,height:192},timezoneId:'Asia/Tokyo'});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.clock.install({time:new Date('2026-10-09T12:00:00-07:00')});
  await page.clock.pauseAt(new Date('2026-10-09T12:00:00-07:00'));
  await page.goto(url);
  await page.waitForSelector('.slide.on');
  assert.equal(await page.evaluate(() => towerBrightnessStatus.level), 0.4);
  assert.equal(await page.locator('#sign').evaluate(el => getComputedStyle(el).opacity), '0.4');

  async function verifyFrame(kind, level) {
    await page.evaluate(kind => {
      clearTimeout(stepTimer);
      const el = kind === 'make' ? LAYOUTS[0]('connection', [C.black,C.white,C.marigold]) : festivalSlide();
      el.style.transition = 'none';
      el.classList.add('on');
      sign.replaceChildren(el);
    }, kind);
    if (kind === 'festival') await page.waitForFunction(() => document.querySelector('img').complete);
    const png = PNG.sync.read(await page.screenshot({path:`${out}/${kind}-${level}.png`}));
    let max = 0;
    for (let i = 0; i < png.data.length; i += 4) max = Math.max(max, png.data[i], png.data[i+1], png.data[i+2]);
    assert.ok(max >= Math.floor(255*level)-2 && max <= Math.ceil(255*level)+2, `${kind} channel maximum ${max}, expected ${level}`);
  }
  await verifyFrame('make', 0.4);
  await verifyFrame('festival', 0.4);

  await page.clock.setSystemTime(new Date('2026-10-09T22:00:00-07:00'));
  await page.clock.runFor(30000);
  assert.equal(await page.evaluate(() => towerBrightnessStatus.level), 0.08);
  await verifyFrame('make', 0.08);
  await verifyFrame('festival', 0.08);
  await page.reload();
  await page.waitForSelector('.slide.on');
  assert.equal(await page.locator('#sign').evaluate(el => getComputedStyle(el).opacity), '0.08');

  // A missing image must retain dimming on its HTML fallback.
  await page.route('**/slides/cohen-festival-date-block-768x192.png', route => route.abort());
  await page.evaluate(() => {
    clearTimeout(stepTimer);
    const el=festivalSlide();el.classList.add('on');sign.replaceChildren(el);
  });
  await page.waitForFunction(() => !document.querySelector('#sign img'));
  const fallback = PNG.sync.read(await page.screenshot({path:out+'/fallback-night.png'}));
  let fallbackMax=0;
  for(let i=0;i<fallback.data.length;i+=4) fallbackMax=Math.max(fallbackMax,fallback.data[i],fallback.data[i+1],fallback.data[i+2]);
  assert.ok(fallbackMax >= 19 && fallbackMax <= 22);

  await page.clock.setSystemTime(new Date('2026-10-10T07:00:00-07:00'));
  await page.clock.runFor(30000);
  const dawnLevel = await page.evaluate(() => towerBrightnessStatus.level);
  assert.ok(dawnLevel > 0.08 && dawnLevel < 0.4);
  await page.clock.setSystemTime(new Date('2026-10-10T08:00:00-07:00'));
  await page.clock.runFor(30000);
  assert.equal(await page.evaluate(() => towerBrightnessStatus.level), 0.4);
  assert.deepEqual(errors, []);

  // Failed brightness scripts leave the safe CSS level and playable rotation.
  const safe = await browser.newPage({viewport:{width:768,height:192}});
  await safe.route('**/brightness.js*', route => route.abort());
  await safe.goto(url);
  await safe.waitForSelector('.slide.on');
  assert.equal(await safe.locator('#sign').evaluate(el => getComputedStyle(el).opacity), '0.08');
  const noSun = await browser.newPage({viewport:{width:768,height:192}});
  await noSun.route('**/suncalc-1.9.0.js', route => route.abort());
  await noSun.goto(url);
  await noSun.waitForSelector('.slide.on');
  assert.equal(await noSun.evaluate(() => towerBrightnessStatus.phase), 'fallback');
  assert.equal(await noSun.locator('#sign').evaluate(el => getComputedStyle(el).opacity), '0.08');
  console.log(JSON.stringify({day:0.4,night:0.08,dawnLevel,pixelChecks:5,reload:'passed',missingScripts:'passed',timezone:'Asia/Tokyo',browserErrors:errors}));
  await browser.close();
})().catch(e => {console.error(e);process.exit(1);});
