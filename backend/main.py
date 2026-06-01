"""
GitRepo-Dev · FastAPI Backend — Entry Point

How to run:
  uvicorn main:app --reload --port 8000

  --reload means the server restarts automatically when you save a file.
  Remove --reload in production.

After starting, visit:
  http://localhost:8000/docs    ← Swagger UI — test every endpoint in browser
  http://localhost:8000/health  ← quick health check
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from models.db import init_db
from routers.analyze  import router as analyze_router
from routers.generate import router as generate_router

load_dotenv()  # reads your .env file into os.environ

# ── Create FastAPI app ────────────────────────────────────────────────────────
app = FastAPI(
    title="GitRepo-Dev API",
    description="AI-powered GitHub repo analysis — bug detection, code explanation, doc generation.",
    version="1.0.0",
    # docs_url="/docs" is the default Swagger UI path
)

# ── CORS middleware ───────────────────────────────────────────────────────────
# CORS (Cross-Origin Resource Sharing) — browsers block requests from one
# domain to another by default. This middleware tells the browser:
# "It's OK for http://localhost:5173 (React) to call this API."
# Without this, your React dashboard would get a CORS error.
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # which frontend URLs can call us
    allow_credentials=True,
    allow_methods=["*"],        # GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],        # Content-Type, Authorization, etc.
)

# ── Register routers ──────────────────────────────────────────────────────────
# This adds all routes from analyze.py and generate.py to the app
app.include_router(analyze_router)
app.include_router(generate_router)

# ── Startup event ─────────────────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    """
    Runs once when the server starts.
    Creates MySQL tables if they don't exist yet — safe to run every time.
    """
    init_db()
    print("✅  Database tables ready")
    print("✅  GitRepo-Dev API running at http://localhost:8000")
    print("📖  Swagger UI at http://localhost:8000/docs")

# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["meta"])
def health_check():
    """
    Simple endpoint to check if the server is running.
    AWS load balancers and monitoring tools ping this to verify uptime.
    """
    return {"status": "ok", "version": "1.0.0"}

# ── Quick reference of all endpoints ─────────────────────────────────────────
"""
METHOD  PATH                        DESCRIPTION
──────  ──────────────────────────  ─────────────────────────────────────────
POST    /analyze/repo               Full repo review — GitHub fetch + LLM scoring
POST    /analyze/bugs               Bug detection on a single file
POST    /analyze/explain            Explain highlighted code snippet
POST    /generate/docs              Add JSDoc/docstrings + upload to S3
POST    /generate/readme            Generate full README.md + upload to S3
POST    /generate/api-docs          Generate API docs from router code
POST    /optimize/suggest           Optimization suggestions
GET     /history/{repo_id}          Full analysis + bugs for a repo
GET     /reports/{id}/download      Presigned S3 download URL (1hr)
DELETE  /history/{repo_id}          Delete repo + all related data
GET     /health                     Health check
GET     /docs                       Swagger UI (auto-generated)
"""
