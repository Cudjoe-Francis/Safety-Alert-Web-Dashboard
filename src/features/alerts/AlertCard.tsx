import React from "react";

interface AlertCardProps {
  userName: string;
  serviceType: string;
  time: string;
  location: string;
  phoneNumber?: string;
  bloodType?: string;
  medicalCondition?: string;
  onClick?: () => void;
}

const AlertCard: React.FC<AlertCardProps> = ({
  userName,
  serviceType,
  time,
  location,
  phoneNumber,
  bloodType,
  medicalCondition,
  onClick,
}) => {
  return (
    <div
      className="alert-card"
      onClick={onClick}
      style={{
        background: "#fff",
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
        padding: "1rem",
        marginBottom: "1rem",
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow 0.2s",
      }}
    >
      <div style={{ fontWeight: 600, color: "#ff5330" }}>{userName}</div>
      <div style={{ color: "#121a68", fontSize: 14 }}>{serviceType}</div>
      <div style={{ color: "#222", fontSize: 13 }}>{location}</div>
      <div style={{ color: "#888", fontSize: 12 }}>{time}</div>
      {phoneNumber && (
        <div style={{ color: "#888", fontSize: 12 }}>Phone: {phoneNumber}</div>
      )}
      {bloodType && (
        <div style={{ color: "#888", fontSize: 12 }}>
          Blood Type: {bloodType}
        </div>
      )}
      {medicalCondition && (
        <div style={{ color: "#888", fontSize: 12 }}>
          Condition: {medicalCondition}
        </div>
      )}
    </div>
  );
};

export default AlertCard;
