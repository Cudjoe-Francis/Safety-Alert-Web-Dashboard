import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import ReplyForm from "../features/alerts/ReplyForm";
import LocationMap from "../features/alerts/LocationMap";
import { sendReplyNotification } from "../services/replyNotificationService";
import { sendReplyEmailToUser } from "../services/replyEmailService";
import { useToast } from "../hooks/useToast";

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
  audioUrl?: string;
  lat?: number;
  lng?: number;
  user?: UserDetails;
  emergencyContacts?: EmergencyContact[];
  userId?: string;
  email?: string;
  homeAddress?: string;
  occupation?: string;
  medicalCondition?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
}

interface Reply {
  id: string;
  responderName: string;
  station: string;
  message: string;
  createdAt?: Timestamp;
}

const AlertDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [alertData, setAlertData] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [replies, setReplies] = useState<Reply[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchAlert = async () => {
      const docRef = doc(db, "alerts", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setAlertData({ id: docSnap.id, ...docSnap.data() } as Alert);
      } else {
        setAlertData(null);
      }
      setLoading(false);
    };
    fetchAlert();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    
    // Listen to the alert subcollection for replies instead of top-level collection
    // This matches where we're now storing replies to prevent duplicates
    const repliesQuery = query(
      collection(db, "alerts", id, "replies"),
      orderBy("createdAt", "asc")
    );
    
    const unsubReplies = onSnapshot(repliesQuery, (snapshot) => {
      const alertReplies = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Reply[];
      
      setReplies(alertReplies);
    });
    
    return () => {
      unsubReplies();
    };
  }, [id]);

  const alert = alertData;

  return (
    <div style={{ 
      padding: "24px", 
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", 
      width: "100%", 
      maxWidth: "800px",
      margin: "0 auto",
      backgroundColor: "#f8f9fa"
    }}>
      {loading ? (
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          minHeight: "200px",
          flexDirection: "column",
          gap: "16px"
        }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #ff5330",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }}></div>
          <p style={{ color: "#666", fontSize: "16px", margin: 0 }}>Loading alert details...</p>
        </div>
      ) : !alert ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          Alert not found
        </div>
      ) : (
        <div
      style={{
        maxWidth: 700,
        margin: "0 auto",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        padding: "1rem",
        width: "100%",
        boxSizing: "border-box",
        minWidth: 0,
      }}
    >
      <button
        onClick={() => navigate("/")}
        style={{
          marginBottom: 16,
          marginTop: 48, // Add this line
          background: "#ff5330",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          padding: "8px 16px",
          cursor: "pointer",
        }}
      >
            ← Back
          </button>

          <div style={{ 
            background: "#fff", 
            border: "1px solid #e1e5e9", 
            borderRadius: "8px", 
            padding: "32px",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}>
            <div style={{ 
              display: "grid", 
              gap: "16px",
              fontSize: "15px",
              lineHeight: "1.5"
            }}>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <span style={{ fontWeight: "600", color: "#495057", minWidth: "140px", display: "inline-block" }}>Email:</span>
                <span style={{ color: "#6c757d" }}>{alert.user?.email || alert.email}</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <span style={{ fontWeight: "600", color: "#495057", minWidth: "140px", display: "inline-block" }}>Home Address:</span>
                <span style={{ color: "#6c757d" }}>{alert.user?.homeAddress || alert.homeAddress}</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <span style={{ fontWeight: "600", color: "#495057", minWidth: "140px", display: "inline-block" }}>Occupation:</span>
                <span style={{ color: "#6c757d" }}>{alert.user?.occupation || alert.occupation}</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <span style={{ fontWeight: "600", color: "#495057", minWidth: "140px", display: "inline-block" }}>Medical Condition:</span>
                <span style={{ color: "#6c757d" }}>{alert.user?.medicalCondition || alert.medicalCondition}</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <span style={{ fontWeight: "600", color: "#495057", minWidth: "140px", display: "inline-block" }}>Allergies:</span>
                <span style={{ color: "#6c757d" }}>{alert.user?.allergies || alert.allergies}</span>
              </div>
            </div>
          </div>

          <div style={{ 
            background: "#fff", 
            border: "1px solid #e1e5e9", 
            borderRadius: "8px", 
            padding: "32px",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}>
            <h3 style={{ 
              color: "#495057", 
              marginTop: 0, 
              marginBottom: "20px",
              fontSize: "16px",
              fontWeight: "600"
            }}>
              Emergency Contacts
            </h3>
            
            <div style={{ 
              display: "grid", 
              gap: "16px",
              fontSize: "15px",
              lineHeight: "1.5"
            }}>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <span style={{ fontWeight: "600", color: "#495057", minWidth: "140px", display: "inline-block" }}>Name:</span>
                <span style={{ color: "#6c757d" }}>{alert.emergencyContacts?.[0]?.name || alert.emergencyContactName}</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <span style={{ fontWeight: "600", color: "#495057", minWidth: "140px", display: "inline-block" }}>Relationship:</span>
                <span style={{ color: "#6c757d" }}>{alert.emergencyContacts?.[0]?.relationship || alert.emergencyContactRelationship}</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <span style={{ fontWeight: "600", color: "#495057", minWidth: "140px", display: "inline-block" }}>Phone:</span>
                <span style={{ color: "#6c757d" }}>{alert.emergencyContacts?.[0]?.phone || alert.emergencyContactPhone}</span>
              </div>
            </div>
          </div>

          <div style={{ 
            background: "#fff", 
            border: "1px solid #e1e5e9", 
            borderRadius: "8px", 
            padding: "32px",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}>
            <div style={{ 
              display: "grid", 
              gap: "16px",
              fontSize: "15px",
              lineHeight: "1.5"
            }}>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <span style={{ fontWeight: "600", color: "#495057", minWidth: "140px", display: "inline-block" }}>Service:</span>
                <span style={{ color: "#6c757d" }}>{alert.serviceType}</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <span style={{ fontWeight: "600", color: "#495057", minWidth: "140px", display: "inline-block" }}>Time:</span>
                <span style={{ color: "#6c757d" }}>
                  {typeof alert.time === "object" && alert.time && "toDate" in alert.time
                    ? (alert.time as Timestamp).toDate().toLocaleString()
                    : alert.time}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <span style={{ fontWeight: "600", color: "#495057", minWidth: "140px", display: "inline-block" }}>Current Location:</span>
                <span style={{ color: "#6c757d" }}>
                  {typeof alert.location === "string"
                    ? alert.location
                    : alert.location?.address}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <span style={{ fontWeight: "600", color: "#495057", minWidth: "140px", display: "inline-block" }}>Message:</span>
                <span style={{ color: "#6c757d" }}>{alert.message}</span>
              </div>
            </div>
          </div>

          {typeof alert.location === "object" &&
            typeof alert.location.lat === "number" &&
            typeof alert.location.lng === "number" && (
              <LocationMap
                lat={alert.location.lat}
                lng={alert.location.lng}
                label={alert.location.address ?? ""}
              />
            )}

          <div style={{ 
            background: "#fff", 
            border: "1px solid #e1e5e9", 
            borderRadius: "8px", 
            padding: "32px",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}>
            <h3 style={{ 
              color: "#495057", 
              marginTop: 0, 
              marginBottom: "20px",
              fontSize: "16px",
              fontWeight: "600"
            }}>
              Send a Reply
            </h3>
            <ReplyForm
              onSend={async (reply) => {
                if (!id) return;
                try {
                  // Store reply ONLY in alert subcollection for mobile notifications
                  // This prevents duplicate notifications by having a single source of truth
                  await addDoc(collection(db, "alerts", id, "replies"), {
                    responderName: reply.responderName,
                    station: reply.station,
                    message: reply.message,
                    time: serverTimestamp(),
                    createdAt: serverTimestamp(),
                    alertId: id,
                  });

                  const notificationSent = await sendReplyNotification({
                    alertId: id,
                    responderName: reply.responderName,
                    station: reply.station,
                    message: reply.message,
                    serviceType: alert.serviceType,
                    userId: alert.userId || alert.user?.email || '',
                  });

                  // Send email notification to the mobile user who created the alert
                  const emailSent = await sendReplyEmailToUser({
                    alertId: id,
                    responderName: reply.responderName,
                    station: reply.station,
                    message: reply.message,
                    serviceType: alert.serviceType
                  });

                  if (notificationSent && emailSent) {
                    showToast("Reply sent successfully!", 'success');
                  } else {
                    showToast("Reply saved, but delivery may have issues", 'warning');
                  }
                } catch (error) {
                  showToast("Failed to send reply: " + (error as Error).message, 'error');
                }
              }}
            />
          </div>

          <div style={{ 
            background: "#fff", 
            border: "1px solid #e1e5e9", 
            borderRadius: "8px", 
            padding: "32px",
            marginTop: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}>
            <h3 style={{ 
              color: "#495057", 
              marginTop: 0, 
              marginBottom: "20px",
              fontSize: "16px",
              fontWeight: "600"
            }}>
              Replies
            </h3>
            {replies.length === 0 ? (
              <div style={{ color: "#6c757d", fontStyle: "italic" }}>No replies yet.</div>
            ) : (
              replies.map((reply) => (
                <div
                  key={reply.id}
                  style={{
                    background: "#f8f9fa",
                    border: "1px solid #e9ecef",
                    borderRadius: "6px",
                    padding: "16px",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ marginBottom: "8px" }}>
                    <strong style={{ color: "#495057" }}>{reply.responderName}</strong>
                    <span style={{ color: "#6c757d", marginLeft: "8px" }}>({reply.station})</span>
                  </div>
                  <div style={{ color: "#495057", marginBottom: "8px" }}>{reply.message}</div>
                  <div style={{ fontSize: "12px", color: "#6c757d" }}>
                    {reply.createdAt?.toDate
                      ? reply.createdAt.toDate().toLocaleString()
                      : ""}
                  </div>
                  <button
                    style={{
                      marginTop: "8px",
                      color: "#dc3545",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      fontSize: "12px",
                      textDecoration: "underline"
                    }}
                    onClick={async () => {
                      if (!id) return;
                      await deleteDoc(doc(db, "alerts", id, "replies", reply.id));
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertDetails;
