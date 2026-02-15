# Group Tabs by Domain — TODO List

## Goal
Build a Chrome extension that groups browser tabs by domain name to help users organize and manage open tabs.

## Decisions / Preferences
- Manifest: Manifest V3 (service-worker based)
- UI: Popup (quick actions)
- Grouping: Registered domain (e.g. `sub.example.com` grouped with `example.com`)
- Auto-grouping: Manual trigger by default; provide optional auto-group modes (on tab change or periodic)

## High-level Tasks
1. Create `todolist.md` with plan and milestones — deliverable: this file.
2. Gather requirements & constraints — clarify browser targets, incognito behavior, sync needs, privacy.
3. Define grouping rules — use public suffix list / registered-domain logic; support custom overrides.
4. Design architecture — service worker (background), popup UI, options page, storage (chrome.storage.local/sync).
5. Scaffold project — `manifest.json`, directory layout, build scripts (if needed).
6. Implement tab querying & grouping logic — use `chrome.tabs` and `chrome.windows`, compute registered domain, group algorithm, performance for many tabs.
7. Implement popup UI — grouped list view, actions (select, move to window, close, create group), visual affordances.
8. Add settings UI in the popup — include/exclude lists, auto-grouping settings, domain overrides, sync preference.
9. Permissions & security review — least-privilege permissions, explain in manifest and README, review storage of data.
10. Tests & edge-case handling — incognito, profiles, many-tabs performance, sites with uncommon TLDs.
11. Polish, README & packaging — icons, versioning, publish checklist for Chrome Web Store.

## Implementation Notes / Acceptance Criteria
- Use Manifest V3 service worker and only request necessary permissions (tabs, storage, scripting if needed).
- Grouping must rely on a robust registered-domain algorithm (consider using a small public-suffix parser or include a lightweight list).
- Popup must display groups clearly and let users perform actions on groups and individual tabs.
- Settings in the popup must allow users to opt-in to auto-grouping (on tab events or periodic interval) and maintain privacy (no external telemetry).
- Extension must handle large tab counts without freezing the UI; grouping computation should be incremental/asynchronous.

## Next Steps
- Implement project scaffold and `manifest.json`.
- Start implementing tab grouping logic and a minimal popup to trigger grouping.

---

(If any preferences above are incorrect, reply with changes and I will update the plan.)
