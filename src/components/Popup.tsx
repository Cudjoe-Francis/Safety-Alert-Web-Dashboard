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
      background: "rgba(0,0,0,0.3)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}
  >
    <div
      style={{
        minWidth: "90vw",
        padding: 16,
        borderRadius: 12,
        boxSizing: "border-box",
        background: "#fff",
        // ...other styles...
      }}
    >
      <div style={{ marginBottom: 24, color: "#e53935", fontWeight: 600 }}>
        {message}
      </div>
      <button
        onClick={onClose}
        style={{
          background: "#ff5330",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "10px 24px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        OK
      </button>
    </div>
  </div>
);

export default Popup;
