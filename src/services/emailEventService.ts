// Event-driven email service that sends emails only when specific actions are triggered
import { sendAlertEmail, AlertEmailData } from './emailService';

// Email event tracking to prevent duplicate sends
const processedEvents = new Set<string>();
const EVENT_EXPIRY = 300000; // 5 minutes

interface EmailEvent {
  id: string;
  type: 'emergency_alert' | 'incident_report';
  alertData: AlertEmailData;
  timestamp: number;
}

// Clean up expired events
function cleanupExpiredEvents() {
  const now = Date.now();
  const expiredEvents: string[] = [];
  
  processedEvents.forEach(eventId => {
    const [, timestamp] = eventId.split('-timestamp-');
    if (timestamp && (now - parseInt(timestamp)) > EVENT_EXPIRY) {
      expiredEvents.push(eventId);
    }
  });
  
  expiredEvents.forEach(eventId => processedEvents.delete(eventId));
}

// Process email event - ensures one email per unique event
export async function processEmailEvent(event: EmailEvent): Promise<boolean> {
  try {
    // Clean up old events first
    cleanupExpiredEvents();
    
    // Create unique event identifier
    const eventKey = `${event.type}-${event.id}-timestamp-${event.timestamp}`;
    
    // Check if this event was already processed
    if (processedEvents.has(eventKey)) {
      console.log(`📧 Email event already processed: ${event.id}`);
      return true; // Return true as email was already sent
    }
    
    // Send the email
    const success = await sendAlertEmail(event.alertData, event.id);
    
    if (success) {
      // Mark event as processed
      processedEvents.add(eventKey);
      console.log(`📧 Email event processed successfully: ${event.id}`);
    }
    
    return success;
  } catch (error) {
    console.error('Error processing email event:', error);
    return false;
  }
}

// Create email event for emergency alerts
export function createEmergencyAlertEvent(alertData: AlertEmailData, alertId: string): EmailEvent {
  return {
    id: alertId,
    type: 'emergency_alert',
    alertData,
    timestamp: Date.now()
  };
}

// Create email event for incident reports
export function createIncidentReportEvent(alertData: AlertEmailData, reportId: string): EmailEvent {
  return {
    id: reportId,
    type: 'incident_report',
    alertData,
    timestamp: Date.now()
  };
}

// Debounced email sender - prevents rapid fire emails
let emailQueue: EmailEvent[] = [];
let processingQueue = false;

export async function queueEmailEvent(event: EmailEvent): Promise<void> {
  // Add to queue
  emailQueue.push(event);
  
  // Process queue if not already processing
  if (!processingQueue) {
    processingQueue = true;
    
    // Wait a short delay to batch any rapid events
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Process all queued events
    const eventsToProcess = [...emailQueue];
    emailQueue = [];
    
    for (const queuedEvent of eventsToProcess) {
      await processEmailEvent(queuedEvent);
    }
    
    processingQueue = false;
  }
}

// Main function to trigger email sending for alerts
export async function triggerAlertEmail(alertData: AlertEmailData, alertId: string): Promise<boolean> {
  const event = createEmergencyAlertEvent(alertData, alertId);
  await queueEmailEvent(event);
  return true;
}

// Main function to trigger email sending for incident reports
export async function triggerIncidentEmail(alertData: AlertEmailData, reportId: string): Promise<boolean> {
  const event = createIncidentReportEvent(alertData, reportId);
  await queueEmailEvent(event);
  return true;
}
