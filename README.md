# Motion Renamer

A local web app that automatically renames ad creatives to [MotionApp](https://motionapp.com)-compatible naming conventions using Gemini AI analysis.

## Features

- **Drag & drop** upload for images and videos
- **Gemini CLI** analyzes each creative and extracts naming fields (format, messaging, hook, gender, length, audio)
- **Editable table** — tweak any naming field inline, proposed name updates live
- **File manager** — Google Drive-style grid with thumbnails, lightbox preview, download renamed files
- **Bulk operations** — select multiple files, download as ZIP, bulk delete
- **Settings** — add custom sources, products, talent names, and set defaults
- **Stats bar** — live file count, analysis status, total size
- **Auto-start** — macOS launchd plist for auto-start on login
- **Tailscale-ready** — binds to `0.0.0.0` for network access

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

### Quick Start

```bash
./start.sh
```

This kills any existing server, starts a new one, and opens the browser.

### Auto-Start on Login (macOS)

```bash
./install-service.sh
```

This installs a macOS launchd plist at `~/Library/LaunchAgents/com.motion-renamer.plist` that:
- Starts the server automatically when you log in
- Restarts it if it crashes
- Logs output to `/tmp/motion-renamer.log`

To uninstall:
```bash
launchctl unload ~/Library/LaunchAgents/com.motion-renamer.plist
rm ~/Library/LaunchAgents/com.motion-renamer.plist
```

## Tailscale Access

The server binds to `0.0.0.0:3210`, so any device on your Tailscale network can access it:

```
http://<your-tailscale-ip>:3210
```

Example: `http://100.108.195.97:3210`

## Naming Convention Format

```
{basename}_{source}_{format}_{messaging}_{hook}_{product}_{talent}_{gender}_{length}_{offer}_{lp}_{audio}
```

Example:
```
ugc-compare-v1_s-ariel_as-UGCMashup_m-problemsolution_h-talkinghead_p-medicare-english_i-ariel_gen-Female_len-30sec_o-None_lp-pdp_a-voiceover.mp4
```

### Naming Glossary

| Field | Prefix | Valid Values |
|-------|--------|-------------|
| Source | `s-` | ariel, a-teamwork, data-grande (+ custom) |
| Format | `as-` | Advertorial, UGCMashup, Unboxing, podcast, StreetInterview, BeforeAfter |
| Messaging | `m-` | FOMO, tagline, benefit1, founderstory, problemsolution |
| Hook | `h-` | 3reasonswhy, whynottobuy, productdemonstration, commentbubble, talkinghead, problem, offer, shocking, taboo |
| Product | `p-` | medicare-english, medicare-spanish, aca-english, aca-spanish (+ custom) |
| Talent | `i-` | ariel, AI (+ custom) |
| Gender | `gen-` | Male, Female, No Gender |
| Length | `len-` | IMG, 03sec, 06sec, 10sec, 15sec, 30sec, 60sec, 90sec, 120sec |
| Offer | `o-` | None, Percentage Off, Dollar Off, BOGO |
| Landing Page | `lp-` | home, collection, pdp, blog, customoffer |
| Audio | `a-` | music, voiceover, trendingsound, none |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/upload` | Upload files (multipart) |
| GET | `/files` | List all files with metadata |
| GET | `/health` | Server health check |
| GET | `/stats` | File count, analysis stats, total size |
| POST | `/analyze/:id` | Analyze single file with Gemini |
| POST | `/analyze-all` | Analyze all pending files |
| GET | `/analyze-status` | Batch analysis progress |
| GET | `/preview/:id` | Inline file preview |
| GET | `/download/:id` | Download file |
| GET | `/download-renamed/:id` | Download with proposed name |
| GET | `/download-all-zip` | Download all as ZIP |
| GET | `/download-selected-zip` | Download selected files as ZIP |
| POST | `/update/:id` | Update file fields |
| DELETE | `/files/:id` | Delete single file |
| DELETE | `/files/bulk` | Bulk delete files |
| GET | `/settings` | Get settings |
| POST | `/settings` | Update settings |

## Stack

- **Backend:** Express + multer + archiver
- **Frontend:** Vanilla JS/CSS (no framework)
- **AI:** Gemini CLI (`gemini -p "..." --file ...`)
- **Color scheme:** Dark Violet `#7C3AED` + Cyan `#06B6D4`

## Screenshots

_Coming soon_
