import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AlertCard from "../features/alerts/AlertCard";
import { db } from "../services/firebase";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
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
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "alerts"), (snapshot) => {
      setAlerts(
        snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
          id: doc.id,
          ...doc.data(),
        })) as Alert[]
      );
    });
    return () => unsub();
  }, []);

  return (
    <div>
      <h2>Incoming Alerts</h2>
      {alerts.map((item) => (
        <AlertCard
          key={item.id}
          userName={item.userName}
          serviceType={item.serviceType}
          time={
            typeof item.time === "object" && "toDate" in item.time
              ? item.time.toDate().toLocaleString()
              : item.time
          }
          location={item.location}
          phoneNumber={item.user?.phoneNumber}
          bloodType={item.user?.bloodType}
          medicalCondition={item.user?.medicalCondition}
          onClick={() => navigate(`/alert/${item.id}`)}
        />
      ))}
    </div>
  );
};

export default Dashboard;
