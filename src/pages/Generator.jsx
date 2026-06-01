import { useState } from "react";
import ReadmeTab from "../components/generator/ReadmeTab";
import DocstringTab from "../components/generator/DocstringTab";
import ApiDocsTab from "../components/generator/ApiDocsTab";
import OptimizeTab from "../components/generator/OptimizeTab";

const TABS = [
  { id: "readme",    label: "README Generator",  icon: "📄" },
  { id: "docstring", label: "Docstrings",         icon: "💬" },
  { id: "apidocs",   label: "API Docs",           icon: "🔌" },
  { id: "optimize",  label: "Optimization",       icon: "⚡" },
];

export default function Generator() {
  const [tab, setTab] = useState("readme");

  return (
    <div className="p-6 space-y-4">
      {/* Tab bar */}
      <div className="card p-1 flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors flex-1 justify-center
              ${tab === t.id
                ? "bg-brand-500 text-white font-medium"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}
          >
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "readme"    && <ReadmeTab />}
      {tab === "docstring" && <DocstringTab />}
      {tab === "apidocs"   && <ApiDocsTab />}
      {tab === "optimize"  && <OptimizeTab />}
    </div>
  );
}
