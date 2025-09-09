import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, doc, getDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { sendEmailToAllServiceUsers } from "../services/serviceTypeEmailService";

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
  userEmail?: string;
  emergencyContacts?: EmergencyContact[];
}

const Dashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [serviceType, setServiceType] = useState<string | null>(null);
  const [openedAlerts, setOpenedAlerts] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  // Check authentication and get user data
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      console.log("🔐 Auth state changed:", currentUser?.email);
      
      if (!currentUser) {
        console.log("❌ No user logged in - redirecting to signin");
        navigate("/signin");
        return;
      }

      
      // Get user document to get serviceType
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log("👤 User data:", userData);
          console.log("🏷️ User serviceType:", userData.serviceType);
          
          // Save to localStorage and state
          localStorage.setItem("serviceType", userData.serviceType);
          setServiceType(userData.serviceType);
        } else {
          console.log("❌ User document not found");
        }
      } catch (error) {
        console.error("❌ Error fetching user data:", error);
      }
    });

    return () => unsubAuth();
  }, [navigate]);

  // Fetch and filter alerts
  useEffect(() => {
    if (!serviceType) {
      console.log("⏳ Waiting for serviceType...");
      return;
    }
    
    console.log("🔍 Fetching alerts for serviceType:", serviceType);
    
    // Clean serviceType to remove any quotes or extra characters
    const cleanServiceType = serviceType.replace(/['"]/g, '').trim().toLowerCase();
    console.log("🧹 Cleaned serviceType:", cleanServiceType);
    
    // Fetch all alerts and filter them
    const allAlertsQuery = query(collection(db, "alerts"));
    const unsub = onSnapshot(allAlertsQuery, (snapshot) => {
      const allAlerts = snapshot.docs.map(doc => ({ 
        ...(doc.data() as Alert), 
        id: doc.id 
      }));
      
      // Check for new alerts and send email notifications
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          const newAlert = { ...(change.doc.data() as Alert), id: change.doc.id };
          console.log(`🚨 New alert detected: ${newAlert.serviceType} - ${newAlert.userName}`);
          
          // Send email notification to all users with matching service type
          try {
            await sendEmailToAllServiceUsers({
              serviceType: newAlert.serviceType,
              userName: newAlert.userName,
              location: typeof newAlert.location === 'string' ? newAlert.location : newAlert.location?.address || 'Location provided',
              time: typeof newAlert.time === 'object' && 'toDate' in newAlert.time ? newAlert.time.toDate().toLocaleString() : newAlert.time?.toString() || new Date().toLocaleString(),
              message: newAlert.message || '',
              alertId: newAlert.id
            });
            console.log(`✅ Email notifications sent for ${newAlert.serviceType} alert`);
          } catch (error) {
            console.error(`❌ Failed to send email notifications for alert ${newAlert.id}:`, error);
          }
        }
      });
      
      // Try multiple matching strategies
      const exactMatch = allAlerts.filter(alert => alert.serviceType === serviceType);
      const cleanMatch = allAlerts.filter(alert => alert.serviceType === cleanServiceType);
      const caseInsensitiveMatch = allAlerts.filter(alert => 
        alert.serviceType?.toString().toLowerCase().trim() === cleanServiceType
      );
      
      // Use the best match
      let matchingAlerts = caseInsensitiveMatch.length > 0 ? caseInsensitiveMatch :
                          cleanMatch.length > 0 ? cleanMatch :
                          exactMatch;
      
      console.log(`📊 Found ${matchingAlerts.length} matching alerts`);
      setAlerts(matchingAlerts);
    });
    
    return () => unsub();
  }, [serviceType]);

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
    
    // Simple refresh - just re-trigger the useEffect
    if (serviceType) {
      const cleanServiceType = serviceType.replace(/['"]/g, '').trim().toLowerCase();
      
      const allAlertsQuery = query(collection(db, "alerts"));
      const tempUnsub = onSnapshot(allAlertsQuery, (snapshot) => {
        const allAlerts = snapshot.docs.map(doc => ({ 
          ...(doc.data() as Alert), 
          id: doc.id 
        }));
        
        // Filter alerts for this service
        const matchingAlerts = allAlerts.filter(alert => 
          alert.serviceType?.toString().toLowerCase().trim() === cleanServiceType
        );
        
        setAlerts(matchingAlerts);
        setRefreshing(false);
        tempUnsub();
      });
    } else {
      setRefreshing(false);
    }
  };

  // Alerts are already filtered in useEffect, no need to filter again
  const filteredAlerts = alerts;

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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 13, color: "#888" }}>
                  {typeof item.time === 'object' && 'toDate' in item.time
                    ? item.time.toDate().toLocaleString()
                    : item.time.toString()}
                </span>
                <span
                  style={{
                    background:
                      item.serviceType === "police"
                        ? "#dbeafe"
                        : item.serviceType === "hospital"
                        ? "#fecaca"
                        : item.serviceType === "fire"
                        ? "#fed7aa"
                        : "#d1fae5",
                    color:
                      item.serviceType === "police"
                        ? "#1e40af"
                        : item.serviceType === "hospital"
                        ? "#dc2626"
                        : item.serviceType === "fire"
                        ? "#ea580c"
                        : "#059669",
                    padding: "4px 8px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {item.serviceType.toUpperCase()}
                </span>
              </div>
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
