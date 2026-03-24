# Motion Renamer — HANDOFF.md
_Last updated: Wave 2 redesign_

## Project Overview
**App name:** Precision Curator  
**Tagline:** Asset Management  
**Purpose:** Drag-and-drop creative file renamer for MotionApp naming convention compatibility.  
**Stack:** Express.js backend (port 3210), Vanilla JS SPA frontend, Gemini CLI for AI analysis.  
**Repo:** https://github.com/ArielleTolome/motion-renamer  
**Live URL:** http://localhost:3210 (Tailscale: http://100.108.195.97:3210)

---

## Directory Structure
```
motion-renamer/
├── server.js              # Express backend
├── package.json
├── public/
│   ├── index.html         # SPA shell
│   ├── style.css          # Custom styles
│   └── app.js             # SPA router + all page logic
├── uploads/               # Raw uploaded files (UUID||originalname)
├── renamed/               # Renamed file copies for download
├── settings.json          # Persisted settings
├── design-ref/stitch/     # Stitch design reference HTMLs
│   ├── archivist_pro/DESIGN.md
│   ├── dashboard/code.html
│   ├── upload_renamer/code.html
│   ├── file_manager/code.html
│   └── naming_settings/code.html
└── HANDOFF.md
```

---

## Design System (MUST FOLLOW EXACTLY)

Based on: `design-ref/stitch/archivist_pro/DESIGN.md`

### Colors (Tailwind custom tokens)
```js
"primary": "#073370"
"primary-container": "#284a88"
"surface": "#f8f9fa"
"surface-container-low": "#f3f4f5"
"surface-container": "#edeeef"
"surface-container-high": "#e7e8e9"
"surface-container-highest": "#e1e3e4"
"surface-container-lowest": "#ffffff"
"on-surface": "#191c1d"
"on-surface-variant": "#434652"
"outline": "#737783"
"outline-variant": "#c3c6d4"
"secondary-container": "#cbe7f5"
"on-secondary-container": "#4e6874"
"error": "#ba1a1a"
"error-container": "#ffdad6"
"tertiary": "#6f002c"
"tertiary-container": "#99003f"
"on-tertiary-container": "#ffa2b4"
"secondary": "#48626e"
```

### Typography
- **Headlines/Display:** Manrope (font-headline) — weights 700, 800
- **Body/Data/Labels:** Inter (font-body, font-label) — weights 400, 500, 600, 700
- **Metadata headers:** `text-[11px] uppercase tracking-[0.05rem] font-semibold`
- Load from Google Fonts CDN

### Icons
- Material Symbols Outlined from Google CDN
- `font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24`
- Use `style="font-variation-settings: 'FILL' 1;"` for filled variant

