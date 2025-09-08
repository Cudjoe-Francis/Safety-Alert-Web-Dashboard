const nodemailer = require('nodemailer');

console.log('Testing Gmail configuration...');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'safety.alert.app@gmail.com',
    pass: 'gjxoeixzyoxacyac'
  }
});

transporter.sendMail({
  from: 'safety.alert.app@gmail.com',
  to: 'safety.alert.app@gmail.com',
  subject: 'Test Email - ' + new Date().toLocaleTimeString(),
  text: 'This is a test email to verify Gmail configuration is working.'
}, (error, info) => {
  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
  }
});
