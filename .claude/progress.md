# Progress Log

A running log of everything built and decided. Most recent entries at the top.

---

## [2026-04-18] — Client-Side Audio Extraction CONFIRMED WORKING ✅

### Solution: Web Audio API (no FFmpeg.wasm at all)

The FFmpeg.wasm approach was abandoned entirely. Instead, `useAudioExtractor.ts`
was rewritten to use **100% native browser APIs** — zero WASM, zero service workers,
zero COEP headers required.

**How it works (browser-native pipeline):**
```
videoFile.arrayBuffer()
        ↓
AudioContext.decodeAudioData()   ← Browser's native media decoder
        ↓                           (handles MP4, MOV, MKV, WebM, AVI natively)
OfflineAudioContext              ← Resample to 16kHz mono
        ↓
encodeWav()                      ← Hand-rolled PCM WAV encoder (44-byte header + Int16 samples)
        ↓
new File([wav], "audio.wav")     ← WAV File object uploaded to backend
```

**Progress steps reported:**
  - 15% → arrayBuffer() read complete
  - 55% → AudioContext.decodeAudioData() complete
  - 85% → OfflineAudioContext rendering complete  
  - 100% → WAV encoded, File ready

**Bandwidth savings:**
  - 44-min meeting video: ~500 MB raw vs ~85 MB WAV uploaded
  - ~6x less data transferred per upload

**End-to-end flow confirmed working:**
  1. User selects MP4 → shows "Extracting audio in browser… 15%/55%/85%"
  2. WAV created in-browser → shows "Uploading audio" with progress bar
  3. Backend receives WAV → Groq Whisper transcribes → transcript shown
  4. User confirms → Gemini summarizes

**File in final state:**
  - `useAudioExtractor.ts` — Web Audio API, pure TypeScript, ~120 lines
  - `UploadPanel.tsx` — calls extractAudio() before upload, 4-step tracker
  - `vite.config.ts` — clean, no special headers, no plugins
  - `index.html` — no service worker registration

---

## [2026-04-18] — Client-Side FFmpeg.wasm: Final Working Architecture ✅

### Solution: coi-serviceworker + CDN + toBlobURL

All three previous attempts failed; this is the approach that works.

**Root cause recap of previous failures:**

- Attempt 1 (plain string path `/ffmpeg-core.js`): Vite appends `?import` inside the worker, breaking Emscripten UMD loader.
- Attempt 2 (toBlobURL from local path): COEP `require-corp` blocks blob URLs accessed from a Worker without cross-origin isolation active.
- Attempt 3 (COEP/COOP server headers): Broke Google Fonts, third-party scripts, OAuth popups.

**Working solution:**

`coi-serviceworker` injects COOP/COEP headers per browser tab via service worker — no server-level headers needed. With `crossOriginIsolated === true`, blob URLs created in the main thread are accessible from worker context. CDN URLs fed through `toBlobURL()` become blob URLs that Vite never mangles.

**Files changed:**

- `index.html` — added `<script src="/coi-serviceworker.js"></script>` as first tag in `<head>`
- `public/coi-serviceworker.js` — copied from `node_modules/coi-serviceworker/`
- `public/ffmpeg-core.js` + `ffmpeg-core.wasm` — deleted (now loaded from CDN)
- `vite.config.ts` — removed COEP/COOP server headers and `ffmpegCorePlugin`; kept `optimizeDeps.exclude`
- `useAudioExtractor.ts` — CDN URLs (`https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd`) via `toBlobURL`
- `ProgressTracker.tsx` — added "extracting" as first step; `hint` prop for sub-label
- `UploadPanel.tsx` — wired `useAudioExtractor`; async `handleFile`: extract → upload WAV

**Verification:**

On first page load: `"coi-serviceworker: reloading page to activate service worker"` in console (one-time, expected).

In DevTools console: `crossOriginIsolated` must print `true`.

---

## [2026-04-18] — Session: Dependency Fixes, Login Repair

### Missing backend packages installed (fresh venv was incomplete)

- `python-jose[cryptography]==3.5.0` — could not import `from jose import JWTError`
- `passlib[bcrypt]==1.7.4` — could not import `from passlib.context import CryptContext`
- `pydantic[email]` (email-validator) — `RegisterRequest.email: EmailStr` failed on model load

