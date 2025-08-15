import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

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

const responderServiceType = serviceType;  const filteredAlerts = alerts.filter(
    (alert) => alert.serviceType === responderServiceType
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ color: "#121a68", marginBottom: 24 }}>Incoming Alerts</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
        {filteredAlerts.map((item) => (
          <div
            key={item.id}
            className="alert-card"
            style={{
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
              padding: 24,
              minWidth: 280,
              flex: "1 1 300px",
              cursor: "pointer",
              transition: "box-shadow 0.2s",
            }}
            onClick={() => navigate(`/alert/${item.id}`)}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 18,
                color: "#ff5330",
                marginBottom: 8,
              }}
            >
              {item.userName}
            </div>
            <div
              style={{
                color: "#121a68",
                fontSize: 15,
                marginBottom: 8,
                textTransform: "capitalize",
              }}
            >
              {item.serviceType}
            </div>
            <div style={{ color: "#222", fontSize: 14, marginBottom: 8 }}>
              {item.location}
            </div>
            <div style={{ color: "#888", fontSize: 13 }}>
              {typeof item.time === "object" && "toDate" in item.time
                ? item.time.toDate().toLocaleString()
                : item.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
