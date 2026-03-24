# Changelog

## v0.5.0 — Final QA
- Sort options in Files view (newest, oldest, name A-Z, name Z-A, status)
- Escape key closes lightbox
- Duplicate upload detection (same filename + size returns existing file)
- Loading skeleton cards while Files page fetches data
- Empty state on Upload tab when no files uploaded
- Updated start.sh to Precision Curator branding

## v0.4.0 — Auto-Start & Docs
- macOS launchd plist auto-start on login (`install-service.sh`)
- `start.sh`: one-command startup + browser open
- `GET /health` endpoint with version, uptime, file count
- Full README with setup, glossary table, API reference, Tailscale instructions
- CHANGELOG.md

## v0.3.0 — Bulk Operations & Settings
- Bulk select with checkboxes (Table) and click-select (Files grid)
- Shift+click range select in Files grid
- Download Selected ZIP
- Bulk delete
- Talent name management in Settings
- Settings auto-save on change
- Reset to Defaults button
- Stats bar: file count, analyzed count, total size
- `GET /stats` and `GET /download-selected-zip` endpoints
- `DELETE /files/bulk` endpoint

## v0.2.0 — Bug Fixes & Polish
- Fixed UUID extraction bug (pipe-pipe separator instead of hyphen)
- Added `GET /preview/:id` for inline file serving
- Added `GET /analyze-status` for batch progress polling
- Video thumbnails via canvas capture
- Re-analyze button per row
- Auto-copy proposed name on click with toast
- File count badges on nav tabs
- Clear All button in Upload tab

## v0.1.0 — Initial Release
- Express backend with multer file uploads
- Gemini CLI integration for creative analysis
- Editable naming fields table
- File manager grid with lightbox preview
- Download renamed files individually or as ZIP
- Settings for custom sources and products
- Dark Violet + Cyan color scheme
