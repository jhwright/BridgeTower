const test = require('node:test');
const assert = require('node:assert/strict');
const { config, getState, slotMs } = require('../campaign.js');

test('Pacific weekday daypart uses inclusive 15:00 and exclusive 19:00', () => {
  for (const [time, share] of [
    ['2026-10-08T14:59:59-07:00',10], ['2026-10-08T15:00:00-07:00',33],
    ['2026-10-08T18:59:59-07:00',33], ['2026-10-08T19:00:00-07:00',10],
    ['2026-10-10T15:00:00-07:00',10], ['2026-10-11T15:00:00-07:00',10],
    ['2026-10-09T03:00:00-07:00',10], ['2026-11-02T15:00:00-08:00',33],
    ['2026-11-02T19:00:00-08:00',10]
  ]) assert.equal(getState(Date.parse(time)).percent, share, time);
});

test('exact airtime in every complete aligned block during the campaign', () => {
  const start = Date.parse(config.startsAt), end = Date.parse(config.endsAt);
  let blocks = 0;
  for (let block = start; block < end; block += 100 * slotMs) {
    const share = getState(block).percent;
    let promo = 0;
    let longestGap = 0, gap = 0;
    for (let slot = 0; slot < 100; slot++) {
      const state = getState(block + slot * slotMs);
      assert.equal(state.percent, share);
      if (state.showCampaign) { promo++; longestGap = Math.max(gap, longestGap); gap = 0; }
      else gap++;
    }
    assert.equal(promo, share);
    assert.equal(promo * slotMs, share * 6000);
    assert.ok(longestGap <= (share === 33 ? 3 : 9));
    blocks++;
  }
  assert.ok(blocks > 4000);
});

test('DST change uses both Pacific offsets without Intl or controller timezone', () => {
  const before = getState(Date.parse('2026-11-01T08:59:59Z'));
  const after = getState(Date.parse('2026-11-01T09:00:00Z'));
  assert.equal(before.localTime, '2026-11-01T01:59:59');
  assert.equal(after.localTime, '2026-11-01T01:00:00');
  assert.equal(before.offsetMinutes, -420);
  assert.equal(after.offsetMinutes, -480);
  assert.equal(before.percent, 10);
  assert.equal(after.percent, 10);
});

test('campaign ends at November 9 midnight Pacific and can be disabled', () => {
  const end = Date.parse(config.endsAt);
  assert.equal(getState(end - 1).active, true);
  assert.equal(getState(end).active, false);
  assert.equal(getState(end).percent, 0);
  assert.equal(getState(end).showCampaign, false);
  assert.equal(getState(Date.parse(config.startsAt) - 1).active, false);
  config.enabled = false;
  assert.equal(getState(Date.parse('2026-10-08T16:00:18-07:00')).showCampaign, false);
  config.enabled = true;
});

test('reload or resize resumes the same slot, with only its remaining duration', () => {
  const time = Date.parse('2026-10-08T16:00:19-07:00');
  const state = getState(time);
  assert.equal(state.showCampaign, true);
  assert.deepEqual(getState(time), state);
  assert.equal(state.nextAt - time, 5000);
  assert.equal(getState(state.nextAt).showCampaign, false);
});
