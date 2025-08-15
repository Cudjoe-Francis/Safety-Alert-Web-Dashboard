import React, { useEffect, useState } from "react";
import { db } from "../services/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

interface Alert {
  id: string;
  userName: string;
  serviceType: string;
  time: string;
  location: string;
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
          id: doc.id,
          ...(doc.data() as Alert),
        }))
      );
    });
    return () => unsub();
  }, [serviceType]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ color: "#121a68", marginBottom: 24 }}>Alert History</h2>
      <table
        style={{
          width: "100%",
          background: "#fff",
          borderCollapse: "collapse",
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          borderRadius: 12,
        }}
      >
        <thead>
          <tr style={{ background: "#f7f8fa" }}>
            <th
              style={{
                border: `1px solid #e0e0e0`,
                padding: 12,
              }}
            >
              User
            </th>
            <th
              style={{
                border: `1px solid #e0e0e0`,
                padding: 12,
              }}
            >
              Service
            </th>
            <th
              style={{
                border: `1px solid #e0e0e0`,
                padding: 12,
              }}
            >
              Time
            </th>
            <th
              style={{
                border: `1px solid #e0e0e0`,
                padding: 12,
              }}
            >
              Location
            </th>
            <th
              style={{
                border: `1px solid #e0e0e0`,
                padding: 12,
              }}
            >
              Message
            </th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => (
            <tr key={alert.id}>
              <td
                style={{
                  border: `1px solid #e0e0e0`,
                  padding: 12,
                }}
              >
                {alert.userName}
              </td>
              <td
                style={{
                  border: `1px solid #e0e0e0`,
                  padding: 12,
                }}
              >
                {alert.serviceType}
              </td>
              <td
                style={{
                  border: `1px solid #e0e0e0`,
                  padding: 12,
                }}
              >
                {typeof alert.time === "object" && "toDate" in alert.time
                  ? alert.time.toDate().toLocaleString()
                  : alert.time}
              </td>
              <td
                style={{
                  border: `1px solid #e0e0e0`,
                  padding: 12,
                }}
              >
                {alert.location}
              </td>
              <td
                style={{
                  border: `1px solid #e0e0e0`,
                  padding: 12,
                }}
              >
                {alert.message}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default History;
