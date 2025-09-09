// Utility to get the current email server URL from the port file
const fs = require('fs');
const path = require('path');

function getEmailServerUrl() {
  try {
    const portFilePath = path.join(__dirname, '..', 'email-server-port.json');
    
    if (fs.existsSync(portFilePath)) {
      const portInfo = JSON.parse(fs.readFileSync(portFilePath, 'utf8'));
      return portInfo.url;
    }
  } catch (error) {
    console.warn('Could not read email server port info, using default');
  }
  
  // Fallback to default port
  return 'http://localhost:3002';
}

module.exports = { getEmailServerUrl };
