// Service for sending emails to ALL users of a specific service type when new alerts are created
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "./firebase";

interface ServiceEmailData {
  serviceType: string;
  userName: string;
  location: string;
  time: string;
  message?: string;
  alertId: string;
}

// Function to get all users registered for a specific service type
async function getUsersByServiceType(serviceType: string): Promise<string[]> {
  try {
    console.log(`🔍 Searching for users with serviceType: "${serviceType}"`);
    
    // Get all users and filter case-insensitively
    const usersQuery = query(
      collection(db, "users")
    );
    
    const querySnapshot = await getDocs(usersQuery);
    const userEmails: string[] = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      console.log(`👤 User found: ${doc.id}, serviceType: "${userData.serviceType}", email: ${userData.email}`);
      
      // Case-insensitive matching for serviceType (handles Police, Hospital, Fire Service, Campus)
      if (userData.email && userData.serviceType && 
          userData.serviceType.toLowerCase().replace(/\s+/g, '') === serviceType.toLowerCase().replace(/\s+/g, '')) {
        userEmails.push(userData.email);
      }
    });
    
    console.log(`Found ${userEmails.length} users for service type: "${serviceType}"`);
    if (userEmails.length === 0) {
      console.log('💡 Try checking if users have serviceType set as: Police, Hospital, Fire Service, or Campus');
    }
    return userEmails;
  } catch (error) {
    console.error("❌ Error fetching users by service type:", error);
    
    // Check if it's a permission error that indicates session expiry
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: string };
      if (firebaseError.code === 'permission-denied') {
        console.log('🚪 Permission denied - session may have expired');
        // Force page reload to trigger auth guard
        window.location.reload();
      }
    }
    
    return [];
  }
}

// Function to send email to all users of a service type
export async function sendEmailToAllServiceUsers(serviceType: string, alertData: ServiceEmailData): Promise<boolean> {
  try {
    // Validate serviceType before proceeding
    if (!serviceType || serviceType.trim() === '') {
      console.error('❌ Cannot send emails: serviceType is undefined or empty');
      console.error('Service type:', serviceType);
      console.error('Alert data:', JSON.stringify(alertData, null, 2));
      return false;
    }
    
    // Normalize serviceType to lowercase for consistency
    const normalizedServiceType = serviceType.toLowerCase().trim();
    console.log(`📧 Processing emails for service type: "${normalizedServiceType}"`);
    
    // Get all users for this service type
    const userEmails = await getUsersByServiceType(normalizedServiceType);
    
    if (userEmails.length === 0) {
      console.log(`No users found for service type: "${normalizedServiceType}"`);
      console.log('💡 Make sure users have the correct serviceType set in Firestore');
      return false;
    }
    
    // Generate unique alert ID for duplicate prevention
    const uniqueAlertId = `service-alert-${alertData.alertId}-${Date.now()}`;
    
    // Use the email server's database lookup for ALL users with the serviceType
    try {
      // Get dynamic email server URL - fallback to default port
      const emailServerUrl = 'http://localhost:3002';
      
      const response = await fetch(`${emailServerUrl}/api/send-alert-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceType: normalizedServiceType, // This triggers database lookup for ALL users
          subject: `🚨 New Emergency Alert - ${alertData.serviceType.toUpperCase()}`,
          html: generateServiceAlertHTML(alertData),
          alertId: uniqueAlertId,
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Alert sent via email server: ${result.message}`);
        
        // Show notification about email results
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Service Alert Emails Sent', {
            body: result.message,
            icon: '/favicon.ico'
          });
        }
        
        return true;
      } else {
        const error = await response.json();
        console.error('❌ Email server error:', error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending service type emails:', error);
      return false;
    }
    
    // Legacy code below - keeping for reference but not used
    /*
    const emailPromises = userEmails.map(async (userEmail) => {
      try {
        // Get dynamic email server URL
        const emailServerUrl = await getEmailServerUrl();
        
        const response = await fetch(`${emailServerUrl}/api/send-alert-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            serviceType: normalizedServiceType, // This will trigger database lookup
            subject: `🚨 New Emergency Alert - ${alertData.serviceType.toUpperCase()}`,
            html: generateServiceAlertHTML(alertData),
            alertId: `${uniqueAlertId}-${userEmail}`, // Unique per user
          }),
        });

        if (response.ok) {
          console.log(`✅ Email sent to ${userEmail} for ${alertData.serviceType} alert`);
          return true;
        } else if (response.status === 429) {
          const errorData = await response.json();
          console.warn(`⚠️ Email rate limited for ${userEmail}: ${errorData.error}`);
          return false;
        } else {
          console.error(`❌ Failed to send email to ${userEmail}`);
          return false;
        }
      } catch (error) {
        console.error(`❌ Error sending email to ${userEmail}:`, error);
        return false;
      }
    });
    
    });
    
    // Wait for all emails to be sent
    const results = await Promise.all(emailPromises);
    const successCount = results.filter(result => result).length;
    
    console.log(`📧 Sent ${successCount}/${userEmails.length} emails for ${alertData.serviceType} alert`);
    
    // Show notification about email results
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Service Alert Emails Sent', {
        body: `Sent ${successCount}/${userEmails.length} emails to ${alertData.serviceType} users`,
        icon: '/favicon.ico'
      });
    }
    
    return successCount > 0;
    */
  } catch (error) {
    console.error('❌ Error sending service type emails:', error);
    return false;
  }
}

// Generate HTML for service alert email
function generateServiceAlertHTML(alertData: ServiceEmailData): string {
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
          <p>Alert ID: ${alertData.alertId}</p>
          <p>Generated at: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Function to automatically send emails when new alerts are added to Firestore
export async function handleNewAlert(alertData: ServiceEmailData): Promise<void> {
  console.log(`📧 Processing new ${alertData.serviceType} alert for email notification`);
  
  const success = await sendEmailToAllServiceUsers(alertData.serviceType, alertData);
  
  if (success) {
    console.log(`✅ Successfully processed email notifications for ${alertData.serviceType} alert`);
  } else {
    console.error(`❌ Failed to send email notifications for ${alertData.serviceType} alert`);
  }
}
