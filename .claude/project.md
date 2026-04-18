# Project Context

## Project Name
Meridian — Meeting Intelligence Platform

## Goal
Production-grade multi-user meeting intelligence platform: upload meeting videos, transcribe with Groq Whisper, summarize with Gemini (context-aware across prior meetings), correct transcripts, chat with AI across all meeting history, with full JWT-based role access control.

## Current Status
🟢 **Phase 3 Complete** — Auth system, RBAC, UI rebuild, cost optimization, context-aware summaries all shipped.

---

## Stack

### Backend (`meeting-intelligence/backend/`)
- **Framework**: FastAPI + Pydantic v2
- **Auth**: JWT (python-jose HS256) + bcrypt password hashing (passlib + bcrypt==3.2.2)
- **Transcription**: Groq `whisper-large-v3-turbo` (2.8× cheaper than large-v3, near-identical quality)
- **Summarization**: Gemini 2.5 Flash — standalone for first meeting, context-aware for subsequent
- **Chat**: Gemini 2.5 Flash — summaries-only context (not full transcripts, ~18× cheaper)
- **Storage**: JSON + plain text on disk, fully async via aiofiles
- **Logging**: Daily rotating log files (`logs/YYYY-MM-DD.log`)
- **Audio**: moviepy + pydub + imageio_ffmpeg (no system ffmpeg)

### Frontend (`meeting-intelligence/frontend/`)
- **Framework**: React 18 + TypeScript strict, Vite
- **State**: TanStack Query v5 (server), Zustand with persist (client + auth)
- **Routing**: React Router v6 with AuthGuard
- **HTTP**: Axios — Bearer token interceptor, 401 → redirect to /login
- **UI**: TailwindCSS (CSS custom property tokens), Framer Motion, Lucide icons
- **Fonts**: DM Sans (body), JetBrains Mono (code), Syne (display headings)
- **Markdown**: react-markdown + remark-gfm (summaries and chat responses)
- **Design**: `#0A0A0F` bg, `#111118` surface, `#6366F1` accent, "Precision Dark" system

---

## Data Storage Layout (current)

```
backend/
  users/
    {user_id}.json             ← {id, email, display_name, password_hash, role, created_at, is_active}

  projects/
    {user_id}/                 ← per-user isolation
      project_index.json
      {slug}/
        project_meta.json
        meetings/
          {meeting_id}/
            meta.json
            transcript_raw.txt
            transcript_corrected.txt   (optional)
            summary.txt                (optional)

  temp/                        ← in-flight audio/video, cleared after each job
  logs/                        ← YYYY-MM-DD.log, 90-day retention
```

---

## Roles

| Role | Permissions |
|------|-------------|
| `admin` | Own projects + GET/PATCH/DELETE `/api/admin/users/*` |
| `member` | Own projects only — fully isolated from other users |

- First user to register → automatically `admin`
- All subsequent → `member`
- Admins can promote/demote, deactivate, or delete any user

---

## Auth Flow

1. `POST /api/auth/register` → returns JWT + user object
2. `POST /api/auth/login` → returns JWT + user object
3. All `/api/projects/**`, `/api/admin/**`, `/api/auth/me` require `Authorization: Bearer {token}`
4. Token stored in `localStorage` via Zustand `persist` (key: `meridian-auth`)
5. Axios request interceptor reads token from localStorage and attaches header
6. Axios response interceptor: 401 → clear storage → redirect to `/login`
7. Frontend `AuthGuard` route wrapper checks store token; redirects to `/login` if missing

---

## Backend Key Files

