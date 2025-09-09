// Using console.log for notifications instead of toast for now

interface ConfirmationEmailData {
  userEmail: string;
  userName: string;
  serviceType: string;
  alertId: string;
  location: string;
  time: string;
}

// Function to get email server URL dynamically
async function getEmailServerUrl(): Promise<string> {
  try {
    const response = await fetch('/email-server-port.json');
    if (response.ok) {
      const portInfo = await response.json();
      return portInfo.url;
    }
  } catch (error) {
    console.warn('Could not get dynamic email server URL, using default');
  }
  return 'http://localhost:3002';
}

export async function sendConfirmationEmail(data: ConfirmationEmailData): Promise<boolean> {
  try {
    console.log('Sending confirmation email to:', data.userEmail);
    
    // Generate unique confirmation ID for duplicate prevention
    const confirmationId = `confirmation-${data.alertId}-${Date.now()}`;
    
    // Get dynamic email server URL
    const emailServerUrl = await getEmailServerUrl();
    
    const response = await fetch(`${emailServerUrl}/api/send-alert-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serviceType: 'confirmation',
        recipientEmail: data.userEmail,
        subject: `✅ Alert Confirmation - We Have Received Your ${data.serviceType.toUpperCase()} Request`,
        html: generateDetailedConfirmationHTML(data),
        alertId: confirmationId,
      }),
    });

    if (response.status === 429) {
      console.log('Rate limited - confirmation email not sent to prevent spam');
      console.log('Confirmation email rate limited to prevent spam');
      return false;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Confirmation email sent successfully:', result);
    console.log(`Confirmation email sent to ${data.userEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    console.error('Failed to send confirmation email');
    return false;
  }
}

export async function sendConfirmationEmailManually(alertData: any): Promise<void> {
  const confirmationData: ConfirmationEmailData = {
    userEmail: alertData.userEmail || alertData.user?.email,
    userName: alertData.userName,
    serviceType: alertData.serviceType,
    alertId: alertData.alertId,
    location: typeof alertData.location === 'string' 
      ? alertData.location 
      : alertData.location?.address || `${alertData.location?.lat}, ${alertData.location?.lng}`,
    time: alertData.time,
  };

  if (!confirmationData.userEmail) {
    console.error('Cannot send confirmation email: User email not found');
    return;
  }

  await sendConfirmationEmail(confirmationData);
}

// Generate detailed confirmation email HTML
function generateDetailedConfirmationHTML(data: ConfirmationEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Alert Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px 20px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">ALERT RECEIVED</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">We have successfully received your ${data.serviceType.toUpperCase()} emergency request</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px 20px;">
          
          <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151;">Hello <strong>${data.userName}</strong>,</p>
          <p style="margin: 0 0 25px 0; font-size: 16px; color: #374151; line-height: 1.6;">We have successfully received your emergency alert and notified the appropriate emergency services:</p>
          
          <!-- Alert Details -->
          <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin-bottom: 25px; border-left: 4px solid #059669;">
            <h3 style="margin: 0 0 15px 0; color: #047857; font-size: 18px;">Your Alert Details</h3>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>Service Requested:</strong> ${data.serviceType.toUpperCase()}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>Person:</strong> ${data.userName}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>Location:</strong> ${data.location}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>Time:</strong> ${data.time}</p>
            <p style="margin: 0; font-size: 14px; color: #374151;"><strong>Alert ID:</strong> ${data.alertId}</p>
          </div>

          <!-- What happens next -->
          <div style="background-color: #dbeafe; border-radius: 8px; padding: 20px; margin-bottom: 25px; border-left: 4px solid #3b82f6;">
            <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 18px;">📱 What happens next:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #374151;">
              <li style="margin-bottom: 8px;">Emergency services have been automatically notified</li>
              <li style="margin-bottom: 8px;">You will receive updates via push notifications in your app</li>
              <li style="margin-bottom: 8px;">Emergency responders may contact you directly</li>
              <li style="margin-bottom: 0;">Keep your phone nearby for any follow-up communication</li>
            </ul>
          </div>

          <!-- Important notice -->
          <div style="background-color: #fff3cd; border-radius: 8px; padding: 20px; margin-bottom: 25px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; font-size: 14px; color: #856404;"><strong>⚠️ Important:</strong> If this is a life-threatening emergency, please also call your local emergency number immediately.</p>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              This confirmation was sent through the Safety Alert System.<br>
              Alert submitted at: ${new Date().toLocaleString()}
            </p>
          </div>
          
        </div>
      </div>
    </body>
    </html>
  `;
}
