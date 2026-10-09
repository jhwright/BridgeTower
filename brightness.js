/* Richmond daylight dimming. SunCalc 1.9.0 is stored locally in vendor/. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./vendor/suncalc-1.9.0.js'));
  } else {
    root.BridgeBrightness = factory(root.SunCalc);
  }
}(typeof self !== 'undefined' ? self : this, function (sunCalc) {
  'use strict';

  var config = {
    // Approximate Richmond location; no network or ambient sensor is used.
    latitude: 37.935,
    longitude: -122.347,
    day: 0.40,
    horizon: 0.15,
    night: 0.08,
    updateMs: 30000
  };

  function getState(now) {
    var timestamp = new Date(now).getTime();
    var altitude = NaN;
    if (isFinite(timestamp) && sunCalc && typeof sunCalc.getPosition === 'function') {
      altitude = sunCalc.getPosition(new Date(timestamp), config.latitude, config.longitude).altitude * 180 / Math.PI;
    }
    // Keep the dim default if the date or solar calculation is unavailable.
    var level = config.night;
    var phase = 'night';
    if (!isFinite(altitude)) {
      phase = 'fallback';
    } else if (altitude >= 6) {
      level = config.day;
      phase = 'day';
    } else if (altitude > 0) {
      level = config.horizon + (config.day - config.horizon) * altitude / 6;
      phase = 'twilight';
    } else if (altitude > -6) {
      level = config.night + (config.horizon - config.night) * (altitude + 6) / 6;
      phase = 'twilight';
    }
    return {
      source: 'calculated-sun-position',
      timestamp: timestamp,
      solarAltitudeDegrees: isFinite(altitude) ? altitude : null,
      phase: phase,
      level: level
    };
  }

  return { config: config, getState: getState };
}));
