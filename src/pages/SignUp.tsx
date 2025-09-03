import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { Link, useNavigate } from "react-router-dom";
import Popup from "../components/Popup";
import { FiEye, FiEyeOff } from "react-icons/fi";

const serviceTypes = ["Police", "Hospital", "Fire", "Campus"];

const SignUp: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [serviceType, setServiceType] = useState(serviceTypes[0]);
  const [popupMsg, setPopupMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await setDoc(doc(db, "users", userCredential.user.uid), {
        serviceType,
        email,
      });
      localStorage.setItem("serviceType", serviceType); // Store service type in localStorage
      navigate("/"); // Use navigate instead of window.location.href
    } catch (err: any) {
      // Firebase error codes: https://firebase.google.com/docs/reference/js/auth.md#autherrorcodes
      if (err.code === "auth/email-already-in-use") {
        setPopupMsg(
          "This email is already registered. Please sign in or use another email."
        );
      } else if (err.code === "auth/invalid-email") {
        setPopupMsg("Please enter a valid email address.");
      } else if (err.code === "auth/weak-password") {
        setPopupMsg("Password should be at least 6 characters.");
      } else {
        setPopupMsg("Sign up failed. Please try again.");
      }
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f7f8fa",
      }}
    >
      <form
        onSubmit={handleSignUp}
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
          Sign Up
        </h2>
        <label
          style={{
            fontWeight: 500,
            marginBottom: 8,
            display: "block",
          }}
        >
          Service Type
        </label>
        <select
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 16,
            borderRadius: 8,
            border: "1px solid #e0e0e0",
            fontSize: 16,
          }}
        >
          {serviceTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
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
          Sign Up
        </button>
        <div style={{ marginTop: 16, textAlign: "center" }}>
          Already have an account?{" "}
          <Link to="/signin" style={{ color: "#ff5330", fontWeight: 500 }}>
            Sign In
          </Link>
        </div>
      </form>
      {popupMsg && <Popup message={popupMsg} onClose={() => setPopupMsg("")} />}
    </div>
  );
};

export default SignUp;
