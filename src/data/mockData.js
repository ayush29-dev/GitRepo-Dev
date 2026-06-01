export const REPOS = [
  { id: 1, name: "facebook/react",       lang: "js",  stack: "JS/TS",   files: 847,   bugs: 12,  doc: 88, score: "A", scoreN: 94, analyzed: "2h ago",    status: "clean"   },
  { id: 2, name: "vercel/next.js",        lang: "js",  stack: "JS/TS",   files: 1203,  bugs: 31,  doc: 74, score: "B", scoreN: 78, analyzed: "5h ago",    status: "warning" },
  { id: 3, name: "torvalds/linux",        lang: "c",   stack: "C",       files: 28000, bugs: 204, doc: 42, score: "C", scoreN: 62, analyzed: "Yesterday", status: "danger"  },
  { id: 4, name: "openai/whisper",        lang: "py",  stack: "Python",  files: 340,   bugs: 8,   doc: 91, score: "A", scoreN: 91, analyzed: "2d ago",    status: "clean"   },
  { id: 5, name: "django/django",         lang: "py",  stack: "Python",  files: 1890,  bugs: 19,  doc: 85, score: "A", scoreN: 87, analyzed: "3d ago",    status: "clean"   },
  { id: 6, name: "microsoft/vscode",      lang: "js",  stack: "JS/TS",   files: 4210,  bugs: 67,  doc: 61, score: "C", scoreN: 65, analyzed: "4d ago",    status: "warning" },
  { id: 7, name: "redis/redis",           lang: "c",   stack: "C",       files: 820,   bugs: 44,  doc: 55, score: "C", scoreN: 59, analyzed: "5d ago",    status: "warning" },
  { id: 8, name: "tiangolo/fastapi",      lang: "py",  stack: "Python",  files: 412,   bugs: 5,   doc: 96, score: "A", scoreN: 96, analyzed: "6d ago",    status: "clean"   },
];

export const BUGS = [
  { id: 1,  sev: "critical", type: "Null dereference",     file: "src/core/renderer.c",  line: 247, repo: "torvalds/linux",   lang: "C"      },
  { id: 2,  sev: "critical", type: "SQL injection risk",   file: "db/queries.py",         line: 89,  repo: "django/django",    lang: "Python" },
  { id: 3,  sev: "critical", type: "Memory leak",          file: "allocator.c",           line: 412, repo: "redis/redis",      lang: "C"      },
  { id: 4,  sev: "high",     type: "Unhandled promise",    file: "src/hooks/useEffect.js",line: 134, repo: "facebook/react",   lang: "JS"     },
  { id: 5,  sev: "high",     type: "N+1 query pattern",    file: "models/user.py",        line: 67,  repo: "django/django",    lang: "Python" },
  { id: 6,  sev: "high",     type: "Buffer overflow",      file: "net/socket.c",          line: 891, repo: "torvalds/linux",   lang: "C"      },
  { id: 7,  sev: "medium",   type: "Missing error handler",file: "pages/api/route.ts",    line: 23,  repo: "vercel/next.js",   lang: "TS"     },
  { id: 8,  sev: "medium",   type: "Redundant API call",   file: "src/fetch.js",          line: 156, repo: "microsoft/vscode", lang: "JS"     },
  { id: 9,  sev: "medium",   type: "Type coercion",        file: "src/parser.ts",         line: 78,  repo: "vercel/next.js",   lang: "TS"     },
  { id: 10, sev: "low",      type: "Unused variable",      file: "utils/helpers.py",      line: 45,  repo: "openai/whisper",   lang: "Python" },
  { id: 11, sev: "low",      type: "Dead code block",      file: "src/router.ts",         line: 302, repo: "microsoft/vscode", lang: "TS"     },
];

export const REPORTS = [
  { id: 1, name: "facebook/react — full analysis", date: "May 25 2026", size: "1.2 MB",  type: "Full Report"   },
  { id: 2, name: "vercel/next.js — bug report",    date: "May 25 2026", size: "340 KB",  type: "Bug Report"    },
  { id: 3, name: "openai/whisper — README",         date: "May 23 2026", size: "18 KB",   type: "README"        },
  { id: 4, name: "django/django — JSDoc export",    date: "May 22 2026", size: "892 KB",  type: "Docs Export"   },
  { id: 5, name: "tiangolo/fastapi — optimization", date: "May 21 2026", size: "210 KB",  type: "Optimization"  },
];

export const BUG_TREND = {
  labels: ["W1","W2","W3","W4","W5","W6","W7","W8"],
  critical: [8, 12, 9, 14, 11, 10, 13, 12],
  high:     [22, 28, 19, 31, 26, 24, 29, 27],
  medium:   [45, 52, 41, 60, 55, 49, 58, 56],
};

export const DOC_TREND = {
  labels: ["W1","W2","W3","W4","W5","W6","W7","W8"],
  avg:    [58, 61, 64, 62, 66, 68, 70, 71],
};

export const METRICS = {
  reposAnalyzed:    124,
  bugsDetected:     847,
  criticalBugs:     38,
  avgDocScore:      71,
  readmesGenerated: 58,
  p95Latency:       180,
};
