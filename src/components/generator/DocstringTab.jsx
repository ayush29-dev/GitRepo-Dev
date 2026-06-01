import { useState } from "react";
import { generateDocs } from "../../api/client";
import PreviewPane from "./PreviewPane";

const LANGS = ["Python", "JavaScript", "TypeScript", "C", "C++", "Go", "Rust"];

export default function DocstringTab() {
  const [repo,     setRepo]     = useState("");
  const [filePath, setFilePath] = useState("");
  const [code,     setCode]     = useState("");
  const [lang,     setLang]     = useState("Python");
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleGenerate() {
    if (!repo || !filePath || !code) {
      setError("All fields required.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const data = await generateDocs(repo, filePath, code, lang);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold">Docstring Generator</h2>
        <p className="text-xs text-gray-400">
          Inserts JSDoc / Python docstrings into every function and class.
          Annotated file uploaded to S3 with download link.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Repo <span className="text-red-400">*</span></label>
            <input className="input" placeholder="owner/repo" value={repo} onChange={e => setRepo(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Language</label>
            <select className="input" value={lang} onChange={e => setLang(e.target.value)}>
              {LANGS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">File path <span className="text-red-400">*</span></label>
          <input className="input font-mono text-xs" placeholder="src/utils/helpers.py" value={filePath} onChange={e => setFilePath(e.target.value)} />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Paste code <span className="text-red-400">*</span></label>
          <textarea
            className="input h-48 resize-none font-mono text-xs"
            placeholder={`def add(a, b):\n    return a + b\n\nclass Calculator:\n    pass`}
            value={code}
            onChange={e => setCode(e.target.value)}
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
        >
          {loading ? "Annotating…" : "Add Docstrings"}
        </button>
      </div>

      <PreviewPane result={result} loading={loading} placeholder="Annotated code preview appears here" isCode />
    </div>
  );
}
