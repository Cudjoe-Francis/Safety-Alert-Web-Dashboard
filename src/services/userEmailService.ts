// Service for sending emails to logged-in users when new alerts are created
import { auth } from './firebase';

interface UserEmailData {
  serviceType: string;
  userName: string;
  location: string;
  time: string;
  message?: string;
  alertId: string;
}

// Function to send email notification to the currently logged-in user
export async function sendEmailToLoggedInUser(alertData: UserEmailData): Promise<boolean> {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser || !currentUser.email) {
      console.log('No logged-in user or user email found');
      return false;
    }

    // Generate unique alert ID for duplicate prevention
    const uniqueAlertId = `user-alert-${alertData.alertId}-${Date.now()}`;
    
    const response = await fetch('http://localhost:3002/api/send-alert-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: currentUser.email, // Send to logged-in user's email
        subject: `🚨 New Emergency Alert - ${alertData.serviceType.toUpperCase()}`,
        html: generateUserNotificationHTML(alertData, currentUser.email),
        alertId: uniqueAlertId,
      }),
    });

    if (response.ok) {
      console.log(`✅ Email sent to logged-in user: ${currentUser.email} (ID: ${uniqueAlertId})`);
      return true;
    } else if (response.status === 429) {
      const errorData = await response.json();
      console.warn(`⚠️ Email rate limited: ${errorData.error}`);
      return false;
    } else {
      console.error('❌ Failed to send user email notification');
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending user email notification:', error);
    return false;
  }
}

// Generate HTML for user notification email
function generateUserNotificationHTML(alertData: UserEmailData, userEmail: string): string {
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
          <p class="urgent">You have a new alert to respond to</p>
        </div>
        
        <div class="content">
          <p>Hello <strong>${userEmail}</strong>,</p>
          <p>A new emergency alert has been submitted that requires your attention:</p>
          
          <div class="alert-info">
            <h2>Alert Details</h2>
            <p><strong>Service Required:</strong> ${alertData.serviceType.toUpperCase()}</p>
            <p><strong>Person in Need:</strong> ${alertData.userName}</p>
            <p><strong>Location:</strong> ${alertData.location}</p>
            <p><strong>Time:</strong> ${alertData.time}</p>
            ${alertData.message ? `<p><strong>Message:</strong> ${alertData.message}</p>` : ''}
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
          <p>This email was sent to you because you are registered as a ${alertData.serviceType} responder</p>
          <p>Generated at: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Manual function to trigger email for a specific alert (called by button click)
export async function triggerManualEmail(alertData: UserEmailData): Promise<void> {
  const success = await sendEmailToLoggedInUser(alertData);
  
  if (success) {
    // Show success notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Email Sent', {
        body: `Alert notification sent to your email`,
        icon: '/favicon.ico'
      });
    }
  } else {
    // Show error notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Email Failed', {
        body: `Failed to send email notification`,
        icon: '/favicon.ico'
      });
    }
  }
}