### bcrypt version downgraded: 5.0.0 → 3.2.2

- `pip install "bcrypt<4"` → installed `bcrypt==3.2.2`
- Root cause: bcrypt 5.0.0 added a hard 72-byte password limit in `hashpw()`; passlib 1.7.4's internal `detect_wrap_bug()` test hashes a >72-byte sentinel, crashing before any real login attempt
- Error: `ValueError: password cannot be longer than 72 bytes, truncate manually`
- Fix verified: `ctx.verify(password, stored_hash)` → `True` after downgrade
- project.md updated: `bcrypt==4.0.1` → `bcrypt==3.2.2`

### Admin password hash updated

User regenerated admin@mail.com password hash directly in `users/99086091-…json`.

### `wav` added to backend SUPPORTED_FORMATS

- `useAudioExtractor.ts` outputs `.wav`; backend was rejecting uploads with HTTP 415
- Added `"wav"` to `SUPPORTED_FORMATS` list in `config.py`

---

## [2026-04-18] — FFmpeg.wasm Attempts Log (superseded — kept for reference)

**Attempt 1** — plain local path: `ffmpeg.load({ coreURL: "/ffmpeg-core.js" })` → `Failed to fetch dynamically imported module: /ffmpeg-core.js?import` (Vite mangles URL inside worker).

**Attempt 2** — local files + `toBlobURL`: COEP `require-corp` blocks blob URL access from worker without `crossOriginIsolated`.

**Attempt 3** — COEP/COOP server headers in `vite.config.ts`: broke Google Fonts and other cross-origin resources.

**Working fix:** coi-serviceworker (see entry above).

**Final architecture (working):**
```
User selects video
        ↓
Validation (ext + size)
        ↓
Raw video file → multipart/form-data POST to /api/projects/{slug}/meetings/upload
        ↓
Backend: moviepy (imageio_ffmpeg bundled) → mono 16kHz WAV
        ↓
pydub chunks into 12-min segments → Groq Whisper API per chunk
        ↓
Transcript returned to frontend (JSON)
        ↓
User reviews transcript → Gemini summary
```

**Files in final state:**
- `UploadPanel.tsx` — direct upload, no useAudioExtractor
- `ProgressTracker.tsx` — 3 steps: Uploading → Transcribing → Generating Summary
- `vite.config.ts` — clean, no COEP headers, no ffmpegCorePlugin
- `useAudioExtractor.ts` — kept in codebase but unused (for future reference)

---

## [2026-04-18] — Video Upload Fixed ✅

### Root Cause
The frontend was using `useAudioExtractor` — a client-side FFmpeg.wasm hook — to extract audio before uploading. The `@ffmpeg/core` package in `node_modules` only ships a **~114 KB stub** `ffmpeg-core.js`, not the real ~30 MB core binary. FFmpeg.wasm would "load" but immediately fail when trying to decode any video, silently returning a non-zero exit code.

### Fix Applied
- **Deleted the client-side extraction step entirely** from `UploadPanel.tsx`
- Video file is now uploaded **directly** to the backend (multipart/form-data)
- Backend already handles audio extraction reliably via `moviepy` + `imageio-ffmpeg` (bundled binary)
- **`ProgressTracker.tsx` updated** — removed the "extracting" step, now shows 3 steps: Uploading → Transcribing → Generating Summary

### Files Changed
- `frontend/src/components/meetings/UploadPanel.tsx` — rewritten, no more `useAudioExtractor`
- `frontend/src/components/meetings/ProgressTracker.tsx` — removed extracting step

### Verified (end-to-end test)
- Uploaded `2026-04-13 20-52-51.mp4` (44-minute video)
- ✅ Upload progress bar shows correctly
- ✅ Transcribing stage shows "Powered by Groq Whisper"
- ✅ Transcript review screen appears with accurate transcript
- ✅ Zero console errors

---

## [2026-04-18] — Login Bug Fixed ✅

### Root Cause
`python-jose`, `passlib`, and `bcrypt` were installed in the venv but **missing from `requirements.txt`**, so a fresh reinstall would break auth. Additionally, `bcrypt` was at version 3.x (incompatible with passlib 1.7.4) — the hash stored for admin@mail.com was generated against an incompatible binary, causing all login attempts to return 401.

