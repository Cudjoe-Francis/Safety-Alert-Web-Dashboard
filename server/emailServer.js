const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());


const emailTracker = new Map();
const EMAIL_COOLDOWN = 30000; // 30 seconds cooldown between same emails
const processedRequests = new Set(); // Track processed requests to prevent loops

// Email configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'safety.alert.app@gmail.com',
    pass: 'gjxoeixzyoxacyac'
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Import Firebase functions for database access
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBZqzDoNT5FILS1PHA98_DlZERgbN5Qrf0",
  authDomain: "safety-alert-app-3aa05.firebaseapp.com",
  projectId: "safety-alert-app-3aa05",
  storageBucket: "safety-alert-app-3aa05.appspot.com",
  messagingSenderId: "619085971303",
  appId: "1:619085971303:web:9063a751b9deefb7cc39c2"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

console.log('✅ Firebase initialized for email server');

// Function to get all dashboard users for a service type from database
async function getServiceProviderEmails(serviceType) {
  try {
    console.log(`🔍 Fetching all ${serviceType} dashboard users from database...`);
    
    // Query users collection
    const usersQuery = query(collection(db, "users"));
    const querySnapshot = await getDocs(usersQuery);
    const emails = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      console.log(`👤 Found user: ${doc.id}, serviceType: "${userData.serviceType}", email: ${userData.email}`);
      
      // ONLY process users that have a serviceType field
      if (!userData.serviceType) {
        console.log(`⚠️ Skipping user ${userData.email} - no serviceType field found`);
        return;
      }
      
      // ONLY process users that have an email
      if (!userData.email) {
        console.log(`⚠️ Skipping user ${doc.id} - no email field found`);
        return;
      }
      
      // Case-insensitive matching for serviceType (hospital matches Hospital, police matches Police)
      const userServiceType = userData.serviceType.toLowerCase().trim();
      const targetServiceType = serviceType.toLowerCase().trim();
      
      if (userServiceType === targetServiceType) {
        emails.push(userData.email);
        console.log(`✅ Added ${userData.email} - serviceType "${userData.serviceType}" matches "${serviceType}"`);
      } else {
        console.log(`❌ Skipped ${userData.email} - serviceType "${userData.serviceType}" doesn't match "${serviceType}"`);
      }
    });
    
    console.log(`✅ Found ${emails.length} ${serviceType} dashboard users: ${emails.join(', ')}`);
    return emails;
  } catch (error) {
    console.error(`❌ Error fetching ${serviceType} dashboard users:`, error);
    return [];
  }
}

// Function to generate unique email identifier
function generateEmailId(to, subject, alertId) {
  return `${to}-${subject}-${alertId || 'default'}`;
}

// Function to generate unique request identifier to prevent loops
function generateRequestId(serviceType, alertData, userEmails) {
  const emailsHash = userEmails.sort().join(',');
  return `${serviceType}-${alertData.alertId || alertData.userName}-${emailsHash}`;
}

