"""
Generation + history endpoints — 7 routes:

  POST   /generate/docs          → add docstrings to a file, upload to S3
  POST   /generate/readme        → generate full README.md, upload to S3
  POST   /generate/api-docs      → generate API docs from router code
  POST   /optimize/suggest       → optimization suggestions (stateless)
  GET    /history/{repo_id}      → full analysis history for a repo
  GET    /reports/{id}/download  → fresh presigned S3 download URL
  DELETE /history/{repo_id}      → delete repo + all related data
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.db import get_db, RepoAnalysis, BugReport, GeneratedReport
from services import llm, storage

router = APIRouter(tags=["generate"])


# ── Request schemas ───────────────────────────────────────────────────────────

class DocsRequest(BaseModel):
    repo_full_name: str
    file_path: str
    code: str
    language: str = "Python"   # "Python", "JavaScript", "TypeScript", "C", etc.

class ReadmeRequest(BaseModel):
    repo_full_name: str
    purpose: str               # "A React library for building UIs"
    stack: str                 # "JS/TypeScript, Rollup, Jest"
    api_endpoints: list[str] = []   # optional list of endpoint strings
    setup_steps: list[str]   = []   # optional setup instructions

class OptimizeRequest(BaseModel):
    repo_full_name: str
    file_path: str
    code: str

class ApiDocsRequest(BaseModel):
    repo_full_name: str
    router_code: str   # source code of a FastAPI/Express router file


# ════════════════════════════════════════════════════════════════════════════════
# POST /generate/docs
# ════════════════════════════════════════════════════════════════════════════════

@router.post("/generate/docs")
async def generate_docs(req: DocsRequest, db: Session = Depends(get_db)):
    """
    Insert JSDoc/docstring comments into every function and class in a file.

    Flow:
      1. LLM annotates the code (chunked for large files)
      2. Annotated code uploaded to S3
      3. Report record saved to MySQL
      4. Return presigned download URL + preview
    """
    # Step 1 — LLM adds docstrings
    annotated_code = llm.generate_docstrings(req.code, req.language)

    # Step 2 — upload to S3, get back the file path (key)
    s3_key    = storage.upload_text(annotated_code, req.repo_full_name, "docs", ext="txt")
    file_size = storage.get_file_size(s3_key)

    # Step 3 — save to MySQL
    repo_record = _get_or_create_repo(db, req.repo_full_name)
    report = GeneratedReport(
        repo_id=repo_record.id,
        report_type="docs",
        s3_key=s3_key,
        file_size=file_size,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Step 4 — return URL + short preview
    return {
        "report_id":    report.id,
        "file_path":    req.file_path,
        "s3_key":       s3_key,
        "download_url": storage.get_presigned_url(s3_key),  # valid 1 hour
        "file_size":    file_size,
        # Preview first 500 chars so frontend can show a snippet
        "preview": annotated_code[:500] + "…" if len(annotated_code) > 500 else annotated_code,
    }


# ════════════════════════════════════════════════════════════════════════════════
# POST /generate/readme
# ════════════════════════════════════════════════════════════════════════════════

@router.post("/generate/readme")
async def generate_readme(req: ReadmeRequest, db: Session = Depends(get_db)):
    """
    Generate a complete README.md with badges, setup guide, API reference.

    The generated README is stored in S3 AND the S3 key is saved on the
    RepoAnalysis record so the dashboard can always find it.
    """
    # Step 1 — LLM generates Markdown
    readme_markdown = llm.generate_readme(
        req.repo_full_name,
        req.purpose,
        req.stack,
        req.api_endpoints,
        req.setup_steps,
    )

    # Step 2 — upload .md file to S3
    s3_key    = storage.upload_text(readme_markdown, req.repo_full_name, "readme", ext="md")
    file_size = storage.get_file_size(s3_key)

    # Step 3 — save report + update repo record with readme key
    repo_record = _get_or_create_repo(db, req.repo_full_name)
    repo_record.readme_s3_key = s3_key   # store on repo so dashboard can find it

    report = GeneratedReport(
        repo_id=repo_record.id,
        report_type="readme",
        s3_key=s3_key,
        file_size=file_size,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "report_id":    report.id,
        "s3_key":       s3_key,
        "download_url": storage.get_presigned_url(s3_key),
        "file_size":    file_size,
        "preview": readme_markdown[:800] + "…" if len(readme_markdown) > 800 else readme_markdown,
    }


# ════════════════════════════════════════════════════════════════════════════════
# POST /generate/api-docs
# ════════════════════════════════════════════════════════════════════════════════

@router.post("/generate/api-docs")
async def generate_api_docs(req: ApiDocsRequest, db: Session = Depends(get_db)):
    """
    Generate Markdown API documentation from a router source file.
    Pass in your FastAPI or Express router code — get back formatted docs.
    """
    system = (
        "You are a technical writer. Generate API documentation from router source code. "
        "Use markdown tables for parameters. Return raw Markdown only."
    )
    user = f"""
Router source code:
```
{req.router_code[:6000]}
```

