/**
 * API client — all calls to the FastAPI backend go through here.
 *
 * VITE_API_URL comes from a .env file in the frontend root.
 * Create frontend/.env with:  VITE_API_URL=http://localhost:8000
 *
 * In production (CloudFront), change it to your EC2 URL:
 *   VITE_API_URL=http://your-ec2-ip:8000
 */

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// ── Helper: POST request ──────────────────────────────────────────────────────
async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `API error ${res.status}`);
  }
  return res.json();
}

// ── Helper: GET request ───────────────────────────────────────────────────────
async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `API error ${res.status}`);
  }
  return res.json();
}

// ── Helper: DELETE request ────────────────────────────────────────────────────
async function del(path) {
  const res = await fetch(`${BASE}${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

// ── Exported API functions ────────────────────────────────────────────────────

/** Full repo review — pass "facebook/react" */
export const analyzeRepo       = (repoFullName) =>
  post("/analyze/repo", { repo_full_name: repoFullName });

/** Bug detection on a file */
export const analyzeBugs       = (repoFullName, filePath, code) =>
  post("/analyze/bugs", { repo_full_name: repoFullName, file_path: filePath, code });

/** Explain a code snippet */
export const explainCode       = (snippet, language = "auto") =>
  post("/analyze/explain", { snippet, language });

/** Generate docstrings for a file */
export const generateDocs      = (repoFullName, filePath, code, language) =>
  post("/generate/docs", { repo_full_name: repoFullName, file_path: filePath, code, language });

/** Generate a README.md */
export const generateReadme    = (repoFullName, purpose, stack, apiEndpoints, setupSteps) =>
  post("/generate/readme", { repo_full_name: repoFullName, purpose, stack, api_endpoints: apiEndpoints, setup_steps: setupSteps });

/** Optimization suggestions for a file */
export const optimizeSuggest   = (repoFullName, filePath, code) =>
  post("/optimize/suggest", { repo_full_name: repoFullName, file_path: filePath, code });

/** Get full history for a repo by id */
export const getHistory        = (repoId) => get(`/history/${repoId}`);

/** Get presigned download URL for a report */
export const downloadReport    = (reportId) => get(`/reports/${reportId}/download`);

/** Delete a repo and all its data */
export const deleteHistory     = (repoId) => del(`/history/${repoId}`);

/** Health check */
export const healthCheck       = () => get("/health");