### Fixes Applied
1. **`requirements.txt`** — Added `python-jose[cryptography]==3.5.0`, `passlib[bcrypt]==1.7.4`, `bcrypt==4.0.1`
2. **`bcrypt==4.0.1` reinstalled** via `pip install --force-reinstall` after killing uvicorn (needed to release file lock on `_bcrypt.pyd`)
3. **Admin password hash reset** — ran a one-off Python script to rehash `admin@mail.com` password with the now-correct bcrypt binary

### Verified
- `POST /api/auth/login` → 200 + valid JWT
- Browser test: http://localhost:5173 → /login → sign in → redirected to dashboard with sidebar, storage stats, project list all visible
- No console errors

### Credentials
- Email: `admin@mail.com`
- Password: `admin123`
- Role: `admin`

---

## [2026-04-17] — Phase 3: RBAC, Auth, Cost Optimization, Context-Aware Summaries

### Role-based access control (RBAC)

- New `models/user_models.py` — `UserRecord`, `UserPublic`, `RegisterRequest`, `LoginRequest`, `TokenResponse`, `AdminUserUpdate` (Pydantic v2)
- New `auth/tokens.py` — `hash_password`, `verify_password`, `create_access_token`, `decode_access_token` (python-jose HS256, passlib bcrypt)
- New `auth/dependencies.py` — `get_current_user`, `require_admin` FastAPI dependencies (OAuth2PasswordBearer)
- New `storage/user_store.py` — one JSON file per user in `users/`, async CRUD (`count_users`, `create_user`, `get_user_by_email`, `get_user_by_id`, `get_all_users`, `update_user`, `delete_user`)
- New `routers/auth.py` — register (first user → admin), login, me endpoints
- New `routers/admin.py` — admin-only: list/update/delete users; guards self-demotion and self-deletion
- `config.py` — added `USERS_DIR`, `JWT_SECRET`, `JWT_ALGORITHM`, `JWT_EXPIRE_HOURS`
- `.env` — added `JWT_SECRET` (random 64-char hex), `JWT_EXPIRE_HOURS=24`
- **Key pin**: `bcrypt==4.0.1` — passlib 1.7.4 incompatible with bcrypt 5.x

### Per-user data isolation

- `storage/project_store.py` — complete rewrite: all functions take `user_id` as first param; paths rooted at `BASE_DIR/{user_id}/`
- `storage/meeting_store.py` — complete rewrite: all functions take `user_id` first; paths at `BASE_DIR/{user_id}/{slug}/meetings/`
- All routers updated to pass `current_user.id` through to storage layer

### Legacy data migration

- `main.py` lifespan — `_migrate_legacy_projects()` detects old `projects/{slug}/project_meta.json` layout, creates first admin user if needed, moves data to `projects/{admin_user_id}/`, rebuilds project index

### Frontend auth

- New `src/store/authStore.ts` — Zustand persist (key: `meridian-auth`): `token`, `user`, `setAuth`, `logout`
- `src/api/client.ts` — request interceptor: reads token from localStorage, attaches `Authorization: Bearer`; response interceptor: 401 → clear storage + redirect `/login`
- New `src/components/auth/AuthGuard.tsx` — layout route wrapper: redirects to `/login` if no token, renders `<Outlet />` otherwise
- New `src/pages/LoginPage.tsx` — email/password sign-in form
- New `src/pages/RegisterPage.tsx` — display name + email + password registration form
- `src/App.tsx` — restructured: public routes + `<AuthGuard>` layout wrapping `<MainLayout>` with protected routes
- `src/components/layout/Sidebar.tsx` — added user avatar (first letter), display name, role badge, logout button

### Markdown rendering in summaries

- Installed `react-markdown` + `remark-gfm`
- `SummaryViewer.tsx` — full `mdComponents` mapping: h1/h2/h3, p, ul/ol/li (CSS dot markers), code/pre, blockquote, hr, table
- `ChatMessage.tsx` — AI responses rendered as markdown; user messages as plain `whitespace-pre-wrap`

### Cost optimization

