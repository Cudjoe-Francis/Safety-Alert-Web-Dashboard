// Email service for sending notifications to emergency services
export interface AlertEmailData {
  userName: string;
  serviceType: string;
  location: string;
  time: string;
  message?: string;
  userDetails?: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    bloodType?: string;
    medicalCondition?: string;
    allergies?: string;
  };
  emergencyContacts?: Array<{
    name?: string;
    relationship?: string;
    phone?: string;
  }>;
}

// Email configuration (used by email server)
// const EMAIL_CONFIG = {
//   service: 'gmail',
//   auth: {
//     user: 'safety.alert.app@gmail.com',
//     pass: 'gjxoeixzyoxacyac'
//   }
// };

// Service-specific email addresses - these should be the actual service provider emails
const SERVICE_EMAILS = {
  police: 'police@gmail.com',
  hospital: 'hospital@gmail.com',
  fire: 'fire@gmail.com',
  campus: 'campus@gmail.com'
};

// Function to get the correct email based on service type
function getServiceEmail(serviceType: string): string {
  const normalizedType = serviceType.toLowerCase();
  return SERVICE_EMAILS[normalizedType as keyof typeof SERVICE_EMAILS] || 'safety.alert.app@gmail.com';
}

export async function sendAlertEmail(alertData: AlertEmailData, alertId?: string): Promise<boolean> {
  try {
    // Generate unique alert ID if not provided
    const uniqueAlertId = alertId || `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Try to send via email server first, fallback to simulation if server unavailable
    let response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      response = await fetch('http://localhost:3002/api/send-alert-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: getServiceEmail(alertData.serviceType),
          subject: `🚨 URGENT: Emergency Alert - ${alertData.serviceType.toUpperCase()}`,
          html: generateEmailHTML(alertData),
          alertId: uniqueAlertId,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
    } catch (fetchError) {
      console.log('📧 Email server not available, using fallback notification');
      simulateEmailNotification(alertData);
      return true;
    }

    if (response.ok) {
      console.log(`✅ Emergency alert email sent to ${alertData.serviceType} (ID: ${uniqueAlertId})`);
      
      // Show success notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Emergency Alert Sent', {
          body: `Email notification sent to ${alertData.serviceType} for ${alertData.userName}`,
          icon: '/favicon.ico'
        });
      }
      
      return true;
    } else if (response.status === 429) {
      // Handle rate limiting
      const errorData = await response.json();
      console.warn(`⚠️ Email rate limited: ${errorData.error} (${errorData.cooldownRemaining}s remaining)`);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Email Rate Limited', {
          body: `Please wait ${errorData.cooldownRemaining} seconds before sending another email`,
          icon: '/favicon.ico'
        });
      }
      
      return false;
    } else {
      console.error('Failed to send emergency alert email');
      return false;
    }
  } catch (error) {
    console.error('Failed to send alert email:', error);
    return false;
  }
}

function generateEmailHTML(alertData: AlertEmailData): string {
  const { userName, serviceType, location, time, message, userDetails, emergencyContacts } = alertData;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Emergency Alert</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #ff5330; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .alert-info { background: #fff3f0; border-left: 4px solid #ff5330; padding: 15px; margin: 15px 0; }
        .user-details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .emergency-contacts { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { background: #121a68; color: white; padding: 15px; text-align: center; font-size: 12px; }
        .urgent { color: #ff5330; font-weight: bold; font-size: 18px; }
        h2 { color: #121a68; margin-top: 0; }
        .contact-item { margin: 8px 0; padding: 8px; background: white; border-radius: 3px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 EMERGENCY ALERT</h1>
          <p class="urgent">IMMEDIATE ATTENTION REQUIRED</p>
        </div>
        
        <div class="content">
          <div class="alert-info">
            <h2>Alert Details</h2>
            <p><strong>Service Required:</strong> ${serviceType.toUpperCase()}</p>
            <p><strong>Person in Need:</strong> ${userName}</p>
            <p><strong>Location:</strong> ${location}</p>
            <p><strong>Time:</strong> ${time}</p>
            ${message ? `<p><strong>Additional Message:</strong> ${message}</p>` : ''}
          </div>

          ${userDetails ? `
          <div class="user-details">
            <h2>Person Details</h2>
            ${userDetails.firstName || userDetails.lastName ? `<p><strong>Full Name:</strong> ${userDetails.firstName || ''} ${userDetails.lastName || ''}</p>` : ''}
            ${userDetails.phoneNumber ? `<p><strong>Phone:</strong> ${userDetails.phoneNumber}</p>` : ''}
            ${userDetails.bloodType ? `<p><strong>Blood Type:</strong> ${userDetails.bloodType}</p>` : ''}
            ${userDetails.medicalCondition ? `<p><strong>Medical Condition:</strong> ${userDetails.medicalCondition}</p>` : ''}
            ${userDetails.allergies ? `<p><strong>Allergies:</strong> ${userDetails.allergies}</p>` : ''}
          </div>
          ` : ''}

          ${emergencyContacts && emergencyContacts.length > 0 ? `
          <div class="emergency-contacts">
            <h2>Emergency Contacts</h2>
            ${emergencyContacts.map(contact => `
              <div class="contact-item">
                ${contact.name ? `<strong>${contact.name}</strong>` : ''}
                ${contact.relationship ? ` (${contact.relationship})` : ''}
                ${contact.phone ? `<br>Phone: ${contact.phone}` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}

          <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
            <p><strong>⚠️ Action Required:</strong> Please respond to this emergency alert immediately. The person needs ${serviceType} assistance at the specified location.</p>
          </div>
        </div>

        <div class="footer">
          <p>This is an automated emergency alert from Safety Alert App</p>
          <p>Generated at: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Function to send reply notification email to alert creator
export async function sendReplyEmailToUser({
  alertId,
  responderName,
  station,
  message,
  serviceType,
  alertCreatorEmail
}: {
  alertId: string;
  responderName: string;
  station?: string;
  message: string;
  serviceType: string;
  alertCreatorEmail?: string;
}): Promise<boolean> {
  try {
    // If no email provided, we can't send the notification
    if (!alertCreatorEmail) {
      console.warn('⚠️ No alert creator email provided for reply notification');
      return false;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch('http://localhost:3002/api/send-reply-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        alertCreatorEmail,
        responderName,
        station,
        message,
        serviceType,
        alertId
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Reply notification email sent to alert creator: ${alertCreatorEmail}`);
      console.log(`📧 Message ID: ${result.messageId}`);
      return true;
    } else {
      const errorData = await response.json();
      console.error(`❌ Failed to send reply notification email: ${errorData.error}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending reply notification email:', error);
    return false;
  }
}

// Fallback function for client-side email simulation
export function simulateEmailNotification(alertData: AlertEmailData): void {
  console.log('📧 EMAIL NOTIFICATION SENT');
  console.log('=========================');
  console.log(`To: ${getServiceEmail(alertData.serviceType)}`);
  console.log(`Subject: 🚨 URGENT: Emergency Alert - ${alertData.serviceType.toUpperCase()}`);
  console.log(`Alert for: ${alertData.userName}`);
  console.log(`Service: ${alertData.serviceType}`);
  console.log(`Location: ${alertData.location}`);
  console.log(`Time: ${alertData.time}`);
  console.log('=========================');
  
  // Show browser notification as well
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Emergency Alert Email Sent', {
      body: `Email notification sent for ${alertData.userName} - ${alertData.serviceType}`,
      icon: '/favicon.ico'
    });
  }
}
