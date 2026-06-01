import { NavLink } from "react-router-dom";

const links = [
  { to: "/",        icon: "grid",        label: "Dashboard"    },
  { to: "/repos",   icon: "git-branch",  label: "Repositories" },
  { to: "/bugs",    icon: "bug",         label: "Bug Reports"  },
  { to: "/docs",    icon: "file-text",   label: "Doc Coverage" },
  { to: "/reports", icon: "download",    label: "Reports"      },
  { to: "/generate",icon: "sparkles",    label: "Generator"    },
];

export default function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 h-screen w-52 bg-white border-r border-gray-200 flex flex-col z-20">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-200">
        <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
          </svg>
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900 leading-tight">GitRepo-Dev</div>
          <div className="text-[10px] text-gray-400">AI Workspace · v1.0</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 px-2 py-2">Overview</p>
        {links.slice(0, 2).map((l) => <SideLink key={l.to} {...l} />)}
        <p className="text-[10px] uppercase tracking-widest text-gray-400 px-2 pt-4 pb-2">Analysis</p>
        {links.slice(2).map((l) => <SideLink key={l.to} {...l} />)}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200">
        <button className="sidebar-link">
          <Icon name="settings" /> Settings
        </button>
      </div>
    </aside>
  );
}

function SideLink({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
    >
      <Icon name={icon} /> {label}
    </NavLink>
  );
}

function Icon({ name }) {
  const icons = {
    grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
    "git-branch": <><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></>,
    bug: <><rect x="8" y="6" width="8" height="14" rx="4"/><path d="M19 7l-3 2"/><path d="M5 7l3 2"/><path d="M19 12h-4"/><path d="M5 12h4"/><path d="M19 17l-3-2"/><path d="M5 17l3-2"/><path d="M9 3h6"/></>,
    "file-text": <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    sparkles: <><path d="M12 3l1.88 5.47L19 10l-5.12 1.53L12 17l-1.88-5.47L5 10l5.12-1.53z"/><path d="M5 3l.88 2.47L8 6l-2.12.53L5 9l-.88-2.47L2 6l2.12-.53z"/><path d="M19 15l.88 2.47L22 18l-2.12.53L19 21l-.88-2.47L16 18l2.12-.53z"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
  };
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
      {icons[name]}
    </svg>
  );
}
