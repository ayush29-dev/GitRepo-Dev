/**
 * Shared preview panel used by README, Docstring, and API Docs tabs.
 * Shows: loading spinner → preview text → download button + file info.
 */
export default function PreviewPane({ result, loading, placeholder, isCode = false }) {
  function handleDownload() {
    if (result?.download_url) window.open(result.download_url, "_blank");
  }

  const previewText = result?.preview ?? "";
  const fileSize    = result?.file_size
    ? result.file_size > 1024 * 1024
      ? `${(result.file_size / 1024 / 1024).toFixed(1)} MB`
      : `${Math.round(result.file_size / 1024)} KB`
    : null;

  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Preview</h2>
        {result && (
          <div className="flex items-center gap-2">
            {fileSize && <span className="badge badge-gray">{fileSize}</span>}
            <button onClick={handleDownload} className="btn-outline">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download from S3
            </button>
          </div>
        )}
      </div>

      {/* S3 key info */}
      {result?.s3_key && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          <span className="text-green-600 text-xs">✓ Uploaded to S3</span>
          <span className="font-mono text-xs text-gray-400 truncate">{result.s3_key}</span>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 min-h-64">
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">LLM generating…</p>
          </div>
        )}

        {!loading && !result && (
          <div className="flex items-center justify-center h-64 text-gray-300 text-sm">
            {placeholder}
          </div>
        )}

        {!loading && result && (
          <pre className={`text-xs leading-relaxed overflow-auto max-h-96 whitespace-pre-wrap break-words
            ${isCode ? "bg-gray-950 text-green-400 p-4 rounded-lg font-mono" : "bg-gray-50 text-gray-700 p-4 rounded-lg"}`}>
            {previewText}
            {previewText.endsWith("…") && (
              <span className="text-gray-400"> (truncated — download for full file)</span>
            )}
          </pre>
        )}
      </div>
    </div>
  );
}
