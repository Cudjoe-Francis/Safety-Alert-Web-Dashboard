// Service for sending email notifications to Android users when web users reply to their alerts
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

interface ReplyEmailData {
  alertId: string;
  responderName: string;
  station: string;
  message: string;
  serviceType: string;
  alertCreatorEmail?: string;
  alertCreatorName?: string;
}

// Function to send email notification to the original Android user when someone replies
export async function sendReplyEmailToUser(replyData: ReplyEmailData): Promise<boolean> {
  try {
    // Get mobile user for reply notifications - only return if user is actually a mobile user
    async function getMobileUserForAlert(alertId: string): Promise<string | null> {
      try {
        const alertDoc = await getDoc(doc(db, "alerts", alertId));
        
        if (!alertDoc.exists()) {
          console.error("Alert document not found");
          return null;
        }

        const alertData = alertDoc.data();
        const userEmail = alertData.userEmail || alertData.user?.email;
        
        if (!userEmail) {
          console.error("No user email found in alert");
          return null;
        }

        // Verify this is actually a mobile user
        const { getUserTypeForNotifications } = await import('./userValidationService');
        const userType = await getUserTypeForNotifications(userEmail);
        
        if (userType !== 'mobile') {
          console.log(`⚠️ User ${userEmail} is not a mobile user (type: ${userType}), skipping reply email`);
          return null;
        }

        return userEmail;
      } catch (error) {
        console.error('❌ Error getting mobile user for alert:', error);
        return null;
      }
    }

    const userEmail = await getMobileUserForAlert(replyData.alertId);
    if (!userEmail) {
      console.log("⚠️ No mobile user found for reply notification");
      return false;
    }

    console.log("✅ REPLY EMAIL: Found mobile user email:", userEmail);

    // Get alert data for email generation
    const alertDoc = await getDoc(doc(db, "alerts", replyData.alertId));
    if (!alertDoc.exists()) {
      console.error("❌ REPLY EMAIL ERROR: Could not fetch alert data");
      return false;
    }
    
    const alertData = alertDoc.data();

    // Generate unique reply ID for duplicate prevention
    const replyId = `reply-${replyData.alertId}-${Date.now()}`;
    
    console.log("📤 REPLY EMAIL: Sending request to email server...");
    console.log("📤 REPLY EMAIL: Request payload:", {
      serviceType: 'reply',
      recipientEmail: userEmail,
      subject: `🚨 Emergency Response Received - ${replyData.serviceType.toUpperCase()}`,
      alertId: replyId,
      html: generateReplyEmailHTML(replyData, alertData, userEmail)
    });

    // Get dynamic email server URL
    const { getEmailServerUrl } = await import('../../utils/getEmailServerUrl');
    const emailServerUrl = await getEmailServerUrl();
    
    const response = await fetch(`${emailServerUrl}/api/send-reply-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        alertCreatorEmail: userEmail,
        responderName: replyData.responderName,
        station: replyData.station,
        message: replyData.message,
        serviceType: replyData.serviceType,
        alertId: replyData.alertId,
      }),
    });

    console.log("📬 REPLY EMAIL: Response status:", response.status);
    console.log("📬 REPLY EMAIL: Response ok:", response.ok);

    if (response.ok) {
      const responseData = await response.json();
      console.log("✅ REPLY EMAIL SUCCESS: Email sent to user:", userEmail, "(ID:", replyId, ")");
      console.log("✅ REPLY EMAIL SUCCESS: Server response:", responseData);
      return true;
    } else if (response.status === 429) {
      const errorData = await response.json();
      console.warn("⚠️ REPLY EMAIL RATE LIMITED:", errorData.error);
      return false;
    } else {
      const errorText = await response.text();
      console.error("❌ REPLY EMAIL FAILED: Status:", response.status);
      console.error("❌ REPLY EMAIL FAILED: Error:", errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending reply email:', error);
    return false;
  }
}

// Generate HTML for reply notification email
function generateReplyEmailHTML(replyData: ReplyEmailData, alertData: any, userEmail: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Emergency Response Received</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #059669; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .reply-info { background: #f0fdf4; border-left: 4px solid #059669; padding: 15px; margin: 15px 0; }
        .alert-info { background: #fff3f0; border-left: 4px solid #ff5330; padding: 15px; margin: 15px 0; }
        .footer { background: #121a68; color: white; padding: 15px; text-align: center; font-size: 12px; }
        .success { color: #059669; font-weight: bold; font-size: 18px; }
        h2 { color: #121a68; margin-top: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ EMERGENCY RESPONSE RECEIVED</h1>
          <p class="success">Help is on the way!</p>
        </div>
        
        <div class="content">
          <p>Hello <strong>${userEmail}</strong>,</p>
          <p>Great news! Your emergency alert has been received and responded to by emergency services:</p>
          
          <div class="reply-info">
            <h2>Response Details</h2>
            <p><strong>Responder:</strong> ${replyData.responderName}</p>
            ${replyData.station ? `<p><strong>Station/Unit:</strong> ${replyData.station}</p>` : ''}
            <p><strong>Service:</strong> ${replyData.serviceType.toUpperCase()}</p>
            <p><strong>Response Message:</strong></p>
            <p style="font-style: italic; background: #f9f9f9; padding: 10px; border-radius: 4px;">"${replyData.message}"</p>
          </div>

          <div class="alert-info">
            <h2>Your Original Alert</h2>
            <p><strong>Person:</strong> ${alertData.userName}</p>
            <p><strong>Location:</strong> ${typeof alertData.location === 'string' ? alertData.location : alertData.location?.address || 'Location provided'}</p>
            <p><strong>Time:</strong> ${typeof alertData.time === 'object' && 'toDate' in alertData.time ? alertData.time.toDate().toLocaleString() : alertData.time}</p>
            ${alertData.message ? `<p><strong>Your Message:</strong> ${alertData.message}</p>` : ''}
          </div>

          <div style="margin-top: 20px; padding: 15px; background: #dbeafe; border-radius: 5px; border-left: 4px solid #3b82f6;">
            <p><strong>📱 Next Steps:</strong></p>
            <ul>
              <li>Emergency services are aware of your situation</li>
              <li>Check your Safety Alert app for real-time updates</li>
              <li>Keep your phone nearby for any follow-up communication</li>
              <li>If this is a life-threatening emergency, also call your local emergency number</li>
            </ul>
          </div>
        </div>

        <div class="footer">
          <p>This response was sent through the Safety Alert System</p>
          <p>Alert ID: ${replyData.alertId}</p>
          <p>Response received at: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
