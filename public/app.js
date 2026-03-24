/* =========================================
   Precision Curator — SPA App
   ========================================= */

// --- CONSTANTS ---
const FORMATS = ['Advertorial','UGCMashup','Unboxing','podcast','StreetInterview','BeforeAfter'];
const MESSAGINGS = ['FOMO','tagline','benefit1','founderstory','problemsolution'];
const HOOKS = ['3reasonswhy','whynottobuy','productdemonstration','commentbubble','talkinghead','problem','offer','shocking','taboo'];
const GENDERS = ['Male','Female','No Gender'];
const AGES = ['age-kids','age-teens','age-middleage','age-elders','age-No Generation'];
const LENGTHS = ['IMG','03sec','06sec','10sec','15sec','30sec','60sec','90sec','120sec'];
const OFFERS = ['o-None','o-Percentage Off','o-Dollar Off','o-BOGO'];
const LPS = ['lp-home','lp-collection','lp-pdp','lp-customoffer','lp-blog'];
const AUDIOS = ['music','voiceover','trendingsound','none'];

// --- STATE ---
const state = {
  files: [],
  settings: {
    sources: [], products: [], talents: ['AI','Ariel'],
    platforms: ['Meta','TikTok','YouTube','Native'],
    defaultSource: '', defaultProduct: '', defaultTalent: 'AI',
    defaultPlatform: 'Meta', defaultOffer: 'o-None', defaultLp: 'lp-pdp'
  },
  selectedIds: new Set(),
  lastSelectedIdx: -1,
  campaign: {
    source: '', product: '', offer: 'o-None',
    lp: 'lp-pdp', talent: 'AI', platform: 'Meta', batchName: ''
  },
  analyzeProgress: { total: 0, done: 0, analyzing: 0, pending: 0, error: 0 },
  analyzePolling: null,
  viewMode: 'grid',
  sortBy: 'newest',
  filterQuery: '',
  uploadFilter: 'all'
};

