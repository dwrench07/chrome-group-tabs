# Group Tabs by Domain

A Chrome extension that automatically groups your tabs by domain. Say goodbye to tab chaos!

## Features

✨ **Smart Domain Grouping**
- Automatically groups tabs by their registered domain
- Each domain group gets a unique color for easy visual identification
- Groups only tabs with 2+ tabs from the same domain (Chrome minimum)

🔄 **Flexible Grouping Modes**
- **Manual** — Group tabs on demand with a single click
- **Auto on Change** — Automatically group tabs when you create or update a tab
- **Periodic** — Auto-group at set intervals (customizable minutes)

🎯 **Subdomain Control**
- Control which domains are grouped by subdomain
- Example: Add `google.com` to group subdomains separately
  - `docs.google.com` → "Docs" group
  - `mail.google.com` → "Mail" group
  - `sheets.google.com` → "Sheets" group
- Domains not in the list group by domain only

📋 **Flexible Filtering**
- **Include List** — Only group specific domains
- **Exclude List** — Skip grouping for certain domains
- Mix and match for complete control

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked** and select this folder
5. The extension icon will appear in your toolbar

## Usage

### Quick Start

1. **Click the extension icon** to open the popup
2. **Click "Group Tabs"** to see a preview of how your tabs will be grouped
3. **Click "Apply Groups"** to create the groups in Chrome

### Settings

Access settings from the popup:

#### Grouping Mode
- **Manual** — Group only when you click "Apply Groups"
- **Auto on Tab Change** — Groups automatically when you create/update tabs
- **Auto Periodic** — Groups automatically every N minutes (default: 15)

#### Subdomain Grouping
Add domains here (one per line) to group their subdomains separately:
```
google.com
microsoft.com
```

#### Include/Exclude Filters
- **Include List** — Only group tabs from these domains (leave empty to include all)
- **Exclude List** — Never group tabs from these domains

### Example

If you have these tabs open:
- `docs.google.com/document/...`
- `docs.google.com/spreadsheet/...`
- `mail.google.com/mail/...`
- `github.com/user/repo`
- `github.com/different/repo`

With `google.com` in the "Subdomain Grouping" list:
- Result: **Docs** (2 tabs), **Mail** (1 tab) — *not grouped*, **Github** (2 tabs)

Without subdomain grouping:
- Result: **Google** (3 tabs), **Github** (2 tabs)

## How It Works

The extension:
1. Queries all open tabs
2. Extracts the registered domain from each tab's URL
3. Groups tabs by domain (or hostname if subdomain-grouping is enabled)
4. Creates Chrome tab groups with auto-assigned colors
5. Stores the mapping for future grouping

**Excluded tabs:**
- Pinned tabs (Chrome's limitation)
- Non-HTTP/HTTPS tabs (data:, chrome://, etc.)
- URLs that can't be parsed

## File Structure

```
src/
├── popup.html      — UI with grouping controls and settings
├── popup.js        — Popup logic and settings management
├── sw.js           — Background service worker (grouping engine)
└── utils.js        — Utility functions (domain parsing, formatting)
manifest.json       — MV3 extension manifest
```

## Technical Details

- **Manifest Version** — 3 (latest Chrome extension standard)
- **Permissions** — `tabs`, `storage`, `tabGroups`, `alarms`
- **Storage** — Uses Chrome sync storage for cross-device settings
- **Architecture** — Service worker background + popup UI

## Known Limitations

- Only groups tabs with 2+ tabs (Chrome's minimum for grouped tabs)
- Can't group pinned tabs (Chrome restriction)
- Domain parsing uses a simplified approach (not full Public Suffix List)
- Settings sync across Chrome devices (if synced)

## Future Improvements

- [ ] Use Public Suffix List for more accurate domain parsing
- [ ] Export/import settings
- [ ] Custom names for groups
- [ ] Keyboard shortcuts
- [ ] Group by other criteria (domain type, protocol, etc.)
- [ ] Statistics and analytics

## License

MIT

## Contributing

Found a bug or have a feature request? Feel free to open an issue!
