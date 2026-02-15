self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

// Auto-group service worker
let debounceTimer = null;

function getRegisteredDomain(hostname) {
	if (!hostname) return 'unknown';
	if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return hostname;
	const parts = hostname.split('.').filter(Boolean);
	if (parts.length <= 2) return parts.join('.');
	const secondLevelTLDs = new Set(['co.uk','com.au','co.jp','co.kr','gov.uk','ac.uk']);
	const lastTwo = parts.slice(-2).join('.');
	const lastThree = parts.slice(-3).join('.');
	if (secondLevelTLDs.has(lastTwo)) return lastThree;
	return lastTwo;
}

const storageGet = (keys) => new Promise((res) => chrome.storage.sync.get(keys, res));
const storageSet = (obj) => new Promise((res) => chrome.storage.sync.set(obj, res));

async function groupAllTabs() {
	try {
		const settings = await storageGet({ includeList: '', excludeList: '' });
		const includeRaw = (settings.includeList || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
		const excludeRaw = (settings.excludeList || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
		const includeSet = new Set(includeRaw);
		const excludeSet = new Set(excludeRaw);

		const tabs = await new Promise((res) => chrome.tabs.query({}, res));
		// map: domain -> windowId -> [tabIds]
		const map = new Map();
		for (const t of tabs) {
			if (!t.url || typeof t.url !== 'string') continue;
			if (t.pinned) continue;
			if (!t.url.startsWith('http://') && !t.url.startsWith('https://')) continue;
			let hostname = null;
			try {
				hostname = new URL(t.url).hostname;
			} catch {
				continue;
			}
			const domain = getRegisteredDomain(hostname);
			if (!domain) continue;
			if (excludeSet.has(domain)) continue;
			if (includeSet.size > 0 && !includeSet.has(domain)) continue;
			const win = t.windowId || 0;
			if (!map.has(domain)) map.set(domain, new Map());
			const winMap = map.get(domain);
			if (!winMap.has(win)) winMap.set(win, []);
			winMap.get(win).push(t.id);
		}

		// Build a map of existing tab groups by windowId and title (lowercased)
		const existingGroups = await new Promise((res) => chrome.tabGroups.query({}, res));
		const groupsByWindow = new Map();
		const existingGroupIds = new Set();
		for (const g of existingGroups || []) {
			const win = g.windowId || 0;
			if (!groupsByWindow.has(win)) groupsByWindow.set(win, new Map());
			groupsByWindow.get(win).set((g.title || '').toLowerCase(), g.id);
			existingGroupIds.add(g.id);
		}

		// load persisted mapping (fallback/optimization)
		const stored = await storageGet({ domainGroupMap: {} });
		let domainGroupMap = stored.domainGroupMap || {};

		// deterministic color chooser
		const colors = ['grey','blue','red','yellow','green','pink','purple','cyan','orange'];
		function colorForDomain(domain) {
			let h = 0;
			for (let i = 0; i < domain.length; i++) h = (h * 31 + domain.charCodeAt(i)) >>> 0;
			return colors[h % colors.length];
		}

		// For each domain with at least 2 tabs, group them (per window)
		for (const [domain, winMap] of map.entries()) {
			for (const [winId, tabIds] of winMap.entries()) {
				if (!tabIds || tabIds.length < 2) continue;
				try {
					const titleKey = domain.toLowerCase();
					const winGroups = groupsByWindow.get(winId) || new Map();
					let existingGroupId = winGroups.get(titleKey);

					// fallback to stored mapping if it references an existing group id
					if (!existingGroupId && domainGroupMap && domainGroupMap[winId] && domainGroupMap[winId][titleKey]) {
						const maybeId = domainGroupMap[winId][titleKey];
						if (existingGroupIds.has(maybeId)) existingGroupId = maybeId;
					}

					if (existingGroupId != null) {
						// add tabs to the existing group
						console.debug('groupAllTabs: adding to existing group', { domain, winId, groupId: existingGroupId, tabIds });
						chrome.tabs.group({ groupId: existingGroupId, tabIds }, (groupId) => {
							if (chrome.runtime.lastError) {
								console.error('tabs.group add error', chrome.runtime.lastError, { domain, winId, tabIds });
								return;
							}
							console.log('Added to existing group', domain, 'gid', groupId, 'window', winId);
						});
					} else {
						// create a new group and name it with the domain
						console.debug('groupAllTabs: creating new group', { domain, winId, tabIds });
						chrome.tabs.group({ tabIds }, (groupId) => {
							if (chrome.runtime.lastError) {
								console.error('tabs.group create error', chrome.runtime.lastError, { domain, winId, tabIds });
								return;
							}
							try {
								const color = colorForDomain(domain);
								chrome.tabGroups.update(groupId, { title: domain, color });
								// update runtime map and persistent cache
								if (!groupsByWindow.has(winId)) groupsByWindow.set(winId, new Map());
								groupsByWindow.get(winId).set(titleKey, groupId);
								domainGroupMap = domainGroupMap || {};
								domainGroupMap[winId] = domainGroupMap[winId] || {};
								domainGroupMap[winId][titleKey] = groupId;
								storageSet({ domainGroupMap }).catch(() => {});
								console.log('Created group', domain, 'gid', groupId, 'window', winId);
							} catch (e) {
								console.error('tabGroups.update error', e, { domain, winId, groupId });
							}
						});
					}
				} catch (e) {
					console.error('groupAllTabs exception', e, { domain, winId });
				}
			}
		}
	} catch (e) {
		// swallow errors in background grouping
		console.error('groupAllTabs failed', e);
	}
}

// Allow popup to request immediate grouping for testing
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	if (msg && msg.action === 'groupNow') {
		groupAllTabs().then(() => sendResponse({ ok: true })).catch((err) => sendResponse({ ok: false, error: String(err) }));
		return true; // keep channel open for async response
	}
});

function scheduleGroup() {
	if (debounceTimer) clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => { debounceTimer = null; groupAllTabs(); }, 600);
}

// Tab event listeners
chrome.tabs.onCreated.addListener(() => {
	storageGet({ autoMode: 'manual' }).then(({ autoMode }) => { if (autoMode === 'onchange') scheduleGroup(); });
});
chrome.tabs.onUpdated.addListener(() => {
	storageGet({ autoMode: 'manual' }).then(({ autoMode }) => { if (autoMode === 'onchange') scheduleGroup(); });
});

// Alarm handler for periodic grouping
chrome.alarms.onAlarm.addListener((alarm) => {
	if (alarm && alarm.name === 'groupPeriodic') scheduleGroup();
});

// React to storage changes (mode or period changes)
chrome.storage.onChanged.addListener((changes, area) => {
	if (area !== 'sync') return;
	if (changes.autoMode || changes.periodMinutes) {
		storageGet({ autoMode: 'manual', periodMinutes: 15 }).then(({ autoMode, periodMinutes }) => {
			if (autoMode === 'periodic') {
				chrome.alarms.create('groupPeriodic', { periodInMinutes: Math.max(1, parseInt(periodMinutes || 15, 10)) });
			} else {
				chrome.alarms.clear('groupPeriodic');
			}
		});
	}
});

// On startup, ensure alarms are scheduled if needed
storageGet({ autoMode: 'manual', periodMinutes: 15 }).then(({ autoMode, periodMinutes }) => {
	if (autoMode === 'periodic') {
		chrome.alarms.create('groupPeriodic', { periodInMinutes: Math.max(1, parseInt(periodMinutes || 15, 10)) });
	}
});
