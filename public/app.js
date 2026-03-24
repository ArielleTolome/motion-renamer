const API = '';

// State
let files = [];
let settings = {};
let analysisPollInterval = null;

// Glossary options
const GLOSSARY = {
  format: ['Advertorial', 'UGCMashup', 'Unboxing', 'podcast', 'StreetInterview', 'BeforeAfter'],
  messaging: ['FOMO', 'tagline', 'benefit1', 'founderstory', 'problemsolution'],
  hook: ['3reasonswhy', 'whynottobuy', 'productdemonstration', 'commentbubble', 'talkinghead', 'problem', 'offer', 'shocking', 'taboo'],
  gender: ['Male', 'Female', 'No Gender'],
  length: ['IMG', '03sec', '06sec', '10sec', '15sec', '30sec', '60sec', '90sec', '120sec'],
  offer: ['o-None', 'o-Percentage Off', 'o-Dollar Off', 'o-BOGO'],
  lp: ['lp-home', 'lp-collection', 'lp-pdp', 'lp-blog', 'lp-customoffer'],
  audio: ['music', 'voiceover', 'trendingsound', 'none']
};

// DOM refs
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// Init
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupDropZone();
  setupSettings();
  setupViewToggle();
  loadFiles();
  loadSettings();
});

// Tabs
function setupTabs() {
  $$('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.nav-tab').forEach(t => t.classList.remove('active'));
      $$('.tab-content').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      $(`#tab-${tab.dataset.tab}`).classList.add('active');
      if (tab.dataset.tab === 'table' || tab.dataset.tab === 'files') loadFiles();
    });
  });
}

function updateTabBadges() {
  const counts = { upload: files.length, table: files.length, files: files.length };
  $$('.nav-tab').forEach(tab => {
    const key = tab.dataset.tab;
    const badge = tab.querySelector('.tab-badge');
    if (badge) badge.remove();
    if (counts[key] > 0) {
      const span = document.createElement('span');
      span.className = 'tab-badge';
      span.textContent = counts[key];
      tab.appendChild(span);
    }
  });
}

// Drop Zone
function setupDropZone() {
  const zone = $('#dropZone');
  const input = $('#fileInput');
  const browseBtn = $('#browseBtn');

  browseBtn.addEventListener('click', (e) => { e.stopPropagation(); input.click(); });
  zone.addEventListener('click', () => input.click());

  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });

  input.addEventListener('change', () => { handleFiles(input.files); input.value = ''; });

  $('#analyzeAllBtn').addEventListener('click', analyzeAll);
  $('#clearAllBtn').addEventListener('click', clearAll);
}

async function handleFiles(fileList) {
  if (!fileList.length) return;
  const formData = new FormData();
  for (const f of fileList) formData.append('files', f);

  try {
    const res = await fetch(`${API}/upload`, { method: 'POST', body: formData });
    const uploaded = await res.json();
    files = [...files, ...uploaded];
    renderUploadList();
    updateTabBadges();
    $('#uploadActions').style.display = 'flex';
  } catch (err) {
    console.error('Upload failed:', err);
  }
}

function renderUploadList() {
  const list = $('#uploadList');
  list.innerHTML = files.map(f => `
    <div class="upload-item" data-id="${f.id}">
      <span class="upload-item-type">${f.mimeType.split('/')[0]}</span>
      <span class="upload-item-name">${f.originalName}</span>
      <span class="upload-item-size">${formatSize(f.size)}</span>
      <span class="status-chip status-${f.analysisStatus}">
        ${f.analysisStatus === 'analyzing' ? '<span class="spinner"></span>' : ''}
        ${f.analysisStatus}
      </span>
      ${f.analysisStatus === 'error' || f.analysisStatus === 'done' ? `<button class="btn btn-sm btn-ghost" onclick="analyzeSingle('${f.id}')">Re-analyze</button>` : ''}
      ${f.analysisStatus === 'pending' ? `<button class="btn btn-sm btn-ghost" onclick="analyzeSingle('${f.id}')">Analyze</button>` : ''}
    </div>
  `).join('');

  if (files.length > 0) {
    $('#uploadActions').style.display = 'flex';
  }
}

