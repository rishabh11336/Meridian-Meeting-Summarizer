# Meridian — AI Meeting Intelligence Platform

> An AI-powered meeting intelligence platform for transforming meeting recordings into searchable transcripts, structured summaries, and context-aware conversations.

Meridian is a full-stack AI application designed to help users capture, process, and interact with meeting information. It combines automated audio transcription, LLM-powered summarization, project-based organization, and conversational Q&A into a single workspace.

The application is built with a **FastAPI backend** and a **React + TypeScript frontend**, with AI capabilities powered by **Groq** and **Google Gemini**.

---

## ✨ Features

### 🎙️ Meeting Processing
- Upload meeting recordings for processing
- Extract audio from supported media formats
- Convert meeting audio into text using AI-powered transcription
- Store meeting-specific transcripts and metadata
- Organize meetings within projects

### 📝 AI-Powered Summarization
- Generate structured summaries from meeting transcripts
- Extract important information from long conversations
- Generate concise, context-aware meeting insights
- Reduce the effort required to review lengthy meetings

### 💬 Meeting & Project Q&A
- Chat with meeting information using natural language
- Ask questions about previously processed meetings
- Maintain project-level context across meetings
- Retrieve relevant information from meeting content

### 🔐 Authentication & Authorization
- User registration and authentication
- JWT-based authentication
- Password hashing
- Protected API endpoints
- User-scoped meeting and project access

### 📁 Project Organization
- Group related meetings into projects
- Maintain context across multiple meetings
- Manage project-level conversations
- Separate user data and meeting information

### 🖥️ Modern Web Interface
- React-based frontend
- TypeScript
- Responsive application layout
- Interactive meeting management
- Chat interface for AI-powered Q&A
- Project and meeting navigation

---

## 🏗️ Architecture

```text
                         ┌──────────────────────┐
                         │      React App       │
                         │   TypeScript + Vite  │
                         └──────────┬───────────┘
                                    │
                                  HTTP
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    FastAPI Backend   │
                         │                      │
                         │  ┌────────────────┐  │
                         │  │ Authentication │  │
                         │  │     / JWT      │  │
                         │  └────────────────┘  │
                         │                      │
                         │  ┌────────────────┐  │
                         │  │ Meeting APIs   │  │
                         │  └────────────────┘  │
                         │                      │
                         │  ┌────────────────┐  │
                         │  │ Project APIs   │  │
                         │  └────────────────┘  │
                         │                      │
                         │  ┌────────────────┐  │
                         │  │ Chat APIs      │  │
                         │  └────────────────┘  │
                         └──────────┬───────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
          ┌─────────────┐    ┌─────────────┐   ┌─────────────┐
          │   Groq      │    │   Gemini    │   │   Local     │
          │ Transcription│    │ Summarization│  │   Storage   │
          └─────────────┘    └─────────────┘   └─────────────┘
```

---

## 🧠 AI Pipeline

Meridian follows a multi-stage processing pipeline:

```text
Meeting Recording
       │
       ▼
┌─────────────────┐
│ Audio Extraction│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ AI Transcription│
│      (Groq)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Transcript   │
│    Processing   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ AI Summarization│
│     (Gemini)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Meeting Insights│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Contextual Chat │
│    & Q&A        │
└─────────────────┘
```

---

## 🛠️ Technology Stack

### Backend

| Technology       | Purpose                    |
| ---------------- | -------------------------- |
| Python           | Backend development        |
| FastAPI          | REST API framework         |
| Uvicorn          | ASGI server                |
| Pydantic         | Data validation            |
| JWT              | Authentication             |
| Passlib / bcrypt | Password hashing           |
| Aiofiles         | Asynchronous file handling |
| Python-dotenv    | Environment configuration  |

### AI / ML

| Technology     | Purpose                               |
| -------------- | ------------------------------------- |
| Groq           | AI-powered transcription              |
| Google Gemini  | LLM-based summarization and reasoning |
| MoviePy        | Media processing                      |
| PyDub          | Audio processing                      |
| ImageIO FFmpeg | Audio/video processing                |

