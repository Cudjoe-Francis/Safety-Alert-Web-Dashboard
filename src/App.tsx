import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { auth } from "./services/firebase";
import Dashboard from "./pages/Dashboard";
import AlertDetails from "./pages/AlertDetails";
import History from "./pages/History";
import IncidentReports from "./pages/IncidentReports";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import { theme } from "./theme";

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const user = auth.currentUser;
  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const handleLogout = () => {
    auth.signOut();
    window.location.href = "/signin";
  };

  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <div
                style={{
                  display: "flex",
                  minHeight: "100vh",
                  width: "100vw",
                  background: "#f7f8fa",
                }}
              >
                {/* Sidebar */}
                <nav
                  style={{
                    width: 220,
                    minWidth: 180,
                    background: "#f8ead6ff",////////////////////
                    borderRight: `1px solid ${theme.border}`,
                    padding: "2rem 1rem",
                    boxShadow: `2px 0 8px ${theme.shadow}`,
                    height: "100vh",
                    position: "sticky",
                    top: 0,
                  }}
                  className="sidebar"
                >
                  <h1 style={{ color: theme.primary, fontSize: 24, marginBottom: 32 }}
                  className="sidebar-title">
                    Safety Alert
                  </h1>
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    <li>
                      <Link to="/" style={{ color: theme.text, textDecoration: "none" }}>
                        Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link to="/history" style={{ color: theme.text, textDecoration: "none" }}>
                        History
                      </Link>
                    </li>
                    <li>
                      <Link to="/incident-reports" style={{ color: theme.text, textDecoration: "none" }}>
                        Incident Reports
                      </Link>
                    </li>
                  </ul>
                  <button
                    onClick={handleLogout}
                    style={{
                      marginTop: 32,
                      background: "#e53935",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "8px 16px",
                      cursor: "pointer",
                    }}
                  >
                    Logout
                  </button>
                </nav>
                {/* Main Content */}
                <main style={{ flex: 1, padding: "2rem", width: "100%" }}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/alert/:id" element={<AlertDetails />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/incident-reports" element={<IncidentReports />} />
                  </Routes>
                </main>
              </div>
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;