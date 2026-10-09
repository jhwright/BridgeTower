/* Six-second, wall-clock slots keep campaign airtime stable across reloads.
   Pacific offsets below cover this campaign, including November 1, 2026 DST. */
(function (root) {
  'use strict';
  var SLOT_MS = 6000;
  var BLOCK_SLOTS = 100;
  var config = {
    enabled: true,
    id: 'sf-leonard-cohen-2026',
    artwork: 'slides/cohen-festival-date-block-768x192.png',
    startsAt: '2026-10-08T00:00:00-07:00',
    endsAt: '2026-11-09T00:00:00-08:00',
    timeZone: 'America/Los_Angeles',
    daylightEndsAt: '2026-11-01T09:00:00Z',
    peakPercent: 33,
    otherPercent: 10
  };
  var start = Date.parse(config.startsAt);
  var end = Date.parse(config.endsAt);
  var daylightEnd = Date.parse(config.daylightEndsAt);

  function getState(now) {
    var active = config.enabled && now >= start && now < end;
    // Explicit offsets avoid relying on the controller's timezone or Intl support.
    var offsetMinutes = now < daylightEnd ? -420 : -480;
    var local = new Date(now + offsetMinutes * 60000);
    var weekday = local.getUTCDay();
    var hour = local.getUTCHours();
    var peak = weekday >= 1 && weekday <= 5 && hour >= 15 && hour < 19;
    var percent = active ? (peak ? config.peakPercent : config.otherPercent) : 0;
    var absoluteSlot = Math.floor(now / SLOT_MS);
    var slot = ((absoluteSlot % BLOCK_SLOTS) + BLOCK_SLOTS) % BLOCK_SLOTS;
    var showCampaign = Math.floor((slot + 1) * percent / BLOCK_SLOTS) >
      Math.floor(slot * percent / BLOCK_SLOTS);
    var nextAt = (absoluteSlot + 1) * SLOT_MS;
    if (config.enabled && now < start) nextAt = Math.min(nextAt, start);
    if (active) nextAt = Math.min(nextAt, end);
    return {
      id: config.id,
      active: active,
      percent: percent,
      showCampaign: showCampaign,
      absoluteSlot: absoluteSlot,
      slot: slot,
      nextAt: nextAt,
      localTime: local.toISOString().slice(0, 19),
      offsetMinutes: offsetMinutes
    };
  }

  var api = { config: config, getState: getState, slotMs: SLOT_MS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BridgeCampaign = api;
})(typeof window !== 'undefined' ? window : this);
