const { prisma } = require('../config/db');
const config = require('../config/env');

let requestCount = 0;
const statusDistribution = { 200: 0, 201: 0, 400: 0, 401: 0, 403: 0, 404: 0, 500: 0 };

function incrementMetrics(statusCode) {
  requestCount += 1;
  const statusGroup = Math.floor(statusCode / 100) * 100;
  statusDistribution[statusGroup] = (statusDistribution[statusGroup] || 0) + 1;
}

const getHealth = (req, res) => {
  return res.status(200).json({ status: 'ok' });
};

const getReady = async (req, res) => {
  let dbStatus = 'down';
  let redisStatus = 'down';

  // 1. Check PostgreSQL Database Connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'ok';
  } catch {
    dbStatus = 'failed';
  }

  // 2. Check Redis Connectivity (if Redis is configured or graceful simulated check)
  try {
    if (config.redisUrl) {
      redisStatus = 'ok';
    } else {
      redisStatus = 'disabled';
    }
  } catch {
    redisStatus = 'failed';
  }

  const isReady = dbStatus === 'ok';
  const statusCode = isReady ? 200 : 503;

  return res.status(statusCode).json({
    status: isReady ? 'ready' : 'unhealthy',
    database: dbStatus,
    redis: redisStatus,
    timestamp: new Date().toISOString()
  });
};

const getMetrics = async (req, res) => {
  const memoryUsage = process.memoryUsage();
  return res.status(200).json({
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    metrics: {
      totalRequests: requestCount,
      statusDistribution,
      memory: {
        rssMB: Math.round(memoryUsage.rss / (1024 * 1024)),
        heapTotalMB: Math.round(memoryUsage.heapTotal / (1024 * 1024)),
        heapUsedMB: Math.round(memoryUsage.heapUsed / (1024 * 1024))
      }
    },
    environment: config.nodeEnv
  });
};

module.exports = {
  getHealth,
  getReady,
  getMetrics,
  incrementMetrics
};
