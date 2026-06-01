import { useLocation } from "react-router-dom";

const PAGE_TITLES = {
  "/":        "Dashboard",
  "/repos":   "Repositories",
  "/bugs":    "Bug Reports",
  "/docs":    "Doc Coverage",
  "/reports": "Reports",
  "/generate":"Generator",
};

export default function Topbar() {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? "GitRepo-Dev";

  return (
    <header className="sticky top-0 z-10 h-13 bg-white border-b border-gray-200 flex items-center px-6 gap-4" style={{height:"52px"}}>
      <h1 className="text-sm font-semibold flex-1">{title}</h1>

      {/* Search */}
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-400 cursor-text select-none">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Search repos…
      </div>

      {/* Status */}
      <span className="badge badge-green">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
        Extension active
      </span>
    </header>
  );
}
