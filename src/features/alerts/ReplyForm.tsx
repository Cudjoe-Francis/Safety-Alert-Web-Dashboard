import React, { useState } from "react";
import { theme } from "../../theme";

interface ReplyFormProps {
  onSend: (reply: {
    responderName: string;
    station: string;
    message: string;
  }) => void;
}

const ReplyForm: React.FC<ReplyFormProps> = ({ onSend }) => {
  const [responderName, setResponderName] = useState("");
  const [station, setStation] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (responderName && station && message) {
      onSend({ responderName, station, message });
      setMessage("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
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
      <h3>Send a Reply</h3>
      <div style={{ marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Responder Name"
          value={responderName}
          onChange={(e) => setResponderName(e.target.value)}
          style={{
            width: "100%",
            padding: 8,
            marginBottom: 8,
            border: `1px solid ${theme.border}`,
            borderRadius: 4,
          }}
          required
        />
        <input
          type="text"
          placeholder="Station"
          value={station}
          onChange={(e) => setStation(e.target.value)}
          style={{
            width: "100%",
            padding: 8,
            marginBottom: 8,
            border: `1px solid ${theme.border}`,
            borderRadius: 4,
          }}
          required
        />
        <textarea
          placeholder="Type your reply..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{
            width: "100%",
            padding: 8,
            border: `1px solid ${theme.border}`,
            borderRadius: 4,
            minHeight: 60,
          }}
          required
        />
      </div>
      <button
        type="submit"
        style={{
          background: theme.primary,
          color: theme.textLight,
          border: "none",
          borderRadius: 4,
          padding: "8px 16px",
          cursor: "pointer",
        }}
      >
        Send Reply
      </button>
    </form>
  );
};

export default ReplyForm;
