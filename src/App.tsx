import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AlertDetails from "./pages/AlertDetails";
import History from "./pages/History";
import { theme } from "./theme";

const App: React.FC = () => {
  return (
    <Router>
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          width: "100vw",
          background: theme.background,
        }}
      >
        {/* Sidebar */}
        <nav
          style={{
            width: 220,
            minWidth: 180,
            background: theme.card,
            borderRight: `1px solid ${theme.border}`,
            padding: "2rem 1rem",
            boxShadow: `2px 0 8px ${theme.shadow}`,
            height: "100vh",
            position: "sticky",
            top: 0,
          }}
          className="sidebar"
        >
          <h1 style={{ color: theme.primary, fontSize: 24, marginBottom: 32 }}>
            Safety Alert
          </h1>
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li>
              <Link
                to="/"
                style={{ color: theme.text, textDecoration: "none" }}
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/history"
                style={{ color: theme.text, textDecoration: "none" }}
              >
                History
              </Link>
            </li>
          </ul>
        </nav>
        {/* Main Content */}
        <main style={{ flex: 1, padding: "2rem", width: "100%" }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/alert/:id" element={<AlertDetails />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
