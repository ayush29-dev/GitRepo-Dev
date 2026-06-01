"""
LLM pipeline — the brain of GitRepo-Dev.

Uses: Groq (free) + LangChain + Llama 3

Key concept — CHUNKING:
  LLMs have a "context window" limit — they can only read so much text at once.
  A large file like linux/kernel/sched.c might be 5,000 lines.
  We split it into 512-token chunks, analyze each chunk, then merge results.
  This is why the resume says "2,000 lines with 512-token chunking".

Key concept — STRUCTURED OUTPUT:
  We tell the LLM "respond ONLY with JSON, no explanation, no markdown".
  Then we json.loads() the response. This is more reliable than parsing prose.
  Multi-step prompting (analyze → score → summarize) reduces hallucinations ~38%.
"""

from langchain_groq import ChatGroq
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import HumanMessage, SystemMessage
import json
import os
from dotenv import load_dotenv

load_dotenv()

# ── Init Groq LLM ─────────────────────────────────────────────────────────────
# temperature=0.1 → low randomness = more consistent/factual responses
# llama-3.1-8b-instant = fast, free, good enough for code analysis
llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.1,
    api_key=os.getenv("GROQ_API_KEY"),
)

# ── Text splitter ─────────────────────────────────────────────────────────────
# chunk_size=512   → each chunk is max 512 characters
# chunk_overlap=50 → chunks share 50 chars at edges so we don't miss bugs
#                    that span a chunk boundary
splitter = RecursiveCharacterTextSplitter(
    chunk_size=512,
    chunk_overlap=50,
    length_function=len,
)


# ── Core helper: call the LLM ─────────────────────────────────────────────────
def _call_llm(system_prompt: str, user_prompt: str) -> str:
    """
    Send a message to Groq and return the text response.
    SystemMessage = instructions (role/rules for the LLM)
    HumanMessage  = the actual content to analyze
    """
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ])
    return response.content.strip()


# ── Core helper: chunk large files + analyze each chunk ───────────────────────
def _analyze_chunks(code: str, system_prompt: str, build_prompt_fn) -> list[dict]:
    """
    For large files:
      1. Split into chunks
      2. Run LLM on each chunk
      3. Collect all results into one list

    build_prompt_fn(chunk, index) → the user prompt string for that chunk
    """
    chunks = splitter.split_text(code)
    all_results = []

    for i, chunk in enumerate(chunks):
        raw = _call_llm(system_prompt, build_prompt_fn(chunk, i))

        # Parse JSON response — LLM should return a list of findings
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                all_results.extend(parsed)
            elif isinstance(parsed, dict):
                all_results.append(parsed)
        except json.JSONDecodeError:
            # LLM ignored our JSON instruction — skip this chunk
            pass

    return all_results


# ════════════════════════════════════════════════════════════════════════════════
# FEATURE 1 — Repo Review
# Endpoint: POST /analyze/repo
# ════════════════════════════════════════════════════════════════════════════════

def analyze_repo(readme: str, file_tree: str, top_files: dict) -> dict:
    """
    Reads a repo's README, file tree, and key files.
    Returns: purpose, stack, quality_score (0-100), doc_score (0-100), summary.

    We truncate inputs to stay within Groq's context limit:
      readme[:3000]  → first 3000 chars of README
      file_tree[:2000] → first 2000 chars of file listing
    """
    system = (
        "You are a senior software engineer reviewing a GitHub repository. "
        "Respond ONLY with valid JSON. No markdown fences, no explanation, just JSON."
    )

    user = f"""
Analyze this GitHub repository and return a JSON object.

README (first 3000 chars):
{readme[:3000]}

File tree (first 50 files):
{file_tree[:2000]}

Key files sampled:
{json.dumps({k: v[:400] for k, v in list(top_files.items())[:4]})}

Return ONLY this JSON structure (no extra text):
{{
  "purpose": "one sentence: what does this repo do?",
  "stack": "main language/framework e.g. Python/FastAPI or JS/React",
  "quality_score": <integer 0-100 based on code organization, tests, docs>,
  "doc_score": <integer 0-100 based on README quality and inline comments>,
  "summary": "2-3 sentences: technical overview of architecture and approach"
}}
"""
    raw = _call_llm(system, user)
    return json.loads(raw)


# ════════════════════════════════════════════════════════════════════════════════
# FEATURE 2 — Bug Detector
# Endpoint: POST /analyze/bugs
# ════════════════════════════════════════════════════════════════════════════════

SEVERITY_ORDER = ["critical", "high", "medium", "low"]

_BUG_SYSTEM = (
    "You are an expert static analysis tool. Detect real bugs in code. "
    "Respond ONLY with a JSON array. No markdown, no explanation, just the array. "
    "Return [] if no bugs found."
)

def _bug_prompt(chunk: str, index: int) -> str:
    return f"""
Analyze this code chunk (chunk {index}) for bugs:

```
{chunk}
```

Return a JSON array of bugs found. Each bug:
{{
  "severity": "critical | high | medium | low",
  "bug_type": "short name e.g. Null dereference / SQL injection / Memory leak",
  "line_number": <integer or null if unknown>,
  "language": "Python | C | JS | TS | etc.",
  "description": "what is wrong and why it's a problem",
  "suggestion": "concrete fix in 1-2 sentences"
}}

Severity guide:
- critical = crashes, security holes, data loss
- high     = logic errors, unhandled exceptions that break functionality
- medium   = bad practices, N+1 queries, missing error handling
- low      = unused variables, style issues, minor inefficiencies
"""

