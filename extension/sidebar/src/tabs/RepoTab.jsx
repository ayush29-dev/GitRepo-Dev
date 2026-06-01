/**
 * RepoTab — full repo review
 * Calls POST /analyze/repo, shows purpose, stack, quality score, summary.
 */
import { useState } from "react";
import { analyzeRepo } from "../api";

export default function RepoTab({ repo, scoreClass }) {
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleAnalyze() {
    if (!repo) { setError("No repo detected on this page."); return; }
    setError(""); setLoading(true); setResult(null);
    try {
      const data = await analyzeRepo(repo);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const grade = (score) =>
    score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : "D";

  return (
    <div>
      <div className="card">
        <div className="card-title">Repository Review</div>
        <p style={{fontSize:11,color:"#9ca3af",marginBottom:10}}>
          Fetches file tree, README, and key files from GitHub.
          LLM scores quality and generates a summary.
        </p>
        <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading}>
          {loading ? <><span className="spinner" style={{width:14,height:14,borderWidth:2}} /> Analyzing…</> : "🔍 Analyze Repo"}
        </button>
        {error && <p className="error-msg">{error}</p>}
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <p style={{marginTop:10,fontSize:12}}>Fetching from GitHub + running LLM…</p>
          <p style={{fontSize:11,color:"#d1d5db",marginTop:4}}>Takes ~10-15 seconds</p>
        </div>
      )}

      {result && (
        <>
          {/* Score cards */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            <ScoreCard label="Quality" score={result.quality_score} grade={grade(result.quality_score)} scoreClass={scoreClass} />
            <ScoreCard label="Docs"    score={result.doc_score}     grade={grade(result.doc_score)}     scoreClass={scoreClass} />
          </div>

          {/* Summary */}
          <div className="card">
            <div className="card-title">Purpose</div>
            <p style={{fontSize:12,color:"#374151",lineHeight:1.6}}>{result.purpose}</p>
          </div>

          <div className="card">
            <div className="card-title">Stack</div>
            <span className="badge badge-blue">{result.stack}</span>
            <span style={{fontSize:11,color:"#9ca3af",marginLeft:8}}>{result.total_files?.toLocaleString()} files</span>
          </div>

          <div className="card">
            <div className="card-title">Summary</div>
            <p style={{fontSize:12,color:"#374151",lineHeight:1.6}}>{result.summary}</p>
          </div>
        </>
      )}
    </div>
  );
}

function ScoreCard({ label, score, grade, scoreClass }) {
  return (
    <div className="card" style={{display:"flex",alignItems:"center",gap:10}}>
      <div className={`score-ring ${scoreClass(grade)}`}>{grade}</div>
      <div>
        <div style={{fontSize:11,color:"#9ca3af"}}>{label} score</div>
        <div style={{fontSize:18,fontWeight:700}}>{Math.round(score)}</div>
      </div>
    </div>
  );
}
