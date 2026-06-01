import { useState } from "react";
import { optimizeSuggest } from "../../api/client";

const SEV_COLOR = {
  critical: "badge-red",
  high:     "badge-yellow",
  medium:   "badge-blue",
  low:      "badge-gray",
};

export default function OptimizeTab() {
  const [repo,        setRepo]        = useState("");
  const [filePath,    setFilePath]    = useState("");
  const [code,        setCode]        = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [done,        setDone]        = useState(false);

  async function handleAnalyze() {
    if (!repo || !filePath || !code) {
      setError("All fields required.");
      return;
    }
    setError("");
    setLoading(true);
    setSuggestions([]);
    setDone(false);
    try {
      const data = await optimizeSuggest(repo, filePath, code);
      setSuggestions(data.suggestions ?? []);
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold">Optimization Suggester</h2>
        <p className="text-xs text-gray-400">
          Profiles code for time/space complexity issues, N+1 queries,
          redundant API calls, and algorithmic inefficiencies.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Repo <span className="text-red-400">*</span></label>
            <input className="input" placeholder="owner/repo" value={repo} onChange={e => setRepo(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">File path <span className="text-red-400">*</span></label>
            <input className="input font-mono text-xs" placeholder="src/queries.py" value={filePath} onChange={e => setFilePath(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Paste code <span className="text-red-400">*</span></label>
          <textarea
            className="input h-40 resize-none font-mono text-xs"
            placeholder="Paste code to analyze…"
            value={code}
            onChange={e => setCode(e.target.value)}
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
        >
          {loading ? "Analyzing…" : "Analyze Performance"}
        </button>
      </div>

      {/* Results */}
      {loading && <LoadingState />}

      {done && suggestions.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-2xl mb-2">✅</p>
          <p className="text-sm font-medium text-green-700">No issues found</p>
          <p className="text-xs text-gray-400 mt-1">Code looks efficient!</p>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">{suggestions.length} suggestion{suggestions.length > 1 ? "s" : ""} found</p>
          {suggestions.map((s, i) => (
            <div key={i} className="card p-4 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold">{s.issue}</span>
                {s.current_complexity && (
                  <>
                    <span className="badge badge-red font-mono text-xs">{s.current_complexity}</span>
                    <span className="text-gray-400 text-xs">→</span>
                    <span className="badge badge-green font-mono text-xs">{s.suggested_complexity}</span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-600">{s.description}</p>
              {s.fix && (
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Suggested fix</p>
                  <p className="text-xs text-gray-700">{s.fix}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="card p-8 flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500">Profiling code with LLM…</p>
    </div>
  );
}