For every endpoint, document:
- HTTP method + path (as heading)
- Description
- Request body / query params (markdown table: Field | Type | Required | Description)
- Response schema (JSON example)
- Example curl command
"""
    # Direct LLM call (no chunking needed — router files are small)
    from services.llm import _call_llm
    docs_markdown = _call_llm(system, user)

    s3_key    = storage.upload_text(docs_markdown, req.repo_full_name, "api-docs", ext="md")
    file_size = storage.get_file_size(s3_key)

    repo_record = _get_or_create_repo(db, req.repo_full_name)
    report = GeneratedReport(
        repo_id=repo_record.id,
        report_type="docs",
        s3_key=s3_key,
        file_size=file_size,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "report_id":    report.id,
        "s3_key":       s3_key,
        "download_url": storage.get_presigned_url(s3_key),
        "preview":      docs_markdown[:800],
    }


# ════════════════════════════════════════════════════════════════════════════════
# POST /optimize/suggest
# ════════════════════════════════════════════════════════════════════════════════

@router.post("/optimize/suggest")
async def optimize(req: OptimizeRequest):
    """
    Profile code for time/space complexity issues.
    Stateless — no DB write, called live from the Chrome extension sidebar.
    Returns a ranked list of optimization suggestions.
    """
    suggestions = llm.suggest_optimizations(req.code)
    return {
        "file":        req.file_path,
        "total":       len(suggestions),
        "suggestions": suggestions,
    }


# ════════════════════════════════════════════════════════════════════════════════
# GET /history/{repo_id}
# ════════════════════════════════════════════════════════════════════════════════

@router.get("/history/{repo_id}")
def get_history(repo_id: int, db: Session = Depends(get_db)):
    """
    Return the full analysis record + all bugs for a repo.
    This is what the React dashboard's Repositories page calls
    when a user clicks on a repo to see details.
    """
    record = db.query(RepoAnalysis).filter(RepoAnalysis.id == repo_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"No repo found with id={repo_id}")

    bugs = db.query(BugReport).filter(BugReport.repo_id == repo_id).all()
    reports = db.query(GeneratedReport).filter(GeneratedReport.repo_id == repo_id).all()

    return {
        "id":            record.id,
        "repo":          record.repo_full_name,
        "stack":         record.stack,
        "total_files":   record.total_files,
        "quality_score": record.quality_score,
        "doc_score":     record.doc_score,
        "summary":       record.summary,
        "analyzed_at":   record.analyzed_at,
        "bugs": [
            {
                "id":          b.id,
                "severity":    b.severity,
                "bug_type":    b.bug_type,
                "file_path":   b.file_path,
                "line_number": b.line_number,
                "language":    b.language,
                "description": b.description,
                "suggestion":  b.suggestion,
            }
            for b in bugs
        ],
        "reports": [
            {
                "id":          r.id,
                "type":        r.report_type,
                "file_size":   r.file_size,
                "created_at":  r.created_at,
            }
            for r in reports
        ],
    }


# ════════════════════════════════════════════════════════════════════════════════
# GET /reports/{report_id}/download
# ════════════════════════════════════════════════════════════════════════════════

@router.get("/reports/{report_id}/download")
def download_report(report_id: int, db: Session = Depends(get_db)):
    """
    Generate a fresh presigned S3 URL for a report.
    Called when user clicks "Download" in the React dashboard.

    We generate a NEW URL each time because presigned URLs expire after 1 hour.
    The S3 key is stored in MySQL permanently — only the URL changes.
    """
    report = db.query(GeneratedReport).filter(GeneratedReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"No report found with id={report_id}")

    return {
        "report_id":    report.id,
        "download_url": storage.get_presigned_url(report.s3_key),
        "expires_in":   "1 hour",
    }


# ════════════════════════════════════════════════════════════════════════════════
# DELETE /history/{repo_id}
# ════════════════════════════════════════════════════════════════════════════════

@router.delete("/history/{repo_id}")
def delete_history(repo_id: int, db: Session = Depends(get_db)):
    """
    Delete a repo analysis + all its bugs + all its reports.
    The cascade="all, delete-orphan" on the model handles child deletion.
    """
    record = db.query(RepoAnalysis).filter(RepoAnalysis.id == repo_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"No repo found with id={repo_id}")

    db.delete(record)
    db.commit()
    return {"deleted": repo_id, "message": f"Deleted repo {record.repo_full_name} and all related data"}


# ── Helper: get or create a repo record ──────────────────────────────────────

def _get_or_create_repo(db: Session, repo_full_name: str) -> RepoAnalysis:
    """
    Find the most recent analysis for a repo, or create a new blank record.
    Used by generate endpoints that need a parent repo_id to link reports to.
    """
    record = (
        db.query(RepoAnalysis)
        .filter(RepoAnalysis.repo_full_name == repo_full_name)
        .order_by(RepoAnalysis.analyzed_at.desc())
        .first()
    )
    if not record:
        record = RepoAnalysis(repo_full_name=repo_full_name)
        db.add(record)
        db.commit()
        db.refresh(record)
    return record
