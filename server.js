const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

const app = express();
const PORT = 3210;

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const RENAMED_DIR = path.join(__dirname, 'renamed');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');
const GEMINI_PATH = '/Users/arieltolome/.nvm/versions/node/v22.22.1/bin/gemini';

fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(RENAMED_DIR, { recursive: true });

const DEFAULT_SETTINGS = {
  sources: ['s-ariel', 's-a-teamwork', 's-data-grande'],
  products: ['p-medicare-english', 'p-medicare-spanish', 'p-aca-english', 'p-aca-spanish'],
  defaultSource: 's-ariel',
  defaultProduct: 'p-medicare-english'
};

function loadSettings() {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
  } catch {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2));
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

// Initialize settings
loadSettings();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Multer config
const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const id = uuidv4();
    cb(null, `${id}||${file.originalname}`);
  }
});
const upload = multer({ storage });

// Helpers
function getSidecarPath(id) {
  return path.join(UPLOADS_DIR, `${id}.json`);
}

function findFileById(id) {
  const files = fs.readdirSync(UPLOADS_DIR);
  const match = files.find(f => f.startsWith(id + '||') && !f.endsWith('.json'));
  return match ? path.join(UPLOADS_DIR, match) : null;
}

function loadSidecar(id) {
  const p = getSidecarPath(id);
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return null;
  }
}

function saveSidecar(id, data) {
  fs.writeFileSync(getSidecarPath(id), JSON.stringify(data, null, 2));
}

function buildProposedName(sidecar) {
  const f = sidecar.fields || {};
  const ext = path.extname(sidecar.originalName);
  const base = path.basename(sidecar.originalName, ext);
  const parts = [
    base,
    f.source || 's-ariel',
    `as-${f.format || 'Advertorial'}`,
    `m-${f.messaging || 'tagline'}`,
    `h-${f.hook || 'talkinghead'}`,
    f.product || 'p-medicare-english',
    `i-${f.talent || 'AI'}`,
    `gen-${f.gender || 'No Gender'}`,
    `len-${f.length || 'IMG'}`,
    f.offer || 'o-None',
    f.lp || 'lp-pdp',
    `a-${f.audio || 'none'}`
  ];
  return parts.join('_') + ext;
}

// POST /upload
app.post('/upload', upload.array('files'), (req, res) => {
  const settings = loadSettings();
  const results = req.files.map(f => {
    const filename = f.filename;
    const id = filename.split('||')[0];
    // Reconstruct original name from stored filename
    const ext = path.extname(f.originalname);
    const sidecar = {
      id,
      originalName: f.originalname,
      storedFilename: filename,
      uploadedAt: new Date().toISOString(),
      size: f.size,
      mimeType: f.mimetype,
      analysisStatus: 'pending',
      proposedName: null,
      fields: {
        source: settings.defaultSource,
        product: settings.defaultProduct,
        format: null,
        messaging: null,
        hook: null,
        talent: null,
        gender: null,
        length: f.mimetype.startsWith('image/') ? 'IMG' : null,
        offer: 'o-None',
        lp: 'lp-pdp',
        audio: null
      }
    };
    saveSidecar(id, sidecar);
    return sidecar;
  });
  res.json(results);
});

// GET /files
app.get('/files', (req, res) => {
  const files = fs.readdirSync(UPLOADS_DIR).filter(f => f.endsWith('.json'));
  const result = files.map(f => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(UPLOADS_DIR, f), 'utf-8'));
      // Verify the actual file still exists
      if (!findFileById(data.id)) return null;
      return data;
    } catch {
      return null;
    }
  }).filter(Boolean);
  res.json(result);
});

