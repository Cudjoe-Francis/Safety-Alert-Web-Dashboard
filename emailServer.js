// Email server that can be run from the root directory
// This is a wrapper that starts the actual email server from the server directory

import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Email Server from root directory...');

// Path to the actual email server
const serverPath = path.join(__dirname, 'server', 'emailServer.js');

// Start the email server process
const emailServer = spawn('node', [serverPath], {
  stdio: 'inherit',
  cwd: path.join(__dirname, 'server')
});

emailServer.on('error', (error) => {
  console.error('❌ Failed to start email server:', error);
});

emailServer.on('close', (code) => {
  console.log(`📧 Email server process exited with code ${code}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down email server...');
  emailServer.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down email server...');
  emailServer.kill('SIGTERM');
  process.exit(0);
});
