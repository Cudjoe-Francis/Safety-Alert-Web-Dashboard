import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { Link, useNavigate } from "react-router-dom";
import Popup from "../components/Popup";
import { FiEye, FiEyeOff } from "react-icons/fi";
import bgImage from "../assets/Safety_Alert_Dashboard_Background.jpg";
import { validateLogin } from "../services/userValidationService";

const SignIn: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [popupMsg, setPopupMsg] = useState("");
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // First validate if user can login on web dashboard
      const loginValidation = await validateLogin(email, 'web_dashboard');
      
      if (!loginValidation.isValid) {
        setPopupMsg(loginValidation.message);
        return;
      }
      
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      if (userDoc.exists()) {
        localStorage.setItem("serviceType", userDoc.data().serviceType);
      }
      navigate("/");
    } catch (err: any) {
      console.log("Firebase sign-in error:", err);
      if (err.code === "auth/user-not-found") {
        setPopupMsg("No account found with this email. Please sign up first.");
      } else if (err.code === "auth/wrong-password") {
        setPopupMsg("Incorrect password. Please try again.");
      } else if (err.code === "auth/invalid-email") {
        setPopupMsg("Please enter a valid email address.");
      } else if (err.code === "auth/invalid-credential") {
        setPopupMsg(
          "Invalid credentials. Please check your email and password."
        );
      } else {
        setPopupMsg(err.message || "Sign in failed. Please try again.");
      }
    }
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", width: "100vw" }}>
      {/* Blurred background image */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          background: `url(${bgImage}) center center / cover no-repeat`,
          filter: "blur(8px) brightness(0.5)",
          opacity: 0.9,
        }}
      />
      {/* Form container on top */}
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <form
          onSubmit={handleSignIn}
          style={{
            maxWidth: 400,
            width: "100%",
            background: "#fff",
            padding: 16,
            borderRadius: 12,
            boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
            boxSizing: "border-box",
          }}
        >
          <h2
            style={{
              color: "#121a68",
              marginBottom: 24,
              textAlign: "center",
            }}
          >
            Sign In
          </h2>
          <label
            style={{
              fontWeight: 500,
              marginBottom: 8,
              display: "block",
            }}
          >
            Email
          </label>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: 10,
              marginBottom: 16,
              borderRadius: 8,
              border: "1px solid #e0e0e0",
              fontSize: 16,
            }}
          />
          <label
            style={{
              fontWeight: 500,
              marginBottom: 8,
              display: "block",
            }}
          >
            Password
          </label>
          <div
            style={{
              position: "relative",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
            }}
          >
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px 44px 12px 12px", // more space for icon
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 16,
                background: "#f3f4f6", // nice greyish background
                color: "#222",
                boxSizing: "border-box",
                outline: "none",
                transition: "border 0.2s",
              }}
            />
            <span
              onClick={() => setShowPassword((v) => !v)}
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                color: "#6b7280", // greyish icon
                fontSize: 22,
                background: "#f3f4f6",
                borderRadius: "50%",
                padding: 2,
                transition: "color 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={0}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </span>
          </div>
          <button
            type="submit"
            style={{
              width: "100%",
              background: "#ff5330",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "12px 0",
              fontWeight: 600,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Sign In
          </button>
          <div style={{ marginTop: 16, textAlign: "center" }}>
            Don't have an account?{" "}
            <Link to="/signup" style={{ color: "#ff5330", fontWeight: 500 }}>
              Sign Up
            </Link>
          </div>
          <div style={{ marginTop: 8, textAlign: "center" }}>
            <Link
              to="/forgot-password"
              style={{ color: "#ff5330", fontWeight: 500 }}
            >
              Forgot Password?
            </Link>
          </div>
        </form>
        {popupMsg && (
          <Popup message={popupMsg} onClose={() => setPopupMsg("")} />
        )}
      </div>
    </div>
  );
};

export default SignIn;