async function analyzeSingle(id) {
  const file = files.find(f => f.id === id);
  if (!file) return;
  file.analysisStatus = 'analyzing';
  renderUploadList();

  try {
    const res = await fetch(`${API}/analyze/${id}`, { method: 'POST' });
    const updated = await res.json();
    const idx = files.findIndex(f => f.id === id);
    if (idx !== -1) files[idx] = updated.sidecar || updated;
  } catch (err) {
    const idx = files.findIndex(f => f.id === id);
    if (idx !== -1) files[idx].analysisStatus = 'error';
  }
  renderUploadList();
  updateTabBadges();
}

async function analyzeAll() {
  try {
    const res = await fetch(`${API}/analyze-all`, { method: 'POST' });
    const data = await res.json();
    for (const id of data.ids) {
      const f = files.find(x => x.id === id);
      if (f) f.analysisStatus = 'analyzing';
    }
    renderUploadList();
    if (data.queued > 0) startAnalysisPoll();
  } catch (err) {
    console.error('Analyze all failed:', err);
  }
}

function startAnalysisPoll() {
  if (analysisPollInterval) clearInterval(analysisPollInterval);
  showProgressBar();
  analysisPollInterval = setInterval(async () => {
    try {
      const statusRes = await fetch(`${API}/analyze-status`);
      const status = await statusRes.json();
      updateProgressBar(status);
      // Also refresh file list to update chips
      await loadFiles();
      if (status.analyzing === 0 && status.pending === 0) {
        clearInterval(analysisPollInterval);
        analysisPollInterval = null;
        hideProgressBar();
      }
    } catch (err) {
      console.error('Poll failed:', err);
    }
  }, 2000);
}

function showProgressBar() {
  let bar = $('#analysisProgress');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'analysisProgress';
    bar.className = 'analysis-progress';
    bar.innerHTML = '<div class="progress-track"><div class="progress-fill"></div></div><span class="progress-text"></span>';
    $('#uploadActions').after(bar);
  }
  bar.style.display = 'flex';
}

function updateProgressBar(status) {
  const bar = $('#analysisProgress');
  if (!bar) return;
  const pct = status.total > 0 ? ((status.done + status.error) / status.total * 100) : 0;
  bar.querySelector('.progress-fill').style.width = `${pct}%`;
  bar.querySelector('.progress-text').textContent = `${status.done + status.error}/${status.total} complete (${status.analyzing} analyzing, ${status.pending} pending${status.error > 0 ? `, ${status.error} errors` : ''})`;
}

function hideProgressBar() {
  const bar = $('#analysisProgress');
  if (bar) bar.style.display = 'none';
}

async function clearAll() {
  if (!confirm('Delete ALL files? This cannot be undone.')) return;
  for (const f of [...files]) {
    try {
      await fetch(`${API}/files/${f.id}`, { method: 'DELETE' });
    } catch {}
  }
  files = [];
  renderUploadList();
  renderTable();
  renderFilesGrid();
  updateTabBadges();
  $('#uploadActions').style.display = 'none';
}

// Load files from server
async function loadFiles() {
  try {
    const res = await fetch(`${API}/files`);
    files = await res.json();
    renderUploadList();
    renderTable();
    renderFilesGrid();
    updateTabBadges();
  } catch (err) {
    console.error('Failed to load files:', err);
  }
}

