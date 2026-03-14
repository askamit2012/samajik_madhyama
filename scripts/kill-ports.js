const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORTS_FILE = path.join(__dirname, '../.ports.json');

function killPort(port) {
  try {
    console.log(`Attempting to kill process on port ${port}...`);
    // Cross-platform port killing
    if (process.platform === 'win32') {
      execSync(`stop-process -id (get-nettcpconnection -localport ${port}).owningprocess -force`, { shell: 'powershell', stdio: 'ignore' });
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' });
    }
    console.log(`✅ Port ${port} freed.`);
  } catch (e) {
    // console.log(`ℹ️ Port ${port} was already free or could not be killed.`);
  }
}

console.log('🧹 Cleaning up MarketingOS development processes...');

if (fs.existsSync(PORTS_FILE)) {
  const ports = JSON.parse(fs.readFileSync(PORTS_FILE, 'utf8'));
  Object.values(ports).forEach(killPort);
  fs.unlinkSync(PORTS_FILE);
} else {
  console.log('No .ports.json found. Cleaning default ports...');
  [3000, 3001, 4000].forEach(killPort);
}

// Global cleanup for common tools and docker
try {
  if (process.platform !== 'win32') {
    execSync('pkill -f "node scripts/start-dev.js"', { stdio: 'ignore' });
    try {
      execSync('docker compose down', { stdio: 'ignore' });
    } catch (e) {
      execSync('sudo docker compose down', { stdio: 'ignore' });
    }
  }
} catch (e) {}

console.log('✨ Cleanup complete!');
