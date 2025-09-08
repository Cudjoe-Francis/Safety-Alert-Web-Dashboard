// Using console.log for notifications instead of toast for now

interface ConfirmationEmailData {
  userEmail: string;
  userName: string;
  serviceType: string;
  alertId: string;
  location: string;
  time: string;
}

export async function sendConfirmationEmail(data: ConfirmationEmailData): Promise<boolean> {
  try {
    console.log('Sending confirmation email to:', data.userEmail);
    
    // Generate unique confirmation ID for duplicate prevention
    const confirmationId = `confirmation-${data.alertId}-${Date.now()}`;
    
    const response = await fetch('http://localhost:3001/api/send-alert-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serviceType: 'confirmation',
        recipientEmail: data.userEmail,
        alertData: {
          userName: data.userName,
          serviceType: data.serviceType,
          location: data.location,
          time: data.time,
          message: `Your emergency alert has been received and is being processed by our ${data.serviceType} team.`,
          alertId: data.alertId,
        },
        uniqueAlertId: confirmationId,
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
