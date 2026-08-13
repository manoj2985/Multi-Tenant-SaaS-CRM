const app = require('./src/app');
const config = require('./src/config/env');
const { checkDbConnection, prisma } = require('./src/config/db');

async function startServer() {
  try {
    console.log('[SYSTEM] Initializing Multi-Tenant SaaS CRM API backend...');
    
    // Test Prisma DB Connection
    const dbCheck = await checkDbConnection();
    if (dbCheck.isConnected) {
      console.log(`[DATABASE] Connected successfully to PostgreSQL via Prisma (Latency: ${dbCheck.latencyMs}ms)`);
    } else {
      console.warn(`[DATABASE WARNING] PostgreSQL connection check failed: ${dbCheck.error}`);
      console.warn('[DATABASE WARNING] Server starting in standalone mode; verify database settings.');
    }

    const http = require('http');
    const { initSocket } = require('./src/config/socket');

    const server = http.createServer(app);
    initSocket(server);

    server.listen(config.port, () => {
      console.log(`[SERVER] CRM API running on port ${config.port} [${config.nodeEnv}]`);
      console.log(`[HEALTH CHECK] GET http://localhost:${config.port}/api/health`);
    });

    // Graceful Shutdown
    const handleShutdown = async (signal) => {
      console.log(`\n[SYSTEM] Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        console.log('[SERVER] HTTP server closed.');
        await prisma.$disconnect();
        console.log('[DATABASE] Prisma client disconnected.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

  } catch (error) {
    console.error('[FATAL] Failed to start backend server:', error);
    process.exit(1);
  }
}

startServer();
