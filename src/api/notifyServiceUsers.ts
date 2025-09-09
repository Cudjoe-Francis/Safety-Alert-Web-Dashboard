// API endpoint to notify service users when new alerts are created
import { notifyServiceUsers } from '../services/serviceNotificationService';

interface AlertNotificationRequest {
  serviceType: string;
  userName: string;
  location: string;
  time: string;
  message?: string;
  alertId: string;
}

export async function POST(request: Request) {
  try {
    const body: AlertNotificationRequest = await request.json();
    
    const { serviceType, userName, location, time, message, alertId } = body;
    
    if (!serviceType || !userName || !location || !time) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: serviceType, userName, location, time' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Send notifications to all users with matching service type
    const success = await notifyServiceUsers({
      serviceType,
      userName,
      location,
      time,
      message,
      alertId,
    });

    if (success) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Service users notified for ${serviceType} alert` 
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to send notifications to service users' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Error in notify service users API:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