// --- API HELPERS ---
async function api(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

const API = {
  getFiles: () => api('/files'),
  getFile: (id) => api(`/files/${id}`),
  getSettings: () => api('/settings'),
  saveSettings: (s) => api('/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) }),
  upload: (formData) => fetch('/upload', { method: 'POST', body: formData }).then(r => r.json()),
  analyze: (id) => api(`/analyze/${id}`, { method: 'POST' }),
  analyzeAll: () => api('/analyze-all', { method: 'POST' }),
  analyzeStatus: () => api('/analyze-status'),
  getStats: () => api('/stats'),
  updateFile: (id, data) => api(`/update/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteFile: (id) => fetch(`/files/${id}`, { method: 'DELETE' }),
  bulkDelete: (ids) => fetch('/files/bulk', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) }),
};

// --- UTILITIES ---
function showToast(msg, type = '') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

function formatBytes(b) {
  if (!b || b === 0) return '0 B';
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  if (b < 1073741824) return (b / 1048576).toFixed(1) + ' MB';
  return (b / 1073741824).toFixed(2) + ' GB';
}

function formatAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function statusChip(status) {
  const map = {
    pending: { cls: 'chip-pending', label: 'Naming Queue', dot: '#4e6874' },
    analyzing: { cls: 'chip-analyzing', label: 'Analyzing', dot: '#073370' },
    done: { cls: 'chip-done', label: 'Processed', dot: '#155724' },
    error: { cls: 'chip-error', label: 'Error', dot: '#93000a' },
  };
  const m = map[status] || map.pending;
  return `<span class="chip ${m.cls}"><span class="chip-dot" style="background:${m.dot}"></span>${m.label}</span>`;
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function navigate(page) {
  window.location.hash = page;
}

function mkThumb(f) {
  if (!f) return '<div class="w-10 h-10 rounded bg-surface-container-high flex items-center justify-center"><span class="material-symbols-outlined text-outline text-[20px]">image</span></div>';
  if (f.mimeType && f.mimeType.startsWith('image/')) {
    return `<img src="/preview/${f.id}" class="w-10 h-10 rounded object-cover" alt="">`;
  }
  if (f.mimeType && f.mimeType.startsWith('video/')) {
    return `<div class="w-10 h-10 rounded bg-surface-container-high flex items-center justify-center relative">
      <span class="material-symbols-outlined text-primary text-[20px]">play_circle</span>
    </div>`;
  }
  return '<div class="w-10 h-10 rounded bg-surface-container-high flex items-center justify-center"><span class="material-symbols-outlined text-outline text-[20px]">draft</span></div>';
}

function mkSelect(name, values, selected, extraClass = '') {
  const opts = values.map(v => `<option value="${v}" ${v === selected ? 'selected' : ''}>${v}</option>`).join('');
  return `<select class="field-input ${extraClass}" data-field="${name}"><option value="">—</option>${opts}</select>`;
}

function renderHeader(title, subtitle) {
  return `<div class="sticky top-0 z-30 bg-surface/95 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
    <div>
      <h2 class="font-headline font-bold text-on-surface text-lg">${title}</h2>
      ${subtitle ? `<p class="text-on-surface-variant text-xs mt-0.5">${subtitle}</p>` : ''}
    </div>
    <div class="w-8 h-8 rounded-full signature-gradient flex items-center justify-center text-white text-xs font-bold">AT</div>
  </div>`;
}

function escHtml(s) {
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

// --- ROUTER ---
const routes = {
  '#dashboard': renderDashboard,
  '#upload': renderUpload,
  '#files': renderFiles,
  '#settings': renderSettings,
};

function route() {
  const hash = window.location.hash || '#dashboard';
  const renderer = routes[hash] || renderDashboard;

  // Update nav active states
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('nav-active', link.getAttribute('href') === hash);
  });
  document.querySelectorAll('.nav-link-mobile').forEach(link => {
    const isActive = link.getAttribute('href') === hash;
    link.classList.toggle('text-primary', isActive);
    link.classList.toggle('font-bold', isActive);
    link.classList.toggle('text-on-surface-variant', !isActive);
  });

  renderer();
}

window.addEventListener('hashchange', route);

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const [settings, files] = await Promise.all([API.getSettings(), API.getFiles()]);
    state.settings = { ...state.settings, ...settings };
    state.files = files;
    // Set campaign defaults from settings
    state.campaign.source = state.settings.defaultSource;
    state.campaign.product = state.settings.defaultProduct;
    state.campaign.talent = state.settings.defaultTalent || 'AI';
    state.campaign.platform = state.settings.defaultPlatform || 'Meta';
    state.campaign.offer = state.settings.defaultOffer || 'o-None';
    state.campaign.lp = state.settings.defaultLp || 'lp-pdp';
  } catch (e) {
    console.error('Init failed:', e);
  }
  route();
});

// --- PAGE 1: DASHBOARD ---
async function renderDashboard() {
  const main = document.getElementById('main-content');
  let stats = { totalFiles: 0, analyzed: 0, pending: 0, totalSize: 0 };
  try { stats = await API.getStats(); } catch {}

  const recent = [...state.files].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)).slice(0, 5);

  main.innerHTML = `
    ${renderHeader('Dashboard', 'Overview of your asset library')}
    <div class="px-6 pb-8">
      <!-- Stat Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="bg-surface-container-lowest rounded-lg p-5 ambient-shadow">
          <p class="text-[11px] uppercase tracking-wider font-semibold text-primary mb-1">Ready for Analysis</p>
          <p class="text-3xl font-headline font-bold text-primary">${stats.pending}</p>
          <p class="text-xs text-on-surface-variant mt-1">files in queue</p>
        </div>
        <div class="bg-surface-container-lowest rounded-lg p-5 ambient-shadow">
          <p class="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant mb-1">Processed</p>
          <p class="text-3xl font-headline font-bold text-on-surface">${stats.analyzed}</p>
          <p class="text-xs text-on-surface-variant mt-1">files analyzed</p>
        </div>
        <div class="signature-gradient rounded-lg p-5 text-white">
          <p class="text-[11px] uppercase tracking-wider font-semibold text-white/80 mb-1">Total Files</p>
          <p class="text-3xl font-headline font-bold">${stats.totalFiles}</p>
          <p class="text-xs text-white/70 mt-1">${formatBytes(stats.totalSize)} total</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Recent Uploads -->
        <div class="lg:col-span-2 bg-surface-container-lowest rounded-lg ambient-shadow">
          <div class="p-4 pb-2">
            <h3 class="font-headline font-bold text-sm text-on-surface">Recent Uploads</h3>
          </div>
          ${recent.length === 0 ? '<p class="px-4 pb-4 text-sm text-on-surface-variant">No files uploaded yet.</p>' : `
          <table class="data-table w-full text-sm">
            <tbody>
              ${recent.map(f => `<tr class="cursor-pointer" onclick="navigate('#files')">
                <td class="px-4 py-2">${mkThumb(f)}</td>
                <td class="px-2 py-2 max-w-[200px] truncate text-on-surface">${escHtml(f.originalName)}</td>
                <td class="px-2 py-2">${statusChip(f.analysisStatus)}</td>
                <td class="px-4 py-2 text-on-surface-variant text-xs">${formatAgo(f.uploadedAt)}</td>
              </tr>`).join('')}
            </tbody>
          </table>`}
        </div>

        <!-- Quick Links -->
        <div class="bg-surface-container-lowest rounded-lg p-5 ambient-shadow flex flex-col gap-3">
          <h3 class="font-headline font-bold text-sm text-on-surface mb-1">Quick Actions</h3>
          <button onclick="quickAnalyzeAll()" class="signature-gradient text-white text-sm font-semibold rounded-lg px-4 py-2.5 flex items-center gap-2 hover:opacity-90 transition-opacity">
            <span class="material-symbols-outlined text-[18px]">auto_awesome</span> Analyze All
          </button>
          <a href="/download-all-zip" class="bg-surface-container-low text-on-surface text-sm font-medium rounded-lg px-4 py-2.5 flex items-center gap-2 hover:bg-surface-container transition-colors text-center no-underline">
            <span class="material-symbols-outlined text-[18px]">archive</span> Download All ZIP
          </a>
          <a href="#settings" class="bg-surface-container-low text-on-surface text-sm font-medium rounded-lg px-4 py-2.5 flex items-center gap-2 hover:bg-surface-container transition-colors no-underline">
            <span class="material-symbols-outlined text-[18px]">settings</span> Open Settings
          </a>
        </div>
      </div>
    </div>`;
}

async function quickAnalyzeAll() {
  try {
    const res = await API.analyzeAll();
    showToast(`Queued ${res.queued} files for analysis`, 'success');
    if (res.queued > 0) navigate('#upload');
  } catch { showToast('Failed to start analysis', 'error'); }
}

// --- PAGE 2: UPLOAD ---
async function renderUpload() {
  const main = document.getElementById('main-content');
  const pendingCount = state.files.filter(f => f.analysisStatus === 'pending' || f.analysisStatus === 'error').length;

  main.innerHTML = `
    ${renderHeader('Upload & Rename', 'Upload creative assets for AI-powered naming')}
    <div class="px-6 pb-8">
      <!-- Top: Analyze All button -->
      <div class="flex justify-end mb-4">
        <button id="analyze-all-btn" onclick="startAnalyzeAll()" class="signature-gradient text-white text-sm font-semibold rounded-lg px-4 py-2.5 flex items-center gap-2 hover:opacity-90 transition-opacity">
          <span class="material-symbols-outlined text-[18px]">auto_awesome</span>
          Analyze All${pendingCount > 0 ? ` (${pendingCount} pending)` : ''}
        </button>
      </div>

      <!-- Campaign Context Form -->
      <div class="bg-surface-container-low p-6 rounded-lg mb-6">
        <p class="text-[11px] uppercase tracking-wider font-semibold text-primary mb-1">Campaign Context</p>
        <p class="text-xs text-on-surface-variant mb-4">Set batch defaults — applied to all files uploaded this session</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant block mb-1">Source</label>
            ${mkSelect('source', state.settings.sources, state.campaign.source, 'campaign-field')}
          </div>
          <div>
            <label class="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant block mb-1">Product</label>
            ${mkSelect('product', state.settings.products, state.campaign.product, 'campaign-field')}
          </div>
          <div>
            <label class="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant block mb-1">Offer</label>
            ${mkSelect('offer', OFFERS, state.campaign.offer, 'campaign-field')}
          </div>
          <div>
            <label class="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant block mb-1">Landing Page</label>
            ${mkSelect('lp', LPS, state.campaign.lp, 'campaign-field')}
          </div>
          <div>
            <label class="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant block mb-1">Talent</label>
            ${mkSelect('talent', state.settings.talents || ['AI','Ariel'], state.campaign.talent, 'campaign-field')}
          </div>
          <div>
            <label class="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant block mb-1">Platform</label>
            ${mkSelect('platform', state.settings.platforms || ['Meta','TikTok','YouTube','Native'], state.campaign.platform, 'campaign-field')}
          </div>
          <div class="md:col-span-2">
            <label class="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant block mb-1">Batch Name</label>
            <input type="text" class="field-input campaign-field" data-field="batchName" value="${escHtml(state.campaign.batchName)}" placeholder="e.g. Q1-2026-medicare-ugc">
          </div>
        </div>
        <p class="text-xs text-on-surface-variant mt-3">These defaults pre-fill Gemini's analysis context for better accuracy</p>
      </div>

      <!-- Drop Zone -->
      <div id="drop-zone" class="drop-zone rounded-lg p-10 text-center mb-6 cursor-pointer">
        <div class="w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center mx-auto mb-4">
          <span class="material-symbols-outlined text-primary text-[28px]">cloud_upload</span>
        </div>
        <p class="font-headline font-bold text-on-surface mb-1">Drop files here to upload</p>
        <p class="text-xs text-on-surface-variant mb-3">JPG, PNG, GIF, WEBP, AVIF, MP4, MOV, AVI, WEBM, MKV, M4V — up to 500MB</p>
        <button id="browse-btn" class="signature-gradient text-white text-sm font-semibold rounded-lg px-5 py-2 hover:opacity-90 transition-opacity">Browse Files</button>
        <input type="file" id="file-input" multiple accept="image/*,video/*" class="hidden">
      </div>

      <!-- Upload progress area -->
      <div id="upload-progress" class="hidden mb-4"></div>

      <!-- Analyze progress bar -->
      <div id="analyze-progress" class="hidden bg-surface-container-low rounded-lg p-4 mb-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-on-surface" id="analyze-progress-text">Analyzing...</span>
          <span class="text-xs text-on-surface-variant" id="analyze-progress-pct">0%</span>
        </div>
        <div class="progress-bar w-full">
          <div class="progress-fill" id="analyze-progress-fill" style="width:0%"></div>
        </div>
      </div>

      <!-- Filter tabs -->
      <div class="flex gap-2 mb-4" id="upload-filter-tabs">
        <button class="text-xs font-semibold px-3 py-1.5 rounded-full upload-filter-btn active" data-filter="all">All</button>
        <button class="text-xs font-semibold px-3 py-1.5 rounded-full upload-filter-btn" data-filter="pending">Pending</button>
        <button class="text-xs font-semibold px-3 py-1.5 rounded-full upload-filter-btn" data-filter="analyzing">Analyzing</button>
        <button class="text-xs font-semibold px-3 py-1.5 rounded-full upload-filter-btn" data-filter="done">Done</button>
        <button class="text-xs font-semibold px-3 py-1.5 rounded-full upload-filter-btn" data-filter="error">Error</button>
      </div>

      <!-- Pending Queue Table -->
      <div class="data-table-wrapper overflow-x-auto">
        <table class="data-table w-full text-sm" id="upload-queue-table">
          <thead>
            <tr class="text-[11px] uppercase tracking-wider text-on-surface-variant">
              <th class="px-3 py-2 text-left"><input type="checkbox" id="upload-select-all"></th>
              <th class="px-2 py-2 text-left">Thumb</th>
              <th class="px-2 py-2 text-left">Original Name</th>
              <th class="px-2 py-2 text-left">Proposed Name</th>
              <th class="px-2 py-2 text-left">Status</th>
              <th class="px-2 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody id="upload-queue-body"></tbody>
        </table>
      </div>

      <!-- Clear All -->
      <div class="mt-4 flex justify-end">
        <button id="clear-all-btn" class="text-sm text-error font-medium hover:underline">Clear All</button>
      </div>
    </div>`;

  setupDropZone();
  renderUploadQueue();
  setupCampaignFields();
  setupUploadFilterTabs();

  document.getElementById('clear-all-btn').addEventListener('click', clearAllFiles);
  document.getElementById('upload-select-all').addEventListener('change', (e) => {
    const filtered = getFilteredUploadFiles();
    if (e.target.checked) filtered.forEach(f => state.selectedIds.add(f.id));
    else filtered.forEach(f => state.selectedIds.delete(f.id));
    renderUploadQueue();
  });
}

function getFilteredUploadFiles() {
  if (state.uploadFilter === 'all') return state.files;
  return state.files.filter(f => f.analysisStatus === state.uploadFilter);
}

function setupUploadFilterTabs() {
  document.querySelectorAll('.upload-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.uploadFilter = btn.dataset.filter;
      document.querySelectorAll('.upload-filter-btn').forEach(b => {
        b.classList.toggle('active', b === btn);
        b.classList.toggle('bg-primary', b === btn);
        b.classList.toggle('text-white', b === btn);
        b.classList.toggle('bg-surface-container-low', b !== btn);
        b.classList.toggle('text-on-surface-variant', b !== btn);
      });
      renderUploadQueue();
    });
    // Set initial styles
    if (btn.dataset.filter === state.uploadFilter) {
      btn.classList.add('bg-primary', 'text-white');
    } else {
      btn.classList.add('bg-surface-container-low', 'text-on-surface-variant');
    }
  });
}

function renderUploadQueue() {
  const tbody = document.getElementById('upload-queue-body');
  if (!tbody) return;
  const filtered = getFilteredUploadFiles();

  tbody.innerHTML = filtered.map((f, idx) => {
    const checked = state.selectedIds.has(f.id) ? 'checked' : '';
    return `<tr data-id="${f.id}">
      <td class="px-3 py-2"><input type="checkbox" class="queue-check" data-id="${f.id}" ${checked}></td>
      <td class="px-2 py-2">${mkThumb(f)}</td>
      <td class="px-2 py-2 max-w-[180px] truncate" title="${escHtml(f.originalName)}">${escHtml(f.originalName)}</td>
      <td class="px-2 py-2">
        ${f.proposedName ? `<span class="proposed-name" onclick="copyName(this, '${escHtml(f.proposedName)}')" title="Click to copy">${escHtml(f.proposedName)}</span>` : '<span class="text-xs text-on-surface-variant">—</span>'}
      </td>
      <td class="px-2 py-2">${statusChip(f.analysisStatus)}</td>
      <td class="px-2 py-2 flex gap-1">
        <button class="p-1 hover:bg-surface-container rounded" onclick="toggleAccordion('${f.id}')" title="Edit fields">
          <span class="material-symbols-outlined text-[18px] text-on-surface-variant">expand_more</span>
        </button>
        <button class="p-1 hover:bg-surface-container rounded" onclick="reanalyze('${f.id}')" title="Re-analyze">
          <span class="material-symbols-outlined text-[18px] text-on-surface-variant">refresh</span>
        </button>
        <button class="p-1 hover:bg-error-container rounded" onclick="deleteFile('${f.id}')" title="Delete">
          <span class="material-symbols-outlined text-[18px] text-error">delete</span>
        </button>
      </td>
    </tr>
    <tr class="accordion-row" id="acc-${f.id}">
      <td colspan="6" class="px-4 py-3 bg-surface-container-low">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          ${renderFieldDropdowns(f)}
        </div>
      </td>
    </tr>`;
  }).join('');

  // Bind checkboxes
  tbody.querySelectorAll('.queue-check').forEach(cb => {
    cb.addEventListener('change', (e) => {
      if (e.target.checked) state.selectedIds.add(e.target.dataset.id);
      else state.selectedIds.delete(e.target.dataset.id);
    });
  });
}

function renderFieldDropdowns(f) {
  const fld = f.fields || {};
  return `
    <div><label class="text-[10px] uppercase tracking-wider text-on-surface-variant">Source</label>${mkSelect('source', state.settings.sources, fld.source, `acc-field" data-id="${f.id}`)}</div>
    <div><label class="text-[10px] uppercase tracking-wider text-on-surface-variant">Format</label>${mkSelect('format', FORMATS, fld.format, `acc-field" data-id="${f.id}`)}</div>
    <div><label class="text-[10px] uppercase tracking-wider text-on-surface-variant">Messaging</label>${mkSelect('messaging', MESSAGINGS, fld.messaging, `acc-field" data-id="${f.id}`)}</div>
    <div><label class="text-[10px] uppercase tracking-wider text-on-surface-variant">Hook</label>${mkSelect('hook', HOOKS, fld.hook, `acc-field" data-id="${f.id}`)}</div>
    <div><label class="text-[10px] uppercase tracking-wider text-on-surface-variant">Product</label>${mkSelect('product', state.settings.products, fld.product, `acc-field" data-id="${f.id}`)}</div>
    <div><label class="text-[10px] uppercase tracking-wider text-on-surface-variant">Talent</label>${mkSelect('talent', state.settings.talents || ['AI','Ariel'], fld.talent, `acc-field" data-id="${f.id}`)}</div>
    <div><label class="text-[10px] uppercase tracking-wider text-on-surface-variant">Gender</label>${mkSelect('gender', GENDERS, fld.gender, `acc-field" data-id="${f.id}`)}</div>
    <div><label class="text-[10px] uppercase tracking-wider text-on-surface-variant">Age</label>${mkSelect('age', AGES, fld.age, `acc-field" data-id="${f.id}`)}</div>
    <div><label class="text-[10px] uppercase tracking-wider text-on-surface-variant">Length</label>${mkSelect('length', LENGTHS, fld.length, `acc-field" data-id="${f.id}`)}</div>
    <div><label class="text-[10px] uppercase tracking-wider text-on-surface-variant">Offer</label>${mkSelect('offer', OFFERS, fld.offer, `acc-field" data-id="${f.id}`)}</div>
    <div><label class="text-[10px] uppercase tracking-wider text-on-surface-variant">Landing Page</label>${mkSelect('lp', LPS, fld.lp, `acc-field" data-id="${f.id}`)}</div>
    <div><label class="text-[10px] uppercase tracking-wider text-on-surface-variant">Audio</label>${mkSelect('audio', AUDIOS, fld.audio, `acc-field" data-id="${f.id}`)}</div>
  `;
}

function toggleAccordion(id) {
  const row = document.getElementById(`acc-${id}`);
  if (row) row.classList.toggle('open');
}

function copyName(el, name) {
  navigator.clipboard.writeText(name).then(() => showToast('Copied to clipboard', 'success'));
}

async function reanalyze(id) {
  const f = state.files.find(x => x.id === id);
  if (f) f.analysisStatus = 'analyzing';
  renderUploadQueue();
  try {
    const updated = await API.analyze(id);
    const idx = state.files.findIndex(x => x.id === id);
    if (idx >= 0) state.files[idx] = updated.sidecar || updated;
  } catch {
    const idx = state.files.findIndex(x => x.id === id);
    if (idx >= 0) state.files[idx].analysisStatus = 'error';
  }
  renderUploadQueue();
}

async function deleteFile(id) {
  if (!confirm('Delete this file?')) return;
  await API.deleteFile(id);
  state.files = state.files.filter(f => f.id !== id);
  state.selectedIds.delete(id);
  renderUploadQueue();
  showToast('File deleted', 'success');
}

async function clearAllFiles() {
  if (!confirm('Delete ALL uploaded files? This cannot be undone.')) return;
  const ids = state.files.map(f => f.id);
  await API.bulkDelete(ids);
  state.files = [];
  state.selectedIds.clear();
  renderUploadQueue();
  showToast('All files cleared', 'success');
}

function setupCampaignFields() {
  document.querySelectorAll('.campaign-field').forEach(el => {
    const field = el.dataset.field;
    el.addEventListener('change', () => {
      state.campaign[field] = el.value;
      // Apply to all pending files
      state.files.filter(f => f.analysisStatus === 'pending').forEach(f => {
        if (field !== 'batchName' && field !== 'platform') {
          API.updateFile(f.id, { [field]: el.value }).then(updated => {
            const idx = state.files.findIndex(x => x.id === f.id);
            if (idx >= 0) state.files[idx] = updated;
          });
        }
      });
    });
    if (el.tagName === 'INPUT') {
      el.addEventListener('input', debounce(() => {
        state.campaign[field] = el.value;
      }, 300));
    }
  });
}

function setupDropZone() {
  const zone = document.getElementById('drop-zone');
  const input = document.getElementById('file-input');
  const browseBtn = document.getElementById('browse-btn');
  if (!zone || !input) return;

  browseBtn.addEventListener('click', (e) => { e.stopPropagation(); input.click(); });
  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    handleFileSelect(e.dataTransfer.files);
  });
  input.addEventListener('change', () => { handleFileSelect(input.files); input.value = ''; });
}

async function handleFileSelect(fileList) {
  if (!fileList || !fileList.length) return;
  const progressArea = document.getElementById('upload-progress');
  progressArea.classList.remove('hidden');
  progressArea.innerHTML = '';

  const promises = [];
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const id = `upload-prog-${i}`;
    progressArea.innerHTML += `
      <div class="flex items-center gap-3 mb-2" id="${id}">
        <span class="text-xs text-on-surface truncate max-w-[200px]">${escHtml(file.name)}</span>
        <div class="progress-bar flex-1"><div class="progress-fill" style="width:0%"></div></div>
        <span class="text-xs text-on-surface-variant upload-pct">0%</span>
      </div>`;

    const p = new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('files', file);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/upload');
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round(e.loaded / e.total * 100);
          const row = document.getElementById(id);
          if (row) {
            row.querySelector('.progress-fill').style.width = pct + '%';
            row.querySelector('.upload-pct').textContent = pct + '%';
          }
        }
      };
      xhr.onload = () => {
        if (xhr.status === 200) {
          try { resolve(JSON.parse(xhr.responseText)); } catch { resolve([]); }
        } else { reject(new Error('Upload failed')); }
      };
      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.send(formData);
    });
    promises.push(p);
  }

  try {
    const results = await Promise.all(promises);
    const newFiles = results.flat();
    // Merge, avoiding dupes
    for (const f of newFiles) {
      if (!state.files.find(x => x.id === f.id)) state.files.push(f);
    }
    renderUploadQueue();
    showToast(`Uploaded ${newFiles.length} file(s)`, 'success');
  } catch (err) {
    showToast('Upload failed: ' + err.message, 'error');
  }

  setTimeout(() => { progressArea.classList.add('hidden'); }, 1500);
}

async function startAnalyzeAll() {
  try {
    const res = await API.analyzeAll();
    showToast(`Queued ${res.queued} files for analysis`, 'success');
    if (res.queued > 0) {
      const bar = document.getElementById('analyze-progress');
      if (bar) bar.classList.remove('hidden');
      // Start polling
      if (state.analyzePolling) clearInterval(state.analyzePolling);
      state.analyzePolling = setInterval(pollAnalyzeStatus, 2000);
      pollAnalyzeStatus();
    }
  } catch { showToast('Failed to start analysis', 'error'); }
}

async function pollAnalyzeStatus() {
  try {
    const status = await API.analyzeStatus();
    state.analyzeProgress = status;
    const total = status.total || 1;
    const pct = Math.round((status.done + status.error) / total * 100);
    const textEl = document.getElementById('analyze-progress-text');
    const pctEl = document.getElementById('analyze-progress-pct');
    const fillEl = document.getElementById('analyze-progress-fill');
    if (textEl) textEl.textContent = `Analyzing ${status.analyzing} / ${total} files...`;
    if (pctEl) pctEl.textContent = pct + '%';
    if (fillEl) fillEl.style.width = pct + '%';

    // Refresh file list
    state.files = await API.getFiles();
    renderUploadQueue();

    if (status.analyzing === 0 && status.pending === 0) {
      clearInterval(state.analyzePolling);
      state.analyzePolling = null;
      const bar = document.getElementById('analyze-progress');
      if (bar) setTimeout(() => bar.classList.add('hidden'), 2000);
      showToast('Analysis complete!', 'success');
    }
  } catch {}
}

// --- Accordion field changes (delegated) ---
document.addEventListener('change', async (e) => {
  if (e.target.classList.contains('acc-field')) {
    const id = e.target.dataset.id;
    const field = e.target.dataset.field;
    const value = e.target.value;
    try {
      const updated = await API.updateFile(id, { [field]: value });
      const idx = state.files.findIndex(f => f.id === id);
      if (idx >= 0) state.files[idx] = updated;
      renderUploadQueue();
    } catch { showToast('Update failed', 'error'); }
  }
});

// --- PAGE 3: FILES ---
async function renderFiles() {
  const main = document.getElementById('main-content');
  try { state.files = await API.getFiles(); } catch {}

  main.innerHTML = `
    ${renderHeader('File Manager', 'Browse, preview, and manage your assets')}
    <div class="px-6 pb-8">
      <!-- Toolbar -->
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <div class="relative flex-1 min-w-[200px]">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
          <input type="text" id="files-search" class="field-input pl-10" placeholder="Search files..." value="${escHtml(state.filterQuery)}">
        </div>
        <div class="flex bg-surface-container-low rounded-lg overflow-hidden">
          <button class="files-view-btn px-3 py-2 text-sm ${state.viewMode === 'grid' ? 'bg-primary text-white' : 'text-on-surface-variant'}" data-mode="grid">
            <span class="material-symbols-outlined text-[18px]">grid_view</span>
          </button>
          <button class="files-view-btn px-3 py-2 text-sm ${state.viewMode === 'list' ? 'bg-primary text-white' : 'text-on-surface-variant'}" data-mode="list">
            <span class="material-symbols-outlined text-[18px]">view_list</span>
          </button>
        </div>
        <select id="files-sort" class="field-input w-auto">
          <option value="newest" ${state.sortBy === 'newest' ? 'selected' : ''}>Newest</option>
          <option value="oldest" ${state.sortBy === 'oldest' ? 'selected' : ''}>Oldest</option>
          <option value="name-az" ${state.sortBy === 'name-az' ? 'selected' : ''}>Name A→Z</option>
          <option value="name-za" ${state.sortBy === 'name-za' ? 'selected' : ''}>Name Z→A</option>
          <option value="status" ${state.sortBy === 'status' ? 'selected' : ''}>Status</option>
        </select>
        <a href="/download-all-zip" class="signature-gradient text-white text-xs font-semibold rounded-lg px-3 py-2 flex items-center gap-1 hover:opacity-90 transition-opacity no-underline">
          <span class="material-symbols-outlined text-[16px]">archive</span> Download All
        </a>
      </div>

      <!-- Stats bar -->
      <div id="files-stats" class="text-sm text-on-surface-variant mb-4"></div>

      <!-- Content -->
      <div id="files-content"></div>
    </div>

    <!-- Selection toolbar -->
    <div id="files-selection-toolbar" class="selection-toolbar glass-panel ambient-shadow rounded-xl px-5 py-3 flex items-center gap-4 hidden">
      <span class="text-sm font-semibold text-on-surface" id="files-sel-count">0 selected</span>
      <button onclick="downloadSelected()" class="text-sm font-medium text-primary hover:underline flex items-center gap-1">
        <span class="material-symbols-outlined text-[16px]">archive</span> Download ZIP
      </button>
      <button onclick="deleteSelected()" class="text-sm font-medium text-error hover:underline flex items-center gap-1">
        <span class="material-symbols-outlined text-[16px]">delete</span> Delete
      </button>
      <button onclick="state.selectedIds.clear(); renderFilesContent();" class="text-on-surface-variant hover:text-on-surface ml-auto">
        <span class="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>`;

  renderFilesContent();

  // Bind events
  document.getElementById('files-search').addEventListener('input', debounce((e) => {
    state.filterQuery = e.target.value;
    renderFilesContent();
  }, 200));

  document.querySelectorAll('.files-view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.viewMode = btn.dataset.mode;
      document.querySelectorAll('.files-view-btn').forEach(b => {
        b.classList.toggle('bg-primary', b.dataset.mode === state.viewMode);
        b.classList.toggle('text-white', b.dataset.mode === state.viewMode);
        b.classList.toggle('text-on-surface-variant', b.dataset.mode !== state.viewMode);
      });
      renderFilesContent();
    });
  });

  document.getElementById('files-sort').addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    renderFilesContent();
  });
}