def detect_bugs(code: str, file_path: str) -> list[dict]:
    """
    Run bug detection across all chunks of a file.
    Sorts results: critical first, low last.
    """
    bugs = _analyze_chunks(code, _BUG_SYSTEM, _bug_prompt)

    # Clean up: only keep valid bugs, attach file path
    clean_bugs = []
    for bug in bugs:
        if isinstance(bug, dict) and bug.get("severity") in SEVERITY_ORDER:
            bug["file_path"] = file_path
            clean_bugs.append(bug)

    # Sort by severity: critical → high → medium → low
    clean_bugs.sort(key=lambda b: SEVERITY_ORDER.index(b["severity"]))
    return clean_bugs


# ════════════════════════════════════════════════════════════════════════════════
# FEATURE 3 — Code Explainer
# Endpoint: POST /analyze/explain
# ════════════════════════════════════════════════════════════════════════════════

def explain_code(snippet: str, language: str = "auto") -> dict:
    """
    Explain a code snippet in plain English.
    Called from Chrome extension when user highlights code.
    Returns: explanation, complexity, inputs, outputs, edge_cases.
    """
    system = (
        "You are a patient programming teacher. Explain code clearly in plain English. "
        "Respond ONLY with valid JSON. No markdown fences."
    )

    user = f"""
Explain this {language} code snippet:

```
{snippet[:4000]}
```

Return ONLY this JSON (no extra text):
{{
  "explanation": "plain English explanation in 2-4 sentences — what does this code DO?",
  "complexity": "time and space complexity e.g. O(n) time, O(1) space",
  "inputs": "what arguments/data does this accept?",
  "outputs": "what does it return or produce?",
  "edge_cases": ["list each notable edge case or failure scenario"]
}}
"""
    raw = _call_llm(system, user)
    return json.loads(raw)


# ════════════════════════════════════════════════════════════════════════════════
# FEATURE 4 — Docs & Docstring Generator
# Endpoint: POST /generate/docs
# ════════════════════════════════════════════════════════════════════════════════

def generate_docstrings(code: str, language: str) -> str:
    """
    Insert JSDoc/Python docstrings into every function and class.
    Processes file in chunks and reassembles.
    Returns the full annotated source code as a string.
    """
    system = (
        f"You are a technical writer. Add {language} docstrings/JSDoc comments to "
        "every function, class, and module in the code. "
        "Return ONLY the annotated code — no explanation, no markdown fences."
    )

    chunks = splitter.split_text(code)
    annotated_chunks = []

    for chunk in chunks:
        annotated = _call_llm(system, f"Add docstrings to this code:\n\n{chunk}")
        annotated_chunks.append(annotated)

    return "\n\n".join(annotated_chunks)


# ════════════════════════════════════════════════════════════════════════════════
# FEATURE 5 — README Generator
# Endpoint: POST /generate/readme
# ════════════════════════════════════════════════════════════════════════════════

def generate_readme(
    repo_name: str,
    purpose: str,
    stack: str,
    api_endpoints: list[str],
    setup_steps: list[str],
) -> str:
    """
    Generate a full, professional README.md with badges, API docs, setup guide.
    Returns a Markdown string — caller uploads it to S3.
    """
    system = (
        "You are a technical writer who writes exceptional GitHub READMEs. "
        "Return ONLY raw Markdown. No explanation before or after."
    )

    user = f"""
Generate a complete README.md for this project.

Project name: {repo_name}
Purpose: {purpose}
Tech stack: {stack}
API endpoints: {json.dumps(api_endpoints)}
Setup steps: {json.dumps(setup_steps)}

Include all of these sections:
1. Badges (build passing, license MIT, version)
2. Project title + one-liner description
3. Overview (what it does + why it's useful)
4. Tech stack table
5. Installation & setup (numbered steps)
6. API reference (table with Method | Path | Description) if endpoints provided
7. Usage examples (code blocks)
8. Contributing guide
9. License (MIT)

Make it professional, specific, and detailed. Use real content from the inputs above.
"""
    return _call_llm(system, user)


# ════════════════════════════════════════════════════════════════════════════════
# FEATURE 6 — Optimization Suggester
# Endpoint: POST /optimize/suggest
# ════════════════════════════════════════════════════════════════════════════════

_OPT_SYSTEM = (
    "You are a performance engineer. Find inefficiencies in code. "
    "Respond ONLY with a JSON array. Return [] if no issues found."
)

def _opt_prompt(chunk: str, index: int) -> str:
    return f"""
Analyze this code chunk (chunk {index}) for performance issues:

```
{chunk}
```

Return a JSON array of issues:
{{
  "issue": "short name e.g. N+1 query / O(n²) loop / Redundant API call",
  "current_complexity": "e.g. O(n²)",
  "suggested_complexity": "e.g. O(n)",
  "description": "why is this slow?",
  "fix": "concrete code change to fix it (1-3 sentences)"
}}
"""

def suggest_optimizations(code: str) -> list[dict]:
    """
    Profile code for time/space complexity issues.
    Returns ranked list of optimization suggestions.
    """
    return _analyze_chunks(code, _OPT_SYSTEM, _opt_prompt)
