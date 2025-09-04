import React from "react";

const Popup: React.FC<{ message: string; onClose: () => void }> = ({
  message,
  onClose,
}) => (
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
    // Close popup when clicking overlay
    onClick={onClose}
  >
    <div
      style={{
        minWidth: 300,
        maxWidth: "90vw",
        padding: 32,
        borderRadius: 16,
        boxSizing: "border-box",
        background: "#fff",
        boxShadow: "0 4px 24px rgba(0,0,0,0.13)",
        textAlign: "center",
        position: "relative",
        transition: "box-shadow 0.2s",
      }}
      // Prevent closing when clicking inside popup
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          marginBottom: 24,
          color: "red",
          fontWeight: 700,
          fontSize: "1.1em",
          letterSpacing: "0.5px",
        }}
      >
        {message}
      </div>
      <button
        onClick={onClose}
        style={{
          // background: "linear-gradient(90deg, #ff5330 60%, #ff8c42 100%)",
          background: "#ff5330",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "10px 32px",
          fontWeight: 600,
          fontSize: "1em",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(255,83,48,0.09)",
          transition: "background 0.2s",
        }}
      >
        OK
      </button>
    </div>
  </div>
);

export default Popup;