- Whisper: `whisper-large-v3` → `whisper-large-v3-turbo` (2.8× cheaper, near-identical quality for meeting audio)
- Audio chunks: 8 min → 12 min (fewer Groq API calls)
- Chat context: full transcripts (~63K tokens) → summaries only (~3.5K tokens, ~18× reduction)
- Gemini: `_standalone_model` and `_context_aware_model` initialized as module-level singletons (not per-request)
- Token caps: `GEMINI_MAX_TOKENS=1500`, `GEMINI_CHAT_MAX_TOKENS=800`

### Context-aware summaries

- `prompts.py` — added `CONTEXT_AWARE_SUMMARIZER_PROMPT`: instructs model to produce "What Changed Since Last Meeting" section with `**[Topic]:** Before → After` format per category (action items, decisions, dates, blockers, priorities)
- `services/summarization_service.py` — `summarize(transcript, prior_summaries="")` auto-selects `_context_aware_model` if prior summaries exist, `_standalone_model` for first meeting
- `storage/meeting_store.py` — added `get_prior_summaries(user_id, slug, current_meeting_id)` returns sorted chronological summaries of all other meetings
- `routers/meetings.py` — passes `prior_summaries` to `summarize()` call

### Registered users

| Name | Email | Role |
|------|-------|------|
| Rishabh Singh | admin@mail.com | admin |

---

## [2026-04-16] — Frontend UI Rebuild (Precision Dark Design System)

### Design system

- New CSS custom properties in `src/index.css`: `--color-*`, `--font-sans/mono/display`
- Fonts: DM Sans (body), JetBrains Mono (code/transcript), Syne (display headings)
- `tailwind.config.ts` updated to reference CSS vars for all colors and fonts
- New Tailwind token `text-2xs` (0.625rem) and `skeleton` utility class for shimmer loading

### New files created

- `src/store/toastStore.ts` — Zustand toast store with `useToast()` hook (success/error/info)
- `src/components/ui/Toast.tsx` — floating toast container with AnimatePresence, rendered in MainLayout
- `src/components/ui/SkeletonRow.tsx` — shimmer skeleton for loading states
- `src/components/ui/EmptyState.tsx` — icon + title + description + optional action CTA
- `src/components/layout/TopBar.tsx` — reusable header bar (title, subtitle, actions slot)
- `src/components/chat/TypingIndicator.tsx` — animated dots while AI is responding

### Updated components (key changes)

- `MainLayout.tsx` — added `<ToastContainer />`, removed IBM Plex font class
- `Sidebar.tsx` — uses Syne `font-display` for brand name, skeleton loading, toast feedback on delete
- `CreateProjectModal.tsx` — toast on success, reset state on close
- `DeleteProjectDialog.tsx` — `font-display` heading, backdrop blur
- `MeetingCard.tsx` — cleaner layout, `text-2xs` metadata, `cn()` for conditional classes
- `ProgressTracker.tsx` — added hint text per step, tabular-nums percent
- `TranscriptEditor.tsx` — removed separate explanation text block, tighter layout
- `SummaryViewer.tsx` — accordion-style transcript reveals (click to expand), `formatDuration` in header
- `UploadPanel.tsx` — drag-over state, toast on errors and success
- `ChatWindow.tsx` — uses `<TypingIndicator />` with AnimatePresence instead of inline dots
- `ChatInput.tsx` — capped `scrollHeight` at 160px inline
- `StarterChips.tsx` — hover state uses `bg-accent-muted` for consistency
- `WelcomePage.tsx` — `font-display` h1, tighter feature grid, smoother stagger delays
- `ProjectPage.tsx` — uses `TopBar`, `EmptyState`, `AnimatePresence mode="wait"` for panel transitions, toast on meeting delete

---

## [2026-04-16] — Streamlit Removal, Data Migration & Backend Logging

### Streamlit fully removed
All Streamlit files deleted from root: `app.py`, `audio_utils.py`, `config.py`, `logger.py`,
`meeting_store.py`, `project_manager.py`, `prompts.py`, `summarizer.py`, `transcriber.py`,
`requirements.txt`, `.env.example`, `gemini.txt`, `groq.txt` (plaintext key files).

Directories removed: `.streamlit/`, `.venv/`, `__pycache__/`, `logs/`, `temp/`, `projects/`.

Root now contains only: `.env`, `.gitignore`, `CLAUDE.md`, `.claude/`, `.git/`, `meeting-intelligence/`, test MP4.

