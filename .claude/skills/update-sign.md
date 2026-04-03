---
name: update-sign
description: Update the tower sign from the Google Sheet. Reads content from the spreadsheet, regenerates index.html, and pushes to GitHub Pages.
---

# /update-sign

Update the tower LED sign content from the Google Sheet.

**Source:** https://docs.google.com/spreadsheets/d/1gsvIOdBBqp_aXVGYQpwqQdutWyqBSVKjoS6aHERNf8Y

## Steps

### 1. Fetch the spreadsheet

```bash
curl -sL "https://docs.google.com/spreadsheets/d/1gsvIOdBBqp_aXVGYQpwqQdutWyqBSVKjoS6aHERNf8Y/export?format=csv" > /tmp/tower-sign-content.csv
```

Verify it downloaded:
```bash
wc -l /tmp/tower-sign-content.csv
head -5 /tmp/tower-sign-content.csv
```

If it fails or returns HTML (auth wall), tell the user: "The spreadsheet isn't publicly accessible. Open the sheet → Share → change to 'Anyone with the link can view'."

### 2. Parse the CSV and rebuild index.html

Read `/tmp/tower-sign-content.csv`. The format is:

| Column A | Column B | Column C |
|----------|----------|----------|
| Type | Line 1 | Line 2 |

**Type values:**
- `Poem` — poetry/lyrics verse. Line 1 and Line 2 are the two display lines (Line 2 may be empty for single-line verses)
- `MAKE` — MAKE series slide. Line 1 is always "MAKE", Line 2 is the word (e.g., "trouble", "art")
- `Mantra` — the repeating mantra. Line 1 is the full text, Line 2 is empty

### 3. Generate the poems array

For each `Poem` row:
- If Line 2 is empty: `"line1"`
- If Line 2 has content: `"line1\nline2"`

For `MAKE` rows, collect the Line 2 values into the MAKE_WORDS array.

For `Mantra` rows, use Line 1 as the MANTRA constant.

### 4. Update index.html

Read the current `/Users/jeff/code/tower/index.html`. Replace ONLY the data arrays:
- Replace the `const poems = [...]` array with the new poems
- Replace the `const MAKE_WORDS = [...]` array with the new MAKE words
- Replace the `const MANTRA = "..."` with the new mantra

**Do NOT change** any other code (styling, colors, fonts, cycling logic, measurement code).

### 5. Validate

Count the slides and report:
- Number of Poem slides
- Number of MAKE slides
- Mantra text
- Total slides in rotation

Check that no line exceeds 20 characters. Flag any that do.

### 6. Test locally

```bash
B=~/.claude/skills/gstack/browse/dist/browse
$B viewport 768x192
$B goto "http://localhost:8787/index.html"
sleep 3
$B screenshot /tmp/sign-update-test.png
```

Show the screenshot to the user.

### 7. Push to GitHub

```bash
cd /Users/jeff/code/tower
git add index.html
git commit -m "Update sign content from Google Sheet

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
git push
```

### 8. Report

Tell the user:
- How many slides were updated
- What changed (new slides added, slides removed, text modified)
- The sign will update within ~90 seconds
- Link to the live sign: https://jhwright.github.io/BridgeTower/

## Rules

- **Never change the design/styling** — only update the content arrays
- **Max 20 characters per line** — flag violations, don't silently truncate
- **Max 2 lines per slide** — if a row somehow has 3+ lines, flag it
- **Preserve the MAKE block behavior** — MAKE slides shift position and color automatically
- **Preserve shuffle** — poems are shuffled on page load, don't change this
- **Preserve the rotation pattern** — poem → mantra → poem → mantra → poem → MAKE → repeat
