"""
GitHub API helper — 3 jobs:
  1. get_repo_tree()    → list of every file path in the repo
  2. get_readme()       → decoded README.md content
  3. get_top_files()    → content of the most important code files

Why async? GitHub API calls take time (network). Using async lets
FastAPI handle other requests while waiting — much faster under load.

GITHUB_TOKEN gives you 5,000 requests/hour instead of 60.
Get one free at: github.com/settings/tokens → Generate new token (classic) → check 'repo'
"""

import httpx        # async HTTP client (like requests, but async)
import base64       # GitHub returns file content as base64-encoded strings
import asyncio      # for running multiple requests at the same time
import os
from dotenv import load_dotenv

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
BASE_URL     = "https://api.github.com"

# These headers go on every request to GitHub
HEADERS = {
    "Authorization": f"Bearer {GITHUB_TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}

# Only fetch these file types for analysis (skip images, fonts, lock files, etc.)
CODE_EXTENSIONS = {".py", ".js", ".ts", ".jsx", ".tsx", ".c", ".cpp", ".h", ".go", ".rs"}

# Skip files bigger than 100KB — too large to send to LLM
MAX_FILE_BYTES = 100_000


async def get_repo_tree(owner: str, repo: str) -> list[dict]:
    """
    Returns a flat list of ALL files in the repo.
    GitHub's ?recursive=1 param gives us the full tree in one call.

    Each item looks like:
      { "path": "src/index.js", "type": "blob", "size": 2048 }

    We filter to only "blob" (files), not "tree" (folders).
    """
    url = f"{BASE_URL}/repos/{owner}/{repo}/git/trees/HEAD?recursive=1"
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=HEADERS, timeout=20)
        response.raise_for_status()   # throws exception if status != 200
        data = response.json()

    # "blob" = file, "tree" = directory — we only want files
    return [item for item in data.get("tree", []) if item["type"] == "blob"]


async def get_readme(owner: str, repo: str) -> str:
    """
    Fetches the README.md content.
    GitHub returns it base64-encoded, so we decode it.
    Returns empty string if no README exists (404).
    """
    url = f"{BASE_URL}/repos/{owner}/{repo}/readme"
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=HEADERS, timeout=10)
        if response.status_code == 404:
            return ""   # No README — that's fine
        response.raise_for_status()
        data = response.json()

    # GitHub encodes content as base64 with newlines — decode it
    return base64.b64decode(data["content"]).decode("utf-8", errors="replace")


async def get_file_content(owner: str, repo: str, path: str) -> str:
    """
    Fetches content of a single file.
    Returns empty string if file is too big or request fails.
    """
    url = f"{BASE_URL}/repos/{owner}/{repo}/contents/{path}"
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=HEADERS, timeout=10)
        if response.status_code != 200:
            return ""
        data = response.json()

    # Skip files that are too large for the LLM
    if data.get("size", 0) > MAX_FILE_BYTES:
        return ""

    return base64.b64decode(data["content"]).decode("utf-8", errors="replace")


async def get_top_files(owner: str, repo: str, tree: list[dict], max_files: int = 8) -> dict[str, str]:
    """
    Picks the most important files to analyze and fetches their content.

    Strategy:
      1. Check for common entry points first (main.py, index.js, etc.)
      2. Fill remaining slots with any code file (by extension)
      3. Fetch all selected files IN PARALLEL using asyncio.gather()
         (parallel = all requests fire at the same time, not one by one)

    Returns: { "src/main.py": "def main():...", "app.py": "..." }
    """
    # These are the most likely entry points — check for these first
    priority_names = ["main.py", "app.py", "index.js", "index.ts", "main.c", "server.py", "manage.py"]
    all_paths = [f["path"] for f in tree]

    selected = []

    # Step 1: find priority files
    for name in priority_names:
        matches = [p for p in all_paths if p == name or p.endswith("/" + name)]
        if matches:
            selected.append(matches[0])   # take the first match

    # Step 2: fill with any code file we haven't added yet
    for path in all_paths:
        if len(selected) >= max_files:
            break
        ext = "." + path.rsplit(".", 1)[-1] if "." in path else ""
        if ext in CODE_EXTENSIONS and path not in selected:
            selected.append(path)

    # Step 3: fetch all files at the same time (parallel requests)
    # asyncio.gather() fires all coroutines simultaneously
    contents = await asyncio.gather(
        *[get_file_content(owner, repo, path) for path in selected]
    )

    # Return only non-empty files
    return {path: content for path, content in zip(selected, contents) if content}
