import { useState } from "react";
import { BUGS } from "../data/mockData";

const FILTERS = [
  { key: "all",      label: "All" },
  { key: "critical", label: "Critical" },
  { key: "high",     label: "High" },
  { key: "medium",   label: "Medium" },
  { key: "low",      label: "Low" },
];

const SEV_CLASS = {
  critical: "sev-critical",
  high:     "sev-high",
  medium:   "sev-medium",
  low:      "sev-low",
};

const SEV_BADGE = {
  critical: "badge-red",
  high:     "badge-yellow",
  medium:   "badge-blue",
  low:      "badge-gray",
};

export default function BugReports() {
  const [filter, setFilter] = useState("all");
  const rows = filter === "all" ? BUGS : BUGS.filter((b) => b.sev === filter);
  const critCount = BUGS.filter((b) => b.sev === "critical").length;

  return (
    <div className="p-6 space-y-4">
      {/* Summary bar */}
      <div className="card p-4 flex items-center gap-4 flex-wrap">
        <div className="flex-1">
          <p className="text-sm font-semibold">All detected bugs</p>
          <p className="text-xs text-gray-400 mt-0.5">{BUGS.length} total · LLM pipeline · 87% precision benchmark</p>
        </div>
        <span className="badge badge-red">{critCount} critical</span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`filter-btn ${filter === f.key ? "active" : ""}`}
          >
            {f.label}
            <span className="ml-1.5 text-[10px] text-gray-400">
              {f.key === "all" ? BUGS.length : BUGS.filter((b) => b.sev === f.key).length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["Severity","Type","File","Line","Repo","Language"].map((h) => (
                <th key={h} className="text-left text-[11px] uppercase tracking-wider text-gray-400 font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
                <td className="px-4 py-3">
                  <span className={`badge ${SEV_BADGE[b.sev]}`}>
                    {b.sev.charAt(0).toUpperCase() + b.sev.slice(1)}
                  </span>
                </td>
                <td className={`px-4 py-3 ${SEV_CLASS[b.sev]}`}>{b.type}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{b.file}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{b.line}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{b.repo}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{b.lang}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
