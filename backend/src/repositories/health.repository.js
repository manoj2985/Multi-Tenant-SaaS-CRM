const { prisma } = require('../config/db');

class HealthRepository {
  /**
   * Retrieves or updates system health log record
   */
  async pingDatabase() {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;
    return { status: 'healthy', latencyMs: latency };
  }

  /**
   * Fetch health check history count if table exists
   */
  async getHealthRecordCount() {
    try {
      return await prisma.healthCheck.count();
    } catch {
      return 0;
    }
  }
}

module.exports = new HealthRepository();
