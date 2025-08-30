import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import {
  collection,
  // doc,
  // getDoc,
  onSnapshot,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
// import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

interface EmergencyContact {
  name?: string;
  relationship?: string;
  phone?: string;
}

interface UserDetails {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: string;
  bloodType?: string;
  phoneNumber?: string;
  email?: string;
  homeAddress?: string;
  occupation?: string;
  gender?: string;
  medicalCondition?: string;
  allergies?: string;
}

interface Alert {
  id: string;
  userName: string;
  serviceType: string;
  time: string | Timestamp; // allow both string and Timestamp
  location: string;
  message?: string;
  audioUrl?: string;
  lat?: number;
  lng?: number;
  user?: UserDetails;
  emergencyContacts?: EmergencyContact[];
}

const Dashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [serviceType, setServiceType] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "alerts"), (snapshot) => {
      setAlerts(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Alert),
        }))
      );
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const storedType = localStorage.getItem("serviceType");
    setServiceType(storedType);
  }, []);

  useEffect(() => {
    console.log("serviceType:", serviceType); // Add this line
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

  const responderServiceType = serviceType;
  const filteredAlerts = alerts.filter(
    (alert) => alert.serviceType === responderServiceType
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ color: "#121a68", marginBottom: 24 }}>Incoming Alerts</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
        {filteredAlerts.length === 0 ? (
          <div
            style={{
              width: "100%",
              textAlign: "center",
              color: "#888",
              fontSize: 18,
              padding: "48px 0",
            }}
          >
            🎉 All clear! No alerts have been received for your service yet.
            <br />
            Stay ready—alerts will appear here as soon as they arrive.
          </div>
        ) : (
          filteredAlerts.map((item) => (
            <div
              key={item.id}
              className="alert-card"
              style={{
                background: "linear-gradient(135deg, #fff 80%, #f8ead6ff 100%)",
                borderRadius: 16,
                boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
                padding: 28,
                minWidth: 280,
                flex: "1 1 320px",
                cursor: "pointer",
                transition: "box-shadow 0.2s, transform 0.2s",
                marginBottom: 16,
                border: "1px solid #ff5330",
              }}
              onClick={() => navigate(`/alert/${item.id}`)}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 20,
                  color: "#ff5330",
                  marginBottom: 8,
                  letterSpacing: 0.5,
                }}
              >
                {item.userName}
              </div>
              <div
                style={{
                  color: "#121a68",
                  fontSize: 16,
                  marginBottom: 8,
                  textTransform: "capitalize",
                  fontWeight: 600,
                }}
              >
                {item.serviceType}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "#444",
                  fontSize: 15,
                  marginBottom: 12,
                  gap: 6,
                }}
              >
                <span style={{ fontWeight: 500 }}>
                  <strong>Current Location:</strong> {item.location}
                </span>
              </div>
              <div style={{ color: "#888", fontSize: 13 }}>
                {typeof item.time === "object" && "toDate" in item.time
                  ? item.time.toDate().toLocaleString()
                  : item.time}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
