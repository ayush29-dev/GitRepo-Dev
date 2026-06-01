import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { REPOS, METRICS, BUG_TREND } from "../data/mockData";

const bugTrendData = BUG_TREND.labels.map((w, i) => ({
  week: w,
  Critical: BUG_TREND.critical[i],
  High: BUG_TREND.high[i],
  Medium: BUG_TREND.medium[i],
}));

const bugDistData = [
  { name: "Critical", value: 5,  color: "#ef4444" },
  { name: "High",     value: 18, color: "#f59e0b" },
  { name: "Medium",   value: 42, color: "#3b82f6" },
  { name: "Low",      value: 35, color: "#9ca3af" },
];

function MetricCard({ label, value, sub, subClass = "text-gray-400" }) {
  return (
    <div className="metric-card">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
      {sub && <p className={`text-[11px] mt-1 ${subClass}`}>{sub}</p>}
    </div>
  );
}

function scoreClass(s) {
  return { A: "score-a", B: "score-b", C: "score-c", D: "score-d" }[s] || "score-c";
}

export default function Dashboard() {
  return (
    <div className="p-6 space-y-5">
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard label="Repos analyzed"      value={METRICS.reposAnalyzed}    sub="↑ +12 this week"      subClass="text-green-600" />
        <MetricCard label="Bugs detected"       value={METRICS.bugsDetected}     sub={`${METRICS.criticalBugs} critical`} subClass="text-red-500" />
        <MetricCard label="Avg doc score"       value={`${METRICS.avgDocScore}%`} sub="↑ +5% vs last month" subClass="text-green-600" />
        <MetricCard label="READMEs generated"   value={METRICS.readmesGenerated}  sub="~6s avg generation"  />
        <MetricCard label="API p95 latency"     value={`${METRICS.p95Latency}ms`} sub="50 concurrent users" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bug Trend */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold">Bug trends</h2>
              <p className="text-xs text-gray-400 mt-0.5">Last 8 weeks</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={bugTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Critical" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="High"     stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Medium"   stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bug Distribution */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold">Bug distribution</h2>
              <p className="text-xs text-gray-400 mt-0.5">By severity</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={bugDistData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value">
                {bugDistData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} formatter={(v) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v, e) => `${v} ${e.payload.value}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Repos */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Recently analyzed repos</h2>
          <span className="badge badge-blue">Live</span>
        </div>
        <div className="divide-y divide-gray-100">
          {REPOS.slice(0, 5).map((r) => (
            <div key={r.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${r.status === "clean" ? "bg-green-50" : r.status === "warning" ? "bg-yellow-50" : "bg-red-50"}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={r.status === "clean" ? "#16a34a" : r.status === "warning" ? "#d97706" : "#dc2626"} strokeWidth="2" strokeLinecap="round">
                  <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.name}</p>
                <p className="text-xs text-gray-400">{r.analyzed} · {r.files.toLocaleString()} files · {r.stack}</p>
              </div>
              <span className={`badge ${scoreClass(r.score)}`}>{r.score} {r.scoreN}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
