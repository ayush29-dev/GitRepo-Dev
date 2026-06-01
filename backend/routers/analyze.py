"""
Analysis endpoints — 3 routes:

  POST /analyze/repo     → full repo review (fetches from GitHub + LLM)
  POST /analyze/bugs     → bug detection on one file
  POST /analyze/explain  → explain a code snippet (stateless, no DB)

How FastAPI routes work:
  @router.post("/analyze/repo")   ← decorator registers the URL + method
  async def analyze_repo(...)     ← async because we call GitHub (network I/O)
  req: RepoRequest                ← FastAPI auto-parses JSON body into this class
  db: Session = Depends(get_db)   ← FastAPI auto-creates+closes a DB session
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.db import get_db, RepoAnalysis, BugReport
from services import llm, github

# APIRouter groups related routes — we mount this in main.py
router = APIRouter(tags=["analyze"])


# ── Request schemas (Pydantic validates incoming JSON automatically) ───────────

class RepoRequest(BaseModel):
    repo_full_name: str   # must be "owner/repo" format e.g. "facebook/react"

class BugRequest(BaseModel):
    repo_full_name: str   # which repo this file belongs to
    file_path: str        # e.g. "src/renderer.c"
    code: str             # the raw file content to analyze

class ExplainRequest(BaseModel):
    snippet: str          # highlighted code from the Chrome extension
    language: str = "auto"  # optional — LLM can auto-detect


# ════════════════════════════════════════════════════════════════════════════════
# POST /analyze/repo
# ════════════════════════════════════════════════════════════════════════════════

@router.post("/analyze/repo")
async def analyze_repo(req: RepoRequest, db: Session = Depends(get_db)):
    """
    Full repo analysis pipeline:
      1. Parse "owner/repo" from request
      2. Fetch file tree, README, and top files from GitHub API
      3. Send to LLM for quality scoring and summary
      4. Save result to MySQL repo_analyses table
      5. Return the analysis as JSON

    Takes ~5-15 seconds depending on repo size and Groq response time.
    """

    # Step 1 — parse "facebook/react" into owner="facebook", repo="react"
    try:
        owner, repo = req.repo_full_name.split("/", 1)
    except ValueError:
        # If format is wrong, return HTTP 400 with a clear error message
        raise HTTPException(status_code=400, detail="repo_full_name must be 'owner/repo' e.g. 'facebook/react'")

    # Step 2 — fetch from GitHub (these run sequentially; could parallelize later)
    tree      = await github.get_repo_tree(owner, repo)
    readme    = await github.get_readme(owner, repo)
    top_files = await github.get_top_files(owner, repo, tree)

    # Build a plain text file list to send to LLM (first 100 files)
    file_tree_str = "\n".join(f["path"] for f in tree[:100])

    # Step 3 — LLM analysis (returns dict with purpose, stack, scores, summary)
    result = llm.analyze_repo(readme, file_tree_str, top_files)

    # Step 4 — save to MySQL
    record = RepoAnalysis(
        repo_full_name=req.repo_full_name,
        stack=result.get("stack", "Unknown"),
        total_files=len(tree),
        quality_score=float(result.get("quality_score", 0)),
        doc_score=float(result.get("doc_score", 0)),
        summary=result.get("summary", ""),
    )
    db.add(record)
    db.commit()
    db.refresh(record)  # loads the auto-generated id back into the object

    # Step 5 — return JSON response
    return {
        "id":            record.id,
        "repo":          req.repo_full_name,
        "purpose":       result.get("purpose"),
        "stack":         record.stack,
        "quality_score": record.quality_score,
        "doc_score":     record.doc_score,
        "summary":       record.summary,
        "total_files":   record.total_files,
        "analyzed_at":   record.analyzed_at,
    }


# ════════════════════════════════════════════════════════════════════════════════
# POST /analyze/bugs
# ════════════════════════════════════════════════════════════════════════════════

@router.post("/analyze/bugs")
async def analyze_bugs(req: BugRequest, db: Session = Depends(get_db)):
    """
    Bug detection on a single file.

    Flow:
      1. Find (or create) the repo record in MySQL
      2. Run LLM bug detection on the file content
      3. Save each bug as a BugReport row in MySQL
      4. Return the list of bugs with severity + fix suggestions

    Why "or create"? The Chrome extension might send a file for bug detection
    before a full /analyze/repo call has been made for that repo.
    """

    # Step 1 — find existing repo record, or create a minimal one
    repo_record = (
        db.query(RepoAnalysis)
        .filter(RepoAnalysis.repo_full_name == req.repo_full_name)
        .order_by(RepoAnalysis.analyzed_at.desc())
        .first()
    )
    if not repo_record:
        repo_record = RepoAnalysis(repo_full_name=req.repo_full_name)
        db.add(repo_record)
        db.commit()
        db.refresh(repo_record)

    # Step 2 — LLM bug detection (chunked for large files)
    bugs = llm.detect_bugs(req.code, req.file_path)

    # Step 3 — save each bug to MySQL
    saved_bugs = []
    for bug in bugs:
        row = BugReport(
            repo_id=repo_record.id,
            severity=bug["severity"],
            bug_type=bug.get("bug_type", "Unknown"),
            file_path=bug.get("file_path", req.file_path),
            line_number=bug.get("line_number"),
            language=bug.get("language", "Unknown"),
            description=bug.get("description", ""),
            suggestion=bug.get("suggestion", ""),
        )
        db.add(row)
        saved_bugs.append(row)

    db.commit()

    # Step 4 — return results
    return {
        "repo":       req.repo_full_name,
        "file":       req.file_path,
        "total_bugs": len(saved_bugs),
        "bugs": [
            {
                "severity":    b.severity,
                "bug_type":    b.bug_type,
                "file_path":   b.file_path,
                "line_number": b.line_number,
                "language":    b.language,
                "description": b.description,
                "suggestion":  b.suggestion,
            }
            for b in saved_bugs
        ],
    }


# ════════════════════════════════════════════════════════════════════════════════
# POST /analyze/explain
# ════════════════════════════════════════════════════════════════════════════════

@router.post("/analyze/explain")
async def explain_code(req: ExplainRequest):
    """
    Explain a highlighted code snippet. Stateless — no DB write.
    Called directly from the Chrome extension sidebar when user highlights code.
    Fast: single LLM call, no GitHub fetch needed.
    """
    result = llm.explain_code(req.snippet, req.language)
    return result
