# Motion Renamer — Handoff Doc

## Goal
Build a local web app (Node/Express + vanilla frontend) that:
1. Drag & drop images/videos → uploaded to server
2. Gemini CLI analyzes each file → extracts naming convention fields
3. Shows table: original filename | extracted fields | proposed Motion-compatible name
4. File manager page (Google Drive style) with previews + download
5. Allow editing proposed names before downloading renamed files

## Stack
- Backend: Node.js + Express + multer (file upload)
- Frontend: Vanilla HTML/CSS/JS (no framework — keep it simple)
- AI Analysis: `gemini` CLI (already installed at /Users/arieltolome/.nvm/versions/node/v22.22.1/bin/gemini)
- Color scheme: Dark Violet + Cyan — #0A0A0F bg, #7C3AED accent, #06B6D4 highlight

## Motion Naming Convention Format
`{filename}_{source}_{format}_{messaging}_{hook}_{product}_{talent}_{gender}_{length}_{offer}_{audio}`
Separator: `_`

### Glossary Values (from Naming GlossaryLookup sheet)
**Source (s-):** s-ariel, s-a-teamwork, s-data-grande (+ user-addable)
**Format (as-):** as-Advertorial, as-UGCMashup, as-Unboxing, as-podcast, as-StreetInterview, as-BeforeAfter
**Messaging (m-):** m-FOMO, m-tagline, m-benefit1, m-founderstory, m-problemsolution
**Hook (h-):** h-3reasonswhy, h-whynottobuy, h-productdemonstration, h-commentbubble, h-talkinghead, h-problem, h-offer, h-shocking, h-taboo
**Product (p-):** p-medicare-english, p-medicare-spanish, p-aca-english, p-aca-spanish (+ user-addable)
**Talent (i-):** i-ariel, i-AI (+ user-addable)
**Gender (gen-):** gen-Male, gen-Female, gen-No Gender
**Age (age-):** age-kids, age-teens, age-middleage, age-elders, age-No Generation
**Length (len-):** len-IMG, len-03sec, len-06sec, len-10sec, len-15sec, len-30sec, len-60sec, len-90sec, len-120sec
**Offer (o-):** o-None, o-Percentage Off, o-Dollar Off, o-BOGO
**Landing Page (lp-):** lp-home, lp-collection, lp-pdp, lp-blog, lp-customoffer
**Audio (a-):** a-music, a-voiceover, a-trendingsound, a-none

## UGC Creative Strategy Analyzer Prompt
Gemini will use the full prompt from pastebin.com/g8i9a8w7 to analyze each video/image.
Fields to extract: format/concept type, messaging angle, hook type, talent gender, estimated length, audio type.
Map extracted values to the glossary above.

## Architecture
```
motion-renamer/
├── server.js          # Express server
├── package.json
├── public/
│   ├── index.html     # Main app (3 tabs: Upload, Table, Files)
│   ├── style.css
│   └── app.js
├── uploads/           # Raw uploaded files
├── renamed/           # Files with new names (symlinks or copies)
└── analyze.js         # Gemini CLI wrapper + name generator
```

## Wave Progress
- [x] Wave 0: Project scaffold + git init
- [ ] Wave 1: Backend (Express + multer + Gemini analyzer + naming engine)
- [ ] Wave 2: Frontend (Upload drag/drop + table view)
- [ ] Wave 3: File manager page (grid view + download)
- [ ] Wave 4: Editable names + settings page (add custom sources/products)
- [ ] Wave 5: Polish, error handling, README

## Key Files
- analyze.js: runs `gemini -p "PROMPT" --file /path/to/file` → parses JSON → maps to glossary
- server.js: POST /upload, GET /files, GET /download/:id, POST /rename

## Gemini CLI Usage
```bash
gemini -p "Analyze this creative and return JSON with fields: format, messaging, hook, talent_gender, length_seconds, audio_type" --file /path/to/file
```
Output gets parsed and mapped to naming glossary values.

## Notes
- Run locally on Mac: http://localhost:3210
- No auth needed (local only)
- Files stored in uploads/ permanently until user deletes
- renamed/ folder holds symlinked renamed files for download
