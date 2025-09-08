import React, { useState, useRef, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  NavLink,
} from "react-router-dom";
import { FiMenu } from "react-icons/fi"; // npm install react-icons
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./services/firebase";
import { initializeAlertSystem } from "./services/newAlertTracker";
import Dashboard from "./pages/Dashboard";
import AlertDetails from "./pages/AlertDetails";
import History from "./pages/History";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import ForgotPassword from "./pages/ForgotPassword";
import logo from "../src/assets/Safety_Alert_App_Logo.jpg"; // Use your actual logo file name

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 22, color: "#121a68" }}>Loading...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [serviceType, setServiceType] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close sidebar when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).classList.contains("menu-icon")
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  useEffect(() => {
    const storedType = localStorage.getItem("serviceType");
    setServiceType(storedType);
  }, [menuOpen]);

  // Always update serviceType when user signs in/up and initialize alert system
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const type = userDoc.data().serviceType;
          setServiceType(type);
          localStorage.setItem("serviceType", type);
          
          // Initialize alert system when user is authenticated
          initializeAlertSystem();
        } else {
          setServiceType(null);
          localStorage.removeItem("serviceType");
        }
      } else {
        setServiceType(null);
        localStorage.removeItem("serviceType");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    localStorage.removeItem("serviceType");
    auth.signOut();
    window.location.href = "/signin";
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
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
                  position: "relative",
                }}
              >
                {/* Hamburger menu icon (centered on top for mobile) */}
                <button
                  className={`menu-icon${menuOpen ? " hide" : ""}`}
                  style={{
                    position: "fixed",
                    top: 18,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 2001,
                    background: "#fff",
                    border: "none",
                    borderRadius: 8,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
                    padding: 8,
                    display: "none",
                  }}
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-label="Open navigation"
                >
                  <FiMenu size={28} color="#ff5330" />
                </button>
                {/* Overlay for mobile sidebar */}
                {menuOpen && (
                  <div
                    className="sidebar-overlay"
                    style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      width: "100vw",
                      height: "100vh",
                      background: "rgba(0,0,0,0.18)",
                      zIndex: 1999,
                    }}
                    onClick={() => setMenuOpen(false)}
                  />
                )}
                {/* Sidebar */}
                <nav
                  ref={sidebarRef}
                  className={`sidebar${menuOpen ? " open" : ""}`}
                  style={{
                    width: 220,
                    minWidth: 180,
                    background: "#fff",
                    borderRight: `1px solid #e0e0e0`,
                    padding: "2rem 1rem",
                    boxShadow: "2px 0 8px rgba(0,0,0,0.07)",
                    height: "100vh",
                    position: "sticky",
                    top: 0,
                    boxSizing: "border-box",
                    transition: "left 0.3s",
                    zIndex: 2000,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 14,
                      marginBottom: 32,
                    }}
                  >
                    <img
                      src={logo}
                      alt="Safety Alert Logo"
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        objectFit: "cover",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        marginTop: 2, // Slight top margin for better alignment
                        marginBottom: 0,
                        display: "block",
                      }}
                    />
                    <h1
                      className="sidebar-title"
                      style={{
                        color: "#ff5330",
                        fontSize: 24,
                        margin: 0,
                        fontWeight: 700,
                        letterSpacing: "1px",
                        lineHeight: "48px",
                        display: "block",
                      }}
                    >
                      Safety Alert
                    </h1>
                  </div>
                  {serviceType && (
                    <div
                      style={{
                        fontSize: "0.85em",
                        color: "#ff5330",
                        fontWeight: 600,
                        marginBottom: 18,
                        letterSpacing: "0.5px",
                      }}
                    >
                      🎉 Signed in as {serviceType}
                    </div>
                  )}
                  <ul style={{ listStyle: "none", padding: 0, flex: 1 }}>
                    <li>
                      <NavLink
                        to="/"
                        className={({ isActive }) =>
                          "sidebar-link" + (isActive ? " active" : "")
                        }
                        style={{ textDecoration: "none" }}
                        onClick={() => setMenuOpen(false)}
                      >
                        Dashboard
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        to="/history"
                        className={({ isActive }) =>
                          "sidebar-link" + (isActive ? " active" : "")
                        }
                        style={{ textDecoration: "none" }}
                        onClick={() => setMenuOpen(false)}
                      >
                        History
                      </NavLink>
                    </li>
                  </ul>
                  <button
                    onClick={handleLogout}
                    style={{
                      marginTop: "auto",
                      background: "#e53935",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "10px 16px",
                      cursor: "pointer",
                      width: "100%",
                      fontWeight: 600,
                      fontSize: "1em",
                      boxShadow: "0 2px 8px rgba(229,57,53,0.09)",
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
                  </Routes>
                </main>
                {/* Logout Confirmation Popup */}
                {showLogoutConfirm && (
                  <div
                    style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      width: "100vw",
                      height: "100vh",
                      background: "rgba(0,0,0,0.18)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 9999,
                    }}
                    onClick={cancelLogout} // <-- Hide popup when clicking overlay
                  >
                    <div
                      style={{
                        background: "#fff",
                        padding: 32,
                        borderRadius: 14,
                        boxShadow: "0 2px 16px rgba(0,0,0,0.15)",
                        minWidth: 300,
                        textAlign: "center",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        style={{
                          marginBottom: 24,
                          color: "#121a68",
                          fontWeight: 600,
                          fontSize: "1.1em",
                        }}
                      >
                        Are you sure you want to logout?
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 16,
                          justifyContent: "center",
                        }}
                      >
                        <button
                          onClick={confirmLogout}
                          style={{
                            background: "red",
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            padding: "10px 24px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Yes, Logout
                        </button>
                        <button
                          onClick={cancelLogout}
                          style={{
                            background: "#e0e0e0",
                            color: "#121a68",
                            border: "none",
                            borderRadius: 8,
                            padding: "10px 24px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
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