// Table
function renderTable() {
  const search = ($('#tableSearch')?.value || '').toLowerCase();
  const tbody = $('#tableBody');
  const filtered = files.filter(f =>
    f.originalName.toLowerCase().includes(search) ||
    (f.proposedName || '').toLowerCase().includes(search)
  );

  tbody.innerHTML = filtered.map((f, i) => {
    const fld = f.fields || {};
    return `<tr data-id="${f.id}">
      <td>${i + 1}</td>
      <td>${previewThumb(f)}</td>
      <td title="${f.originalName}" style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f.originalName}</td>
      <td>${fieldSelect(f.id, 'source', settings.sources || [], fld.source)}</td>
      <td>${fieldSelect(f.id, 'format', GLOSSARY.format, fld.format)}</td>
      <td>${fieldSelect(f.id, 'messaging', GLOSSARY.messaging, fld.messaging)}</td>
      <td>${fieldSelect(f.id, 'hook', GLOSSARY.hook, fld.hook)}</td>
      <td>${fieldSelect(f.id, 'product', settings.products || [], fld.product)}</td>
      <td><input class="proposed-name-input" style="width:70px" value="${fld.talent || ''}" onchange="updateField('${f.id}','talent',this.value)"></td>
      <td>${fieldSelect(f.id, 'gender', GLOSSARY.gender, fld.gender)}</td>
      <td>${fieldSelect(f.id, 'length', GLOSSARY.length, fld.length)}</td>
      <td>${fieldSelect(f.id, 'offer', GLOSSARY.offer, fld.offer)}</td>
      <td>${fieldSelect(f.id, 'lp', GLOSSARY.lp, fld.lp)}</td>
      <td>${fieldSelect(f.id, 'audio', GLOSSARY.audio, fld.audio)}</td>
      <td>
        <span class="proposed-name copyable" title="${f.proposedName || 'Pending analysis'}" onclick="copyProposedName(this, '${f.id}')">${f.proposedName || '—'}</span>
      </td>
      <td class="table-actions">
        ${f.analysisStatus === 'error' || f.analysisStatus === 'done' ? `<button class="btn btn-sm btn-ghost" onclick="analyzeSingle('${f.id}')" title="Re-analyze">🔄</button>` : ''}
        ${f.proposedName ? `<button class="btn btn-sm btn-primary" onclick="downloadRenamed('${f.id}')">⬇</button>` : ''}
        <button class="btn btn-sm btn-danger" onclick="deleteFile('${f.id}')">🗑</button>
      </td>
    </tr>`;
  }).join('');

  $('#tableSearch')?.removeEventListener('input', renderTable);
  $('#tableSearch')?.addEventListener('input', renderTable);
  $('#downloadAllBtn')?.removeEventListener('click', downloadAllZip);
  $('#downloadAllBtn')?.addEventListener('click', downloadAllZip);
}

function previewThumb(f) {
  const src = `${API}/uploads/${encodeURIComponent(f.storedFilename)}`;
  if (f.mimeType.startsWith('image/')) {
    return `<img class="table-preview" src="${src}" alt="">`;
  } else if (f.mimeType.startsWith('video/')) {
    return `<video class="table-preview video-thumb" src="${src}" muted preload="metadata" data-thumb="true"></video>`;
  }
  return '<div class="table-preview"></div>';
}

function fieldSelect(id, field, options, current) {
  const opts = options.map(o => `<option value="${o}" ${o === current ? 'selected' : ''}>${o}</option>`).join('');
  return `<select class="field-select" onchange="updateField('${id}','${field}',this.value)">
    <option value="">—</option>${opts}
  </select>`;
}

async function updateField(id, field, value) {
  try {
    const res = await fetch(`${API}/update/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value })
    });
    const updated = await res.json();
    const idx = files.findIndex(f => f.id === id);
    if (idx !== -1) files[idx] = updated;
    renderTable();
  } catch (err) {
    console.error('Update failed:', err);
  }
}

function editProposedName(el, id) {
  const file = files.find(f => f.id === id);
  if (!file) return;
  const input = document.createElement('input');
  input.className = 'proposed-name-input';
  input.value = file.proposedName || '';
  input.style.width = '200px';
  el.replaceWith(input);
  input.focus();
  input.addEventListener('blur', async () => {
    await fetch(`${API}/update/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposedName: input.value })
    });
    await loadFiles();
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
}

