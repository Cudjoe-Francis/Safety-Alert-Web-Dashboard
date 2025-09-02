import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  NavLink,
} from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "./services/firebase";
import Dashboard from "./pages/Dashboard";
import AlertDetails from "./pages/AlertDetails";
import History from "./pages/History";
import IncidentReports from "./pages/IncidentReports";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const user = auth.currentUser;
  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [serviceType, setServiceType] = useState<string | null>(null);

  useEffect(() => {
    const fetchServiceType = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setServiceType(userDoc.data().serviceType);
          localStorage.setItem("serviceType", userDoc.data().serviceType);
        } else {
          setServiceType(null);
          localStorage.removeItem("serviceType");
        }
      } else {
        setServiceType(null);
        localStorage.removeItem("serviceType");
      }
    };

    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged(() => {
      fetchServiceType();
    });

    // Initial fetch
    fetchServiceType();

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    auth.signOut();
    window.location.href = "/signin";
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
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
                    width: 240,
                    overflowX: "hidden",
                    minWidth: 180,
                    color: "#fff",
                    borderRight: "none",
                    padding: "2.5rem 1.5rem",
                    boxShadow: "2px 0 16px rgba(0,0,0,0.08)",
                    height: "100vh",
                    position: "sticky",
                    top: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    zIndex: 1000,
                  }}
                  className="sidebar"
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: 24,
                    }}
                  >
                    <img
                      src="/vite.svg"
                      alt="Logo"
                      style={{
                        width: 38,
                        height: 38,
                        marginRight: 12,
                        borderRadius: 8,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 22,
                        // fontWeight: 700,
                        // letterSpacing: 1,
                        // color: "#000",
                        // fontFamily: "Segoe UI, Arial, sans-serif",
                      }}
                      className="sidebar-title"
                    >
                      Safety Alert
                    </span>
                  </div>
                  {serviceType && (
                    <div
                      style={{
                        background: "rgba(255,255,255,0.12)",
                        color: "#000",
                        fontWeight: 600,
                        borderRadius: 8,
                        padding: "8px 12px",
                        marginBottom: 28,
                        fontSize: 15,
                        boxShadow: "0 2px 8px rgba(255,83,48,0.07)",
                        textAlign: "center",
                        letterSpacing: 0.5,
                        width: "100%",
                      }}
                    >
                      <span style={{ opacity: 0.8 }}>Signed in as</span>{" "}
                      <span
                        style={{ textTransform: "capitalize", fontWeight: 700 }}
                      >
                        {serviceType}
                      </span>
                    </div>
                  )}
                  <ul style={{ listStyle: "none", padding: 0, width: "100%" }}>
                    <li>
                      <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                          isActive ? "sidebar-link active" : "sidebar-link"
                        }
                        style={{
                          // color: "#fff",
                          textDecoration: "none",
                          fontWeight: 600,
                          padding: "12px 0",
                          display: "flex",
                          alignItems: "center",
                          borderRadius: 8,
                          marginBottom: 8,
                          fontSize: 17,
                          transition: "background 0.18s, color 0.18s",
                        }}
                      >
                        <span style={{ marginRight: 10, fontSize: 18 }}>
                          🏠
                        </span>
                        Dashboard
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        to="/history"
                        className={({ isActive }) =>
                          isActive ? "sidebar-link active" : "sidebar-link"
                        }
                        style={{
                          // color: "#fff",
                          textDecoration: "none",
                          fontWeight: 600,
                          padding: "12px 0",
                          display: "flex",
                          alignItems: "center",
                          borderRadius: 8,
                          marginBottom: 8,
                          fontSize: 17,
                          transition: "background 0.18s, color 0.18s",
                        }}
                      >
                        <span style={{ marginRight: 10, fontSize: 18 }}>
                          📜
                        </span>
                        History
                      </NavLink>
                    </li>

                    {/* Uncomment if you want Incident Reports */}
                    {/* <li>
                      <NavLink
                        to="/incident-reports"
                        className={({ isActive }) =>
                          isActive ? "sidebar-link active" : "sidebar-link"
                        }
                        style={{
                          color: "#fff",
                          textDecoration: "none",
                          fontWeight: 600,
                          padding: "12px 0",
                          display: "flex",
                          alignItems: "center",
                          borderRadius: 8,
                          marginBottom: 8,
                          fontSize: 17,
                          transition: "background 0.18s, color 0.18s",
                        }}
                      >
                        <span style={{ marginRight: 10, fontSize: 18 }}>🚨</span>
                        Incident Reports
                      </NavLink>
                    </li> */}
                  </ul>
                  <button
                    onClick={handleLogout}
                    style={{
                      marginTop: "auto",
                      background: "#ff5330",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "10px 24px",
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: 16,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                      alignSelf: "center",
                      marginBottom: 12,
                      transition: "background 0.18s",
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
                    <Route
                      path="/incident-reports"
                      element={<IncidentReports />}
                    />
                  </Routes>
                </main>
                {/* Logout Confirmation Modal */}
                {showLogoutModal && (
                  <div
                    style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      width: "100vw",
                      height: "100vh",
                      background: "rgba(0,0,0,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 2000,
                    }}
                  >
                    <div
                      style={{
                        background: "#fff",
                        padding: "32px 24px",
                        borderRadius: 12,
                        boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
                        textAlign: "center",
                        minWidth: 320,
                      }}
                    >
                      <h3 style={{ marginBottom: 18, color: "#121a68" }}>
                        Confirm Logout
                      </h3>
                      <p style={{ marginBottom: 24 }}>
                        Are you sure you want to logout?
                      </p>
                      <button
                        onClick={confirmLogout}
                        style={{
                          background: "#ff5330",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          padding: "8px 24px",
                          fontWeight: 600,
                          fontSize: 16,
                          marginRight: 12,
                          cursor: "pointer",
                        }}
                      >
                        Logout
                      </button>
                      <button
                        onClick={cancelLogout}
                        style={{
                          background: "#e0e0e0",
                          color: "#121a68",
                          border: "none",
                          borderRadius: 6,
                          padding: "8px 24px",
                          fontWeight: 600,
                          fontSize: 16,
                          cursor: "pointer",
                        }}
                      >
                        Stay Signed In
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
