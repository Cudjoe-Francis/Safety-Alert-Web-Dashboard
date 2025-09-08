// Service to track and handle only NEW alerts, preventing duplicate email sends
import { db } from './firebase';
import { collection, onSnapshot, query, Timestamp } from 'firebase/firestore';
import { sendEmailToAllServiceUsers } from './serviceTypeEmailService';

interface Alert {
  id: string;
  serviceType: string;
  userName: string;
  userEmail?: string;
  time: string | Timestamp;
  location: string | { address?: string; lat?: number; lng?: number };
  message?: string;
  user?: {
    email?: string;
    phoneNumber?: string;
    medicalCondition?: string;
    allergies?: string;
    bloodType?: string;
  };
}

// Track processed alerts to prevent duplicates
const processedAlerts = new Set<string>();
let isListening = false;

// Function to start listening for NEW alerts only
export function startNewAlertListener(): void {
  if (isListening) {
    console.log("Alert listener already running");
    return;
  }

  console.log("🔄 Starting new alert listener...");
  isListening = true;

  // Listen to all alerts collection for new additions
  const alertsQuery = query(collection(db, "alerts"));
  
  const unsubscribe = onSnapshot(alertsQuery, async (snapshot) => {
    for (const change of snapshot.docChanges()) {
      if (change.type === "added") {
        const alertId = change.doc.id;
        
        // Only process if we haven't seen this alert before
        if (!processedAlerts.has(alertId)) {
          const alertData = change.doc.data() as Alert;
          
          // Mark as processed immediately
          processedAlerts.add(alertId);
          
          console.log('New alert detected:', alertId);
        
          // Send email notification to all users of this service type
          await sendEmailToAllServiceUsers(alertData.serviceType, {
            userName: alertData.userName,
            userEmail: alertData.userEmail || alertData.user?.email,
            location: typeof alertData.location === 'string' 
              ? alertData.location 
              : alertData.location?.address || `${alertData.location?.lat}, ${alertData.location?.lng}`,
            time: typeof alertData.time === 'object' && 'toDate' in alertData.time
              ? alertData.time.toDate().toLocaleString()
              : alertData.time.toString(),
            message: alertData.message,
            serviceType: alertData.serviceType,
            alertId: alertId,
            user: alertData.user,
          });

          // Send confirmation email to the Android user
          const userEmail = alertData.userEmail || alertData.user?.email;
          if (userEmail) {
            const { sendConfirmationEmail } = await import('./confirmationEmailService');
            await sendConfirmationEmail({
              userEmail: userEmail,
              userName: alertData.userName,
              serviceType: alertData.serviceType,
              alertId: alertId,
              location: typeof alertData.location === 'string' 
                ? alertData.location 
                : alertData.location?.address || `${alertData.location?.lat}, ${alertData.location?.lng}`,
              time: typeof alertData.time === 'object' && 'toDate' in alertData.time
                ? alertData.time.toDate().toLocaleString()
                : alertData.time.toString(),
            });
          }
        }
      }
    }
  });
}

// Function to stop the listener
export function stopNewAlertListener(): void {
  isListening = false;
  console.log("🛑 Alert listener stopped");
}

// Function to manually mark existing alerts as processed (prevents spam on startup)
export async function markExistingAlertsAsProcessed(): Promise<void> {
  try {
    const alertsQuery = query(collection(db, "alerts"));
    
    const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
      snapshot.docs.forEach((doc) => {
        processedAlerts.add(doc.id);
      });
      console.log(`✅ Marked ${snapshot.docs.length} existing alerts as processed`);
      unsubscribe(); // Stop listening after first load
    });
    
  } catch (error) {
    console.error("Error marking existing alerts:", error);
  }
}

// Initialize the system
export function initializeAlertSystem(): void {
  console.log("🚀 Initializing alert system...");
  
  // First mark existing alerts as processed
  markExistingAlertsAsProcessed();
  
  // Wait a moment then start listening for new ones
  setTimeout(() => {
    startNewAlertListener();
  }, 2000);
}
