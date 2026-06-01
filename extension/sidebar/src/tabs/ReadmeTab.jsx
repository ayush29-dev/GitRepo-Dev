/**
 * ReadmeTab — README generator
 * Calls POST /generate/readme, shows preview + S3 download link.
 */
import { useState } from "react";
import { generateReadme } from "../api";

export default function ReadmeTab({ repo }) {
  const [purpose,  setPurpose]  = useState("");
  const [stack,    setStack]    = useState("");
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleGenerate() {
    if (!purpose || !stack) { setError("Purpose and stack required."); return; }
    setError(""); setLoading(true); setResult(null);
    try {
      const data = await generateReadme(repo || "unknown/repo", purpose, stack);
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
        <div className="card-title">README Generator</div>
        <p style={{fontSize:11,color:"#9ca3af",marginBottom:10}}>
          Generates a full README.md with badges, setup guide, and API reference. Uploads to S3.
        </p>
        <div style={{marginBottom:8}}>
          <label>Purpose <span style={{color:"#ef4444"}}>*</span></label>
          <input placeholder="A JavaScript library for building UIs" value={purpose} onChange={e => setPurpose(e.target.value)} />
        </div>
        <div style={{marginBottom:8}}>
          <label>Tech stack <span style={{color:"#ef4444"}}>*</span></label>
          <input placeholder="JS/TypeScript, Rollup, Jest" value={stack} onChange={e => setStack(e.target.value)} />
        </div>
        {error && <p className="error-msg">{error}</p>}
        <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
          {loading ? <><span className="spinner" style={{width:14,height:14,borderWidth:2}} /> Generating…</> : "📄 Generate README"}
        </button>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <p style={{marginTop:10,fontSize:12}}>LLM writing README…</p>
        </div>
      )}

      {result && (
        <div className="card">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <div className="card-title" style={{margin:0}}>Preview</div>
            <button
              className="btn btn-secondary"
              style={{width:"auto",padding:"5px 10px",fontSize:11}}
              onClick={() => window.open(result.download_url, "_blank")}
            >
              ⬇ Download
            </button>
          </div>
          {result.s3_key && (
            <p style={{fontSize:10,color:"#22c55e",marginBottom:8}}>✓ Uploaded to S3 · {result.s3_key.split("/").pop()}</p>
          )}
          <div className="code-block" style={{background:"#f8fafc",color:"#374151",fontSize:11}}>
            {result.preview}
            {result.preview?.endsWith("…") && "\n\n(truncated — download for full file)"}
          </div>
        </div>
      )}
    </div>
  );
}
