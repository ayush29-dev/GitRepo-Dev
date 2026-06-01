import { REPORTS } from "../data/mockData";

const TYPE_BADGE = {
  "Full Report":  "badge-blue",
  "Bug Report":   "badge-red",
  "README":       "badge-green",
  "Docs Export":  "badge-blue",
  "Optimization": "badge-yellow",
};

export default function Reports() {
  return (
    <div className="p-6 space-y-4">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold">Generated reports</h2>
            <p className="text-xs text-gray-400 mt-0.5">Stored on AWS S3 · Presigned download URLs</p>
          </div>
          <span className="badge badge-gray">{REPORTS.length} files</span>
        </div>

        <div className="divide-y divide-gray-100">
          {REPORTS.map((r) => (
            <div key={r.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
              {/* Icon */}
              <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.name}</p>
                <p className="text-xs text-gray-400">{r.date} · {r.size}</p>
              </div>

              {/* Type badge */}
              <span className={`badge ${TYPE_BADGE[r.type] || "badge-gray"}`}>{r.type}</span>

              {/* Download button */}
              <button className="btn-outline">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Info card */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
        <p className="font-medium mb-1">How downloads work</p>
        <p className="text-xs text-blue-600 leading-relaxed">
          Reports are uploaded to AWS S3 after each analysis. Download buttons will generate presigned URLs
          (valid for 1 hour) once the FastAPI backend is connected. You'll wire this up in Week 4 of the build roadmap.
        </p>
      </div>
    </div>
  );
}