// POST /analyze/:id
app.post('/analyze/:id', async (req, res) => {
  const { id } = req.params;
  const sidecar = loadSidecar(id);
  if (!sidecar) return res.status(404).json({ error: 'File not found' });

  const filePath = findFileById(id);
  if (!filePath) return res.status(404).json({ error: 'File not found on disk' });

  sidecar.analysisStatus = 'analyzing';
  saveSidecar(id, sidecar);

  const prompt = `Analyze this creative asset (image or video) for a UGC ad naming convention system. Return ONLY a JSON object with these exact fields:
- "format": one of ["Advertorial", "UGCMashup", "Unboxing", "podcast", "StreetInterview", "BeforeAfter"]
- "messaging": one of ["FOMO", "tagline", "benefit1", "founderstory", "problemsolution"]
- "hook": one of ["3reasonswhy", "whynottobuy", "productdemonstration", "commentbubble", "talkinghead", "problem", "offer", "shocking", "taboo"]
- "talent_gender": one of ["Male", "Female", "No Gender"]
- "length": one of ["IMG", "03sec", "06sec", "10sec", "15sec", "30sec", "60sec", "90sec", "120sec"] (use "IMG" for images)
- "audio": one of ["music", "voiceover", "trendingsound", "none"]
- "talent": a short name for the talent/person shown, or "AI" if AI-generated or no person visible

Return ONLY valid JSON, no markdown, no explanation.`;

  try {
    const result = await new Promise((resolve, reject) => {
      execFile(GEMINI_PATH, ['-p', prompt, '--file', filePath], {
        timeout: 120000,
        maxBuffer: 1024 * 1024
      }, (err, stdout, stderr) => {
        if (err) reject(err);
        else resolve(stdout);
      });
    });

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = result.trim();
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }
    // Also try to find raw JSON object
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonStr);

    sidecar.fields.format = parsed.format || sidecar.fields.format;
    sidecar.fields.messaging = parsed.messaging || sidecar.fields.messaging;
    sidecar.fields.hook = parsed.hook || sidecar.fields.hook;
    sidecar.fields.gender = parsed.talent_gender || sidecar.fields.gender;
    sidecar.fields.length = parsed.length || sidecar.fields.length;
    sidecar.fields.audio = parsed.audio || sidecar.fields.audio;
    sidecar.fields.talent = parsed.talent || sidecar.fields.talent || 'AI';
    sidecar.analysisStatus = 'done';
    sidecar.proposedName = buildProposedName(sidecar);
    saveSidecar(id, sidecar);

    res.json(sidecar);
  } catch (err) {
    sidecar.analysisStatus = 'error';
    sidecar.analysisError = err.message;
    saveSidecar(id, sidecar);
    res.status(500).json({ error: err.message, sidecar });
  }
});

// POST /analyze-all
app.post('/analyze-all', async (req, res) => {
  const files = fs.readdirSync(UPLOADS_DIR).filter(f => f.endsWith('.json'));
  const sidecars = files.map(f => {
    try { return JSON.parse(fs.readFileSync(path.join(UPLOADS_DIR, f), 'utf-8')); }
    catch { return null; }
  }).filter(s => s && (s.analysisStatus === 'pending' || s.analysisStatus === 'error'));

  res.json({ queued: sidecars.length, ids: sidecars.map(s => s.id) });

  // Run sequentially in background
  for (const sidecar of sidecars) {
    const filePath = findFileById(sidecar.id);
    if (!filePath) continue;

    sidecar.analysisStatus = 'analyzing';
    saveSidecar(sidecar.id, sidecar);

    const prompt = `Analyze this creative asset (image or video) for a UGC ad naming convention system. Return ONLY a JSON object with these exact fields:
- "format": one of ["Advertorial", "UGCMashup", "Unboxing", "podcast", "StreetInterview", "BeforeAfter"]
- "messaging": one of ["FOMO", "tagline", "benefit1", "founderstory", "problemsolution"]
- "hook": one of ["3reasonswhy", "whynottobuy", "productdemonstration", "commentbubble", "talkinghead", "problem", "offer", "shocking", "taboo"]
- "talent_gender": one of ["Male", "Female", "No Gender"]
- "length": one of ["IMG", "03sec", "06sec", "10sec", "15sec", "30sec", "60sec", "90sec", "120sec"] (use "IMG" for images)
- "audio": one of ["music", "voiceover", "trendingsound", "none"]
- "talent": a short name for the talent/person shown, or "AI" if AI-generated or no person visible

Return ONLY valid JSON, no markdown, no explanation.`;

    try {
      const result = await new Promise((resolve, reject) => {
        execFile(GEMINI_PATH, ['-p', prompt, '--file', filePath], {
          timeout: 120000,
          maxBuffer: 1024 * 1024
        }, (err, stdout) => {
          if (err) reject(err);
          else resolve(stdout);
        });
      });

      let jsonStr = result.trim();
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonStr = jsonMatch[0];

      const parsed = JSON.parse(jsonStr);
      sidecar.fields.format = parsed.format || sidecar.fields.format;
      sidecar.fields.messaging = parsed.messaging || sidecar.fields.messaging;
      sidecar.fields.hook = parsed.hook || sidecar.fields.hook;
      sidecar.fields.gender = parsed.talent_gender || sidecar.fields.gender;
      sidecar.fields.length = parsed.length || sidecar.fields.length;
      sidecar.fields.audio = parsed.audio || sidecar.fields.audio;
      sidecar.fields.talent = parsed.talent || sidecar.fields.talent || 'AI';
      sidecar.analysisStatus = 'done';
      sidecar.proposedName = buildProposedName(sidecar);
    } catch (err) {
      sidecar.analysisStatus = 'error';
      sidecar.analysisError = err.message;
    }
    saveSidecar(sidecar.id, sidecar);
  }
});

