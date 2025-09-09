import React, { useEffect, useState } from "react";
import { db } from "../services/firebase";
import {
  collection,
  query,
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedType = localStorage.getItem("serviceType");
    console.log("🔍 Retrieved serviceType from localStorage:", storedType);
    setServiceType(storedType);
  }, []);

  useEffect(() => {
    if (!serviceType) {
      console.log("❌ No serviceType found, setting loading to false");
      setLoading(false);
      return;
    }
    
    console.log("🔍 Fetching alerts for serviceType:", serviceType);
    setLoading(true);
    
    // Clean serviceType to remove any quotes or extra characters
    const cleanServiceType = serviceType.replace(/['"]/g, '').trim().toLowerCase();
    console.log("🧹 Cleaned serviceType for history:", cleanServiceType);
    
    // First, let's check what serviceTypes are actually in the database
    const allAlertsQuery = query(collection(db, "alerts"));
    const tempUnsub = onSnapshot(allAlertsQuery, (tempSnapshot) => {
      const allAlerts = tempSnapshot.docs.map(doc => ({ 
        ...(doc.data() as Alert), 
        id: doc.id 
      }));
      
      console.log("📊 HISTORY DEBUG: All alerts in database:", allAlerts.length);
      console.log("📊 HISTORY DEBUG: ServiceTypes found:", allAlerts.map(a => `"${a.serviceType}"`));
      console.log("📊 HISTORY DEBUG: User serviceType:", `"${serviceType}"`);
      console.log("📊 HISTORY DEBUG: Cleaned serviceType:", `"${cleanServiceType}"`);
      
      // Try multiple matching strategies
      const exactMatch = allAlerts.filter(alert => alert.serviceType === serviceType);
      const cleanMatch = allAlerts.filter(alert => alert.serviceType === cleanServiceType);
      const caseInsensitiveMatch = allAlerts.filter(alert => 
        alert.serviceType?.toString().toLowerCase().trim() === cleanServiceType
      );
      
      console.log(`📊 HISTORY DEBUG: Exact match (${serviceType}):`, exactMatch.length);
      console.log(`📊 HISTORY DEBUG: Clean match (${cleanServiceType}):`, cleanMatch.length);
      console.log(`📊 HISTORY DEBUG: Case insensitive match:`, caseInsensitiveMatch.length);
      
      // Use the best match
      let matchingAlerts = caseInsensitiveMatch.length > 0 ? caseInsensitiveMatch :
                          cleanMatch.length > 0 ? cleanMatch :
                          exactMatch;
      
      // TEMPORARY: If no matches found, show all alerts for debugging
      if (matchingAlerts.length === 0) {
        console.log("⚠️ HISTORY TEMPORARY: No matches found, showing all alerts for debugging");
        matchingAlerts = allAlerts;
      }
      
      console.log(`📊 HISTORY DEBUG: Using ${matchingAlerts.length} alerts`);
      
      setAlerts(matchingAlerts);
      setLoading(false);
      tempUnsub(); // Cleanup this temporary listener
    });
    
    return () => {
      if (tempUnsub) tempUnsub();
    };
  }, [serviceType]);

  if (loading) {
    return (
      <div style={{ 
        maxWidth: 900, 
        margin: "0 auto", 
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh"
      }}>
        <div style={{
          width: "50px",
          height: "50px",
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #ff5330",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          marginBottom: "20px"
        }}></div>
        <p style={{ 
          color: "#121a68", 
          fontSize: "1.1em",
          textAlign: "center"
        }}>
          Loading alert history...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", margin: "0 auto", padding: "1rem" }}>
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
        {alerts.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "3rem 1rem",
            color: "#6b7280",
            fontSize: "1.1em"
          }}>
            <div style={{
              fontSize: "3rem",
              marginBottom: "1rem",
              color: "#d1d5db"
            }}>
              📋
            </div>
            <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>
              No Alert History Found
            </p>
            <p style={{ fontSize: "0.9em" }}>
              All alert histories for your service will appear here once they arrive.
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
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
        ))
        )}
      </div>
    </div>
  );
};

export default History;
