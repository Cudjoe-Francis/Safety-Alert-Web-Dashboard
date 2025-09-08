const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

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

// API endpoint to send alert emails
app.post('/api/send-alert-email', async (req, res) => {
  try {
    const { to, subject, html } = req.body;
    
    const mailOptions = {
      from: 'safety.alert.app@gmail.com',
      to: to,
      subject: subject,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
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