// GET /health
app.get('/health', (req, res) => {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));
  const jsonFiles = fs.readdirSync(UPLOADS_DIR).filter(f => f.endsWith('.json'));
  let fileCount = 0;
  for (const f of jsonFiles) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(UPLOADS_DIR, f), 'utf-8'));
      if (findFileById(data.id)) fileCount++;
    } catch {}
  }
  res.json({ status: 'ok', version: pkg.version, uptime: process.uptime(), fileCount });
});

// GET /preview/:id
app.get('/preview/:id', (req, res) => {
  const filePath = findFileById(req.params.id);
  if (!filePath) return res.status(404).json({ error: 'Not found' });
  res.sendFile(filePath);
});

// GET /analyze-status
app.get('/analyze-status', (req, res) => {
  const files = fs.readdirSync(UPLOADS_DIR).filter(f => f.endsWith('.json'));
  const counts = { total: 0, done: 0, analyzing: 0, pending: 0, error: 0 };
  for (const f of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(UPLOADS_DIR, f), 'utf-8'));
      if (!findFileById(data.id)) continue;
      counts.total++;
      const s = data.analysisStatus || 'pending';
      if (counts[s] !== undefined) counts[s]++;
    } catch {}
  }
  res.json(counts);
});

// GET /download/:id
app.get('/download/:id', (req, res) => {
  const { id } = req.params;
  const filePath = findFileById(id);
  if (!filePath) return res.status(404).json({ error: 'File not found' });

  const sidecar = loadSidecar(id);
  const downloadName = sidecar?.proposedName || path.basename(filePath);
  res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
  fs.createReadStream(filePath).pipe(res);
});

// GET /download-renamed/:id
app.get('/download-renamed/:id', (req, res) => {
  const { id } = req.params;
  const filePath = findFileById(id);
  if (!filePath) return res.status(404).json({ error: 'File not found' });

  const sidecar = loadSidecar(id);
  if (!sidecar?.proposedName) return res.status(400).json({ error: 'No proposed name yet' });

  const renamedPath = path.join(RENAMED_DIR, sidecar.proposedName);
  fs.copyFileSync(filePath, renamedPath);

  res.setHeader('Content-Disposition', `attachment; filename="${sidecar.proposedName}"`);
  fs.createReadStream(renamedPath).pipe(res);
});

// GET /download-all-zip
app.get('/download-all-zip', (req, res) => {
  const files = fs.readdirSync(UPLOADS_DIR).filter(f => f.endsWith('.json'));
  const sidecars = files.map(f => {
    try { return JSON.parse(fs.readFileSync(path.join(UPLOADS_DIR, f), 'utf-8')); }
    catch { return null; }
  }).filter(s => s && s.proposedName);

  if (sidecars.length === 0) return res.status(400).json({ error: 'No files to download' });

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="motion-renamed-files.zip"');

  const archive = archiver('zip', { zlib: { level: 5 } });
  archive.pipe(res);

  for (const sidecar of sidecars) {
    const filePath = findFileById(sidecar.id);
    if (filePath) {
      archive.file(filePath, { name: sidecar.proposedName });
    }
  }

  archive.finalize();
});

