const healthRepository = require('../repositories/health.repository');
const config = require('../config/env');

class HealthService {
  async getSystemHealth() {
    let dbStatus = 'disconnected';
    let dbLatencyMs = 0;
    let dbError = null;

    try {
      const dbResult = await healthRepository.pingDatabase();
      dbStatus = dbResult.status;
      dbLatencyMs = dbResult.latencyMs;
    } catch (err) {
      dbError = err.message;
    }

    const memoryUsage = process.memoryUsage();

    return {
      success: true,
      message: 'CRM API is running',
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: {
          rssMb: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
          heapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100
        }
      },
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        ...(dbError && { error: dbError })
      }
    };
  }
}

module.exports = new HealthService();
