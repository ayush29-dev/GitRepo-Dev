# GitRepo-Dev · Backend

FastAPI backend — 6 LLM analysis endpoints + MySQL + S3.

## Quick start (local)

```bash
cd backend

# 1. Create virtualenv
python3 -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate

# 2. Install deps
pip install -r requirements.txt

# 3. Copy env file and fill in your keys
cp .env.example .env

# 4. Start MySQL locally (or use Docker)
docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=yourpassword -e MYSQL_DATABASE=gitrepo_dev mysql:8

# 5. Run server
uvicorn main:app --reload --port 8000
# → http://localhost:8000
# → http://localhost:8000/docs   (Swagger UI — all endpoints interactive)
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/analyze/repo` | Full repo review — fetches GitHub, scores quality |
| POST | `/analyze/bugs` | Bug detection on a file (4 severity levels) |
| POST | `/analyze/explain` | Explain highlighted code snippet |
| POST | `/generate/docs` | Add JSDoc/docstrings, upload to S3 |
| POST | `/generate/readme` | Generate full README.md, upload to S3 |
| POST | `/generate/api-docs` | Generate API docs from router source |
| POST | `/optimize/suggest` | Complexity profiling + optimization suggestions |
| GET | `/history/{repo_id}` | Full analysis history for a repo |
| GET | `/reports/{id}/download` | Presigned S3 download URL (1hr expiry) |
| DELETE | `/history/{repo_id}` | Delete repo + all related data |
| GET | `/health` | Health check |

## Connect frontend

In `frontend/src/`, create `src/api/client.js`:

```js
const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function analyzeRepo(repoFullName) {
  const res = await fetch(`${BASE}/analyze/repo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo_full_name: repoFullName }),
  });
  return res.json();
}
```

Then replace mock data imports in your pages with real API calls.