### Existing project data migrated
Copied `projects/` (1 project — EISAI Accelerator, 7 meetings) to `meeting-intelligence/backend/projects/`.
Patched all 7 `meta.json` files to add `has_summary: true` (all had `summary.txt`) and `has_correction`.

### Model backward compatibility
Added `has_summary: bool = False` and `has_correction: bool = False` defaults to `MeetingMeta`
so old data without these fields loads without validation errors.

### API keys transferred
Copied root `.env` to `meeting-intelligence/backend/.env`.

### Backend logging added
New file: `meeting-intelligence/backend/logger.py`
- Same daily-rotating pattern as Streamlit app: `logs/YYYY-MM-DD.log`
- `_DailyFileHandler` — each day keeps its own named file, no renaming
- 90-day retention, file handler INFO+, console handler WARNING+
- Noisy loggers suppressed: httpx, google, urllib3, uvicorn.access, moviepy, multipart

Wired into:
- `main.py` — `setup_logging()` at import, lifespan logs startup/shutdown
- `services/audio_service.py` — logs extraction start/end, chunk count, cleanup
- `services/transcription_service.py` — logs duration, chunk progress, retries, completion
- `services/summarization_service.py` — logs transcript/summary char counts
- `services/chat_service.py` — logs question length, history turns, answer length
- `storage/project_store.py` — logs create/delete
- `storage/meeting_store.py` — logs record create, summary save, correction save, delete

### Config/docs updated
- `.gitignore` — rewritten for new stack (backend projects/, temp/, frontend node_modules/, media files)
- `CLAUDE.md` — updated to reflect React+FastAPI only, removed Streamlit references

---

## [2026-04-16] — Codebase Cleanup: Dead Code & API Mismatch Fixes

### Backend fixes

**`backend/models/meeting_models.py`**
- Added `has_summary: bool` to `MeetingMeta` (was stored in meta.json but never surfaced to clients)
- Flattened `MeetingDetail` — removed nested `meta: MeetingMeta`, inlined all fields directly so the response is flat
- Removed `meeting_id` from `SummarizeRequest` — it comes from the URL path, having it in the body was redundant

**`backend/storage/meeting_store.py`**
- Updated `get_meeting_detail()` to construct flat `MeetingDetail` instead of nesting under `meta:`

**`backend/routers/meetings.py`**
- Removed unused `import tempfile`
- Removed unused `from pathlib import Path`
- Removed `cleanup_files` from import — only `cleanup_temp_dir` is actually called

**`backend/services/audio_service.py`**
- Removed `from typing import List` — replaced all usages with built-in `list[str]` syntax

**`backend/storage/project_store.py`**
- Fixed `_compute()` return type annotation: `tuple[float, int, float]` → `tuple[float, float]` (returns 2 values, not 3)

### Frontend fixes — field name mismatches (critical, would break runtime)

**`frontend/src/types/project.ts`**
- Fixed `StorageInfo` interface: `used_mb` → `projects_size_mb`, `free_gb` → `free_disk_gb`, `projects_count` → `total_projects`

**`frontend/src/types/meeting.ts`**
- Fixed `MeetingMeta`: `id` → `meeting_id`, `filename` → `original_filename`, added `has_summary: boolean`
- Fixed `MeetingDetail`: now extends `MeetingMeta` (flat), not nested — matches backend response shape
- Removed `meeting_id` from `SummarizeRequest`

**`frontend/src/components/ui/StorageInfo.tsx`**
- Updated `info.used_mb` → `info.projects_size_mb`, `info.free_gb` → `info.free_disk_gb`

**`frontend/src/components/meetings/MeetingCard.tsx`**
- `meeting.filename` → `meeting.original_filename`

**`frontend/src/components/meetings/SummaryViewer.tsx`**
- `meeting.meta.filename` → `meeting.original_filename`, `meeting.meta.uploaded_at` → `meeting.uploaded_at` (flat struct)

**`frontend/src/components/projects/DeleteProjectDialog.tsx`**
- Removed unused `slug` prop from `Props` interface and destructuring

**`frontend/src/components/layout/Sidebar.tsx`**
- Removed `slug` prop from `<DeleteProjectDialog>` call site

