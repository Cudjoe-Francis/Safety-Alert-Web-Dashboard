// Service for sending push notifications to mobile app when replies are sent from web dashboard
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

interface ReplyNotificationData {
  alertId: string;
  responderName: string;
  station: string;
  message: string;
  serviceType: string;
  userId: string;
}

// Function to send push notification to mobile app user
export async function sendReplyNotification(data: ReplyNotificationData): Promise<boolean> {
  try {
    // Get the alert document to find the user's push token
    const alertDoc = await getDoc(doc(db, "alerts", data.alertId));
    
    if (!alertDoc.exists()) {
      console.error("Alert document not found");
      return false;
    }

    const alertData = alertDoc.data();
    const pushToken = alertData.pushToken || alertData.expoPushToken;

    if (!pushToken) {
      console.log("No push token found for user, notification will be delivered via in-app system");
      return true; // Still return true as the in-app notification system will handle it
    }

    // Get service-specific styling
    const serviceEmojis = {
      police: '👮‍♂️',
      hospital: '🏥',
      fire: '🚒',
      campus: '🏫',
    };

    const serviceColors = {
      police: '#1e40af',
      hospital: '#dc2626',
      fire: '#ea580c',
      campus: '#059669',
    };

    const emoji = serviceEmojis[data.serviceType.toLowerCase() as keyof typeof serviceEmojis] || '🚨';
    const color = serviceColors[data.serviceType.toLowerCase() as keyof typeof serviceColors] || '#ff5330';

    // Prepare the enhanced push notification payload
    const notificationPayload = {
      to: pushToken,
      sound: 'emergency-alert.wav',
      title: `${emoji} Emergency Reply Received`,
      body: `${data.serviceType.toUpperCase()} Response from ${data.responderName}${data.station ? ` (${data.station})` : ''}: ${data.message}`,
      data: {
        alertId: data.alertId,
        type: 'alert-reply',
        responderName: data.responderName,
        station: data.station,
        serviceType: data.serviceType,
        timestamp: new Date().toISOString(),
        deepLink: 'safetyalertapp://notifications',
      },
      priority: 'max',
      channelId: 'emergency-replies',
      categoryId: 'emergency-reply',
      badge: 1,
      ttl: 3600, // 1 hour
      expiration: Math.floor(Date.now() / 1000) + 3600,
      mutableContent: true,
      android: {
        channelId: 'emergency-replies',
        priority: 'max',
        sticky: true,
        vibrate: [0, 250, 250, 250, 250, 250],
        color: color,
        icon: './assets/images/notification-icon.png',
        largeIcon: './assets/images/notification-icon.png',
        sound: 'emergency-alert.wav',
        lights: {
          color: color,
          onMs: 1000,
          offMs: 500,
        },
        actions: [
          {
            title: '👁️ View Reply',
            pressAction: {
              id: 'VIEW_REPLY',
              launchActivity: 'default',
            },
          },
          {
            title: '✅ Mark Read',
            pressAction: {
              id: 'MARK_READ',
            },
          },
        ],
      },
      ios: {
        sound: 'emergency-alert.wav',
        badge: 1,
        categoryId: 'emergency-reply',
        mutableContent: true,
        criticalAlert: {
          name: 'emergency-alert.wav',
          critical: true,
          volume: 1.0,
        },
      },
    };

    // Send push notification via Expo Push API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationPayload),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Push notification sent successfully:', result);
      
      // Update the alert document to track that a reply notification was sent
      await updateDoc(doc(db, "alerts", data.alertId), {
        lastReplyNotificationSent: new Date(),
        replyNotificationCount: (alertData.replyNotificationCount || 0) + 1,
      });
      
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to send push notification:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending reply notification:', error);
    return false;
  }
}

// Function to send email notification to service-specific email when new alert is received
export async function notifyServiceEmail(alertData: {
  serviceType: string;
  userName: string;
  location: string;
  time: string;
  message?: string;
}): Promise<boolean> {
  try {
    // Generate unique alert ID for duplicate prevention
    const alertId = `alert-${Date.now()}-${alertData.userName}-${alertData.serviceType}`;
    
    const response = await fetch('http://localhost:3001/api/send-alert-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: getServiceEmail(alertData.serviceType),
        subject: `🚨 URGENT: New Emergency Alert - ${alertData.serviceType.toUpperCase()}`,
        html: generateServiceNotificationHTML(alertData),
        alertId: alertId, // Include unique ID for duplicate prevention
      }),
    });

    if (response.ok) {
      console.log(`✅ Service notification email sent to ${alertData.serviceType} (ID: ${alertId})`);
      return true;
    } else if (response.status === 429) {
      // Handle rate limiting
      const errorData = await response.json();
      console.warn(`⚠️ Email rate limited for ${alertData.serviceType}: ${errorData.error}`);
      return false;
    } else {
      console.error('❌ Failed to send service notification email');
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending service notification:', error);
    return false;
  }
}

// Get service-specific email address
function getServiceEmail(serviceType: string): string {
  const SERVICE_EMAILS = {
    police: 'police@gmail.com',
    hospital: 'hospital@gmail.com',
    fire: 'fire@gmail.com',
    campus: 'campus@gmail.com'
  };
  
  const normalizedType = serviceType.toLowerCase();
  return SERVICE_EMAILS[normalizedType as keyof typeof SERVICE_EMAILS] || 'safety.alert.app@gmail.com';
}

// Generate HTML for service notification email
function generateServiceNotificationHTML(alertData: {
  serviceType: string;
  userName: string;
  location: string;
  time: string;
  message?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Emergency Alert</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #ff5330; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .alert-info { background: #fff3f0; border-left: 4px solid #ff5330; padding: 15px; margin: 15px 0; }
        .footer { background: #121a68; color: white; padding: 15px; text-align: center; font-size: 12px; }
        .urgent { color: #ff5330; font-weight: bold; font-size: 18px; }
        h2 { color: #121a68; margin-top: 0; }
        .cta-button { 
          display: inline-block; 
          background: #ff5330; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px; 
          margin: 15px 0;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 NEW EMERGENCY ALERT</h1>
          <p class="urgent">IMMEDIATE ATTENTION REQUIRED</p>
        </div>
        
        <div class="content">
          <div class="alert-info">
            <h2>Alert Details</h2>
            <p><strong>Service Required:</strong> ${alertData.serviceType.toUpperCase()}</p>
            <p><strong>Person in Need:</strong> ${alertData.userName}</p>
            <p><strong>Location:</strong> ${alertData.location}</p>
            <p><strong>Time:</strong> ${alertData.time}</p>
            ${alertData.message ? `<p><strong>Additional Message:</strong> ${alertData.message}</p>` : ''}
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <a href="http://localhost:5173/signin" class="cta-button">
              Sign In to Respond
            </a>
          </div>

          <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
            <p><strong>⚠️ Action Required:</strong> Please sign in to the Safety Alert Dashboard to view full details and respond to this emergency alert.</p>
            <p><strong>Dashboard URL:</strong> <a href="http://localhost:5173">http://localhost:5173</a></p>
          </div>
        </div>

        <div class="footer">
          <p>This is an automated emergency alert from Safety Alert System</p>
          <p>Generated at: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
