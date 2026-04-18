# Meeting Intelligence

> **Claude: Read all files in `.claude/` folder at the start of every session.**

## Stack
React 18 + TypeScript frontend · FastAPI backend · Groq Whisper · Gemini 2.5 Flash

## App Location
All code lives in `meeting-intelligence/`:
- `meeting-intelligence/backend/` — FastAPI + Python
- `meeting-intelligence/frontend/` — React + TypeScript

## Memory Location

All persistent memory is in:

```
.claude/
├── README.md       ← Memory system index
├── project.md      ← Architecture, file map, decisions
├── progress.md     ← Running progress log
└── preferences.md  ← User preferences & workflow rules
```

## Run
```bash
# Backend (meeting-intelligence/backend/)
.venv\Scripts\activate && uvicorn main:app --reload --port 8000

# Frontend (meeting-intelligence/frontend/)
npm run dev
```
Open: http://localhost:5173