// API endpoint to send alert emails
app.post('/api/send-alert-email', async (req, res) => {
  try {
    const { to, subject, html, alertId, serviceType, recipientEmail: userEmail } = req.body;
    
    // Generate unique identifier for this email
    const emailId = generateEmailId(to, subject, alertId);
    const now = Date.now();
    
    // Check if this exact email was sent recently
    if (emailTracker.has(emailId)) {
      const lastSent = emailTracker.get(emailId);
      const timeSinceLastSent = now - lastSent;
      
      if (timeSinceLastSent < EMAIL_COOLDOWN) {
        console.log(`Email blocked - duplicate detected. Last sent ${Math.round(timeSinceLastSent/1000)}s ago`);
        return res.status(429).json({ 
          success: false, 
          error: 'Email already sent recently',
          cooldownRemaining: Math.round((EMAIL_COOLDOWN - timeSinceLastSent) / 1000)
        });
      }
    }
    
    // Handle different email types
    if (serviceType === 'confirmation' || serviceType === 'reply') {
      // For confirmations and replies, send to specific user
      if (!userEmail) {
        return res.status(400).json({ 
          success: false, 
          error: 'User email required for confirmation/reply emails' 
        });
      }
      
      const mailOptions = {
        from: 'safety.alert.app@gmail.com',
        to: userEmail,
        subject: subject,
        html: html
      };
      
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ ${serviceType} email sent to ${userEmail} (${info.messageId})`);
      
      return res.status(200).json({ 
        success: true, 
        messageId: info.messageId,
        message: `${serviceType} email sent successfully`
      });
    } else {
      // For service alerts, send to ALL dashboard users with matching serviceType
      const dashboardUsers = await getServiceProviderEmails(serviceType);
      
      if (dashboardUsers.length === 0) {
        console.log(`⚠️ No ${serviceType} dashboard users found in database`);
        return res.status(404).json({ 
          success: false, 
          error: `No ${serviceType} dashboard users found in database`
        });
      }
      
      console.log(`📧 Sending ${serviceType} alert notification to ${dashboardUsers.length} dashboard users`);
      
      // Send email notifications to dashboard users
      const emailPromises = dashboardUsers.map(async (email) => {
        try {
          const serviceEmailId = generateEmailId(email, `service-${serviceType}`, alertId || 'default');
          const now = Date.now();
          
          if (emailTracker.has(serviceEmailId)) {
            const lastSent = emailTracker.get(serviceEmailId);
            const timeSinceLastSent = now - lastSent;
            
            if (timeSinceLastSent < EMAIL_COOLDOWN) {
              console.log(`Service email to ${email} blocked - duplicate detected. Last sent ${Math.round(timeSinceLastSent/1000)}s ago`);
              return { email, success: false, error: 'Duplicate email blocked', duplicate: true };
            }
          }
          
          const mailOptions = {
            from: 'safety.alert.app@gmail.com',
            to: email,
            subject: subject || `🚨 NEW ALERT - Check Dashboard for ${serviceType.toUpperCase()} Emergency`,
            html: html
          };
          
          const info = await transporter.sendMail(mailOptions);
          emailTracker.set(serviceEmailId, now);
          
          console.log(`✅ Dashboard notification sent to ${email} (${info.messageId})`);
          return { email, success: true, messageId: info.messageId };
        } catch (error) {
          console.error(`❌ Failed to send dashboard notification to ${email}:`, error);
          return { email, success: false, error: error.message };
        }
      });
      
      const results = await Promise.all(emailPromises);
      const successCount = results.filter(r => r.success).length;
      
      console.log(`📊 Dashboard notifications: ${successCount}/${dashboardUsers.length} successful`);
      
      return res.status(200).json({ 
        success: true, 
        message: `Dashboard notifications sent to ${successCount}/${dashboardUsers.length} ${serviceType} users`,
        results: results
      });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// API endpoint to send emails to all users with matching service type
app.post('/api/send-service-notifications', async (req, res) => {
  try {
    const { serviceType, alertData, userEmails } = req.body;
    
    if (!serviceType || !alertData || !userEmails || !Array.isArray(userEmails)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: serviceType, alertData, userEmails' 
      });
    }

    // Generate unique request ID to prevent duplicate processing
    const requestId = generateRequestId(serviceType, alertData, userEmails);
    
    if (processedRequests.has(requestId)) {
      console.log(`⚠️ Request already processed: ${requestId}`);
      return res.status(200).json({ 
        success: true, 
        message: 'Request already processed - no duplicate emails sent',
        results: []
      });
    }

    // Mark request as processed
    processedRequests.add(requestId);
    
    // Clean up old processed requests (older than 1 hour)
    setTimeout(() => {
      processedRequests.delete(requestId);
    }, 3600000);

    const results = [];
    const now = Date.now();
    
    console.log(`📧 Processing NEW ${serviceType.toUpperCase()} request: ${requestId}`);
    console.log(`📧 Sending ${serviceType.toUpperCase()} alerts to ONLY ${serviceType} users:`);
    
    // Send email to each user with matching service type
    for (const email of userEmails) {
      try {
        // Generate unique identifier for this email
        const emailId = generateEmailId(email, `New ${serviceType} Alert`, alertData.alertId || Date.now());
        
        // Check if this exact email was sent recently
        if (emailTracker.has(emailId)) {
          const lastSent = emailTracker.get(emailId);
          const timeSinceLastSent = now - lastSent;
          
          if (timeSinceLastSent < EMAIL_COOLDOWN) {
            console.log(`📧 Email to ${email} blocked - duplicate detected (sent ${Math.round(timeSinceLastSent/1000)}s ago)`);
            results.push({ email, success: false, reason: 'duplicate' });
            continue;
          }
        }

        const mailOptions = {
          from: 'safety.alert.app@gmail.com',
          to: email,
          subject: `🚨 URGENT: New ${serviceType.toUpperCase()} Emergency Alert`,
          html: generateServiceNotificationHTML(alertData, serviceType)
        };

        console.log(`📧 Attempting to send ${serviceType.toUpperCase()} alert to: ${email}`);
        console.log(`📧 Email subject: ${mailOptions.subject}`);
        console.log(`📧 From: ${mailOptions.from}`);

        const info = await transporter.sendMail(mailOptions);
        
        // Track this email
        emailTracker.set(emailId, now);
        
        results.push({ 
          email, 
          success: true, 
          messageId: info.messageId 
        });
        
        console.log(`✅ ${serviceType.toUpperCase()} alert successfully delivered to ${email}`);
        console.log(`📧 Message ID: ${info.messageId}`);
        console.log(`📧 Response: ${JSON.stringify(info.response)}`);
      } catch (error) {
        console.error(`❌ Failed to send ${serviceType} alert to ${email}:`, error);
        results.push({ 
          email, 
          success: false, 
          error: error.message 
        });
      }
    }
    
    // Clean up old entries (older than 1 hour)
    for (const [key, timestamp] of emailTracker.entries()) {
      if (now - timestamp > 3600000) { // 1 hour
        emailTracker.delete(key);
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    res.status(200).json({ 
      success: true, 
      message: `Service notifications sent: ${successCount}/${totalCount}`,
      results: results
    });
  } catch (error) {
    console.error('Error sending service notifications:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Function to generate HTML for service notification emails
function generateServiceAlertHTML(alertData) {
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
            <p><strong>Service Required:</strong> ${serviceType.toUpperCase()}</p>
            <p><strong>Person in Need:</strong> ${alertData.userName || 'Unknown'}</p>
            <p><strong>Location:</strong> ${typeof alertData.location === 'string' ? alertData.location : alertData.location?.address || 'Location provided'}</p>
            <p><strong>Time:</strong> ${alertData.time || new Date().toLocaleString()}</p>
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API endpoint to send reply notification to alert creator
app.post('/api/send-reply-notification', async (req, res) => {
  try {
    const { alertCreatorEmail, responderName, station, message, serviceType, alertId } = req.body;
    
    if (!alertCreatorEmail || !responderName || !message || !serviceType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: alertCreatorEmail, responderName, message, serviceType' 
      });
    }

    // Generate unique identifier for this reply to prevent duplicates
    const replyEmailId = generateEmailId(alertCreatorEmail, `reply-${alertId}`, `${responderName}-${message.substring(0, 50)}`);
    const now = Date.now();
    
    // Check if this exact reply email was sent recently
    if (emailTracker.has(replyEmailId)) {
      const lastSent = emailTracker.get(replyEmailId);
      const timeSinceLastSent = now - lastSent;
      
      if (timeSinceLastSent < EMAIL_COOLDOWN) {
        console.log(`Reply email blocked - duplicate detected. Last sent ${Math.round(timeSinceLastSent/1000)}s ago`);
        return res.status(429).json({ 
          success: false, 
          error: 'Reply email already sent recently',
          cooldownRemaining: Math.round((EMAIL_COOLDOWN - timeSinceLastSent) / 1000)
        });
      }
    }

    const mailOptions = {
      from: 'safety.alert.app@gmail.com',
      to: alertCreatorEmail,
      subject: `🚨 ${serviceType.toUpperCase()} Response Received - Your Emergency Alert`,
      html: generateReplyNotificationHTML({
        responderName,
        station,
        message,
        serviceType,
        alertId
      })
    };

    console.log(`📧 Sending reply notification to alert creator: ${alertCreatorEmail}`);
    console.log(`📧 From responder: ${responderName} (${station || 'Emergency Services'})`);

    const info = await transporter.sendMail(mailOptions);
    
    // Track this email to prevent duplicates
    emailTracker.set(replyEmailId, now);
    
    console.log(`✅ Reply notification sent to ${alertCreatorEmail} (${info.messageId})`);
    
    res.status(200).json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Reply notification sent successfully'
    });
  } catch (error) {
    console.error('❌ Error sending reply notification:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Function to generate reply notification HTML
function generateReplyNotificationHTML({ responderName, station, message, serviceType, alertId }) {
  const serviceColors = {
    police: '#1e40af',
    hospital: '#16a34a', 
    fire: '#dc2626',
    campus: '#7c3aed'
  };
  
  const serviceIcons = {
    police: '🚔',
    hospital: '🏥',
    fire: '🚒',
    campus: '🏫'
  };
  
  const color = serviceColors[serviceType.toLowerCase()] || '#ff5330';
  const icon = serviceIcons[serviceType.toLowerCase()] || '🚨';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Emergency Response Received</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); color: white; padding: 30px 20px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 10px;">${icon}</div>
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Response Received</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your ${serviceType.toUpperCase()} emergency alert has been answered</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px 20px;">
          
          <!-- Responder Info -->
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px; border-left: 4px solid ${color};">
            <h3 style="margin: 0 0 10px 0; color: #333; font-size: 18px;">Response From:</h3>
            <p style="margin: 0; font-size: 16px; font-weight: 600; color: ${color};">${responderName}</p>
            ${station ? `<p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">${station}</p>` : ''}
          </div>
          
          <!-- Message -->
          <div style="margin-bottom: 25px;">
            <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">Message:</h3>
            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #374151;">${message}</p>
            </div>
          </div>
          
          <!-- Alert Info -->
          ${alertId ? `
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              <strong>Alert ID:</strong> ${alertId}<br>
              <strong>Service:</strong> ${serviceType.toUpperCase()}<br>
              <strong>Time:</strong> ${new Date().toLocaleString()}
            </p>
          </div>
          ` : ''}
          
          <!-- Footer -->
          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              This is an automated notification from Safety Alert System.<br>
              Please keep this information for your records.
            </p>
          </div>
          
        </div>
      </div>
    </body>
    </html>
  `;
}

// PORT will be determined dynamically

// Function to find available port
function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const server = require('net').createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

// Start server with available port
findAvailablePort(3002).then((availablePort) => {
  app.listen(availablePort, () => {
    console.log(`📧 Email server running on port ${availablePort}`);
    console.log(`🔗 Health check: http://localhost:${availablePort}/health`);
    
    // Save port info to a file for other services to read
    const fs = require('fs');
    const portInfo = {
      port: availablePort,
      url: `http://localhost:${availablePort}`,
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync('../email-server-port.json', JSON.stringify(portInfo, null, 2));
    console.log(`📄 Port info saved to email-server-port.json`);
  });
}).catch(console.error);

module.exports = app;