function getFilteredSortedFiles() {
  let filtered = state.files;
  if (state.filterQuery) {
    const q = state.filterQuery.toLowerCase();
    filtered = filtered.filter(f =>
      (f.originalName || '').toLowerCase().includes(q) ||
      (f.proposedName || '').toLowerCase().includes(q)
    );
  }
  const sorted = [...filtered];
  switch (state.sortBy) {
    case 'newest': sorted.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)); break;
    case 'oldest': sorted.sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt)); break;
    case 'name-az': sorted.sort((a, b) => (a.originalName || '').localeCompare(b.originalName || '')); break;
    case 'name-za': sorted.sort((a, b) => (b.originalName || '').localeCompare(a.originalName || '')); break;
    case 'status': sorted.sort((a, b) => (a.analysisStatus || '').localeCompare(b.analysisStatus || '')); break;
  }
  return sorted;
}

function renderFilesContent() {
  const container = document.getElementById('files-content');
  const statsEl = document.getElementById('files-stats');
  if (!container) return;

  const files = getFilteredSortedFiles();
  const totalSize = files.reduce((s, f) => s + (f.size || 0), 0);
  const analyzedCount = files.filter(f => f.analysisStatus === 'done').length;
  if (statsEl) statsEl.textContent = `${files.length} files · ${analyzedCount} analyzed · ${formatBytes(totalSize)}`;

  if (files.length === 0) {
    container.innerHTML = `
      <div class="text-center py-16">
        <span class="material-symbols-outlined text-outline text-[48px] mb-3 block">inventory_2</span>
        <p class="text-on-surface-variant">No files found</p>
        <a href="#upload" class="text-primary text-sm font-medium mt-2 inline-block">Upload files</a>
      </div>`;
    updateSelectionToolbar();
    return;
  }

  if (state.viewMode === 'grid') {
    container.innerHTML = `<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      ${files.map((f, idx) => renderGridCard(f, idx)).join('')}
    </div>`;
  } else {
    container.innerHTML = `
      <table class="data-table w-full text-sm">
        <thead>
          <tr class="text-[11px] uppercase tracking-wider text-on-surface-variant">
            <th class="px-3 py-2 text-left"><input type="checkbox" id="files-select-all"></th>
            <th class="px-2 py-2 text-left">Thumb</th>
            <th class="px-2 py-2 text-left">Filename</th>
            <th class="px-2 py-2 text-left">Size</th>
            <th class="px-2 py-2 text-left">Status</th>
            <th class="px-2 py-2 text-left">Date</th>
            <th class="px-2 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${files.map((f, idx) => `
          <tr data-id="${f.id}" class="cursor-pointer ${state.selectedIds.has(f.id) ? 'bg-primary-fixed/30' : ''}" onclick="handleFileRowClick(event, '${f.id}', ${idx})">
            <td class="px-3 py-2"><input type="checkbox" ${state.selectedIds.has(f.id) ? 'checked' : ''} onclick="event.stopPropagation(); toggleFileSelect('${f.id}')"></td>
            <td class="px-2 py-2">${mkThumb(f)}</td>
            <td class="px-2 py-2 max-w-[200px] truncate">${escHtml(f.proposedName || f.originalName)}</td>
            <td class="px-2 py-2 text-on-surface-variant">${formatBytes(f.size)}</td>
            <td class="px-2 py-2">${statusChip(f.analysisStatus)}</td>
            <td class="px-2 py-2 text-on-surface-variant text-xs">${formatAgo(f.uploadedAt)}</td>
            <td class="px-2 py-2 flex gap-1">
              <button onclick="event.stopPropagation(); openLightbox('${f.id}')" class="p-1 hover:bg-surface-container rounded"><span class="material-symbols-outlined text-[18px]">visibility</span></button>
              <button onclick="event.stopPropagation(); window.open('/download-renamed/${f.id}')" class="p-1 hover:bg-surface-container rounded"><span class="material-symbols-outlined text-[18px]">download</span></button>
              <button onclick="event.stopPropagation(); deleteFile('${f.id}')" class="p-1 hover:bg-error-container rounded"><span class="material-symbols-outlined text-[18px] text-error">delete</span></button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>`;

    const selectAll = document.getElementById('files-select-all');
    if (selectAll) {
      selectAll.addEventListener('change', (e) => {
        files.forEach(f => {
          if (e.target.checked) state.selectedIds.add(f.id);
          else state.selectedIds.delete(f.id);
        });
        renderFilesContent();
      });
    }
  }

  updateSelectionToolbar();
}

function renderGridCard(f, idx) {
  const isSelected = state.selectedIds.has(f.id);
  const isVideo = f.mimeType && f.mimeType.startsWith('video/');
  const isImage = f.mimeType && f.mimeType.startsWith('image/');

  let thumb;
  if (isImage) {
    thumb = `<img src="/preview/${f.id}" class="w-full aspect-video object-cover" alt="">`;
  } else if (isVideo) {
    thumb = `<div class="w-full aspect-video bg-surface-container-high flex items-center justify-center relative">
      <span class="material-symbols-outlined text-primary text-[36px]">play_circle</span>
    </div>`;
  } else {
    thumb = `<div class="w-full aspect-video bg-surface-container-high flex items-center justify-center">
      <span class="material-symbols-outlined text-outline text-[36px]">draft</span>
    </div>`;
  }

  return `<div class="asset-card bg-surface-container-lowest rounded-lg overflow-hidden ambient-shadow ${isSelected ? 'selected' : ''}" data-id="${f.id}" onclick="handleFileCardClick(event, '${f.id}', ${idx})">
    <div class="relative">
      ${thumb}
      <!-- Checkbox -->
      <div class="absolute top-2 left-2">
        <input type="checkbox" ${isSelected ? 'checked' : ''} onclick="event.stopPropagation(); toggleFileSelect('${f.id}')" class="w-4 h-4 accent-primary">
      </div>
      ${isSelected ? '<div class="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"><span class="material-symbols-outlined text-white text-[14px]">check</span></div>' : ''}
      <!-- Hover overlay -->
      <div class="card-overlay absolute inset-0 flex items-center justify-center gap-2 rounded-t-lg">
        <button onclick="event.stopPropagation(); openLightbox('${f.id}')" class="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors">
          <span class="material-symbols-outlined text-primary text-[18px]">visibility</span>
        </button>
        <button onclick="event.stopPropagation(); window.open('/download-renamed/${f.id}')" class="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors">
          <span class="material-symbols-outlined text-primary text-[18px]">download</span>
        </button>
        <button onclick="event.stopPropagation(); deleteFile('${f.id}')" class="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors">
          <span class="material-symbols-outlined text-error text-[18px]">delete</span>
        </button>
      </div>
    </div>
    <div class="p-3">
      <p class="text-xs font-medium text-on-surface truncate">${escHtml(f.proposedName || f.originalName)}</p>
      <div class="flex items-center justify-between mt-1.5">
        <span class="text-[10px] text-on-surface-variant">${formatBytes(f.size)}</span>
        ${statusChip(f.analysisStatus)}
      </div>
    </div>
  </div>`;
}

function handleFileCardClick(event, id, idx) {
  if (event.target.closest('.card-overlay') || event.target.type === 'checkbox') return;

  if (event.shiftKey && state.lastSelectedIdx >= 0) {
    const files = getFilteredSortedFiles();
    const start = Math.min(state.lastSelectedIdx, idx);
    const end = Math.max(state.lastSelectedIdx, idx);
    for (let i = start; i <= end; i++) {
      if (files[i]) state.selectedIds.add(files[i].id);
    }
  } else {
    if (state.selectedIds.has(id)) state.selectedIds.delete(id);
    else state.selectedIds.add(id);
  }
  state.lastSelectedIdx = idx;
  renderFilesContent();
}

function handleFileRowClick(event, id, idx) {
  if (event.target.type === 'checkbox') return;
  handleFileCardClick(event, id, idx);
}

function toggleFileSelect(id) {
  if (state.selectedIds.has(id)) state.selectedIds.delete(id);
  else state.selectedIds.add(id);
  renderFilesContent();
}

function updateSelectionToolbar() {
  const toolbar = document.getElementById('files-selection-toolbar');
  if (!toolbar) return;
  if (state.selectedIds.size > 0) {
    toolbar.classList.remove('hidden');
    document.getElementById('files-sel-count').textContent = `${state.selectedIds.size} selected`;
  } else {
    toolbar.classList.add('hidden');
  }
}

function downloadSelected() {
  if (state.selectedIds.size === 0) return;
  window.open(`/download-selected-zip?ids=${[...state.selectedIds].join(',')}`, '_blank');
}

async function deleteSelected() {
  if (state.selectedIds.size === 0) return;
  if (!confirm(`Delete ${state.selectedIds.size} selected files?`)) return;
  await API.bulkDelete([...state.selectedIds]);
  state.files = state.files.filter(f => !state.selectedIds.has(f.id));
  state.selectedIds.clear();
  renderFilesContent();
  showToast('Files deleted', 'success');
}

// --- LIGHTBOX ---
function openLightbox(id) {
  const f = state.files.find(x => x.id === id);
  if (!f) return;
  const lb = document.getElementById('lightbox');
  const isVideo = f.mimeType && f.mimeType.startsWith('video/');
  const isImage = f.mimeType && f.mimeType.startsWith('image/');
  const fld = f.fields || {};

  lb.innerHTML = `
    <div class="lightbox-panel" onclick="event.stopPropagation()">
      <!-- Preview -->
      <div class="flex-1 bg-black flex items-center justify-center p-4 min-w-[300px]">
        ${isImage ? `<img src="/preview/${f.id}" class="max-h-[80vh] max-w-full object-contain rounded">` : ''}
        ${isVideo ? `<video src="/preview/${f.id}" controls class="max-h-[80vh] max-w-full rounded"></video>` : ''}
        ${!isImage && !isVideo ? `<span class="material-symbols-outlined text-white text-[64px]">draft</span>` : ''}
      </div>
      <!-- Right panel -->
      <div class="bg-surface-container-lowest p-6 w-80 overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-headline font-bold text-sm text-on-surface">File Details</h3>
          <button onclick="closeLightbox()" class="text-on-surface-variant hover:text-on-surface">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="mb-4">
          <label class="text-[10px] uppercase tracking-wider text-on-surface-variant block mb-1">Proposed Name</label>
          <input type="text" class="field-input text-primary font-medium" id="lb-proposed" value="${escHtml(f.proposedName || '')}" data-id="${f.id}">
        </div>
        <div class="grid grid-cols-1 gap-3 mb-6">
          <div><label class="text-[10px] uppercase tracking-wider text-on-surface-variant">Source</label>${mkSelect('source', state.settings.sources, fld.source, `lb-field" data-id="${f.id}`)}</div>
          <div><label class="text-[10px] uppercase tracking-wider text-on-surface-variant">Format</label>${mkSelect('format', FORMATS, fld.format, `lb-field" data-id="${f.id}`)}</div>
          <div><label class="text-[10px] uppercase tracking-wider text-on-surface-variant">Messaging</label>${mkSelect('messaging', MESSAGINGS, fld.messaging, `lb-field" data-id="${f.id}`)}</div>
          <div><label class="text-[10px] uppercase tracking-wider text-on-surface-variant">Hook</label>${mkSelect('hook', HOOKS, fld.hook, `lb-field" data-id="${f.id}`)}</div>
          <div><label class="text-[10px] uppercase tracking-wider text-on-surface-variant">Product</label>${mkSelect('product', state.settings.products, fld.product, `lb-field" data-id="${f.id}`)}</div>
          <div><label class="text-[10px] uppercase tracking-wider text-on-surface-variant">Talent</label>${mkSelect('talent', state.settings.talents, fld.talent, `lb-field" data-id="${f.id}`)}</div>
          <div><label class="text-[10px] uppercase tracking-wider text-on-surface-variant">Gender</label>${mkSelect('gender', GENDERS, fld.gender, `lb-field" data-id="${f.id}`)}</div>
          <div><label class="text-[10px] uppercase tracking-wider text-on-surface-variant">Age</label>${mkSelect('age', AGES, fld.age, `lb-field" data-id="${f.id}`)}</div>
          <div><label class="text-[10px] uppercase tracking-wider text-on-surface-variant">Length</label>${mkSelect('length', LENGTHS, fld.length, `lb-field" data-id="${f.id}`)}</div>
          <div><label class="text-[10px] uppercase tracking-wider text-on-surface-variant">Offer</label>${mkSelect('offer', OFFERS, fld.offer, `lb-field" data-id="${f.id}`)}</div>
          <div><label class="text-[10px] uppercase tracking-wider text-on-surface-variant">Landing Page</label>${mkSelect('lp', LPS, fld.lp, `lb-field" data-id="${f.id}`)}</div>
          <div><label class="text-[10px] uppercase tracking-wider text-on-surface-variant">Audio</label>${mkSelect('audio', AUDIOS, fld.audio, `lb-field" data-id="${f.id}`)}</div>
        </div>
        <button onclick="window.open('/download-renamed/${f.id}')" class="signature-gradient text-white text-sm font-semibold rounded-lg px-4 py-2.5 w-full flex items-center justify-center gap-2 hover:opacity-90 transition-opacity mb-3">
          <span class="material-symbols-outlined text-[18px]">download</span> Download Renamed
        </button>
        <button onclick="deleteFile('${f.id}'); closeLightbox();" class="text-sm font-medium text-error hover:underline w-full text-center">Delete File</button>
      </div>
    </div>`;

  lb.classList.remove('hidden');
  lb.onclick = (e) => { if (e.target === lb) closeLightbox(); };

  // Proposed name edit
  const proposedInput = document.getElementById('lb-proposed');
  if (proposedInput) {
    proposedInput.addEventListener('change', async () => {
      await API.updateFile(f.id, { proposedName: proposedInput.value });
      const idx = state.files.findIndex(x => x.id === f.id);
      if (idx >= 0) state.files[idx].proposedName = proposedInput.value;
    });
  }
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  lb.classList.add('hidden');
  lb.innerHTML = '';
}

// Lightbox field changes
document.addEventListener('change', async (e) => {
  if (e.target.classList.contains('lb-field')) {
    const id = e.target.dataset.id;
    const field = e.target.dataset.field;
    const value = e.target.value;
    try {
      const updated = await API.updateFile(id, { [field]: value });
      const idx = state.files.findIndex(f => f.id === id);
      if (idx >= 0) state.files[idx] = updated;
      // Update proposed name in lightbox
      const proposedInput = document.getElementById('lb-proposed');
      if (proposedInput && updated.proposedName) proposedInput.value = updated.proposedName;
    } catch { showToast('Update failed', 'error'); }
  }
});

// Escape key closes lightbox
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});

// --- PAGE 4: SETTINGS ---
async function renderSettings() {
  const main = document.getElementById('main-content');
  try { state.settings = await API.getSettings(); } catch {}
  const s = state.settings;

  const defaultSrc = s.defaultSource || '';
  const defaultProd = s.defaultProduct || '';
  const defaultTalent = s.defaultTalent || 'AI';
  const defaultPlatform = s.defaultPlatform || 'Meta';
  const defaultOffer = s.defaultOffer || 'o-None';
  const defaultLp = s.defaultLp || 'lp-pdp';

  // Live naming preview
  const preview = `example-asset_${defaultSrc}_as-Advertorial_m-tagline_h-talkinghead_${defaultProd}_i-${defaultTalent}_gen-Female_age-elders_len-30sec_${defaultOffer}_${defaultLp}_a-voiceover.mp4`;

  main.innerHTML = `
    ${renderHeader('Settings', 'Manage naming sources, products, talents, and defaults')}
    <div class="px-6 pb-8 max-w-3xl">
      <!-- Sources -->
      <div class="mb-8">
        <h3 class="text-[11px] uppercase tracking-wider font-semibold text-primary mb-3">Sources</h3>
        <div id="source-chips" class="flex flex-wrap gap-2 mb-3">
          ${(s.sources || []).map(src => `<span class="chip chip-pending">${escHtml(src)}<button class="ml-1 text-on-surface-variant hover:text-error" onclick="removeSetting('sources','${escHtml(src)}')">&times;</button></span>`).join('')}
        </div>
        <div class="flex gap-2">
          <input type="text" id="add-source-input" class="field-input flex-1" placeholder="Add source (e.g. s-name)">
          <button onclick="addSetting('sources','add-source-input')" class="signature-gradient text-white text-xs font-semibold rounded px-3 py-1.5">Add</button>
        </div>
      </div>

      <!-- Products -->
      <div class="mb-8">
        <h3 class="text-[11px] uppercase tracking-wider font-semibold text-primary mb-3">Products</h3>
        <div id="product-chips" class="flex flex-wrap gap-2 mb-3">
          ${(s.products || []).map(p => `<span class="chip chip-pending">${escHtml(p)}<button class="ml-1 text-on-surface-variant hover:text-error" onclick="removeSetting('products','${escHtml(p)}')">&times;</button></span>`).join('')}
        </div>
        <div class="flex gap-2">
          <input type="text" id="add-product-input" class="field-input flex-1" placeholder="Add product (e.g. p-name)">
          <button onclick="addSetting('products','add-product-input')" class="signature-gradient text-white text-xs font-semibold rounded px-3 py-1.5">Add</button>
        </div>
      </div>

      <!-- Talents -->
      <div class="mb-8">
        <h3 class="text-[11px] uppercase tracking-wider font-semibold text-primary mb-3">Talent Names</h3>
        <div id="talent-chips" class="flex flex-wrap gap-2 mb-3">
          ${(s.talents || []).map(t => `<span class="chip chip-pending">${escHtml(t)}<button class="ml-1 text-on-surface-variant hover:text-error" onclick="removeSetting('talents','${escHtml(t)}')">&times;</button></span>`).join('')}
        </div>
        <div class="flex gap-2">
          <input type="text" id="add-talent-input" class="field-input flex-1" placeholder="Add talent (e.g. AI)">
          <button onclick="addSetting('talents','add-talent-input')" class="signature-gradient text-white text-xs font-semibold rounded px-3 py-1.5">Add</button>
        </div>
      </div>

      <!-- Defaults -->
      <div class="mb-8">
        <h3 class="text-[11px] uppercase tracking-wider font-semibold text-primary mb-3">Default Values</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label class="text-[10px] uppercase tracking-wider text-on-surface-variant block mb-1">Default Source</label>
            ${mkSelect('defaultSource', s.sources || [], defaultSrc, 'settings-default')}
          </div>
          <div>
            <label class="text-[10px] uppercase tracking-wider text-on-surface-variant block mb-1">Default Product</label>
            ${mkSelect('defaultProduct', s.products || [], defaultProd, 'settings-default')}
          </div>
          <div>
            <label class="text-[10px] uppercase tracking-wider text-on-surface-variant block mb-1">Default Talent</label>
            ${mkSelect('defaultTalent', s.talents || ['AI','Ariel'], defaultTalent, 'settings-default')}
          </div>
          <div>
            <label class="text-[10px] uppercase tracking-wider text-on-surface-variant block mb-1">Default Platform</label>
            ${mkSelect('defaultPlatform', s.platforms || ['Meta','TikTok','YouTube','Native'], defaultPlatform, 'settings-default')}
          </div>
          <div>
            <label class="text-[10px] uppercase tracking-wider text-on-surface-variant block mb-1">Default Offer</label>
            ${mkSelect('defaultOffer', OFFERS, defaultOffer, 'settings-default')}
          </div>
          <div>
            <label class="text-[10px] uppercase tracking-wider text-on-surface-variant block mb-1">Default LP</label>
            ${mkSelect('defaultLp', LPS, defaultLp, 'settings-default')}
          </div>
        </div>
      </div>

      <!-- Naming Preview -->
      <div class="mb-8">
        <h3 class="text-[11px] uppercase tracking-wider font-semibold text-primary mb-3">Naming Convention Preview</h3>
        <div class="bg-surface-container-low rounded-lg p-4">
          <p class="text-[10px] text-on-surface-variant mb-2">basename_[source]_[format]_[messaging]_[hook]_[product]_[talent]_[gender]_[age]_[length]_[offer]_[lp]_[audio].ext</p>
          <p class="proposed-name text-xs break-all" id="naming-preview">${escHtml(preview)}</p>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="bg-surface-container-high rounded-lg p-5 border-l-4 border-tertiary">
        <h3 class="text-[11px] uppercase tracking-wider font-semibold text-tertiary mb-3">Danger Zone</h3>
        <div class="flex flex-wrap gap-3">
          <button onclick="resetSettings()" class="text-sm font-medium text-tertiary border border-tertiary/30 rounded-lg px-4 py-2 hover:bg-tertiary/5 transition-colors">
            Reset to Defaults
          </button>
          <button onclick="clearAllUploads()" class="text-sm font-medium text-error border border-error/30 rounded-lg px-4 py-2 hover:bg-error/5 transition-colors">
            Clear All Uploads
          </button>
        </div>
      </div>
    </div>`;

  // Bind default change events
  document.querySelectorAll('.settings-default').forEach(el => {
    el.addEventListener('change', async () => {
      state.settings[el.dataset.field] = el.value;
      await API.saveSettings(state.settings);
      showToast('Defaults saved', 'success');
      updateNamingPreview();
    });
  });
}

function updateNamingPreview() {
  const el = document.getElementById('naming-preview');
  if (!el) return;
  const s = state.settings;
  const preview = `example-asset_${s.defaultSource || ''}_as-Advertorial_m-tagline_h-talkinghead_${s.defaultProduct || ''}_i-${s.defaultTalent || 'AI'}_gen-Female_age-elders_len-30sec_${s.defaultOffer || 'o-None'}_${s.defaultLp || 'lp-pdp'}_a-voiceover.mp4`;
  el.textContent = preview;
}

async function addSetting(key, inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;
  if (!state.settings[key]) state.settings[key] = [];
  if (state.settings[key].includes(val)) { showToast('Already exists', 'error'); return; }
  state.settings[key].push(val);
  await API.saveSettings(state.settings);
  showToast('Added', 'success');
  renderSettings();
}

async function removeSetting(key, val) {
  state.settings[key] = (state.settings[key] || []).filter(x => x !== val);
  await API.saveSettings(state.settings);
  showToast('Removed', 'success');
  renderSettings();
}

async function resetSettings() {
  if (!confirm('Reset all settings to defaults?')) return;
  state.settings = {
    sources: ['s-ariel','s-a-teamwork','s-data-grande','s-creativeagency1','s-creativeagency2'],
    products: ['p-medicare-english','p-medicare-spanish','p-aca-english','p-aca-spanish'],
    talents: ['AI','Ariel'],
    platforms: ['Meta','TikTok','YouTube','Native'],
    defaultSource: 's-ariel', defaultProduct: 'p-medicare-english',
    defaultTalent: 'AI', defaultPlatform: 'Meta',
    defaultOffer: 'o-None', defaultLp: 'lp-pdp'
  };
  await API.saveSettings(state.settings);
  showToast('Settings reset', 'success');
  renderSettings();
}

async function clearAllUploads() {
  if (!confirm('Delete ALL uploaded files? This cannot be undone.')) return;
  const ids = state.files.map(f => f.id);
  await API.bulkDelete(ids);
  state.files = [];
  state.selectedIds.clear();
  showToast('All uploads cleared', 'success');
  renderSettings();
}