### Design Rules (NO EXCEPTIONS)
1. **NO 1px borders** between sections — use background color shifts only
2. **Signature gradient CTA:** `linear-gradient(135deg, #073370 0%, #284a88 100%)`
3. **Ghost border fallback:** `outline-variant` at 15% opacity max
4. **Ambient shadow:** `0px 12px 32px rgba(7, 51, 112, 0.08)`
5. **Border radius:** 0.125rem default, 0.25rem for cards (NO large rounding except status chips)
6. **No pure black** — always use `on-surface` (#191c1d) for text
7. **Surface tonal layering** for depth (lowest=white, low=f3f4f5, default=edeeef, high=e7e8e9, highest=e1e3e4)

### Tailwind Config (copy this block exactly into index.html)
```js
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "on-background": "#191c1d", "outline": "#737783", "inverse-surface": "#2e3132",
        "surface-tint": "#3c5d9c", "surface": "#f8f9fa", "secondary-container": "#cbe7f5",
        "surface-variant": "#e1e3e4", "on-error": "#ffffff", "inverse-primary": "#aec6ff",
        "primary-container": "#284a88", "surface-container": "#edeeef",
        "on-secondary-container": "#4e6874", "secondary": "#48626e",
        "on-surface-variant": "#434652", "surface-container-lowest": "#ffffff",
        "error": "#ba1a1a", "surface-container-high": "#e7e8e9", "primary": "#073370",
        "outline-variant": "#c3c6d4", "secondary-fixed": "#cbe7f5", "on-surface": "#191c1d",
        "tertiary-container": "#99003f", "primary-fixed": "#d8e2ff", "tertiary": "#6f002c",
        "on-tertiary-container": "#ffa2b4", "error-container": "#ffdad6",
        "background": "#f8f9fa", "on-tertiary": "#ffffff",
        "surface-container-highest": "#e1e3e4", "surface-dim": "#d9dadb",
        "surface-container-low": "#f3f4f5", "primary-fixed-dim": "#aec6ff",
        "on-primary-container": "#9ebcff", "on-primary": "#ffffff",
        "on-secondary": "#ffffff", "on-error-container": "#93000a",
      },
      fontFamily: { "headline": ["Manrope"], "body": ["Inter"], "label": ["Inter"] },
      borderRadius: {"DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem"},
    },
  },
}
```

---

## Naming Convention (from Excel analysis)

**Separator:** underscore `_`  
**Field order:** `basename_source_format_messaging_hook_product_talent_gender_age_length_offer_lp_audio`

### Glossary
| Field | Prefix | Values |
|-------|--------|--------|
| Source | s- | s-ariel, s-a-teamwork, s-data-grande, s-creativeagency1, s-creativeagency2, s-internal, s-creator |
| Format/Concept | as- | as-Advertorial, as-UGCMashup, as-Unboxing, as-podcast, as-StreetInterview, as-BeforeAfter |
| Messaging | m- | m-FOMO, m-tagline, m-benefit1, m-founderstory, m-problemsolution |
| Hook | h- | h-3reasonswhy, h-whynottobuy, h-productdemonstration, h-commentbubble, h-talkinghead, h-problem, h-offer, h-shocking, h-taboo |
| Product | p- | p-medicare-english, p-medicare-spanish, p-aca-english, p-aca-spanish |
| Talent | t- | AI, Ariel |
| Gender | gen- | gen-Male, gen-Female, gen-No Gender |
| Age | age- | age-kids, age-teens, age-middleage, age-elders, age-No Generation |
| Length | len- | len-IMG, len-03sec, len-06sec, len-10sec, len-15sec, len-30sec, len-60sec, len-90sec, len-120sec |
| Offer | o- | o-None, o-Percentage Off, o-Dollar Off, o-BOGO |
| Landing Page | lp- | lp-home, lp-collection, lp-pdp, lp-customoffer, lp-blog |
| Audio | a- | a-music, a-voiceover, a-trendingsound, a-none |

**Example filename:**  
`ugc-compare-v1_s-internal_as-UGCMashup_m-problemsolution_h-talkinghead_p-medicare_gen-Female_age-elders_len-30sec_o-None_lp-pdp_a-voiceover.mp4`

---

## Backend (server.js) — Required Changes

### CRITICAL: UUID Bug Fix
Current code uses `${id}-${file.originalname}` — UUIDs have hyphens so `split('-')[0]` is broken.

**Fix:**
```js
// multer storage filename:
filename: (req, file, cb) => {
  const id = uuidv4();
  cb(null, `${id}||${file.originalname}`);
}

// findFileById:
function findFileById(id) {
  const files = fs.readdirSync(UPLOADS_DIR);
  const match = files.find(f => f.startsWith(id + '||') && !f.endsWith('.json'));
  return match ? path.join(UPLOADS_DIR, match) : null;
}

// In POST /upload, extract id:
const id = f.filename.split('||')[0];
```

### New Endpoints Required
```
GET  /health             → { status:'ok', version:'0.2.0', uptime, fileCount }
GET  /stats              → { totalFiles, analyzed, pending, totalSize }
GET  /analyze-status     → { total, done, analyzing, pending, error }
GET  /preview/:id        → serve file inline (no attachment header)
GET  /files/:id          → single file sidecar JSON
DELETE /files/:id        → delete file + sidecar
DELETE /files/bulk       → body: { ids: [...] }, batch delete
GET  /download-selected-zip?ids=id1,id2  → ZIP of renamed files
POST /settings           → also accepts { talents, defaultTalent, platforms, defaultPlatform }
```

### Updated DEFAULT_SETTINGS
```js
const DEFAULT_SETTINGS = {
  sources: ['s-ariel', 's-a-teamwork', 's-data-grande', 's-creativeagency1', 's-creativeagency2'],
  products: ['p-medicare-english', 'p-medicare-spanish', 'p-aca-english', 'p-aca-spanish'],
  talents: ['AI', 'Ariel'],
  platforms: ['Meta', 'TikTok', 'YouTube', 'Native'],
  defaultSource: 's-ariel',
  defaultProduct: 'p-medicare-english',
  defaultTalent: 'AI',
  defaultPlatform: 'Meta',
  defaultOffer: 'o-None',
  defaultLp: 'lp-pdp',
};
```

### Concurrency Limiter (max 3 Gemini at once)
```js
let activeAnalyses = 0;
const MAX_CONCURRENT = 3;
const analysisQueue = [];
async function runWithLimit(fn) {
  if (activeAnalyses >= MAX_CONCURRENT) {
    await new Promise(resolve => analysisQueue.push(resolve));
  }
  activeAnalyses++;
  try { return await fn(); }
  finally {
    activeAnalyses--;
    if (analysisQueue.length > 0) analysisQueue.shift()();
  }
}
```

### File Validation
```js
const ALLOWED_TYPES = [
  'image/jpeg','image/png','image/gif','image/webp','image/avif',
  'video/mp4','video/quicktime','video/avi','video/webm',
  'video/x-matroska','video/x-m4v'
];
// 500MB limit in multer limits: { fileSize: 500 * 1024 * 1024 }
```

### Filename Sanitization
```js
// In buildProposedName, before returning:
return parts.join('_').replace(/[\/\\:*?"<>|]/g, '-') + ext;
```

---

## Frontend Architecture

### Files
- `public/index.html` — SPA shell (sidebar + content area)
- `public/style.css` — custom CSS (gradients, glass, chips, lightbox, etc.)
- `public/app.js` — router + all 4 page renderers + API calls + state

### SPA Router
```js
const routes = {
  '#dashboard': renderDashboard,
  '#upload': renderUpload,
  '#files': renderFiles,
  '#settings': renderSettings,
};
window.addEventListener('hashchange', route);
function route() {
  const hash = window.location.hash || '#dashboard';
  const renderer = routes[hash] || renderDashboard;
  renderer();
}
```

### State
```js
const state = {
  files: [],
  settings: {},
  selectedIds: new Set(),
  lastSelectedIndex: -1,
  campaign: {
    source: '', product: '', offer: 'o-None',
    lp: 'lp-pdp', talent: 'AI', platform: 'Meta', batchName: ''
  },
  analyzeProgress: { total:0, done:0, analyzing:0, pending:0, error:0 },
  analyzePolling: null,
  viewMode: 'grid', // 'grid' | 'list'
  sortBy: 'newest',
  filterQuery: '',
};
```

---

## Page Specs

### Page 1: Dashboard (#dashboard)
Reference: `design-ref/stitch/dashboard/code.html`

Layout:
- 3 bento stat cards (GET /stats for real data):
  1. "Ready for Analysis" — pending count, primary color emphasis
  2. "Processed" — analyzed count
  3. "Total Files" — total + formatted size, gradient background
- Recent uploads table (last 5 from GET /files sorted by uploadedAt desc)
  - Columns: thumbnail, filename, status chip, date relative
- Quick links right panel: "Analyze All" action, "Download All ZIP", "Open Settings"

### Page 2: Upload & Renamer (#upload)
Reference: `design-ref/stitch/upload_renamer/code.html`

**CAMPAIGN CONTEXT FORM** (surface-container-low card, ABOVE drop zone):
```
Section label: "CAMPAIGN CONTEXT" (11px uppercase tracking-wider, primary color)
Subtitle: "Set batch defaults — applied to all files uploaded this session"

2-column grid layout:
Row 1: [Source dropdown] [Vertical / Product dropdown]
Row 2: [Offer dropdown] [Landing Page dropdown]  
Row 3: [Talent dropdown] [Platform dropdown]
Row 4 (full width): [Batch Name text input]

Footer: "These defaults pre-fill Gemini's analysis context for better accuracy" (on-surface-variant, text-xs)
```

All dropdowns: `<select class="field-input">` populated from state.settings.
On change: update state.campaign AND call POST /update/:id for each pending file.

**Drop Zone:**
- Dashed border card (bg-primary/5, border-dashed border-outline-variant, hover:border-primary)
- Upload icon (circle bg-surface-container-highest), headline, supported formats text, Browse button
- Wire: dragover/drop + file input click → POST /upload with FormData
- Show per-file XHR progress bar while uploading

**Analyze All button** (top-right, gradient style):
- Shows count of pending files: "Analyze All (N pending)"
- On click: POST /analyze-all, start polling GET /analyze-status every 2s
- Progress bar: "Analyzing X / Y files..." with % fill
- Stop when analyzing===0 && pending===0

**Pending Queue Table:**
- `border-separate border-spacing-y-2` table
- Columns: checkbox | 40px thumbnail | Original Name | Proposed Name (monospace, click=copy+toast) | Status chip | Actions
- Status chips: Naming Queue (secondary-container), Analyzing (primary-fixed), Processed (green-100/green-800), Error (error-container/error)
- Actions: edit (expand row accordion), re-analyze icon, delete icon
- Expandable accordion: 12 named dropdowns per row, POST /update/:id on change
- "Clear All" button (confirm dialog first)

### Page 3: Files (#files)
Reference: `design-ref/stitch/file_manager/code.html`

**Toolbar:**
- Search input (filter by filename client-side)
- Grid/List toggle buttons
- Sort dropdown: Name A→Z, Name Z→A, Newest, Oldest, Status
- "Download All ZIP" button

**Stats bar:** "X files · Y analyzed · Z MB" (on-surface-variant, text-sm)

**Grid View (default):**
- `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4`
- Card: thumbnail (aspect-video), footer (filename truncated, size, status chip)
- Video cards: show play icon overlay + duration badge (bottom-right)
- Hover overlay (opacity-0 → opacity-100): preview icon, download icon, delete icon
- Click card body: toggle in state.selectedIds, show blue ring + checkmark overlay
- Shift+click: range select (use state.lastSelectedIndex)
- Checkbox top-left corner

**Selection toolbar** (fixed bottom, appears when selectedIds.size > 0):
Glass panel style, shows: "X selected · Download ZIP · Delete · ✕"

**List View:**
- Precision Curator table (no dividers, border-separate border-spacing-y-2, surface-container-lowest rows)
- Columns: checkbox | thumbnail | filename | size | status | date | actions

**Lightbox** (shared component):
- Fixed overlay (inset-0, bg-black/85, backdrop-blur-sm, z-9998)
- Left: preview area (image = full img, video = HTML5 video player)
- Right panel (surface-container-lowest, p-6, w-80):
  - Proposed name (editable input, primary style)
  - 12 naming field dropdowns
  - "Download Renamed" (gradient button)
  - "Delete" (tertiary text button, error color)
- Escape key closes, click outside closes

### Page 4: Settings (#settings)
Reference: `design-ref/stitch/naming_settings/code.html`

**Section 1: Sources & Products**
- Chip list UI: each chip has label + × button
- Add input + "Add" button
- Auto-save on change via POST /settings

**Section 2: Talent Names**
- Same chip pattern

**Section 3: Platform & Defaults**
- Grid of dropdowns for: Default Source, Default Product, Default Talent, Default Platform, Default Offer, Default LP

**Section 4: Naming Convention Preview**
- Live-updating example filename using current default values
- Shows format: `basename_[source]_[format]_[messaging]_[hook]_[product]_[talent]_[gender]_[age]_[length]_[offer]_[lp]_[audio].ext`

**Section 5: Danger Zone** (surface-container-high card, left border tertiary):
- "Reset to Defaults" — confirm dialog
- "Clear All Uploads" — confirm dialog

---

## Custom CSS (public/style.css)

```css
/* Signature gradient */
.signature-gradient { background: linear-gradient(135deg, #073370 0%, #284a88 100%); }

/* Glass panel */
.glass-panel { background: rgba(255,255,255,0.8); backdrop-filter: blur(20px); }

/* Ambient shadow */
.ambient-shadow { box-shadow: 0px 12px 32px rgba(7,51,112,0.08); }

/* Monospace proposed name */
.proposed-name {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.75rem;
  background: rgba(7,51,112,0.05);
  color: #073370;
  padding: 0.25rem 0.5rem;
  border-radius: 0.125rem;
  cursor: pointer;
  transition: background 0.15s;
}
.proposed-name:hover { background: rgba(7,51,112,0.1); }

/* Input field — bottom border only */
.field-input {
  background: #f3f4f5;
  border: none;
  border-bottom: 2px solid #c3c6d4;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border-radius: 0.125rem 0.125rem 0 0;
  width: 100%;
  font-family: 'Inter', sans-serif;
  color: #191c1d;
  transition: border-color 0.15s;
}
.field-input:focus { border-bottom-color: #073370; outline: none; box-shadow: none; }

/* Active nav link */
.nav-active {
  background: white !important;
  color: #073370 !important;
  font-weight: 700 !important;
  border-radius: 0.5rem 0 0 0.5rem;
  transform: translateX(4px);
  box-shadow: 0px 2px 8px rgba(7,51,112,0.08);
}

/* Status chips */
.chip { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.125rem 0.625rem; border-radius: 9999px; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
.chip-pending { background: #cbe7f5; color: #4e6874; }
.chip-analyzing { background: #d8e2ff; color: #073370; }
.chip-done { background: #d4edda; color: #155724; }
.chip-error { background: #ffdad6; color: #93000a; }
.chip-dot { width: 0.375rem; height: 0.375rem; border-radius: 9999px; }

/* Asset card */
.asset-card { transition: transform 0.2s; cursor: pointer; }
.asset-card:hover { transform: translateY(-1px); }
.asset-card.selected { outline: 2px solid #073370; outline-offset: 2px; }
.card-overlay { opacity: 0; transition: opacity 0.2s; background: rgba(7,51,112,0.6); }
.asset-card:hover .card-overlay { opacity: 1; }

/* Lightbox */
.lightbox { position: fixed; inset: 0; z-index: 9998; background: rgba(0,0,0,0.85); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; }
.lightbox-panel { background: white; border-radius: 0.25rem; overflow: hidden; display: flex; max-height: 90vh; max-width: 90vw; }

/* Toast */
.toast-container { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999; display: flex; flex-direction: column; gap: 0.5rem; }
.toast {
  padding: 0.75rem 1rem; border-radius: 0.25rem; font-size: 0.875rem; font-weight: 500;
  background: #191c1d; color: white;
  box-shadow: 0px 8px 24px rgba(0,0,0,0.2);
  animation: slideIn 0.2s ease;
}
.toast.success { background: #073370; }
.toast.error { background: #ba1a1a; }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

/* Upload progress bar */
.progress-bar { height: 3px; background: #edeeef; border-radius: 0; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #073370, #284a88); transition: width 0.3s; }

/* Drop zone */
.drop-zone { border: 2px dashed #c3c6d4; background: rgba(7,51,112,0.02); transition: border-color 0.2s, background 0.2s; }
.drop-zone.drag-over { border-color: #073370; background: rgba(7,51,112,0.05); }

/* Table rows (no dividers) */
table.data-table { border-collapse: separate; border-spacing: 0 0.4rem; }
table.data-table tbody tr { background: white; }
table.data-table tbody tr:hover { background: #f3f4f5; }
table.data-table tbody td:first-child { border-radius: 0.25rem 0 0 0.25rem; }
table.data-table tbody td:last-child { border-radius: 0 0.25rem 0.25rem 0; }

/* Accordion row expand */
.accordion-row { display: none; }
.accordion-row.open { display: table-row; }

/* Selection toolbar */
.selection-toolbar { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); z-index: 100; }

/* Responsive mobile */
@media (max-width: 768px) {
  .data-table-wrapper { overflow-x: auto; }
  aside.sidebar { display: none; }
  main.main-content { margin-left: 0; padding-bottom: 5rem; }
  .mobile-nav { display: flex; }
}
```

---

## Wave Plan

### Wave 1 (DONE) — v0.1.0
- Basic Express server, multer upload, Gemini CLI integration
- Simple 3-tab frontend, GitHub repo

### Wave 2 (CURRENT) — v0.2.0
**Target:** Full Precision Curator UI + Campaign Context form + UUID fix + 4-page SPA

Tasks:
1. Fix UUID bug in server.js (|| separator)
2. Add all new endpoints: /health, /stats, /analyze-status, /preview/:id, /files/:id, DELETE /files/bulk, GET /download-selected-zip
3. Add concurrency limiter (max 3 Gemini)
4. Add file type validation + 500MB limit
5. Rebuild index.html with exact Stitch design system
6. Build style.css with all custom styles
7. Build app.js SPA (4 pages, state, router, API helpers)
8. Campaign Context Form (above drop zone on Upload page)
9. Kill old server, start new, test /health
10. git commit + tag v0.2.0 + gh release

### Wave 3 — v0.3.0
- Bulk select + ZIP download wired up
- Shift+click range select in Files grid
- Selection toolbar (X selected → Download ZIP → Delete)
- Settings: talent chip management
- git commit v0.3.0

### Wave 4 — v0.4.0
- start.sh launcher script
- install-service.sh (macOS launchd plist)
- Full README.md with setup + glossary + Tailscale
- CHANGELOG.md
- package.json version 0.4.0
- git commit v0.4.0

### Wave 5 — v0.5.0
- Sort options in table + files view
- Escape key closes lightbox
- Duplicate upload detection
- Loading skeletons for Files grid
- Empty state for Upload tab (when no files yet)
- Final curl /health test
- git commit v0.5.0

---

## Environment
- Node v22.22.1, npm 10.9.4
- gemini CLI: `~/.nvm/versions/node/v22.22.1/bin/gemini`
- ffmpeg: `/opt/homebrew/bin/ffmpeg`
- archiver package: `npm install archiver` if not present
- Server binds to 0.0.0.0 (accessible on Tailscale)

## Git Info
```
remote: git@github.com:ArielleTolome/motion-renamer.git
branch: main
gh cli: available (gh release create)
```
