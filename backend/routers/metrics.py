"""
Metrics + health endpoints.
GET /health          → basic liveness
GET /health/deep     → checks DB + Groq + S3 connectivity
GET /metrics         → response time stats, request counts
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from models.db import get_db, RepoAnalysis, BugReport
import time, os

router = APIRouter(tags=["health"])

# Simple in-process counters (reset on restart; use Prometheus in prod)
_stats = {"requests": 0, "errors": 0, "total_ms": 0.0}


def record(ms: float, error: bool = False):
    _stats["requests"] += 1
    _stats["total_ms"] += ms
    if error:
        _stats["errors"] += 1


@router.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


@router.get("/health/deep")
def health_deep(db: Session = Depends(get_db)):
    """Check DB, count rows. Add Groq + S3 pings here if needed."""
    checks = {}

    # DB check
    try:
        db.execute(text("SELECT 1"))
        repo_count = db.query(RepoAnalysis).count()
        bug_count  = db.query(BugReport).count()
        checks["database"] = {"status": "ok", "repos": repo_count, "bugs": bug_count}
    except Exception as e:
        checks["database"] = {"status": "error", "detail": str(e)}

    # Groq key present
    checks["groq"]   = {"status": "ok" if os.getenv("GROQ_API_KEY") else "missing"}
    checks["github"] = {"status": "ok" if os.getenv("GITHUB_TOKEN")  else "missing"}
    checks["s3"]     = {"status": "ok" if os.getenv("AWS_ACCESS_KEY_ID") else "not_configured"}

    overall = "ok" if all(v.get("status") == "ok" for v in checks.values()) else "degraded"
    return {"status": overall, "checks": checks}


@router.get("/metrics")
def metrics():
    reqs = _stats["requests"]
    avg  = round(_stats["total_ms"] / reqs, 1) if reqs else 0
    return {
        "total_requests": reqs,
        "total_errors":   _stats["errors"],
        "avg_latency_ms": avg,
        "error_rate":     f"{round(_stats['errors']/reqs*100,1)}%" if reqs else "0%",
    }
