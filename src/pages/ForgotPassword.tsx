import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/firebase";
import { Link } from "react-router-dom";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [popupMsg, setPopupMsg] = useState("");
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
      setPopupMsg(
        "A password reset email has been sent. Please check your inbox."
      );
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        setPopupMsg("No account found with this email.");
      } else if (err.code === "auth/invalid-email") {
        setPopupMsg("Please enter a valid email address.");
      } else {
        setPopupMsg("Failed to send reset email. Please try again.");
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
        onSubmit={handleReset}
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
          Forgot Password
        </h2>
        <label
          style={{
            fontWeight: 500,
            marginBottom: 8,
            display: "block",
          }}
        >
          Enter your email address
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
          disabled={sent}
        >
          Send Reset Email
        </button>
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <Link to="/signin" style={{ color: "#ff5330", fontWeight: 500 }}>
            Back to Sign In
          </Link>
        </div>
        {popupMsg && (
          <div
            style={{
              marginTop: 18,
              color: sent ? "#121a68" : "#e53935",
              fontWeight: 500,
              textAlign: "center",
            }}
          >
            {popupMsg}
          </div>
        )}
        {sent && (
          <div style={{ marginTop: 8, color: "#ff5330", fontSize: "0.95em" }}>
            If you don't see the email, please check your spam folder and mark
            it as "Not Spam".
          </div>
        )}
      </form>
    </div>
  );
};

export default ForgotPassword;