| File | Purpose |
|------|---------|
| `main.py` | FastAPI app, CORS, lifespan (runs legacy data migration on startup) |
| `config.py` | All constants: paths, model names, JWT settings, API keys from .env |
| `auth/tokens.py` | `hash_password`, `verify_password`, `create_access_token`, `decode_access_token` |
| `auth/dependencies.py` | `get_current_user`, `require_admin` FastAPI dependencies |
| `models/user_models.py` | `UserRecord`, `UserPublic`, `RegisterRequest`, `LoginRequest`, `TokenResponse` |
| `models/project_models.py` | `ProjectMeta`, `ProjectCreate`, `StorageInfo` |
| `models/meeting_models.py` | `MeetingMeta`, `MeetingDetail`, `TranscriptionResult`, etc. |
| `models/chat_models.py` | `ChatMessage`, `ChatRequest`, `ChatResponse` |
| `storage/user_store.py` | Async user CRUD (one JSON file per user in `users/`) |
| `storage/project_store.py` | Async project CRUD — all ops take `user_id` param |
| `storage/meeting_store.py` | Async meeting CRUD, `get_prior_summaries()`, `build_project_context()` |
| `services/audio_service.py` | `extract_audio`, `get_duration`, `chunk_audio`, `cleanup_temp_dir` |
| `services/transcription_service.py` | `transcribe()` — auto-chunks audio (12 min per chunk) |
| `services/summarization_service.py` | `summarize(transcript, prior_summaries="")` — two modes |
| `services/chat_service.py` | `answer_question()` — Gemini multi-turn, summaries-only context |
| `routers/auth.py` | register, login, me |
| `routers/admin.py` | list/update/delete users (admin only) |
| `routers/projects.py` | CRUD + /storage (all user-scoped) |
| `routers/meetings.py` | upload, summarize, correction, list, get, delete (all user-scoped) |
| `routers/chat.py` | POST /projects/{slug}/chat (user-scoped) |
| `prompts.py` | `SUMMARIZER_SYSTEM_PROMPT` + `CONTEXT_AWARE_SUMMARIZER_PROMPT` + `PROJECT_CHAT_PROMPT` |
| `logger.py` | Daily rotating log setup, 90-day retention |

---

## Frontend Key Files

| Path | Purpose |
|------|---------|
| `src/types/auth.ts` | `User`, `TokenResponse`, `RegisterPayload`, `LoginPayload` |
| `src/types/project.ts` | `ProjectMeta`, `StorageInfo` |
| `src/types/meeting.ts` | `MeetingMeta`, `MeetingDetail`, `TranscriptionResult`, `SummarizeRequest` |
| `src/types/chat.ts` | `ChatMessage` |
| `src/api/client.ts` | Axios instance + Bearer token interceptor + 401 redirect interceptor |
| `src/api/authApi.ts` | `register`, `login`, `getMe`, `listUsers`, `updateUser`, `deleteUser` |
| `src/api/projectsApi.ts` | Project CRUD + storage |
| `src/api/meetingsApi.ts` | Meeting upload, summarize, correction, CRUD |
| `src/api/chatApi.ts` | `sendMessage` |
| `src/store/authStore.ts` | Zustand persist: `token`, `user`, `setAuth`, `logout` |
| `src/store/appStore.ts` | Zustand: `activeProjectSlug`, `chatHistory` |
| `src/store/toastStore.ts` | Zustand toast queue + `useToast()` hook |
| `src/hooks/useProjects.ts` | TanStack Query hooks for projects |
| `src/hooks/useMeetings.ts` | TanStack Query hooks for meetings |
| `src/hooks/useChat.ts` | Chat send/history |
| `src/components/auth/AuthGuard.tsx` | Route wrapper — redirects to /login if no token |
| `src/components/layout/MainLayout.tsx` | Root layout (Sidebar + Outlet + ToastContainer) |
| `src/components/layout/Sidebar.tsx` | Project list + user info + logout |
| `src/components/layout/TopBar.tsx` | Per-page header bar |
| `src/components/ui/Toast.tsx` | Floating toast container |
| `src/components/ui/Badge.tsx` | Status badges |
| `src/components/ui/EmptyState.tsx` | Icon + title + CTA empty state |
| `src/components/ui/SkeletonRow.tsx` | Shimmer loading skeleton |
| `src/components/ui/StorageInfo.tsx` | Disk usage panel with progress bar |
| `src/components/projects/CreateProjectModal.tsx` | Framer Motion modal |
| `src/components/projects/DeleteProjectDialog.tsx` | Confirm delete dialog |
| `src/components/meetings/UploadPanel.tsx` | Drop zone + upload flow |
| `src/components/meetings/ProgressTracker.tsx` | Step-by-step upload progress |
| `src/components/meetings/TranscriptEditor.tsx` | Review/edit transcript before summarizing |
| `src/components/meetings/SummaryViewer.tsx` | Markdown-rendered summary + transcript accordions |
| `src/components/meetings/MeetingCard.tsx` | Meeting list item |
| `src/components/chat/ChatWindow.tsx` | Full chat panel |
| `src/components/chat/ChatMessage.tsx` | Markdown-rendered message bubble |
| `src/components/chat/ChatInput.tsx` | Auto-resize textarea + send button |
| `src/components/chat/StarterChips.tsx` | Suggestion chips |
| `src/components/chat/TypingIndicator.tsx` | Animated dots while AI responds |
| `src/pages/LoginPage.tsx` | Sign in form |
| `src/pages/RegisterPage.tsx` | Create account form |
| `src/pages/WelcomePage.tsx` | Landing for authenticated users |
| `src/pages/ProjectPage.tsx` | Main project view (meetings tab + chat tab) |

