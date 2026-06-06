# GitRepo-Dev — Full Setup Guide

Everything needed to run all 3 parts: React dashboard, FastAPI backend, Chrome extension.

---

## 0. Prerequisites

| Tool | Min version | Install |
|------|------------|---------|
| Node.js | 18+ | https://nodejs.org |
| Python | 3.10+ | https://python.org |
| MySQL | 8.0+ | https://dev.mysql.com/downloads/mysql |
| Git | any | https://git-scm.com |
| Chrome | any | https://google.com/chrome |

---

## 1. Clone the Repo

```bash
git clone https://github.com/ayush29-dev/GitRepo-Dev.git
cd GitRepo-Dev
```

---

## 2. Get API Keys

### Groq (free — LLM provider)
1. Sign up at https://console.groq.com
2. **API Keys → Create API Key**
3. Copy key — starts with `gsk_`

### GitHub Token (free — repo fetching)
1. Go to https://github.com/settings/tokens
2. **Generate new token (classic)**
3. Check `repo` scope → **Generate token**
4. Copy key — starts with `ghp_`

### AWS (optional — only needed for S3 uploads/downloads)
1. Log in at https://console.aws.amazon.com
2. **IAM → Users → your user → Security credentials → Create access key**
3. Choose **Local code** → copy both keys
4. Create S3 bucket named `gitrepo-dev-reports` in region `ap-south-1`

> Skip AWS if you don't need file downloads yet. App runs fine without it.

---

## 3. Create MySQL Database

```bash
# Open MySQL
mysql -u root -p

# Inside MySQL shell:
CREATE DATABASE gitrepo_dev;
exit;
```

> Tables are auto-created on first backend start — no SQL scripts needed.

---

## 4. Configure Environment Files

### Frontend `.env` (in project root)

```bash
cp .env.example .env
```

Contents:
```env
VITE_API_URL=http://localhost:8000
```

### Backend `.env` (in `backend/` folder)

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in:

```env
# Required
GROQ_API_KEY=gsk_...
GITHUB_TOKEN=ghp_...

# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gitrepo_dev
DB_USER=root
DB_PASS=your_mysql_password

# AWS S3 (optional)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-south-1
S3_BUCKET=gitrepo-dev-reports

# App
CORS_ORIGINS=http://localhost:5173
```

---

## 5. Start the Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate (Mac/Linux)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

# Install packages
pip install -r requirements.txt

# Start server
uvicorn main:app --reload --port 8000
```

Expected output:
```
✅  Database tables ready
✅  GitRepo-Dev API running → http://localhost:8000
📖  Swagger UI → http://localhost:8000/docs
```

Test it:
```bash
curl http://localhost:8000/health
# → {"status":"ok","version":"1.0.0"}

curl http://localhost:8000/health/deep
# → shows DB + Groq + GitHub + S3 status
```

> Keep this terminal open. Open a new terminal for the frontend.

---

## 6. Start the React Dashboard

Open a **new terminal** in project root:

```bash
npm install
npm run dev
```

Open http://localhost:5173

Pages available:
- **Dashboard** — metrics, charts, recent repos
- **Repositories** — filterable repo table
- **Bug Reports** — severity-ranked bugs
- **Doc Coverage** — coverage charts + progress bars
- **Reports** — S3 report downloads
- **Generator** — README, docstrings, API docs, optimization tabs

---

## 7. Load the Chrome Extension

```bash
# Build the sidebar first (only needed once, or after editing sidebar source)
cd extension/sidebar
npm install
npm run build
cd ../..
```

Then in Chrome:
1. Open `chrome://extensions`
2. Enable **Developer mode** (toggle, top right)
3. Click **Load unpacked**
4. Select the `extension/` folder
5. The ⚡ GitRepo-Dev icon appears in your toolbar

Test:
1. Go to https://github.com/tiangolo/fastapi
2. Click the ⚡ toolbar icon → **Open Sidebar**
3. Click **🔍 Analyze Repo** — takes ~10-15s
4. Scores, summary, and stack appear in the sidebar

**Highlight-to-explain:**
1. Open any file on GitHub (e.g. a `.py` file)
2. Select any function with your mouse
3. Sidebar auto-switches to **💡 Explain** tab with code pre-filled

