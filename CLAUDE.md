# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Remote content management system for a physical LED tower sign visible from I-580 in Richmond, CA.

**Hardware:** NovaStar Taurus-00002753 media player (768x192 pixel resolution), managed via ViPlex Express. The Taurus loads a web page widget pointing to the GitHub Pages URL for this repo.

**Architecture:** Static site on GitHub Pages. `index.html` is a slideshow engine that reads `slides.json` and cycles through content. Content updates = push to main branch. No build step.

## Development

```bash
# Serve locally for testing
python3 -m http.server 8787

# View at exact sign resolution
# Open http://localhost:8787 in a 768x192 browser window
```

## Key Files

- `index.html` -- Display page (what the sign renders). Slideshow engine in inline JS.
- `slides.json` -- Content manifest. Defines slide order, types, durations, transitions.
- `slides/` -- Image and video assets at 768x192 resolution.
- `admin.html` -- (Phase 2) Browser-based content management UI.

## Content Types

Slides can be `image` (PNG/JPG), `video` (MP4/WebM), or `html` (embedded HTML pages).
Videos play muted. HTML slides render in iframes at 768x192.

## Constraints

- All content must render at exactly 768x192 pixels
- No external CDN dependencies -- everything self-contained
- No build step -- pure HTML/CSS/JS
- The display page polls `slides.json` every 30s for changes
- GitHub Pages deployment takes 30-90 seconds after push
