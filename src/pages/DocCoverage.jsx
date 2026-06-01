import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { REPOS, DOC_TREND, METRICS } from "../data/mockData";

const docTrendData = DOC_TREND.labels.map((w, i) => ({ week: w, avg: DOC_TREND.avg[i] }));
const docBarData   = [...REPOS].sort((a, b) => b.doc - a.doc).map((r) => ({
  name: r.name.split("/")[1],
  coverage: r.doc,
  fill: r.doc >= 80 ? "#16a34a" : r.doc >= 60 ? "#3b82f6" : "#f59e0b",
}));

function MetricCard({ label, value }) {
  return (
    <div className="metric-card">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default function DocCoverage() {
  return (
    <div className="p-6 space-y-5">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Avg coverage"       value={`${METRICS.avgDocScore}%`} />
        <MetricCard label="READMEs generated"  value={METRICS.readmesGenerated}  />
        <MetricCard label="JSDoc / Docstrings" value="2,140"                     />
        <MetricCard label="API docs"           value="312"                       />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="text-sm font-semibold mb-4">Coverage by repo</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={docBarData} layout="vertical" margin={{ left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} formatter={(v) => `${v}%`} />
              <Bar dataKey="coverage" radius={[0, 4, 4, 0]}>
                {docBarData.map((entry, i) => (
                  <rect key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold mb-1">Coverage trend</h2>
          <p className="text-xs text-gray-400 mb-4">Last 8 weeks</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={docTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} formatter={(v) => `${v}%`} />
              <Line type="monotone" dataKey="avg" stroke="#1D9E75" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Progress bars */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold mb-4">Repo doc breakdown</h2>
        <div className="space-y-3">
          {[...REPOS].sort((a, b) => b.doc - a.doc).map((r) => (
            <div key={r.id}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">{r.name}</span>
                <span className="font-medium">{r.doc}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${r.doc}%`,
                    background: r.doc >= 80 ? "#16a34a" : r.doc >= 60 ? "#3b82f6" : "#f59e0b",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
