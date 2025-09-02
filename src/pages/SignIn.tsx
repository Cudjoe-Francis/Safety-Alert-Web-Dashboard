import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { Link, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import Popup from "../components/Popup";

const SignIn: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [popupMsg, setPopupMsg] = useState("");
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
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
      // console.log(err); // <-- Add this line
      if (err.code === "auth/user-not-found") {
        setPopupMsg("No account found with this email.");
      } else if (err.code === "auth/wrong-password") {
        setPopupMsg("Incorrect password. Please try again.");
      } else if (err.code === "auth/invalid-email") {
        setPopupMsg("Please enter a valid email address.");
      } else {
        setPopupMsg("Sign in failed. Please try again.");
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
        onSubmit={handleSignIn}
        style={{
          maxWidth: 400,
          width: "100%",
          background: "#fff",
          padding: 32,
          borderRadius: 16,
          boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
        }}
      >
        <h2
          style={{
            color: "#ff5330",
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
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        >
          Sign In
        </button>
        <div style={{ marginTop: 16, textAlign: "center" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: "#ff5330", fontWeight: 500 }}>
            Sign Up
          </Link>
        </div>
      </form>
      {popupMsg && <Popup message={popupMsg} onClose={() => setPopupMsg("")} />}
    </div>
  );
};

export default SignIn;