function copyProposedName(el, id) {
  const file = files.find(f => f.id === id);
  if (!file?.proposedName) return;
  navigator.clipboard.writeText(file.proposedName);
  showToast('Copied!');
}

function copyName(id) {
  const file = files.find(f => f.id === id);
  if (file?.proposedName) {
    navigator.clipboard.writeText(file.proposedName);
    showToast('Copied!');
  }
}

function showToast(message) {
  let toast = $('#toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

function downloadRenamed(id) {
  window.open(`${API}/download-renamed/${id}`, '_blank');
}

function downloadAllZip() {
  window.open(`${API}/download-all-zip`, '_blank');
}

async function deleteFile(id) {
  if (!confirm('Delete this file?')) return;
  await fetch(`${API}/files/${id}`, { method: 'DELETE' });
  files = files.filter(f => f.id !== id);
  renderUploadList();
  renderTable();
  renderFilesGrid();
  updateTabBadges();
}

// Files Grid
function renderFilesGrid() {
  const search = ($('#filesSearch')?.value || '').toLowerCase();
  const grid = $('#filesGrid');
  const filtered = files.filter(f =>
    f.originalName.toLowerCase().includes(search) ||
    (f.proposedName || '').toLowerCase().includes(search)
  );

  grid.innerHTML = filtered.map(f => {
    const src = `${API}/uploads/${encodeURIComponent(f.storedFilename)}`;
    let thumb;
    if (f.mimeType.startsWith('image/')) {
      thumb = `<img class="file-card-thumb" src="${src}" alt="">`;
    } else if (f.mimeType.startsWith('video/')) {
      thumb = `<video class="file-card-thumb video-thumb" src="${src}" muted preload="metadata" data-thumb="true"></video>`;
    } else {
      thumb = `<div class="file-card-thumb file-card-thumb-placeholder">📄</div>`;
    }
    return `<div class="file-card" onclick="openLightbox('${f.id}')">
      ${thumb}
      <div class="file-card-info">
        <div class="file-card-name">${f.proposedName || f.originalName}</div>
        <div class="file-card-meta">${formatSize(f.size)} · ${new Date(f.uploadedAt).toLocaleDateString()}</div>
      </div>
      <div class="file-card-overlay">
        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation();downloadRenamed('${f.id}')">⬇ Download</button>
        <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deleteFile('${f.id}')">🗑 Delete</button>
      </div>
    </div>`;
  }).join('');

  // Generate video thumbnails
  requestAnimationFrame(() => generateVideoThumbnails());

  $('#filesSearch')?.removeEventListener('input', renderFilesGrid);
  $('#filesSearch')?.addEventListener('input', renderFilesGrid);
}

function generateVideoThumbnails() {
  document.querySelectorAll('video[data-thumb="true"]').forEach(video => {
    video.removeAttribute('data-thumb');
    video.addEventListener('loadeddata', function() {
      try {
        this.currentTime = 1;
      } catch {}
    });
    video.addEventListener('seeked', function() {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = this.videoWidth || 320;
        canvas.height = this.videoHeight || 180;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(this, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        const img = document.createElement('img');
        img.src = dataUrl;
        img.className = this.className;
        img.alt = 'Video thumbnail';
        if (this.parentNode) {
          this.parentNode.replaceChild(img, this);
        }
      } catch {
        // Fallback: keep video element as-is
      }
    });
  });
}

function setupViewToggle() {
  $$('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const grid = $('#filesGrid');
      if (btn.dataset.view === 'list') {
        grid.classList.add('list-view');
      } else {
        grid.classList.remove('list-view');
      }
    });
  });
}