---

## API Endpoints

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Any user |
| GET | `/api/admin/users` | Admin |
| PATCH | `/api/admin/users/{id}` | Admin |
| DELETE | `/api/admin/users/{id}` | Admin |
| GET | `/api/projects` | Any user |
| POST | `/api/projects` | Any user |
| GET | `/api/projects/{slug}` | Any user |
| PATCH | `/api/projects/{slug}` | Any user |
| DELETE | `/api/projects/{slug}` | Any user |
| GET | `/api/storage` | Any user |
| GET | `/api/projects/{slug}/meetings` | Any user |
| POST | `/api/projects/{slug}/meetings/upload` | Any user |
| GET | `/api/projects/{slug}/meetings/{id}` | Any user |
| POST | `/api/projects/{slug}/meetings/{id}/summarize` | Any user |
| PATCH | `/api/projects/{slug}/meetings/{id}/correction` | Any user |
| DELETE | `/api/projects/{slug}/meetings/{id}` | Any user |
| POST | `/api/projects/{slug}/chat` | Any user |

---

## Known Decisions

- **No database** — JSON + text files on disk (intentional: simple, portable, no infra)
- **JWT only** — no refresh tokens (24hr expiry, re-login after that)
- **bcrypt==3.2.2** — passlib 1.7.4 incompatible with bcrypt 4.x+ (detect_wrap_bug test crashes on 72-byte limit added in bcrypt 4.0; must stay on 3.x)
- **coi-serviceworker** — provides COOP/COEP cross-origin isolation per browser tab for FFmpeg.wasm SharedArrayBuffer; registered as first script in index.html; avoids setting COEP server-wide which breaks Google Fonts and OAuth
- **Summaries-only chat context** — not full transcripts (~18× token reduction)
- **Standalone vs context-aware summarization** — automatically selected based on whether prior summaries exist
- **whisper-large-v3-turbo** — 2.8× cheaper, chosen over large-v3 for meeting audio
- **12-min audio chunks** — up from 8 min (fewer API calls, still under Groq 25MB limit)
- **pydub warning suppressed** — imageio_ffmpeg binary not named `ffmpeg.exe`
- **Legacy data migration** — runs on startup; moves old `projects/{slug}/` into `projects/{admin_user_id}/`

---

## Run Commands

```bash
# Backend
cd meeting-intelligence/backend
uvicorn main:app --reload --port 8000

# Frontend
cd meeting-intelligence/frontend
npm run dev
```

Open: http://localhost:5173

---

## Registered Users

| Name | Email | Role |
|------|-------|------|
| Rishabh Singh | admin@mail.com | admin |
