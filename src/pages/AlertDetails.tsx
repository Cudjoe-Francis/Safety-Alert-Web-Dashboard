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
import AudioPlayer from "../features/alerts/AudioPlayer";
import ReplyForm from "../features/alerts/ReplyForm";
import LocationMap from "../features/alerts/LocationMap";
import { auth } from "../services/firebase"; // Import auth

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
  location: string;
  message?: string;
  audioUrl?: string;
  lat?: number;
  lng?: number;
  user?: UserDetails;
  emergencyContacts?: EmergencyContact[];
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
  const [alertData, setAlertData] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [serviceType, setServiceType] = useState<string | null>(null); // <-- Added state for serviceType

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
    const q = query(
      collection(db, "alerts", id, "replies"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setReplies(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Reply[]
      );
    });
    return () => unsub();
  }, [id]);

  useEffect(() => {
    const fetchServiceType = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setServiceType(userDoc.data().serviceType);
        }
      }
    };
    fetchServiceType();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!alertData) {
    return (
      <div>
        <h2>Alert Not Found</h2>
        <button onClick={() => navigate("/")}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "0 auto",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        padding: 32,
      }}
    >
      <button
        onClick={() => navigate("/")}
        style={{
          marginBottom: 16,
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

      {/* User Details */}
      {alertData.user && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ color: "#ff5330" }}>User Details</h3>
          <div>
            <strong>Name:</strong> {alertData.user.firstName}{" "}
            {alertData.user.middleName ? alertData.user.middleName + " " : ""}
            {alertData.user.lastName}
          </div>
          {alertData.user.dateOfBirth && (
            <div>
              <strong>Date of Birth:</strong> {alertData.user.dateOfBirth}
            </div>
          )}
          {alertData.user.gender && (
            <div>
              <strong>Gender:</strong> {alertData.user.gender}
            </div>
          )}
          {alertData.user.bloodType && (
            <div>
              <strong>Blood Type:</strong> {alertData.user.bloodType}
            </div>
          )}
          {alertData.user.phoneNumber && (
            <div>
              <strong>Phone:</strong> {alertData.user.phoneNumber}
            </div>
          )}
          {alertData.user.email && (
            <div>
              <strong>Email:</strong> {alertData.user.email}
            </div>
          )}
          {alertData.user.homeAddress && (
            <div>
              <strong>Home Address:</strong> {alertData.user.homeAddress}
            </div>
          )}
          {alertData.user.occupation && (
            <div>
              <strong>Occupation:</strong> {alertData.user.occupation}
            </div>
          )}
          {alertData.user.medicalCondition && (
            <div>
              <strong>Medical Condition:</strong>{" "}
              {alertData.user.medicalCondition}
            </div>
          )}
          {alertData.user.allergies && (
            <div>
              <strong>Allergies:</strong> {alertData.user.allergies}
            </div>
          )}
        </div>
      )}

      {/* Emergency Contacts */}
      {alertData.emergencyContacts &&
        alertData.emergencyContacts.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ color: "#ff5330" }}>Emergency Contacts</h3>
            {alertData.emergencyContacts.map((contact, idx) => (
              <div key={idx} style={{ marginBottom: 8 }}>
                {contact.name && (
                  <div>
                    <strong>Name:</strong> {contact.name}
                  </div>
                )}
                {contact.relationship && (
                  <div>
                    <strong>Relationship:</strong> {contact.relationship}
                  </div>
                )}
                {contact.phone && (
                  <div>
                    <strong>Phone:</strong> {contact.phone}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      <div>
        <strong>Service:</strong> {alertData.serviceType}
      </div>
      <div>
        <strong>Time:</strong>{" "}
        {typeof alertData.time === "object" &&
        alertData.time &&
        "toDate" in alertData.time
          ? (alertData.time as Timestamp).toDate().toLocaleString()
          : alertData.time}
      </div>
      <div
      >
        <strong>Current Location:</strong>
        <span style={{ marginLeft: 6 }}>{alertData.location}</span>
      </div>
      <div>
        <strong>Message:</strong> {alertData.message}
      </div>
      {alertData.lat && alertData.lng && (
        <LocationMap
          lat={alertData.lat}
          lng={alertData.lng}
          label={alertData.location}
        />
      )}
      {alertData.audioUrl && <AudioPlayer audioUrl={alertData.audioUrl} />}
      {serviceType === alertData.serviceType && (
        <ReplyForm
          onSend={async (reply) => {
            if (!id) return;
            try {
              await addDoc(collection(db, "alerts", id, "replies"), {
                responderName: reply.responderName,
                station: reply.station,
                message: reply.message,
                createdAt: serverTimestamp(),
                alertId: id,
              });
              alert(
                `Reply sent and saved to ${alertData?.user?.firstName ?? ""} ${
                  alertData?.user?.lastName ?? ""
                }!`
              );
            } catch (error) {
              alert("Failed to send reply: " + (error as Error).message);
            }
          }}
        />
      )}
      <div style={{ marginTop: 32 }}>
        <h3>Replies</h3>
        {replies.length === 0 && <div>No replies yet.</div>}
        {replies.map((reply) => (
          <div
            key={reply.id}
            style={{
              background: "#f7f8fa",
              border: "1px solid #e0e0e0",
              borderRadius: 6,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <div>
              <strong>{reply.responderName}</strong> ({reply.station})
            </div>
            <div>{reply.message}</div>
            <div style={{ fontSize: 12, color: "#888" }}>
              {reply.createdAt?.toDate
                ? reply.createdAt.toDate().toLocaleString()
                : ""}
            </div>
            <button
              style={{
                marginTop: 8,
                color: "#e53935",
                border: "none",
                background: "none",
                cursor: "pointer",
              }}
              onClick={async () => {
                if (!id) return;
                await deleteDoc(doc(db, "alerts", id, "replies", reply.id));
                // Optionally show a toast/alert here
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertDetails;
