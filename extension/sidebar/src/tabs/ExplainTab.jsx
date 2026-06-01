/**
 * ExplainTab — code explainer
 * Auto-populates from text selection (sent by content.js).
 * Calls POST /analyze/explain.
 */
import { useState, useEffect } from "react";
import { explainCode } from "../api";

export default function ExplainTab({ initialSnippet }) {
  const [snippet,  setSnippet]  = useState(initialSnippet ?? "");
  const [language, setLanguage] = useState("auto");
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  // When user highlights code on page, content.js sends it here
  useEffect(() => {
    if (initialSnippet) {
      setSnippet(initialSnippet);
      setResult(null);
    }
  }, [initialSnippet]);

  async function handleExplain() {
    if (!snippet.trim()) { setError("Paste or select some code first."); return; }
    setError(""); setLoading(true); setResult(null);
    try {
      const data = await explainCode(snippet, language);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="card">
        <div className="card-title">Code Explainer</div>
        <p style={{fontSize:11,color:"#9ca3af",marginBottom:8}}>
          Highlight any code on the page — it auto-fills below.
        </p>
        <div style={{marginBottom:8}}>
          <label>Language</label>
          <select value={language} onChange={e => setLanguage(e.target.value)}>
            {["auto","Python","JavaScript","TypeScript","C","C++","Go","Rust","Java"].map(l =>
              <option key={l} value={l}>{l}</option>
            )}
          </select>
        </div>
        <div style={{marginBottom:8}}>
          <label>Code snippet</label>
          <textarea
            rows={6}
            placeholder="Highlight code on the page, or paste here…"
            value={snippet}
            onChange={e => setSnippet(e.target.value)}
          />
        </div>
        {error && <p className="error-msg">{error}</p>}
        <button className="btn btn-primary" onClick={handleExplain} disabled={loading}>
          {loading ? <><span className="spinner" style={{width:14,height:14,borderWidth:2}} /> Explaining…</> : "💡 Explain Code"}
        </button>
      </div>

      {loading && <div className="loading-state"><div className="spinner" /><p style={{marginTop:10,fontSize:12}}>Analyzing…</p></div>}

      {result && (
        <div className="card explain-block">
          <div className="card-title">Explanation</div>
          <p>{result.explanation}</p>

          <h4>Complexity</h4>
          <p style={{fontFamily:"monospace",fontSize:12,background:"#f3f4f6",padding:"4px 8px",borderRadius:5,display:"inline-block"}}>{result.complexity}</p>

          <h4>Inputs</h4>
          <p>{result.inputs}</p>

          <h4>Outputs</h4>
          <p>{result.outputs}</p>

          {result.edge_cases?.length > 0 && (
            <>
              <h4>Edge Cases</h4>
              <ul>
                {result.edge_cases.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
