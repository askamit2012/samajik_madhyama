const { spawn, execSync } = require('child_process');
const net = require('net');
const fs = require('fs');
const path = require('path');

const BACKEND_ENV_PATH = path.join(__dirname, '../apps/backend/.env');
const PORTS_FILE = path.join(__dirname, '../.ports.json');

function getDatabaseUrl() {
  try {
    const contents = fs.readFileSync(BACKEND_ENV_PATH, 'utf8');
    const match = contents.match(/^DATABASE_URL=(.*)$/m);
    return match ? match[1].trim() : null;
  } catch (e) {
    return null;
  }
}

async function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

async function getNextFreePort(startPort) {
  let port = startPort;
  while (!(await isPortFree(port))) {
    console.log(`Port ${port} is occupied, trying ${port + 1}...`);
    port++;
  }
  return port;
}

async function start() {
  console.log('🚀 Starting MarketingOS Local Development Environment...');

  // 1. Resolve Ports
  const backendPort = await getNextFreePort(4000);
  const userPort = await getNextFreePort(3000);
  const adminPort = await getNextFreePort(3001);

  const portMapping = {
    backend: backendPort,
    user: userPort,
    admin: adminPort
  };

  fs.writeFileSync(PORTS_FILE, JSON.stringify(portMapping, null, 2));
  console.log(`📍 Port Mapping: Backend:${backendPort}, User:${userPort}, Admin:${adminPort}`);

  // 2. Start Infrastructure
  console.log('📦 Ensuring Infrastructure (Postgres/Redis) is up...');
  try {
    execSync('docker compose up -d postgres redis', { stdio: 'inherit' });
  } catch (e) {
    console.warn('⚠️  Standard Docker Compose failed. Trying with sudo...');
    try {
      execSync('sudo docker compose up -d postgres redis', { stdio: 'inherit' });
    } catch (sudoErr) {
      console.error('❌ Docker Compose failed even with sudo. Ensure Docker is running.');
    }
  }

  // 3. Provision Database if needed
  console.log('🗄️  Ensuring database "marketing_os" exists...');
  try {
    execSync('sudo docker exec m-os-db psql -U postgres -c "CREATE DATABASE marketing_os;"', { stdio: 'ignore' });
    console.log('✅ Database created or already exists.');
  } catch (e) {
    // Database likely already exists
  }

  // 4. Push Schema
  console.log('🔄 Synchronizing database schema...');
  const dbUrl = getDatabaseUrl() || 'postgresql://postgres:postgres@localhost:5432/marketing_os';
  try {
    execSync('pnpm --filter @repo/database push', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: dbUrl }
    });
    console.log('✅ Schema synchronization complete.');
  } catch (e) {
    console.error('❌ Failed to push database schema.');
  }

  // 5. Start Apps
  const env = { 
    ...process.env, 
    DATABASE_URL: dbUrl,
    PORT: backendPort,
    NEXT_PUBLIC_API_URL: `http://localhost:${backendPort}`,
    // For Next.js/Vite to pick up their dynamic ports if they support it via env
    USER_PORT: userPort,
    ADMIN_PORT: adminPort
  };

  const services = [
    { name: 'Backend', command: 'pnpm', args: ['--filter', 'backend', 'dev'], env: { ...env, PORT: backendPort } },
    { name: 'Admin', command: 'pnpm', args: ['--filter', 'admin', 'dev'], env: { ...env, PORT: adminPort } },
    { name: 'User', command: 'pnpm', args: ['--filter', 'user', 'dev'], env: { ...env, PORT: userPort } }
  ];

  services.forEach(service => {
    console.log(`🏁 Starting ${service.name}...`);
    const proc = spawn(service.command, service.args, { 
      stdio: 'inherit', 
      shell: true,
      env: service.env
    });

    proc.on('error', (err) => {
      console.error(`❌ Failed to start ${service.name}:`, err);
    });
  });

  console.log('\n✨ All services triggered. Press Ctrl+C to stop (use pnpm run kill for full cleanup).\n');
}

start().catch(console.error);
