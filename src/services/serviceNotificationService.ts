// Service for sending email notifications to all users with matching service type when new alerts are created
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

interface AlertData {
  userName: string;
  serviceType: string;
  location: string | { address?: string };
  time: string;
  message?: string;
  alertId?: string;
}

// Function to get all users with a specific service type
export async function getUsersWithServiceType(serviceType: string): Promise<string[]> {
  try {
    console.log(`🔍 Fetching users with service type: ${serviceType}`);
    
    const usersQuery = query(
      collection(db, "users"),
      where("serviceType", "==", serviceType.toLowerCase())
    );
    
    const querySnapshot = await getDocs(usersQuery);
    const userEmails: string[] = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.email) {
        userEmails.push(userData.email);
        console.log(`📧 Found ${serviceType} user: ${userData.email}`);
      }
    });
    
    console.log(`✅ Found ${userEmails.length} users with service type ${serviceType}`);
    return userEmails;
  } catch (error) {
    console.error(`❌ Error fetching users with service type ${serviceType}:`, error);
    return [];
  }
}

// Function to send notifications to all service users
export async function notifyServiceUsers(alertData: AlertData): Promise<boolean> {
  try {
    console.log(`📢 Sending notifications for new ${alertData.serviceType} alert`);
    
    // Get all users with matching service type
    const userEmails = await getUsersWithServiceType(alertData.serviceType);
    
    if (userEmails.length === 0) {
      console.log(`⚠️ No users found with service type: ${alertData.serviceType}`);
      return true; // Not an error, just no users to notify
    }
    
    // Send notifications via email server
    const response = await fetch('http://localhost:3002/api/send-service-notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serviceType: alertData.serviceType,
        alertData: alertData,
        userEmails: userEmails,
      }),
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Service notifications sent successfully:`, result.message);
      console.log(`📊 Results:`, result.results);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`❌ Failed to send service notifications:`, response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending service notifications:', error);
    return false;
  }
}

// Function to send confirmation email to the alert creator
export async function sendAlertConfirmation(alertData: AlertData, userEmail: string): Promise<boolean> {
  try {
    console.log(`📧 Sending confirmation email to alert creator: ${userEmail}`);
    
    const response = await fetch('http://localhost:3002/api/send-alert-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serviceType: 'confirmation',
        recipientEmail: userEmail,
        subject: `✅ Alert Confirmation - We Have Received Your ${alertData.serviceType.toUpperCase()} Request`,
        html: generateConfirmationEmailHTML(alertData, userEmail),
        alertId: `confirmation-${alertData.alertId || Date.now()}`,
      }),
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Confirmation email sent to ${userEmail}:`, result.messageId);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`❌ Failed to send confirmation email to ${userEmail}:`, response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error sending confirmation email to ${userEmail}:`, error);
    return false;
  }
}

// Generate HTML for confirmation email
function generateConfirmationEmailHTML(alertData: AlertData, userEmail: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Alert Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #059669; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .alert-info { background: #f0fdf4; border-left: 4px solid #059669; padding: 15px; margin: 15px 0; }
        .footer { background: #121a68; color: white; padding: 15px; text-align: center; font-size: 12px; }
        .success { color: #059669; font-weight: bold; font-size: 18px; }
        h2 { color: #121a68; margin-top: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ ALERT RECEIVED</h1>
          <p class="success">Your emergency request has been submitted!</p>
        </div>
        
        <div class="content">
          <p>Hello <strong>${userEmail}</strong>,</p>
          <p>We have successfully received your emergency alert and notified the appropriate emergency services:</p>
          
          <div class="alert-info">
            <h2>Your Alert Details</h2>
            <p><strong>Service Requested:</strong> ${alertData.serviceType.toUpperCase()}</p>
            <p><strong>Person:</strong> ${alertData.userName}</p>
            <p><strong>Location:</strong> ${typeof alertData.location === 'string' ? alertData.location : alertData.location?.address || 'Location provided'}</p>
            <p><strong>Time:</strong> ${alertData.time}</p>
            ${alertData.message ? `<p><strong>Your Message:</strong> ${alertData.message}</p>` : ''}
          </div>

          <div style="margin-top: 20px; padding: 15px; background: #dbeafe; border-radius: 5px; border-left: 4px solid #3b82f6;">
            <p><strong>📱 What happens next:</strong></p>
            <ul>
              <li>Emergency services have been automatically notified</li>
              <li>You will receive updates via push notifications in your app</li>
              <li>Emergency responders may contact you directly</li>
              <li>Keep your phone nearby for any follow-up communication</li>
            </ul>
          </div>

          <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
            <p><strong>⚠️ Important:</strong> If this is a life-threatening emergency, please also call your local emergency number immediately.</p>
          </div>
        </div>

        <div class="footer">
          <p>This confirmation was sent through the Safety Alert System</p>
          <p>Alert submitted at: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
