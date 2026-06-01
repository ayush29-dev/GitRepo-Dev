# GitRepo-Dev 🚀

AI-powered GitHub repository analysis — bug detection, code explanation, README generation, and optimization suggestions. Built with a Chrome Extension, FastAPI backend, and React dashboard.

![Build](https://img.shields.io/badge/build-passing-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![Version](https://img.shields.io/badge/version-1.0.0-informational)

---

## What It Does

| Feature | Where |
|---------|-------|
| 🔍 Repo review — purpose, stack, quality score | Chrome Extension + Dashboard |
| 🐛 Bug detection — 4 severity levels, fix suggestions | Chrome Extension + Dashboard |
| 💡 Code explainer — highlight any code on GitHub | Chrome Extension |
| 📄 README generator — full markdown, uploaded to S3 | Chrome Extension + Dashboard |
| ⚡ Optimization suggester — complexity + N+1 flags | Chrome Extension + Dashboard |
| 📊 History dashboard — trends, doc coverage, reports | React Dashboard |

---

## Architecture

```
Chrome Extension (MV3)
       ↓  sends code + repo name
FastAPI on localhost:8000
       ↓  LangChain + Groq (Llama 3)
MySQL Database          AWS S3
       ↓                    ↓
React Dashboard (localhost:5173)
```

---

## Prerequisites

Install these before starting:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18+ | https://nodejs.org |
| Python | 3.10+ | https://python.org |
| MySQL | 8.0+ | https://dev.mysql.com/downloads |
| Git | any | https://git-scm.com |

---

## Project Structure

```
gitrepo-dev/
├── src/                    ← React dashboard (Vite + Tailwind)
│   ├── pages/              ← Dashboard, Repos, Bugs, Docs, Reports, Generator
│   ├── components/         ← Sidebar, Topbar, generator tabs
│   ├── api/client.js       ← calls FastAPI backend
│   └── data/mockData.js    ← fallback mock data
├── backend/                ← FastAPI backend
│   ├── main.py             ← server entry point
│   ├── routers/            ← analyze.py, generate.py
│   ├── services/           ← llm.py, github.py, storage.py
│   ├── models/db.py        ← SQLAlchemy MySQL models
│   └── requirements.txt
├── extension/              ← Chrome Extension (MV3)
│   ├── manifest.json
│   ├── background.js       ← service worker
│   ├── content.js          ← injected into GitHub pages
│   ├── popup.html/js       ← extension icon popup
│   ├── sidebar.html/js/css ← built React sidebar
│   └── sidebar/src/        ← sidebar source (Vite + React)
│       └── tabs/           ← RepoTab, BugsTab, ExplainTab, ReadmeTab, OptimizeTab
└── README.md
```

---

## Step 1 — Get API Keys (free)

You need 2 mandatory keys and 2 optional ones.

### 1a. Groq API Key (free — required for LLM)

1. Go to https://console.groq.com
2. Sign up / log in
3. Click **API Keys** → **Create API Key**
4. Copy the key — starts with `gsk_`

### 1b. GitHub Token (free — required for repo analysis)

1. Go to https://github.com/settings/tokens
2. Click **Generate new token (classic)**
3. Give it a name e.g. `gitrepo-dev`
4. Check the `repo` scope (read access to public repos)
5. Click **Generate token** — copy it (starts with `ghp_`)

### 1c. AWS Credentials (optional — needed only for S3 uploads)

> Skip this if you don't want S3 uploads yet. The app works without it — download buttons just won't work.

1. Log into https://console.aws.amazon.com
2. Go to **IAM** → **Users** → your user → **Security credentials**
3. Click **Create access key** → choose **Local code**
4. Copy `Access key ID` and `Secret access key`
5. Create an S3 bucket named `gitrepo-dev-reports` in region `ap-south-1`

---

## Step 2 — Clone & Set Up Environment Files

```bash
# 1. Clone the repo (or unzip the project)
git clone https://github.com/yourusername/gitrepo-dev.git
cd gitrepo-dev
```

### Frontend `.env`

```bash
# In the gitrepo-dev/ root folder:
cp .env.example .env
```

Open `.env` and set:

```env
VITE_API_URL=http://localhost:8000
```

### Backend `.env`

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in your keys:

```env
GROQ_API_KEY=gsk_...          ← paste your Groq key
GITHUB_TOKEN=ghp_...          ← paste your GitHub token

DB_HOST=localhost
DB_PORT=3306
DB_NAME=gitrepo_dev
DB_USER=root
DB_PASS=yourpassword          ← your MySQL root password

AWS_ACCESS_KEY_ID=...         ← optional, for S3
AWS_SECRET_ACCESS_KEY=...     ← optional, for S3
AWS_REGION=ap-south-1
S3_BUCKET=gitrepo-dev-reports

CORS_ORIGINS=http://localhost:5173
```

---

## Step 3 — Set Up MySQL Database

```bash
# Open MySQL as root
mysql -u root -p

# Create the database (run inside MySQL shell)
CREATE DATABASE gitrepo_dev;
exit;
```

> Tables are created automatically when the backend starts — you don't need to run any SQL scripts.

---

## Step 4 — Start the Backend

```bash
cd backend

# Create Python virtual environment
python3 -m venv venv

# Activate it
# On Mac/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

You should see:

```
✅  Database tables ready
✅  GitRepo-Dev API running at http://localhost:8000
📖  Swagger UI at http://localhost:8000/docs
```

> Keep this terminal open. Open a new terminal for the next step.

**Test it's working:**

```bash
curl http://localhost:8000/health
# → {"status":"ok","version":"1.0.0"}
```

Visit http://localhost:8000/docs to see all endpoints and test them in the browser.

---

## Step 5 — Start the React Dashboard

Open a **new terminal**:

```bash
# From the gitrepo-dev/ root folder
npm install
npm run dev
```

You should see:

```
  ➜  Local:   http://localhost:5173/
```

Open http://localhost:5173 in your browser. You'll see the full dashboard with:

- **Dashboard** — metrics, bug trend charts, recent repos
- **Repositories** — filterable table
- **Bug Reports** — severity-ranked bug list
- **Doc Coverage** — coverage charts
- **Reports** — S3 download links
- **Generator** — README, docstrings, API docs, optimization tabs

> The dashboard shows mock data by default. Once the backend is running and you analyze real repos, it will show real data.

---

## Step 6 — Load the Chrome Extension

1. Open Chrome and go to `chrome://extensions`
2. Turn on **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Navigate to and select the `extension/` folder inside your project
5. The GitRepo-Dev icon (⚡) will appear in your Chrome toolbar

**Test it:**

1. Go to any GitHub repo e.g. https://github.com/tiangolo/fastapi
2. Click the ⚡ extension icon in your toolbar
3. Click **Open Sidebar**
4. The AI sidebar slides in from the right
5. Click **🔍 Analyze Repo** — waits ~10-15 seconds, then shows quality scores and summary

**Text selection (Code Explainer):**

1. Go to any `.py` or `.js` file on GitHub
2. Highlight any function with your mouse
3. The sidebar automatically switches to the **💡 Explain** tab with your code pre-filled
4. Click **Explain Code**

---

## Step 7 — Rebuild the Sidebar (only needed after editing sidebar source)

If you edit any file inside `extension/sidebar/src/`, you need to rebuild:

```bash
cd extension/sidebar
npm install       # only needed first time
npm run build     # outputs sidebar.js + sidebar.css into extension/
```

Then go to `chrome://extensions` and click the **↺ refresh** icon on the GitRepo-Dev card.

---

## Running Everything Together

You need **2 terminals** running simultaneously:

| Terminal | Command | URL |
|----------|---------|-----|
| Terminal 1 | `cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000` | http://localhost:8000 |
| Terminal 2 | `npm run dev` (in project root) | http://localhost:5173 |

---

## API Endpoints Reference

| Method | Endpoint | What it does |
|--------|----------|-------------|
| POST | `/analyze/repo` | Full repo review — fetches GitHub, LLM scoring |
| POST | `/analyze/bugs` | Bug detection on a pasted file |
| POST | `/analyze/explain` | Explain a code snippet |
| POST | `/generate/docs` | Add JSDoc/docstrings, upload to S3 |
| POST | `/generate/readme` | Generate full README.md, upload to S3 |
| POST | `/generate/api-docs` | Generate API docs from router code |
| POST | `/optimize/suggest` | Optimization suggestions |
| GET | `/history/{repo_id}` | Full analysis history for a repo |
| GET | `/reports/{id}/download` | Presigned S3 download URL |
| DELETE | `/history/{repo_id}` | Delete repo + all related data |
| GET | `/health` | Health check |

Full interactive docs: http://localhost:8000/docs

---

## Common Issues

**Backend won't start — `ModuleNotFoundError`**

```bash
# Make sure virtualenv is activated
source venv/bin/activate   # Mac/Linux
venv\Scripts\activate      # Windows

pip install -r requirements.txt
```

**`Access denied` MySQL error**

```bash
# Check your DB_USER and DB_PASS in backend/.env
# Test connection manually:
mysql -u root -p -e "SHOW DATABASES;"
```

**Chrome extension: `Could not establish connection`**

- Make sure the FastAPI backend is running on port 8000
- Check that `http://localhost:8000/*` is in `manifest.json` under `host_permissions`
- Reload the extension at `chrome://extensions`

**Groq `401 Unauthorized`**

- Double-check `GROQ_API_KEY` in `backend/.env` — must start with `gsk_`
- Get a new key at https://console.groq.com/keys

**GitHub `403 rate limit`**

- Make sure `GITHUB_TOKEN` is set in `backend/.env`
- Verify the token has `repo` scope at https://github.com/settings/tokens

**Extension sidebar is blank**

```bash
# Rebuild the sidebar
cd extension/sidebar
npm run build

# Then reload extension at chrome://extensions
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Chrome Extension | MV3, Vanilla JS + React (sidebar) |
| Frontend Dashboard | React 18, Vite, Tailwind CSS, Recharts |
| Backend | Python, FastAPI, Uvicorn |
| LLM Pipeline | LangChain, Groq (Llama 3.1) |
| Database | MySQL 8, SQLAlchemy |
| File Storage | AWS S3, boto3 |
| GitHub Integration | GitHub REST API v3, httpx |

---

## License

MIT — free to use, modify, and distribute.
