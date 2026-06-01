/**
 * BugsTab — bug detection on a pasted file
 * Calls POST /analyze/bugs, shows severity-ranked bug list.
 */
import { useState } from "react";
import { analyzeBugs } from "../api";

const SEV_BADGE = {
  critical: "badge-red",
  high:     "badge-yellow",
  medium:   "badge-blue",
  low:      "badge-gray",
};

export default function BugsTab({ repo }) {
  const [filePath, setFilePath] = useState("");
  const [code,     setCode]     = useState("");
  const [bugs,     setBugs]     = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [done,     setDone]     = useState(false);

  async function handleDetect() {
    if (!filePath || !code) { setError("Paste a file path and code."); return; }
    setError(""); setLoading(true); setBugs([]); setDone(false);
    try {
      const data = await analyzeBugs(repo || "unknown/repo", filePath, code);
      setBugs(data.bugs ?? []);
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const critCount = bugs.filter(b => b.severity === "critical").length;

  return (
    <div>
      <div className="card">
        <div className="card-title">Bug Detector</div>
        <div style={{marginBottom:8}}>
          <label>File path</label>
          <input placeholder="src/utils/queries.py" value={filePath} onChange={e => setFilePath(e.target.value)} />
        </div>
        <div style={{marginBottom:8}}>
          <label>Paste code</label>
          <textarea rows={6} placeholder="Paste code to analyze…" value={code} onChange={e => setCode(e.target.value)} />
        </div>
        {error && <p className="error-msg">{error}</p>}
        <button className="btn btn-primary" onClick={handleDetect} disabled={loading}>
          {loading ? <><span className="spinner" style={{width:14,height:14,borderWidth:2}} /> Scanning…</> : "🐛 Detect Bugs"}
        </button>
      </div>

      {loading && <div className="loading-state"><div className="spinner" /><p style={{marginTop:10,fontSize:12}}>Running LLM analysis…</p></div>}

      {done && bugs.length === 0 && (
        <div className="card" style={{textAlign:"center",padding:"20px 12px"}}>
          <div style={{fontSize:24,marginBottom:6}}>✅</div>
          <p style={{fontWeight:600,color:"#16a34a",fontSize:12}}>No bugs found</p>
          <p style={{fontSize:11,color:"#9ca3af",marginTop:4}}>Code looks clean!</p>
        </div>
      )}

      {bugs.length > 0 && (
        <div className="card">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <div className="card-title" style={{margin:0}}>{bugs.length} bug{bugs.length > 1 ? "s" : ""} found</div>
            {critCount > 0 && <span className="badge badge-red">{critCount} critical</span>}
          </div>
          {bugs.map((bug, i) => (
            <div className="result-row" key={i}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                <span className={`badge ${SEV_BADGE[bug.severity]}`}>{bug.severity}</span>
                <span style={{fontWeight:500,fontSize:12}}>{bug.bug_type}</span>
              </div>
              <div className="file">{bug.file_path}{bug.line_number ? `:${bug.line_number}` : ""} · {bug.language}</div>
              <p style={{fontSize:11,color:"#6b7280",margin:"4px 0 2px"}}>{bug.description}</p>
              {bug.suggestion && (
                <p style={{fontSize:11,color:"#185FA5"}}>💡 {bug.suggestion}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
