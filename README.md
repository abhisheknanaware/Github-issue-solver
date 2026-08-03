# 🤖 GitHub Issue Solver Agent

An AI-powered full-stack engineering agent designed to autonomously index repositories, analyze GitHub issues, retrieve semantic codebase context via RAG (Retrieval-Augmented Generation), generate targeted solutions, and facilitate contributions.

---

## 🚀 Features

- **GitHub Repository Indexing & Vector Search**: Indexes codebase files into Pinecone vector database using OpenAI embeddings.
- **AI Issue Resolution Engine**: Uses OpenAI models with RAG retrieval to diagnose issues, understand codebase semantics, and propose concrete solutions or fixes.
- **GitHub Integration**: Connects with GitHub repositories, fetches issues, commits, file trees, and contribution metadata.
- **Modern Full-Stack Architecture**:
  - **Frontend**: React 19, Vite, Tailwind CSS, Lucide icons, Zustand state management, React Router.
  - **Backend**: Node.js, Express 5, MongoDB with Mongoose, Pinecone vector client, OpenAI SDK, Passport GitHub OAuth, JWT authentication.

---

## 📁 Project Structure

```text
├── backend/
│   ├── src/
│   │   ├── agents/          # Agent orchestration and prompt handlers
│   │   ├── config/          # Database, auth, and environment configs
│   │   ├── controllers/     # API request controllers (auth, issues, rag, repos)
│   │   ├── middleware/      # Authentication & error handling middleware
│   │   ├── models/          # MongoDB schemas (User, Repo, Issue, etc.)
│   │   ├── rag/             # Pinecone vector indexing, embedding & retrieval
│   │   ├── routes/          # Express route definitions
│   │   └── server.js        # Express app entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API client configurations
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Application views (Dashboard, Issues, Contributions)
│   │   ├── store/           # Zustand stores
│   │   └── App.jsx
│   ├── .env.example
│   └── package.json
│
├── .gitignore               # Root gitignore protecting secrets & node_modules
├── run_servers.py           # Unified runner for local development
└── README.md
```

---

## 🛠️ Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas cluster)
- [OpenAI API Key](https://platform.openai.com/)
- [Pinecone API Key](https://www.pinecone.io/)
- [GitHub Personal Access Token](https://github.com/settings/tokens) / OAuth App credentials

---

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```
4. Fill in your credentials in `backend/.env`:
   - `PORT=5000`
   - `MONGO_URI=your_mongodb_connection_string`
   - `JWT_SECRET=your_secret_key`
   - `GITHUB_CLIENT_ID=your_github_client_id`
   - `GITHUB_CLIENT_SECRET=your_github_client_secret`
   - `GITHUB_TOKEN=your_github_token`
   - `OPENAI_API_KEY=your_openai_api_key`
   - `PINECONE_API_KEY=your_pinecone_api_key`
   - `PINECONE_INDEX=ai-engineer-agent`

---

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```
4. Configure `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_BACKEND_URL=http://localhost:5000
   ```

---

### 4. Running the Application

You can start both frontend and backend concurrently:

#### Option A: Running separately
- **Backend**:
  ```bash
  cd backend
  npm run dev
  ```
- **Frontend**:
  ```bash
  cd frontend
  npm run dev
  ```

#### Option B: Unified Python Runner
From the root directory:
```bash
python run_servers.py
```

Frontend runs at `http://localhost:5173` and backend runs at `http://localhost:5000`.

---

## 🔒 Security Note

- Make sure **never** to commit `.env` or sensitive API keys to GitHub.
- The repository is pre-configured with [.gitignore](file:///.gitignore) to protect keys and dependencies.
