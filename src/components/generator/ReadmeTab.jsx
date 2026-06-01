import { useState } from "react";
import { generateReadme } from "../../api/client";
import PreviewPane from "./PreviewPane";

const DEFAULT_STEPS = ["Clone repo", "npm install", "npm run dev"];

export default function ReadmeTab() {
  const [repo,      setRepo]      = useState("");
  const [purpose,   setPurpose]   = useState("");
  const [stack,     setStack]     = useState("");
  const [endpoints, setEndpoints] = useState("");
  const [steps,     setSteps]     = useState(DEFAULT_STEPS.join("\n"));
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  async function handleGenerate() {
    if (!repo || !purpose || !stack) {
      setError("Repo, purpose, and stack required.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const data = await generateReadme(
        repo,
        purpose,
        stack,
        endpoints.split("\n").filter(Boolean),
        steps.split("\n").filter(Boolean),
      );
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Input form */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold">README Generator</h2>
        <p className="text-xs text-gray-400">
          Generates a full README.md with badges, setup guide, and API reference.
          Uploads to S3 and returns a download link.
        </p>

        <Field label="Repo (owner/repo)" required>
          <input className="input" placeholder="facebook/react" value={repo} onChange={e => setRepo(e.target.value)} />
        </Field>

        <Field label="Purpose" required>
          <input className="input" placeholder="A JavaScript library for building user interfaces" value={purpose} onChange={e => setPurpose(e.target.value)} />
        </Field>

        <Field label="Tech stack" required>
          <input className="input" placeholder="JS/TypeScript, Rollup, Jest" value={stack} onChange={e => setStack(e.target.value)} />
        </Field>

        <Field label="API endpoints (one per line)">
          <textarea className="input h-20 resize-none font-mono text-xs" placeholder="GET /api/users&#10;POST /api/posts" value={endpoints} onChange={e => setEndpoints(e.target.value)} />
        </Field>

        <Field label="Setup steps (one per line)">
          <textarea className="input h-20 resize-none text-xs" value={steps} onChange={e => setSteps(e.target.value)} />
        </Field>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate README"}
        </button>
      </div>

      {/* Preview */}
      <PreviewPane result={result} loading={loading} placeholder="README preview appears here" />
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}
