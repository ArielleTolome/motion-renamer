# Motion Renamer 🎬

A local web app that automatically renames ad creatives to [MotionApp](https://motionapp.com)-compatible naming conventions using Gemini AI analysis.

## Features

- **Drag & drop** upload for images and videos
- **Gemini CLI** analyzes each creative and extracts naming fields (format, messaging, hook, gender, length, audio)
- **Editable table** — tweak any naming field inline, proposed name updates live
- **File manager** — Google Drive-style grid with thumbnails, lightbox preview, download renamed files
- **Settings** — add custom sources, products, and set defaults
- **Tailscale-ready** — bind to `0.0.0.0` for network access

## Naming Convention Format

```
{basename}_{source}_{format}_{messaging}_{hook}_{product}_{talent}_{gender}_{length}_{offer}_{lp}_{audio}
```

Example:
```
ugc-compare-v1_s-ariel_as-UGCMashup_m-problemsolution_h-talkinghead_p-medicare-english_i-ariel_gen-Female_len-30sec_o-None_lp-pdp_a-voiceover.mp4
```

## Requirements

- Node.js 18+
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) installed and authenticated

## Setup

```bash
git clone https://github.com/ArielleTolome/motion-renamer
cd motion-renamer
npm install
node server.js
```

Open `http://localhost:3210`

For Tailscale access: `http://<your-tailscale-ip>:3210`

## Stack

- **Backend:** Express + multer + archiver
- **Frontend:** Vanilla JS/CSS (no framework)
- **AI:** Gemini CLI (`gemini -p "..." --file ...`)
- **Color scheme:** Dark Violet `#7C3AED` + Cyan `#06B6D4`