// Lightbox
function openLightbox(id) {
  const file = files.find(f => f.id === id);
  if (!file) return;

  const modal = $('#lightboxModal');
  const preview = $('#lightboxPreview');
  const info = $('#lightboxInfo');
  const src = `${API}/preview/${file.id}`;

  $('#lightboxTitle').textContent = file.originalName;

  if (file.mimeType.startsWith('image/')) {
    preview.innerHTML = `<img src="${src}" alt="">`;
  } else if (file.mimeType.startsWith('video/')) {
    preview.innerHTML = `<video src="${src}" controls style="max-width:100%;max-height:50vh"></video>`;
  }

  const fld = file.fields || {};
  info.innerHTML = `
    <div class="lightbox-field"><span>Original:</span> ${file.originalName}</div>
    <div class="lightbox-field"><span>Proposed:</span> ${file.proposedName || '—'}</div>
    <div class="lightbox-field"><span>Format:</span> ${fld.format || '—'}</div>
    <div class="lightbox-field"><span>Messaging:</span> ${fld.messaging || '—'}</div>
    <div class="lightbox-field"><span>Hook:</span> ${fld.hook || '—'}</div>
    <div class="lightbox-field"><span>Gender:</span> ${fld.gender || '—'}</div>
    <div class="lightbox-field"><span>Length:</span> ${fld.length || '—'}</div>
    <div class="lightbox-field"><span>Audio:</span> ${fld.audio || '—'}</div>
    <div class="lightbox-field"><span>Source:</span> ${fld.source || '—'}</div>
    <div class="lightbox-field"><span>Product:</span> ${fld.product || '—'}</div>
  `;

  $('#lightboxDownload').onclick = () => downloadRenamed(id);

  modal.classList.add('open');
  $('#closeLightbox').onclick = () => modal.classList.remove('open');
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });
}

// Settings
function setupSettings() {
  $('#settingsBtn').addEventListener('click', () => {
    loadSettings();
    $('#settingsModal').classList.add('open');
  });
  $('#closeSettings').addEventListener('click', () => $('#settingsModal').classList.remove('open'));
  $('#settingsModal').addEventListener('click', (e) => {
    if (e.target === $('#settingsModal')) $('#settingsModal').classList.remove('open');
  });

  $('#addSourceBtn').addEventListener('click', () => {
    const val = $('#newSource').value.trim();
    if (val && !settings.sources.includes(val)) {
      settings.sources.push(val);
      renderSettingsChips();
      $('#newSource').value = '';
    }
  });

  $('#addProductBtn').addEventListener('click', () => {
    const val = $('#newProduct').value.trim();
    if (val && !settings.products.includes(val)) {
      settings.products.push(val);
      renderSettingsChips();
      $('#newProduct').value = '';
    }
  });

  $('#saveSettingsBtn').addEventListener('click', saveSettingsToServer);
}

async function loadSettings() {
  try {
    const res = await fetch(`${API}/settings`);
    settings = await res.json();
    renderSettingsChips();
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

function renderSettingsChips() {
  const sc = $('#sourceChips');
  sc.innerHTML = (settings.sources || []).map(s =>
    `<span class="chip">${s}<button class="chip-x" onclick="removeSource('${s}')">&times;</button></span>`
  ).join('');

  const pc = $('#productChips');
  pc.innerHTML = (settings.products || []).map(p =>
    `<span class="chip">${p}<button class="chip-x" onclick="removeProduct('${p}')">&times;</button></span>`
  ).join('');

  const ds = $('#defaultSource');
  ds.innerHTML = (settings.sources || []).map(s =>
    `<option value="${s}" ${s === settings.defaultSource ? 'selected' : ''}>${s}</option>`
  ).join('');

  const dp = $('#defaultProduct');
  dp.innerHTML = (settings.products || []).map(p =>
    `<option value="${p}" ${p === settings.defaultProduct ? 'selected' : ''}>${p}</option>`
  ).join('');
}

function removeSource(s) {
  settings.sources = settings.sources.filter(x => x !== s);
  renderSettingsChips();
}

function removeProduct(p) {
  settings.products = settings.products.filter(x => x !== p);
  renderSettingsChips();
}

async function saveSettingsToServer() {
  settings.defaultSource = $('#defaultSource').value;
  settings.defaultProduct = $('#defaultProduct').value;
  try {
    await fetch(`${API}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    $('#settingsModal').classList.remove('open');
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

// Helpers
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}