### Frontend

| Technology     | Purpose                        |
| -------------- | ------------------------------ |
| React          | UI development                 |
| TypeScript     | Type-safe frontend development |
| Vite           | Frontend build tooling         |
| Tailwind CSS   | UI styling                     |
| React Router   | Client-side routing            |
| TanStack Query | Server-state management        |
| Axios          | API communication              |
| Zustand        | Client-side state management   |
| Framer Motion  | UI animations                  |
| React Markdown | Markdown rendering             |
| Radix UI       | Accessible UI primitives       |
| Lucide React   | Icons                          |

---

## 📂 Project Structure

```text
Meridian-Meeting-Summarizer/
│
├── meeting-intelligence/
│   │
│   ├── backend/
│   │   ├── auth/
│   │   │   ├── dependencies.py
│   │   │   └── tokens.py
│   │   │
│   │   ├── models/
│   │   │   ├── chat_models.py
│   │   │   ├── meeting_models.py
│   │   │   ├── project_models.py
│   │   │   └── user_models.py
│   │   │
│   │   ├── routers/
│   │   │   ├── admin.py
│   │   │   ├── auth.py
│   │   │   ├── chat.py
│   │   │   ├── meetings.py
│   │   │   └── projects.py
│   │   │
│   │   ├── services/
│   │   │   ├── audio_service.py
│   │   │   ├── chat_service.py
│   │   │   ├── summarization_service.py
│   │   │   └── transcription_service.py
│   │   │
│   │   ├── storage/
│   │   │   ├── meeting_store.py
│   │   │   ├── project_store.py
│   │   │   └── user_store.py
│   │   │
│   │   ├── config.py
│   │   ├── logger.py
│   │   ├── main.py
│   │   ├── prompts.py
│   │   ├── requirements.txt
│   │   └── .env.example
│   │
│   └── frontend/
│       ├── src/
│       │   ├── api/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── stores/
│       │   ├── types/
│       │   ├── App.tsx
│       │   └── main.tsx
│       │
│       ├── package.json
│       ├── package-lock.json
│       └── vite.config.ts
│
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure the following are installed:

- Python 3.10+
- Node.js 18+
- npm
- FFmpeg
- Groq API key
- Google Gemini API key

### 1. Clone the Repository

```bash
git clone https://github.com/rishabh11336/Meridian-Meeting-Summarizer.git
cd Meridian-Meeting-Summarizer
```

### 2. Backend Setup

Navigate to the backend:

```bash
cd meeting-intelligence/backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it.

#### macOS / Linux

```bash
source .venv/bin/activate
```

#### Windows

```bash
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file inside `meeting-intelligence/backend/` and add:

```env
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
```

Never commit actual API keys or secrets to GitHub.

### 4. Start the Backend

From the backend directory:

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

Interactive API documentation is available at:

- `http://localhost:8000/docs`
- `http://localhost:8000/redoc`

### 5. Frontend Setup

Open another terminal and navigate to the frontend:

```bash
cd meeting-intelligence/frontend
npm install
npm run dev
```

The frontend will normally be available at `http://localhost:5173`.

---

## 🔐 Authentication

Meridian uses JWT-based authentication.

```text
User
 │
 ▼
Registration / Login
 │
 ▼
Password Verification
 │
 ▼
JWT Token
 │
 ▼
Authenticated API Requests
 │
 ▼
Protected Resources
```

User-specific access is enforced at the API layer so meetings and projects are associated with the authenticated user.

---

## 🎧 Meeting Processing

A typical meeting workflow looks like this:

```text
1. User uploads recording
             ↓
2. Backend receives media
             ↓
3. Audio is extracted / processed
             ↓
4. Audio is sent for transcription
             ↓
5. Transcript is generated
             ↓
6. Transcript is summarized
             ↓
7. Meeting information is stored
             ↓
8. User can search / chat with meeting context
```

