import React, { useEffect, useState } from "react";
import { db } from "../services/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";

interface Location {
  address?: string;
  lat?: number;
  lng?: number;
}

interface Alert {
  id: string;
  userName: string;
  serviceType: string;
  time: string | Timestamp;
  location: string | Location;
  message?: string;
}

const History: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [serviceType, setServiceType] = useState<string | null>(null);

  useEffect(() => {
    const storedType = localStorage.getItem("serviceType");
    setServiceType(storedType);
  }, []);

  useEffect(() => {
    if (!serviceType) return;
    const q = query(
      collection(db, "alerts"),
      where("serviceType", "==", serviceType)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setAlerts(
        snapshot.docs.map((doc) => ({
          ...(doc.data() as Alert),
          id: doc.id,
        }))
      );
    });
    return () => unsub();
  }, [serviceType]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1rem" }}>
      <h2
        style={{
          color: "#121a68",
          marginBottom: 24,
          fontSize: "1.3em",
          marginTop: 56, // Add this line for spacing below menu bar
        }}
      >
        Alert History
      </h2>
      {/* Desktop Table */}
      <div
        className="alert-history-table-container"
        style={{ display: "none" }}
      >
        <table
          className="alert-history-table"
          style={{
            width: "100%",
            minWidth: 600,
            borderCollapse: "collapse",
            fontSize: "1em",
          }}
        >
          <thead>
            <tr style={{ background: "#f7f8fa" }}>
              <th
                style={{
                  border: "1px solid #e0e0e0",
                  padding: 12,
                  fontWeight: 600,
                }}
              >
                User
              </th>
              <th
                style={{
                  border: "1px solid #e0e0e0",
                  padding: 12,
                  fontWeight: 600,
                }}
              >
                Service
              </th>
              <th
                style={{
                  border: "1px solid #e0e0e0",
                  padding: 12,
                  fontWeight: 600,
                }}
              >
                Time
              </th>
              <th
                style={{
                  border: "1px solid #e0e0e0",
                  padding: 12,
                  fontWeight: 600,
                }}
              >
                Location
              </th>
              <th
                style={{
                  border: "1px solid #e0e0e0",
                  padding: 12,
                  fontWeight: 600,
                }}
              >
                Message
              </th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert.id} style={{ background: "#f9fafb" }}>
                <td style={{ border: "1px solid #e0e0e0", padding: 12 }}>
                  {alert.userName}
                </td>
                <td style={{ border: "1px solid #e0e0e0", padding: 12 }}>
                  {alert.serviceType}
                </td>
                <td style={{ border: "1px solid #e0e0e0", padding: 12 }}>
                  {typeof alert.time === "object" &&
                  alert.time &&
                  "toDate" in alert.time
                    ? (alert.time as Timestamp).toDate().toLocaleString()
                    : alert.time}
                </td>
                <td style={{ border: "1px solid #e0e0e0", padding: 12 }}>
                  {typeof alert.location === "string"
                    ? alert.location
                    : alert.location?.address}
                </td>
                <td style={{ border: "1px solid #e0e0e0", padding: 12 }}>
                  {alert.message}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile Card/List Layout */}
      <div className="alert-history-mobile-list">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="alert-history-mobile-card"
            style={{
              background: "#fff",
              borderRadius: 10,
              boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
              padding: "1rem",
              marginBottom: 16,
              fontSize: 15,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div style={{ fontWeight: 600, color: "#121a68" }}>
              {alert.userName}{" "}
              <span
                style={{ color: "#ff5330", fontWeight: 500 }}
              >{`(${alert.serviceType})`}</span>
            </div>
            <div style={{ color: "#6b7280", fontSize: 14 }}>
              <strong>Time:</strong>{" "}
              {typeof alert.time === "object" &&
              alert.time &&
              "toDate" in alert.time
                ? (alert.time as Timestamp).toDate().toLocaleString()
                : alert.time}
            </div>
            <div style={{ color: "#6b7280", fontSize: 14 }}>
              <strong>Location:</strong>{" "}
              {typeof alert.location === "string"
                ? alert.location
                : alert.location?.address}
            </div>
            {alert.message && (
              <div style={{ color: "#222", fontSize: 15 }}>
                <strong>Message:</strong> {alert.message}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;
