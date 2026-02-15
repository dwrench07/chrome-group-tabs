# Group Tabs by Domain (MV3)

This is an early scaffold for the "Group Tabs by Domain" Chrome extension.

How to load locally:
1. Open Chrome and go to `chrome://extensions`.
2. Enable "Developer mode".
3. Click "Load unpacked" and select this repository's root folder.

What's included:
- `manifest.json` — MV3 manifest.
- `src/sw.js` — background service worker placeholder.
- `src/popup.html` and `src/popup.js` — minimal popup UI and grouping logic.
- `src/utils.js` — helper (naive registered-domain function). 

Next steps:
- Replace naive domain parser with a Public Suffix List-based parser.
- Add options page for auto-group settings and domain overrides.
- Add tests and polish UI.
