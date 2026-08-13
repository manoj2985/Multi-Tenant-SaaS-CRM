const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn']
    });
  }
  prisma = global.prisma;
}

/**
 * Verifies database connection latency and connectivity status
 * @returns {Promise<{ isConnected: boolean, latencyMs: number, error: string|null }>}
 */
async function checkDbConnection() {
  const startTime = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - startTime;
    return { isConnected: true, latencyMs, error: null };
  } catch (err) {
    return { isConnected: false, latencyMs: 0, error: err.message };
  }
}

module.exports = {
  prisma,
  checkDbConnection
};