---

## 8. Run Everything Together

You need **2 terminals** running simultaneously:

| Terminal | Directory | Command |
|----------|-----------|---------|
| 1 — Backend | `backend/` | `source venv/bin/activate && uvicorn main:app --reload --port 8000` |
| 2 — Frontend | project root | `npm run dev` |

---

## 9. Rebuild After Changes

| Changed | Command |
|---------|---------|
| `extension/sidebar/src/**` | `cd extension/sidebar && npm run build` then reload extension at `chrome://extensions` |
| `src/**` (dashboard) | Auto-reloads — Vite HMR handles it |
| `backend/**` | Auto-reloads — `--reload` flag handles it |

---

## 10. Pulling Updates

After each dev session, pull new files:

```bash
git pull origin main
```

If backend deps changed:
```bash
cd backend && pip install -r requirements.txt
```

If frontend deps changed:
```bash
npm install
```

---

## API Quick Reference

| Method | Endpoint | What it does |
|--------|----------|-------------|
| GET | `/health` | Liveness check |
| GET | `/health/deep` | DB + key connectivity check |
| GET | `/metrics` | Request count + avg latency |
| POST | `/analyze/repo` | Full repo review + scoring |
| POST | `/analyze/bugs` | Bug detection on a file |
| POST | `/analyze/explain` | Explain a code snippet |
| POST | `/generate/docs` | Add docstrings, upload to S3 |
| POST | `/generate/readme` | Generate README.md, upload to S3 |
| POST | `/generate/api-docs` | Generate API docs from router code |
| POST | `/optimize/suggest` | Optimization suggestions |
| GET | `/history/{repo_id}` | Full history for a repo |
| GET | `/reports/{id}/download` | Presigned S3 download URL |
| DELETE | `/history/{repo_id}` | Delete repo + all data |

Interactive docs: http://localhost:8000/docs

---

## Troubleshooting

**`ModuleNotFoundError` on backend start**
```bash
source venv/bin/activate   # activate virtualenv first
pip install -r requirements.txt
```

**MySQL `Access denied`**
```bash
# Check credentials in backend/.env
mysql -u root -p -e "SHOW DATABASES;"  # test connection
```

**Groq `401 Unauthorized`**
- Verify `GROQ_API_KEY` starts with `gsk_`
- Get new key: https://console.groq.com/keys

**GitHub `403 rate limit`**
- Verify `GITHUB_TOKEN` is set and has `repo` scope
- Check: https://github.com/settings/tokens

**Chrome extension blank sidebar**
```bash
cd extension/sidebar && npm run build
# Then reload at chrome://extensions
```

**`Could not establish connection` in extension**
- Backend must be running on port 8000
- Check `host_permissions` in `extension/manifest.json` includes `http://localhost:8000/*`

**CORS error in dashboard**
- Verify `CORS_ORIGINS=http://localhost:5173` in `backend/.env`
- Restart backend after changing `.env`

---

## Project Structure

```
GitRepo-Dev/
├── src/                        ← React dashboard
│   ├── pages/                  ← Dashboard, Repos, Bugs, Docs, Reports, Generator
│   ├── components/             ← Sidebar, Topbar, generator tabs
│   ├── api/client.js           ← API calls to FastAPI
│   └── data/mockData.js        ← fallback mock data
├── backend/
│   ├── main.py                 ← FastAPI entry point
│   ├── routers/                ← analyze.py, generate.py, metrics.py
│   ├── services/               ← llm.py, github.py, storage.py
│   ├── middleware/             ← errors.py, ratelimit.py
│   ├── models/db.py            ← SQLAlchemy models (3 tables)
│   └── requirements.txt
├── extension/
│   ├── manifest.json           ← MV3 config
│   ├── background.js           ← service worker
│   ├── content.js              ← injected into GitHub
│   ├── popup.html/js           ← toolbar icon popup
│   ├── sidebar.html/js/css     ← built React sidebar
│   └── sidebar/src/            ← sidebar source
│       └── tabs/               ← 5 feature tabs
├── .github/workflows/ci.yml    ← GitHub Actions CI
├── README.md
└── SETUP.md                    ← this file
```
