import React, { useEffect, useState } from "react";
import { db, auth } from "../services/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { addDoc, serverTimestamp } from "firebase/firestore";

interface IncidentReport {
  id: string;
  userName: string;
  user?: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    email?: string;
    // ...add other user fields as needed
  };
  serviceType: string;
  time: string;
  location: string;
  description?: string;
  emergencyContacts?: {
    name?: string;
    relationship?: string;
    phone?: string;
  }[];
}

const IncidentReports: React.FC = () => {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [serviceType, setServiceType] = useState<string | null>(null);

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

  useEffect(() => {
    if (!serviceType) return;
    const q = query(
      collection(db, "incidentReports"),
      where("serviceType", "==", serviceType)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setReports(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as IncidentReport[]
      );
    });
    return () => unsub();
  }, [serviceType]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ color: "#121a68", marginBottom: 24 }}>Incident Reports</h2>
      {reports.length === 0 && <div>No incident reports found.</div>}
      {reports.map((report) => (
        <div
          key={report.id}
          style={{
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
            padding: 24,
            marginBottom: 24,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 18, color: "#ff5330" }}>
            {report.userName}
          </div>
          <div style={{ color: "#121a68", fontSize: 15, marginBottom: 8 }}>
            {report.serviceType}
          </div>
          <div style={{ color: "#222", fontSize: 14 }}>{report.location}</div>
          <div style={{ color: "#888", fontSize: 13 }}>
            {typeof report.time === "object" &&
            report.time &&
            "toDate" in report.time
              ? (report.time as Timestamp).toDate().toLocaleString()
              : report.time}
          </div>
          <div style={{ marginTop: 12 }}>
            <strong>Description:</strong> {report.description}
          </div>
          {report.user && (
            <div style={{ marginTop: 12 }}>
              <strong>User Details:</strong>
              <div>
                Name: {report.user.firstName} {report.user.lastName}
              </div>
              <div>Phone: {report.user.phoneNumber}</div>
              <div>Email: {report.user.email}</div>
            </div>
          )}
          {report.emergencyContacts && report.emergencyContacts.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <strong>Emergency Contacts:</strong>
              {report.emergencyContacts.map((contact, idx) => (
                <div key={idx}>
                  {contact.name} ({contact.relationship}): {contact.phone}
                </div>
              ))}
            </div>
          )}
          <ReplyForm reportId={report.id} />
          <RepliesList reportId={report.id} />
        </div>
      ))}
    </div>
  );
};

const ReplyForm: React.FC<{ reportId: string }> = ({ reportId }) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await addDoc(collection(db, "incidentReports", reportId, "replies"), {
        message,
        createdAt: serverTimestamp(),
      });
      setMessage("");
      alert("Reply sent!");
    } catch (err) {
      alert("Failed to send reply.");
    }
    setSending(false);
  };

  return (
    <form onSubmit={handleSend} style={{ marginTop: 16 }}>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your reply..."
        required
        style={{
          width: "100%",
          minHeight: 60,
          borderRadius: 8,
          border: "1px solid #e0e0e0",
          padding: 8,
          marginBottom: 8,
        }}
      />
      <button
        type="submit"
        disabled={sending}
        style={{
          background: "#121a68",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "8px 16px",
          cursor: "pointer",
        }}
      >
        {sending ? "Sending..." : "Send Reply"}
      </button>
    </form>
  );
};

const RepliesList: React.FC<{ reportId: string }> = ({ reportId }) => {
  const [replies, setReplies] = useState<any[]>([]);

  useEffect(() => {
    const q = collection(db, "incidentReports", reportId, "replies");
    const unsub = onSnapshot(q, (snapshot) => {
      setReplies(snapshot.docs.map((doc) => doc.data()));
    });
    return () => unsub();
  }, [reportId]);

  return (
    <div style={{ marginTop: 12 }}>
      {replies.length > 0 && (
        <div>
          <strong>Replies:</strong>
          {replies.map((reply, idx) => (
            <div
              key={idx}
              style={{
                background: "#f7f8fa",
                borderRadius: 6,
                padding: 8,
                marginTop: 6,
              }}
            >
              {reply.message}
              <div style={{ fontSize: 12, color: "#888" }}>
                {reply.createdAt?.toDate
                  ? reply.createdAt.toDate().toLocaleString()
                  : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IncidentReports;