**`frontend/src/pages/ProjectPage.tsx`**
- `m.id` → `m.meeting_id` in `key`, `isActive`, `onSelect`, `onDelete`

---

## [2026-04-16] — Phase 2: React + FastAPI App Complete

### What was built
Full production-grade rewrite of the Streamlit app into a React 18 + TypeScript frontend + FastAPI backend. Lives in `d:\Video summarizer\meeting-intelligence\`.

### Backend (22 files — `meeting-intelligence/backend/`)
- `main.py` — FastAPI app, CORS for localhost:5173, 3 routers under `/api`
- `config.py` — all constants, paths, API keys loaded from `.env`
- `models/` — Pydantic v2 strict: project_models, meeting_models, chat_models
- `storage/` — fully async via aiofiles: project_store, meeting_store
- `services/` — audio_service (moviepy+pydub), transcription_service, summarization_service, chat_service
- `routers/` — projects (6 endpoints), meetings (6 endpoints), chat (1 endpoint)

### Frontend (39 files — `meeting-intelligence/frontend/src/`)
- TypeScript strict mode, Vite + proxy to port 8000
- TanStack Query v5 for server state, Zustand for global state (active project, chat history)
- React Router v6 with 3 pages: WelcomePage, ProjectPage, NotFoundPage
- Components: Sidebar, CreateProjectModal, DeleteProjectDialog, UploadPanel, ProgressTracker, TranscriptEditor, SummaryViewer, MeetingCard, ChatWindow, ChatInput, StarterChips, StorageInfo, Badge
- Design: `#0A0A0F` bg, `#6366F1` accent, IBM Plex Sans/Mono fonts, Framer Motion animations

### Key design decisions
- Two-step upload: POST `/upload` returns transcript for review → POST `/{id}/summarize` adds summary
- File streaming in 1MB chunks with live size-check (500MB limit)
- MeetingDetail is flat (not nested) — all fields at top level
- `has_summary` and `has_correction` flags surfaced in every MeetingMeta response
- Chat history stored in Zustand, reset when switching projects

### Run commands
```bash
# Backend
cd meeting-intelligence/backend
.venv\Scripts\activate && uvicorn main:app --reload --port 8000

# Frontend
cd meeting-intelligence/frontend
npm run dev
# Open http://localhost:5173
```

---

## [2026-04-15] — Daily Rotating Log System Added

- `logger.py` — `_DailyFileHandler`, `setup_logging()`, `get_logger()`
- One log file per calendar day: `logs/YYYY-MM-DD.log`
- 90-day retention, file handler INFO+, console handler WARNING+
- Noisy third-party loggers suppressed to WARNING
- `logs/` is gitignored

---

## [2026-04-15] — Full App Rebuild: Multi-Project Architecture

Complete rewrite from single-session Streamlit app to persistent multi-project system.

New files: `config.py`, `project_manager.py`, `meeting_store.py`

Updated: `audio_utils.py`, `transcriber.py`, `summarizer.py`, `prompts.py`, `app.py`, `.streamlit/config.toml`

Architecture: projects/ folder on disk, JSON + txt files, state machine in app.py (None → reviewing_transcript → complete), Gemini multi-turn chat with full project context.

---

## [2026-04-15] — Chat Q&A + pydub Warning Fix

- Suppressed pydub false-alarm RuntimeWarning via `warnings.filterwarnings()` (imageio_ffmpeg binary is `ffmpeg-win64-v*.exe`, not `ffmpeg.exe`)
- Added `chat()` to `summarizer.py` with Gemini multi-turn and guardrails
- Added chat tab to `app.py` with starter chips and clear button

---

## [2026-04-15] — Integration Testing & Bug Fixes

1. pydub WinError 2 on Windows — fixed by configuring converter path via imageio_ffmpeg
2. Gemini 1.5 Flash 404 — upgraded to `gemini-2.5-flash`
3. Verified with real 44-min MP4: chunked to 6 WAV segments, transcribed, summarized successfully

---

## [2026-04-15] — Full Streamlit App Scaffolded

Initial app: `app.py`, `audio_utils.py`, `transcriber.py`, `summarizer.py`, `prompts.py`, `requirements.txt`, `.env`, `.env.example`, `.gitignore`

Run: `streamlit run app.py`
