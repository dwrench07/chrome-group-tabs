import { getRegisteredDomain } from './utils.js';

const groupBtn = document.getElementById('groupBtn');
const applyBtn = document.getElementById('applyBtn');
const groupsEl = document.getElementById('groups');
const saveBtn = document.getElementById('saveSettings');
const saveStatus = document.getElementById('saveStatus');
const includeListEl = document.getElementById('includeList');
const excludeListEl = document.getElementById('excludeList');
const periodEl = document.getElementById('period-minutes');

const autoManual = document.getElementById('auto-manual');
const autoOnChange = document.getElementById('auto-onchange');
const autoPeriodic = document.getElementById('auto-periodic');

groupBtn.addEventListener('click', async () => {
  groupBtn.disabled = true;
  groupsEl.textContent = 'Working...';
  const tabs = await chrome.tabs.query({});
  const groups = {};
  for (const t of tabs) {
    let domain = 'unknown';
    try {
      const url = new URL(t.url || '');
      domain = getRegisteredDomain(url.hostname);
    } catch (e) {
      domain = 'unknown';
    }
    if (!groups[domain]) groups[domain] = [];
    groups[domain].push(t);
  }
  renderGroups(groups);
  groupBtn.disabled = false;
});

applyBtn.addEventListener('click', async () => {
  applyBtn.disabled = true;
  applyBtn.textContent = 'Applying...';
  try {
    const res = await new Promise((res2) => chrome.runtime.sendMessage({ action: 'groupNow' }, res2));
    if (res && res.ok) {
      applyBtn.textContent = 'Done';
    } else {
      applyBtn.textContent = 'Failed';
      console.error('groupNow response', res);
    }
  } catch (e) {
    applyBtn.textContent = 'Error';
    console.error('applyBtn error', e);
  }
  setTimeout(() => { applyBtn.disabled = false; applyBtn.textContent = 'Apply Groups (test)'; }, 1200);
});

// Settings load/save
async function loadSettings() {
  const data = await new Promise((res) => chrome.storage.sync.get({ autoMode: 'manual', periodMinutes: 15, includeList: '', excludeList: '' }, res));
  const { autoMode, periodMinutes, includeList, excludeList } = data;
  if (autoMode === 'manual') autoManual.checked = true;
  else if (autoMode === 'onchange') autoOnChange.checked = true;
  else if (autoMode === 'periodic') autoPeriodic.checked = true;
  periodEl.value = periodMinutes || 15;
  includeListEl.value = includeList || '';
  excludeListEl.value = excludeList || '';
}

async function saveSettingsHandler() {
  const mode = autoManual.checked ? 'manual' : autoOnChange.checked ? 'onchange' : 'periodic';
  const minutes = parseInt(periodEl.value, 10) || 15;
  const includeList = includeListEl.value || '';
  const excludeList = excludeListEl.value || '';
  try {
    await new Promise((res) => chrome.storage.sync.set({ autoMode: mode, periodMinutes: minutes, includeList, excludeList }, res));
    saveStatus.style.color = '#070';
    saveStatus.textContent = 'Saved';
    setTimeout(() => (saveStatus.textContent = ''), 1500);
  } catch (err) {
    saveStatus.style.color = '#a00';
    saveStatus.textContent = 'Save failed';
    console.error('saveSettings error', err);
  }
}

saveBtn.addEventListener('click', saveSettingsHandler);
loadSettings();

// Also create/clear alarms immediately so setting takes effect without waiting for service worker storage listener
async function applyAlarmForMode() {
  const mode = autoManual.checked ? 'manual' : autoOnChange.checked ? 'onchange' : 'periodic';
  const minutes = parseInt(periodEl.value, 10) || 15;
  if (mode === 'periodic') {
    try { chrome.alarms.create('groupPeriodic', { periodInMinutes: Math.max(1, minutes) }); } catch (e) {}
  } else {
    try { chrome.alarms.clear('groupPeriodic'); } catch (e) {}
  }
}

saveBtn.addEventListener('click', applyAlarmForMode);

function renderGroups(groups) {
  groupsEl.innerHTML = '';
  const entries = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  for (const [domain, tabs] of entries) {
    const h = document.createElement('h3');
    h.textContent = `${domain} (${tabs.length})`;
    groupsEl.appendChild(h);
    const ul = document.createElement('ul');
    for (const t of tabs) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = t.title || t.url || 'untitled';
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        chrome.windows.update(t.windowId, { focused: true }, () => {
          chrome.tabs.update(t.id, { active: true });
        });
      });
      li.appendChild(a);
      ul.appendChild(li);
    }
    groupsEl.appendChild(ul);
  }
}