---

## 💬 AI Meeting Chat

Meridian provides a conversational interface over meeting information.

Users can ask questions such as:

```text
"What were the main decisions from this meeting?"

"Who was responsible for the API implementation?"

"What were the unresolved issues?"

"Summarize the discussion around the launch timeline."
```

The backend uses project and meeting context to generate responses through the configured LLM service.

---

## 📁 Storage

The current implementation uses application-level local storage rather than a managed external database.

The backend contains dedicated storage modules for:

- Users
- Meetings
- Projects

These are separated from the API routers and AI service layer to keep storage operations modular.

> For production deployment, the storage layer can be replaced or extended with a persistent database and object storage solution.

---

## 🔒 Security Considerations

The project is designed to keep credentials outside the source code. Environment variables are used for AI API credentials and JWT configuration.

Do not commit:

```text
.env
API keys
JWT secrets
meeting recordings
meeting transcripts
user data
generated application storage
```

The repository includes `.gitignore` rules to prevent local application data and environment files from being committed.

---

## 🧩 Backend Design

The backend follows a layered structure:

```text
Routers
   │
   ▼
Services
   │
   ▼
Storage
```

### Routers

Responsible for HTTP endpoints and request/response handling.

### Services

Encapsulate application and AI logic such as:

- Audio processing
- Transcription
- Summarization
- Chat

### Storage

Handles persistence and retrieval of:

- Users
- Projects
- Meetings

This separation makes individual components easier to modify and test.

---

## 📡 API Modules

The backend currently exposes functionality around:

### Authentication

```text
/auth
```

Handles user registration, login, authentication, and token handling.

### Meetings

```text
/meetings
```

Handles meeting creation, processing, retrieval, and meeting-related operations.

### Projects

```text
/projects
```

Handles project creation, management, and project-level organization.

### Chat

```text
/chat
```

Handles AI conversations and meeting/project-contextual Q&A.

---

## 🧪 Development

Run the backend in development mode:

```bash
cd meeting-intelligence/backend
uvicorn main:app --reload --port 8000
```

Run the frontend:

```bash
cd meeting-intelligence/frontend
npm run dev
```

Build the frontend:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

---

## 🗺️ Roadmap

The project is actively evolving.

Potential future improvements include:

- [ ] Microsoft Teams integration
- [ ] Google Meet integration
- [ ] Calendar integration
- [ ] Cloud object storage
- [ ] Production database
- [ ] Background processing for long recordings
- [ ] Meeting search and semantic retrieval
- [ ] Speaker identification
- [ ] Action-item tracking
- [ ] Meeting analytics
- [ ] Enterprise authentication
- [ ] Production deployment
- [ ] Scalable asynchronous processing

---

## 🎯 Why Meridian?

Meetings generate large amounts of unstructured information.

Meridian aims to transform that information into an accessible knowledge layer:

```text
Raw Meeting
     ↓
Transcription
     ↓
Structured Information
     ↓
AI Summarization
     ↓
Searchable Knowledge
     ↓
Conversational Interface
```

Instead of manually reviewing an hour-long meeting, users can interact directly with the information generated from it.

---

## 📌 Current Status

Meridian is currently under active development.

The core application includes:

- Full-stack web architecture
- FastAPI backend
- React/TypeScript frontend
- JWT authentication
- Meeting processing
- AI transcription
- AI summarization
- Project organization
- Context-aware meeting chat

External integrations such as Microsoft Teams are planned for future iterations.

---

## 👨‍💻 Author

**Rishabh Singh**

Data Scientist | Machine Learning | AI | Generative AI

- GitHub: [rishabh11336](https://github.com/rishabh11336)
- Portfolio: [rishabhsingh.me](https://rishabhsingh.me)

---

## 📄 License

This project is currently intended for educational, experimental, and portfolio purposes.

Add an appropriate open-source license before accepting external contributions or redistributing the project.
