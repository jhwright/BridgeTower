const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const brightness = require('../brightness.js');

test('Richmond midday and midnight have reduced output ceilings', () => {
  assert.equal(brightness.getState('2026-10-09T12:00:00-07:00').level, 0.40);
  assert.equal(brightness.getState('2026-10-09T00:00:00-07:00').level, 0.08);
});

test('the same evening clock time follows seasonal daylight', () => {
  assert.equal(brightness.getState('2026-06-21T18:00:00-07:00').phase, 'day');
  assert.equal(brightness.getState('2026-12-21T18:00:00-08:00').phase, 'night');
});

test('daylight remains bounded and gradual throughout every day of 2026', () => {
  let previous;
  for (let now = Date.parse('2026-01-01T00:00:00Z'); now < Date.parse('2027-01-01T00:00:00Z'); now += 30000) {
    const state = brightness.getState(now);
    assert.ok(state.level >= 0.08 && state.level <= 0.40);
    assert.notEqual(state.phase, 'fallback');
    if (previous !== undefined) assert.ok(Math.abs(state.level - previous) < 0.006, 'no sudden output changes');
    previous = state.level;
  }
});

test('sunrise brightens gradually and sunset dims gradually', () => {
  const dawn = ['06:45', '07:00', '07:15', '07:30', '07:45', '08:00'].map(t => brightness.getState(`2026-10-09T${t}:00-07:00`).level);
  const dusk = ['18:00', '18:15', '18:30', '18:45', '19:00', '19:15'].map(t => brightness.getState(`2026-10-09T${t}:00-07:00`).level);
  assert.ok(dawn.every((level, i) => !i || level >= dawn[i-1]));
  assert.ok(dusk.every((level, i) => !i || level <= dusk[i-1]));
  assert.equal(dawn.at(-1), 0.40);
  assert.equal(dusk.at(-1), 0.08);
});

test('DST and browser timezones cannot change an absolute timestamp', () => {
  const times = ['2026-03-08T09:59:59Z','2026-03-08T10:00:00Z','2026-11-01T08:59:59Z','2026-11-01T09:00:00Z'];
  const modulePath = require.resolve('../brightness.js');
  const script = `const b=require(${JSON.stringify(modulePath)});process.stdout.write(JSON.stringify(${JSON.stringify(times)}.map(t=>b.getState(t))));`;
  const output = tz => execFileSync(process.execPath, ['-e', script], {env:{...process.env,TZ:tz},encoding:'utf8'});
  assert.equal(output('America/Los_Angeles'), output('Asia/Tokyo'));
  assert.equal(output('Asia/Tokyo'), output('UTC'));
});

test('invalid dates use the dim fallback', () => {
  assert.equal(brightness.getState('invalid').level, 0.08);
  assert.equal(brightness.getState(NaN).phase, 'fallback');
});
