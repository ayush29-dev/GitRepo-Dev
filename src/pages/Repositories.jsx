import { useState } from "react";
import { REPOS } from "../data/mockData";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "js",  label: "JavaScript / TS" },
  { key: "py",  label: "Python" },
  { key: "c",   label: "C / C++" },
];

function scoreClass(s) {
  return { A: "score-a", B: "score-b", C: "score-c", D: "score-d" }[s] || "score-c";
}

export default function Repositories() {
  const [filter, setFilter] = useState("all");

  const rows = filter === "all" ? REPOS : REPOS.filter((r) => r.lang === filter);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`filter-btn ${filter === f.key ? "active" : ""}`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">{rows.length} repos</span>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["Repository","Stack","Files","Bugs","Doc Score","Quality","Analyzed"].map((h) => (
                <th key={h} className="text-left text-[11px] uppercase tracking-wider text-gray-400 font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{r.stack}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{r.files.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={r.bugs > 50 ? "sev-critical" : r.bugs > 20 ? "sev-high" : "sev-medium"}>{r.bugs}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${r.doc}%`,
                          background: r.doc >= 80 ? "#16a34a" : r.doc >= 60 ? "#3b82f6" : "#f59e0b",
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{r.doc}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${scoreClass(r.score)}`}>{r.score} {r.scoreN}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{r.analyzed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
