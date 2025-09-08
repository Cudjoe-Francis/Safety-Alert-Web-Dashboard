import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { simulateEmailNotification, type AlertEmailData } from "../services/emailService";

interface Location {
  address?: string;
  lat?: number;
  lng?: number;
}

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
  time: string | Timestamp;
  location: string | Location;
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
  const [openedAlerts, setOpenedAlerts] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [processedAlerts, setProcessedAlerts] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "alerts"), (snapshot) => {
      setAlerts(
        snapshot.docs.map((doc) => ({
          ...(doc.data() as Alert),
          id: doc.id,
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
    console.log("serviceType:", serviceType);
    if (!serviceType) return;
    const q = query(
      collection(db, "alerts"),
      where("serviceType", "==", serviceType)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const newAlerts = snapshot.docs.map((doc) => ({
        ...(doc.data() as Alert),
        id: doc.id,
      }));
      
      // Check for new alerts and send email notifications
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" && !processedAlerts.includes(change.doc.id)) {
          const alertData = change.doc.data() as Alert;
          const emailData: AlertEmailData = {
            userName: alertData.userName,
            serviceType: alertData.serviceType,
            location: typeof alertData.location === 'string' 
              ? alertData.location 
              : alertData.location?.address || `${alertData.location?.lat}, ${alertData.location?.lng}`,
            time: typeof alertData.time === 'object' && 'toDate' in alertData.time
              ? alertData.time.toDate().toLocaleString()
              : alertData.time.toString(),
            message: alertData.message,
            userDetails: alertData.user ? {
              firstName: alertData.user.firstName,
              lastName: alertData.user.lastName,
              phoneNumber: alertData.user.phoneNumber,
              bloodType: alertData.user.bloodType,
              medicalCondition: alertData.user.medicalCondition,
              allergies: alertData.user.allergies,
            } : undefined,
            emergencyContacts: alertData.emergencyContacts
          };
          
          // Send email notification
          simulateEmailNotification(emailData);
          
          // Mark this alert as processed
          setProcessedAlerts(prev => [...prev, change.doc.id]);
        }
      });
      
      setAlerts(newAlerts);
    });
    return () => unsub();
  }, [serviceType, processedAlerts]);

  useEffect(() => {
    // Load opened alerts from localStorage
    const opened = localStorage.getItem("openedAlerts");
    setOpenedAlerts(opened ? JSON.parse(opened) : []);
  }, []);

  const handleOpenAlert = (id: string) => {
    if (!openedAlerts.includes(id)) {
      const updated = [...openedAlerts, id];
      setOpenedAlerts(updated);
      localStorage.setItem("openedAlerts", JSON.stringify(updated));
    }
    navigate(`/alert/${id}`);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate a short delay for UX (remove if you want instant)
    setTimeout(() => {
      // This will re-trigger the Firestore listener by updating state
      // If you want to force a re-fetch, you can re-run the query manually:
      const q = query(
        collection(db, "alerts"),
        where("serviceType", "==", serviceType)
      );
      onSnapshot(q, (snapshot) => {
        setAlerts(
          snapshot.docs.map((doc) => ({
            ...(doc.data() as Alert),
            id: doc.id,
          }))
        );
        setRefreshing(false);
      });
    }, 800); // 800ms for activity indicator
  };

  const responderServiceType = serviceType;
  const filteredAlerts = alerts.filter(
    (alert) => alert.serviceType === responderServiceType
  );

  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    const timeA =
      typeof a.time === "object" && "toDate" in a.time
        ? a.time.toDate().getTime()
        : new Date(a.time).getTime();
    const timeB =
      typeof b.time === "object" && "toDate" in b.time
        ? b.time.toDate().getTime()
        : new Date(b.time).getTime();
    return timeB - timeA; // Most recent first
  });

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          marginTop: 56,
        }}
      >
        <h2
          style={{
            color: "#121a68",
            fontSize: "1.3em",
            margin: 0,
          }}
        >
          Incoming Alerts
        </h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            background: "#f3f4f6",
            color: "#ff5330",
            border: "none",
            borderRadius: 8,
            padding: "8px 18px",
            fontWeight: 600,
            fontSize: "1em",
            cursor: refreshing ? "not-allowed" : "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            marginLeft: 16,
            width: "fit-content",
            display: "flex",
            alignItems: "center",
            gap: 8,
            opacity: refreshing ? 0.7 : 1,
          }}
          title="Refresh dashboard"
        >
          {refreshing ? (
            <span
              style={{
                display: "inline-block",
                width: 18,
                height: 18,
                border: "2px solid #ff5330",
                borderTop: "2px solid #f3f4f6",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
          ) : (
            "Refresh"
          )}
        </button>
      </div>

      {/* Desktop Card Grid */}
      <div
        className="dashboard-alerts-desktop"
        style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}
      >
        {sortedAlerts.length === 0 ? (
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
          sortedAlerts.map((item) => (
            <div
              key={item.id}
              className="alert-card"
              style={{
                position: "relative",
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                padding: "1rem",
                marginBottom: "1rem",
                width: "100%",
                boxSizing: "border-box",
                minWidth: 0,
                cursor: "pointer",
              }}
              onClick={() => handleOpenAlert(item.id)}
            >
              {/* Badge for unopened alert */}
              {!openedAlerts.includes(item.id) && (
                <span
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 18,
                    background: "#ff5330",
                    color: "#fff",
                    borderRadius: "50%",
                    padding: "6px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                    boxShadow: "0 2px 8px rgba(255,83,48,0.13)",
                  }}
                >
                  NEW
                </span>
              )}
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
                  <strong>Current Location:</strong>{" "}
                  {typeof item.location === "string"
                    ? item.location
                    : `${item.location?.address ?? ""} (${
                        item.location?.lat ?? ""
                      }, ${item.location?.lng ?? ""})`}
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

      {/* Mobile Card/List Layout */}
      <div className="dashboard-alerts-mobile">
        {sortedAlerts.length === 0 ? (
          <div
            style={{
              width: "100%",
              textAlign: "center",
              color: "#888",
              fontSize: 16,
              padding: "36px 0",
            }}
          >
            🎉 All clear! No alerts have been received for your service yet.
          </div>
        ) : (
          sortedAlerts.map((item) => (
            <div
              key={item.id}
              className="dashboard-alert-mobile-card"
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
              onClick={() => handleOpenAlert(item.id)}
            >
              <div style={{ fontWeight: 600, color: "#121a68" }}>
                {item.userName}{" "}
                <span style={{ color: "#ff5330", fontWeight: 500 }}>
                  ({item.serviceType})
                </span>
              </div>
              <div style={{ color: "#6b7280", fontSize: 14 }}>
                <strong>Location:</strong>{" "}
                {typeof item.location === "string"
                  ? item.location
                  : item.location?.address}
              </div>
              <div style={{ color: "#888", fontSize: 13 }}>
                <strong>Time:</strong>{" "}
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
