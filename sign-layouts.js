/* All eight treatments use the same measured text and proportional margins. */
function BridgeLayouts(getSize, fit, widthOf) {
  function luminance(hex) {
    const channels = hex.match(/[a-f\d]{2}/gi).map(value => parseInt(value, 16) / 255)
      .map(value => value <= .04045 ? value / 12.92 : Math.pow((value + .055) / 1.055, 2.4));
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
  }
  function readablePair([bg, fg, accent]) {
    const base = luminance(bg);
    function readable(color) {
      const value = luminance(color);
      const ratio = (Math.max(base, value) + .05) / (Math.min(base, value) + .05);
      return ratio >= 4.5 ? color : '#FFFFFF';
    }
    return [bg, readable(fg), readable(accent)];
  }
  function frame(markup) {
    const el = document.createElement('div');
    el.className = 'slide';
    el.innerHTML = markup;
    return el;
  }
  function dimensions() {
    const { W, H } = getSize();
    return { W, H, px: Math.round(W * .021), py: Math.round(H * .052), gap: Math.round(W * .018) };
  }
  function text(label, maxW, maxH, color, tracking = -.03, size) {
    const px = size || fit(label, maxW, maxH, tracking);
    return `<div class="t" data-fit-text style="font-size:${px}px;color:${color};letter-spacing:${tracking}em;line-height:1;flex-shrink:0;">${label}</div>`;
  }
  function lineSize(labels, maxW, maxH, extraEm, tracking) {
    let lo = 10, hi = Math.floor(maxH), best = 10;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const width = labels.reduce((sum, label) => sum + widthOf(label, mid, tracking), 0) + mid * extraEm;
      if (width <= maxW) { best = mid; lo = mid + 1; } else hi = mid - 1;
    }
    return best;
  }
  const layouts = [
    function splitHorizontal(word, [bg, fg]) {
      const { W, H, px, py } = dimensions();
      const fraction = widthOf('MAKE', 100, -.03) / (widthOf('MAKE', 100, -.03) + widthOf(word, 100, -.03));
      const left = Math.round(W * Math.max(.28, Math.min(.44, fraction)));
      return frame(`<div style="width:${left}px;height:100%;background:${fg};display:flex;align-items:center;justify-content:center;">${text('MAKE', left - 2 * px, H - 2 * py, bg)}</div>
        <div style="width:${W-left}px;height:100%;background:${bg};display:flex;align-items:center;justify-content:center;">${text(word, W - left - 2 * px, H - 2 * py, fg)}</div>`);
    },
    function stackBar(word, [bg, fg, accent]) {
      const { W, H, px, py } = dimensions();
      const bar = Math.round(H * .36);
      return frame(`<div style="width:100%;height:100%;background:${bg};display:flex;flex-direction:column;">
        <div style="height:${bar}px;flex-shrink:0;background:${accent};display:flex;align-items:center;padding:0 ${px}px;">${text('MAKE', W - 2 * px, bar - 2 * py, bg, .06)}</div>
        <div style="flex:1;display:flex;align-items:center;justify-content:center;">${text(word, W - 2 * px, H - bar - 2 * py, fg)}</div></div>`);
    },
    function inlineTag(word, [bg, fg, accent]) {
      const { W, H, px, py, gap } = dimensions();
      const make = fit('MAKE', W * .28 - 2 * px, H * .5 - py, .02);
      const tagW = Math.ceil(widthOf('MAKE', make, .02)) + 2 * px;
      return frame(`<div style="width:100%;height:100%;background:${bg};display:flex;align-items:center;padding:0 ${px}px;gap:${gap}px;">
        <div style="flex-shrink:0;background:${accent};padding:${py}px ${px}px;">${text('MAKE', tagW, H, bg, .02, make)}</div>
        ${text(word, W - tagW - 2 * px - gap, H - 2 * py, fg)}</div>`);
    },
    function rightBleed(word, [bg, fg, accent]) {
      const { W, H, px, py, gap } = dimensions();
      const left = Math.round(W * .25);
      return frame(`<div style="width:100%;height:100%;background:${bg};display:flex;align-items:center;padding:0 ${px}px;gap:${gap}px;">
        <div style="width:${left}px;flex-shrink:0;">${text('MAKE', left, H - 2 * py, accent)}</div>
        <div style="flex:1;display:flex;justify-content:flex-end;">${text(word, W - left - 2 * px - gap, H - 2 * py, fg)}</div></div>`);
    },
    function underline(word, [bg, fg, accent]) {
      const { W, H, px, py } = dimensions();
      const top = Math.round(H * .28), gap = Math.round(H * .04), rule = Math.max(3, Math.round(H * .03));
      return frame(`<div style="width:100%;height:100%;background:${bg};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${gap}px;">
        ${text('MAKE', W - 2 * px, top, accent, .08)}
        <div style="border-bottom:${rule}px solid ${accent};">${text(word, W - 2 * px, H - 2 * py - top - gap - rule, fg)}</div></div>`);
    },
    function blockHighlight(word, [bg, fg, accent]) {
      const { W, H, px, py } = dimensions();
      const size = lineSize(['MAKE', word], W - 2 * px, H - 2 * py, .46, -.03);
      return frame(`<div style="width:100%;height:100%;background:${bg};display:flex;align-items:center;justify-content:center;gap:${size * .18}px;">
        <div style="background:${accent};padding:0 ${size * .14}px;">${text('MAKE', W, H, bg, -.03, size)}</div>
        ${text(word, W, H, fg, -.03, size)}</div>`);
    },
    function punctuation(word, [bg, fg, accent]) {
      const { W, H, px, py } = dimensions();
      const top = Math.round(H * .28), gap = Math.round(H * .04);
      return frame(`<div style="width:100%;height:100%;background:${bg};padding:${py}px ${px}px;display:flex;flex-direction:column;justify-content:space-between;">
        ${text('MAKE', W - 2 * px, top, accent, .08)}
        ${text(word + '.', W - 2 * px, H - 2 * py - top - gap, fg)}</div>`);
    },
    function arrow(word, [bg, fg, accent]) {
      const { W, H, px, py, gap } = dimensions();
      const make = fit('MAKE', W * .25, H - 2 * py, -.03);
      const arrowSize = Math.round(H * .34);
      const arrowW = widthOf('→', arrowSize, 0);
      const makeW = widthOf('MAKE', make, -.03);
      return frame(`<div style="width:100%;height:100%;background:${bg};display:flex;align-items:center;justify-content:center;gap:${gap}px;">
        ${text('MAKE', W, H, fg, -.03, make)}
        ${text('→', W, H, accent, 0, arrowSize)}
        ${text(word, W - 2 * px - makeW - arrowW - 2 * gap, H - 2 * py, accent)}</div>`);
    }
  ];
  return layouts.map(layout => (word, pair) => layout(word, readablePair(pair)));
}
