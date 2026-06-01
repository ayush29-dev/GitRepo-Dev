import { useState } from "react";
import PreviewPane from "./PreviewPane";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export default function ApiDocsTab() {
  const [repo,       setRepo]       = useState("");
  const [routerCode, setRouterCode] = useState("");
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");

  async function handleGenerate() {
    if (!repo || !routerCode) {
      setError("Both fields required.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${BASE}/generate/api-docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_full_name: repo, router_code: routerCode }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      setResult(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold">API Docs Generator</h2>
        <p className="text-xs text-gray-400">
          Paste a FastAPI or Express router file. LLM generates markdown docs
          with param tables and curl examples for every endpoint.
        </p>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Repo <span className="text-red-400">*</span></label>
          <input className="input" placeholder="owner/repo" value={repo} onChange={e => setRepo(e.target.value)} />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Router source code <span className="text-red-400">*</span></label>
          <textarea
            className="input h-64 resize-none font-mono text-xs"
            placeholder={"@router.get('/users')\ndef get_users():\n    ..."}
            value={routerCode}
            onChange={e => setRouterCode(e.target.value)}
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate API Docs"}
        </button>
      </div>

      <PreviewPane result={result} loading={loading} placeholder="API docs preview appears here" />
    </div>
  );
}
