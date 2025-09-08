const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Email tracking to prevent duplicates
const emailTracker = new Map();
const EMAIL_COOLDOWN = 30000; // 30 seconds cooldown between same emails

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'safety.alert.app@gmail.com',
    pass: 'gjxoeixzyoxacyac'
  }
});

// Service-specific email addresses - these should match the actual service provider emails
const SERVICE_EMAILS = {
  police: 'police@gmail.com',
  hospital: 'hospital@gmail.com',
  fire: 'fire@gmail.com',
  campus: 'campus@gmail.com'
};

// Function to get the correct email based on service type
function getServiceEmail(serviceType) {
  const normalizedType = serviceType.toLowerCase();
  return SERVICE_EMAILS[normalizedType] || 'safety.alert.app@gmail.com';
}

// Function to generate unique email identifier
function generateEmailId(to, subject, alertId) {
  return `${to}-${subject}-${alertId || 'default'}`;
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
    
    // Determine recipient based on service type or use specific recipient for confirmations/replies
    let finalRecipient;
    if ((serviceType === 'confirmation' || serviceType === 'reply') && userEmail) {
      finalRecipient = userEmail;
    } else {
      finalRecipient = getServiceEmail(to || 'default');
    }
    
    const mailOptions = {
      from: 'safety.alert.app@gmail.com',
      to: finalRecipient,
      subject: subject || (serviceType === 'confirmation' ? 'Alert Confirmation - We Have Received Your Emergency Request' : serviceType === 'reply' ? 'Emergency Response Received' : 'New Emergency Alert'),
      html: html || 'Emergency alert received.'
    };

    console.log(`📧 Sending ${serviceType || 'alert'} email to: ${finalRecipient}`);

    const info = await transporter.sendMail(mailOptions);
    
    // Track this email
    emailTracker.set(emailId, now);
    
    // Clean up old entries (older than 1 hour)
    for (const [key, timestamp] of emailTracker.entries()) {
      if (now - timestamp > 3600000) { // 1 hour
        emailTracker.delete(key);
      }
    }
    
    console.log('Email sent successfully:', info.messageId);
    
    res.status(200).json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Email sent successfully' 
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Email server is running' });
});

app.listen(PORT, () => {
  console.log(`Email server running on port ${PORT}`);
});

module.exports = app;
