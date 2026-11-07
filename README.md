# DocuMind AI

**Tagline:** Your Documents. Your AI. Your Answers.  
**Product Type:** AI-Powered Document Intelligence SaaS  
**Version:** 1.0.0

DocuMind AI is an intelligent document assistant that allows users to upload PDF documents, extract their contents, and ask natural-language questions through an interactive AI chat interface with verifiable, page-accurate citations and source excerpts.

---

## 🌟 Key Features

- **End-to-End RAG Pipeline:** PDF text extraction via PyMuPDF, page-aware chunking (800-token chunks with 120-token overlap), vector embedding generation, and pgvector cosine distance search.
- **Clickable Page Citations:** Every factual response derived from document chunks includes `[Page X]` citation buttons. Clicking a citation jumps the document viewer directly to that page and highlights relevant text.
- **Hallucination Prevention:** The assistant is strictly instructed to answer only from retrieved chunks. Unsupported questions produce an honest fallback: *"I couldn't find sufficient information about this in the uploaded document."*
- **Multi-Tenant Security:** Every document, vector chunk, and conversation is strictly isolated by user ID with row-level ownership checks.
- **Provider Abstraction:** Agnostic to AI providers—easily switch between OpenAI (`gpt-4o-mini`, `text-embedding-3-small`), Google Gemini (`gemini-1.5-flash`, `text-embedding-004`), or offline test/dev mock mode.
- **Document & Collections Management:** Group documents into collections, track upload and vectorization statuses (`uploading`, `queued`, `extracting`, `chunking`, `embedding`, `ready`, `failed`).
- **Modern Responsive UI:** Built with React 19, TypeScript, Tailwind CSS, Lucide Icons, and React Markdown with dark/light mode support.

---

## 🏗️ Technology Stack

### Frontend
- **Framework:** React 19 / 18 with TypeScript & Vite
- **Styling:** Tailwind CSS with custom branding (#635BFF accent) & dark mode
- **Icons:** Lucide React
- **Markdown & Citations:** React Markdown with custom citation tokenizer
- **State & Routing:** React Router v6/v7, Context API, TanStack Query

### Backend
- **Framework:** Python 3.12+, FastAPI, Pydantic v2
- **ORM & Database:** SQLAlchemy 2, Alembic migrations, PostgreSQL 16 with pgvector extension (with SQLite vector fallback for offline testing/development)
- **Document Ingestion:** PyMuPDF (`pymupdf`)
- **Authentication & Security:** JWT (HS256) + bcrypt password hashing

### Infrastructure
- **Docker Compose:** Multi-container PostgreSQL with pgvector
- **Testing:** Pytest (Backend), Vitest & React Testing Library (Frontend)

---

## 📁 Project Structure

```
documind-ai/
├── backend/
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── .env.example
│   ├── migrations/
│   │   ├── env.py
│   │   └── versions/
│   │       └── 001_initial_schema.py
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── security.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── document.py
│   │   │   ├── chunk.py
│   │   │   ├── conversation.py
│   │   │   └── collection.py
│   │   ├── schemas/
│   │   │   ├── auth.py
│   │   │   ├── document.py
│   │   │   ├── chat.py
│   │   │   └── collection.py
│   │   ├── services/
│   │   │   ├── storage_service.py
│   │   │   ├── pdf_service.py
│   │   │   ├── chunking_service.py
│   │   │   ├── embedding_service.py
│   │   │   ├── llm_service.py
│   │   │   ├── retrieval_service.py
│   │   │   └── chat_service.py
│   │   ├── workers/
│   │   │   └── document_processor.py
│   │   └── api/
│   │       ├── deps.py
│   │       └── routes/
│   │           ├── auth.py
│   │           ├── documents.py
│   │           ├── chat.py
│   │           ├── collections.py
│   │           └── health.py
│   └── tests/
│       ├── conftest.py
│       ├── test_auth.py
│       ├── test_documents.py
│       └── test_chat.py
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── AppLayout.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── documents/
│   │   │   │   ├── UploadDropzone.tsx
│   │   │   │   └── StatusBadge.tsx
│   │   │   ├── chat/
│   │   │   │   ├── ChatPanel.tsx
│   │   │   │   └── CitationPill.tsx
│   │   │   └── viewer/
│   │   │       └── DocumentViewer.tsx
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── DocumentsPage.tsx
│   │   │   ├── DocumentWorkspacePage.tsx
│   │   │   ├── CollectionsPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   └── test/
├── docker-compose.yml
└── README.md
```

---

## ⚡ Quick Start & Local Setup

### 1. Database (PostgreSQL with pgvector)
Run the provided Docker Compose stack:
```bash
docker compose up -d
```
*Note: If Docker is not installed locally, the backend automatically uses SQLite fallback with in-memory vector cosine similarity for instant local development and testing.*

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

Apply database migrations:
```bash
alembic upgrade head
```

Run backend server:
```bash
uvicorn app.main:app --reload --port 8000
```
Open API docs: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open the app: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Testing

### Backend Tests (pytest)
Runs auth, upload, processing pipeline, page preservation, multi-tenancy isolation, citations, and health check tests:
```bash
cd backend
.\venv\Scripts\pytest tests -v
```

### Frontend Tests (vitest)
Runs UI component tests (status badge, citation pill, handlers):
```bash
cd frontend
npm run test
```

### Frontend Production Build
```bash
cd frontend
npm run build
```

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` — Register a new account
- `POST /api/auth/login` — Sign in and obtain JWT
- `POST /api/auth/logout` — Revoke session
- `GET /api/auth/me` — Authenticated user profile

### Documents
- `POST /api/documents/upload` — Upload PDF file
- `GET /api/documents` — List user's documents
- `GET /api/documents/{id}` — Get document metadata
- `GET /api/documents/{id}/status` — Check ingestion status (`uploading`, `extracting`, `chunking`, `embedding`, `ready`, `failed`)
- `GET /api/documents/{id}/pages/{page}` — Get extracted text of page
- `GET /api/documents/{id}/file` — Stream/download PDF file
- `DELETE /api/documents/{id}` — Delete document and associated chunks/conversations

### Chat & Q&A
- `POST /api/documents/{id}/chat` — Ask question and receive grounded answer with citations
- `GET /api/conversations` — List conversations
- `GET /api/conversations/{id}` — Get conversation messages and citations
- `DELETE /api/conversations/{id}` — Delete conversation

### Collections
- `POST /api/collections` — Create collection
- `GET /api/collections` — List collections
- `POST /api/collections/{id}/documents/{doc_id}` — Add document to collection
- `DELETE /api/collections/{id}/documents/{doc_id}` — Remove document from collection
- `DELETE /api/collections/{id}` — Delete collection

### System
- `GET /api/health` — Check system, database, and AI provider configuration

---

## 🔒 Security & Privacy

1. **Password Hashing:** Passwords are never stored in plaintext (hashed with bcrypt).
2. **Access Control:** User ownership is strictly verified on every single endpoint.
3. **Prompt Injection Defense:** PDF document text is treated purely as untrusted data in the LLM context.
4. **Environment Variables:** API keys and credentials are never exposed to the frontend client.

---

## 📜 License
MIT License.