// POST /update/:id
app.post('/update/:id', (req, res) => {
  const { id } = req.params;
  const sidecar = loadSidecar(id);
  if (!sidecar) return res.status(404).json({ error: 'File not found' });

  const updates = req.body;

  // Update fields
  if (updates.fields) {
    sidecar.fields = { ...sidecar.fields, ...updates.fields };
  }
  // Allow direct field updates too
  for (const key of ['source', 'product', 'format', 'messaging', 'hook', 'talent', 'gender', 'length', 'offer', 'lp', 'audio']) {
    if (updates[key] !== undefined) {
      sidecar.fields[key] = updates[key];
    }
  }
  // Allow direct proposedName override
  if (updates.proposedName !== undefined) {
    sidecar.proposedName = updates.proposedName;
  } else {
    // Recalculate
    sidecar.proposedName = buildProposedName(sidecar);
  }

  saveSidecar(id, sidecar);
  res.json(sidecar);
});

// DELETE /files/:id
app.delete('/files/:id', (req, res) => {
  const { id } = req.params;
  const filePath = findFileById(id);
  const sidecarPath = getSidecarPath(id);

  if (filePath) fs.unlinkSync(filePath);
  if (fs.existsSync(sidecarPath)) fs.unlinkSync(sidecarPath);

  res.json({ deleted: true });
});

// GET /stats
app.get('/stats', (req, res) => {
  const jsonFiles = fs.readdirSync(UPLOADS_DIR).filter(f => f.endsWith('.json'));
  let totalFiles = 0, analyzed = 0, pending = 0, totalSize = 0;
  for (const f of jsonFiles) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(UPLOADS_DIR, f), 'utf-8'));
      if (!findFileById(data.id)) continue;
      totalFiles++;
      totalSize += data.size || 0;
      if (data.analysisStatus === 'done') analyzed++;
      else if (data.analysisStatus === 'pending') pending++;
    } catch {}
  }
  res.json({ totalFiles, analyzed, pending, totalSize });
});

// DELETE /files/bulk
app.delete('/files/bulk', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be an array' });
  let deleted = 0;
  for (const id of ids) {
    const filePath = findFileById(id);
    const sidecarPath = getSidecarPath(id);
    if (filePath) { fs.unlinkSync(filePath); deleted++; }
    if (fs.existsSync(sidecarPath)) fs.unlinkSync(sidecarPath);
  }
  res.json({ deleted });
});

// GET /download-selected-zip
app.get('/download-selected-zip', (req, res) => {
  const ids = (req.query.ids || '').split(',').filter(Boolean);
  if (ids.length === 0) return res.status(400).json({ error: 'No ids provided' });

  const sidecars = ids.map(id => loadSidecar(id)).filter(Boolean);
  if (sidecars.length === 0) return res.status(400).json({ error: 'No valid files found' });

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="motion-selected-files.zip"');

  const archive = archiver('zip', { zlib: { level: 5 } });
  archive.pipe(res);

  for (const sidecar of sidecars) {
    const filePath = findFileById(sidecar.id);
    if (filePath) {
      archive.file(filePath, { name: sidecar.proposedName || sidecar.originalName });
    }
  }
  archive.finalize();
});

// GET /settings
app.get('/settings', (req, res) => {
  res.json(loadSettings());
});

// POST /settings
app.post('/settings', (req, res) => {
  const current = loadSettings();
  const updated = { ...current, ...req.body };
  saveSettings(updated);
  res.json(updated);
});

// Serve uploaded files for preview
app.use('/uploads', express.static(UPLOADS_DIR));
// Fallback: serve uploaded file by stored filename
app.get('/uploads/:filename', (req, res) => {
  const filePath = path.join(UPLOADS_DIR, req.params.filename);
  if (fs.existsSync(filePath)) return res.sendFile(filePath);
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Motion Renamer running at http://localhost:${PORT}`);
  console.log(`Tailscale access: http://100.108.195.97:${PORT}`);
});
