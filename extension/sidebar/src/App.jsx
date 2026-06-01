import { useState, useEffect } from "react";
import RepoTab     from "./tabs/RepoTab";
import BugsTab     from "./tabs/BugsTab";
import ExplainTab  from "./tabs/ExplainTab";
import ReadmeTab   from "./tabs/ReadmeTab";
import OptimizeTab from "./tabs/OptimizeTab";

const TABS = [
  { id: "repo",     icon: "🔍", label: "Repo"     },
  { id: "bugs",     icon: "🐛", label: "Bugs"     },
  { id: "explain",  icon: "💡", label: "Explain"  },
  { id: "readme",   icon: "📄", label: "README"   },
  { id: "optimize", icon: "⚡", label: "Optimize" },
];

export default function App() {
  const [tab,     setTab]     = useState("repo");
  const [repo,    setRepo]    = useState("");
  const [snippet, setSnippet] = useState("");   // from text selection

  // Parse repo name from iframe URL query param
  // sidebar.html?repo=facebook%2Freact
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("repo");
    if (r) setRepo(decodeURIComponent(r));
  }, []);

  // Listen for code selections from content.js
  useEffect(() => {
    function onMessage(event) {
      if (event.data?.type === "CODE_SELECTED") {
        setSnippet(event.data.snippet);
        setTab("explain");   // auto-switch to Explain tab
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  function closeSidebar() {
    // Tell content.js to close us
    window.parent.postMessage({ type: "CLOSE_SIDEBAR" }, "*");
  }

  const scoreClass = (s) =>
    ({ A: "score-a", B: "score-b", C: "score-c", D: "score-d" }[s] ?? "score-b");

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-mark">⚡</div>
          <div>
            <div className="logo-title">GitRepo-Dev</div>
            <div className="logo-repo">{repo || "No repo detected"}</div>
          </div>
        </div>
        <button className="close-btn" onClick={closeSidebar} title="Close sidebar">✕</button>
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {tab === "repo"     && <RepoTab     repo={repo} scoreClass={scoreClass} />}
        {tab === "bugs"     && <BugsTab     repo={repo} />}
        {tab === "explain"  && <ExplainTab  repo={repo} initialSnippet={snippet} />}
        {tab === "readme"   && <ReadmeTab   repo={repo} />}
        {tab === "optimize" && <OptimizeTab repo={repo} />}
      </div>
    </div>
  );
}
