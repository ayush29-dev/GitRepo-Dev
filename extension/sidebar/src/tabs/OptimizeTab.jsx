/**
 * OptimizeTab — optimization suggester
 * Calls POST /optimize/suggest, shows ranked issues with fix suggestions.
 */
import { useState } from "react";
import { optimizeSuggest } from "../api";

export default function OptimizeTab({ repo }) {
  const [filePath,    setFilePath]    = useState("");
  const [code,        setCode]        = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [done,        setDone]        = useState(false);

  async function handleAnalyze() {
    if (!filePath || !code) { setError("File path and code required."); return; }
    setError(""); setLoading(true); setSuggestions([]); setDone(false);
    try {
      const data = await optimizeSuggest(repo || "unknown/repo", filePath, code);
      setSuggestions(data.suggestions ?? []);
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="card">
        <div className="card-title">Optimization Suggester</div>
        <p style={{fontSize:11,color:"#9ca3af",marginBottom:8}}>
          Profiles time/space complexity, flags N+1 queries and redundant API calls.
        </p>
        <div style={{marginBottom:8}}>
          <label>File path</label>
          <input placeholder="src/queries.py" value={filePath} onChange={e => setFilePath(e.target.value)} />
        </div>
        <div style={{marginBottom:8}}>
          <label>Paste code</label>
          <textarea rows={5} placeholder="Paste code to profile…" value={code} onChange={e => setCode(e.target.value)} />
        </div>
        {error && <p className="error-msg">{error}</p>}
        <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading}>
          {loading ? <><span className="spinner" style={{width:14,height:14,borderWidth:2}} /> Analyzing…</> : "⚡ Analyze Performance"}
        </button>
      </div>

      {loading && <div className="loading-state"><div className="spinner" /><p style={{marginTop:10,fontSize:12}}>Profiling…</p></div>}

      {done && suggestions.length === 0 && (
        <div className="card" style={{textAlign:"center",padding:"20px 12px"}}>
          <div style={{fontSize:24,marginBottom:6}}>✅</div>
          <p style={{fontWeight:600,color:"#16a34a",fontSize:12}}>No issues found</p>
          <p style={{fontSize:11,color:"#9ca3af",marginTop:4}}>Code looks efficient!</p>
        </div>
      )}

      {suggestions.map((s, i) => (
        <div className="card" key={i}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap"}}>
            <span style={{fontWeight:600,fontSize:12}}>{s.issue}</span>
            {s.current_complexity && (
              <>
                <span className="badge badge-red" style={{fontFamily:"monospace"}}>{s.current_complexity}</span>
                <span style={{fontSize:11,color:"#9ca3af"}}>→</span>
                <span className="badge badge-green" style={{fontFamily:"monospace"}}>{s.suggested_complexity}</span>
              </>
            )}
          </div>
          <p style={{fontSize:11,color:"#6b7280",marginBottom:6}}>{s.description}</p>
          {s.fix && (
            <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:6,padding:"7px 9px"}}>
              <p style={{fontSize:10,fontWeight:600,color:"#15803d",marginBottom:3}}>Suggested fix</p>
              <p style={{fontSize:11,color:"#166534"}}>{s.fix}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
