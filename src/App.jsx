import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar   from "./components/Sidebar";
import Topbar    from "./components/Topbar";
import Dashboard    from "./pages/Dashboard";
import Repositories from "./pages/Repositories";
import BugReports   from "./pages/BugReports";
import DocCoverage  from "./pages/DocCoverage";
import Reports      from "./pages/Reports";
import Generator    from "./pages/Generator";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-col flex-1 ml-52">
          <Topbar />
          <main className="flex-1">
            <Routes>
              <Route path="/"        element={<Dashboard />}    />
              <Route path="/repos"   element={<Repositories />} />
              <Route path="/bugs"    element={<BugReports />}   />
              <Route path="/docs"    element={<DocCoverage />}  />
              <Route path="/reports"  element={<Reports />}      />
              <Route path="/generate" element={<Generator />}    />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
