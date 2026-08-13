const crypto = require('crypto');
const { prisma } = require('../config/db');
const ApiError = require('../utils/apiError');

class ApiKeyService {
  async createApiKey(companyId, userId, dto) {
    const rawSecret = `crm_live_${crypto.randomBytes(24).toString('hex')}`;
    const keyPrefix = rawSecret.substring(0, 12) + '...';
    const keyHash = crypto.createHash('sha256').update(rawSecret).digest('hex');

    const expiresAt = dto.expiresInDays
      ? new Date(Date.now() + dto.expiresInDays * 86400000)
      : null;

    const apiKeyRecord = await prisma.apiKey.create({
      data: {
        companyId,
        createdById: userId,
        name: dto.name || 'External API Integration Key',
        keyHash,
        keyPrefix,
        scopes: dto.scopes || ['CUSTOMERS_READ', 'LEADS_READ', 'DEALS_READ'],
        expiresAt
      }
    });

    return {
      apiKey: apiKeyRecord,
      secretKey: rawSecret // Returned ONLY ONCE
    };
  }

  async getApiKeys(companyId) {
    const keys = await prisma.apiKey.findMany({
      where: { companyId },
      include: {
        _count: { select: { requestLogs: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return keys.map(k => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      scopes: k.scopes,
      lastUsedAt: k.lastUsedAt,
      expiresAt: k.expiresAt,
      revokedAt: k.revokedAt,
      createdAt: k.createdAt,
      totalRequests: k._count.requestLogs
    }));
  }

  async revokeApiKey(companyId, keyId) {
    const key = await prisma.apiKey.findFirst({
      where: { id: keyId, companyId }
    });

    if (!key) throw new ApiError(404, 'API Key not found', true, null, 'NOT_FOUND');

    await prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() }
    });

    return { success: true, message: 'API key revoked successfully' };
  }

  async verifyApiKey(rawKeyString) {
    if (!rawKeyString) return null;

    const keyHash = crypto.createHash('sha256').update(rawKeyString).digest('hex');
    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { company: true }
    });

    if (!apiKey) return null;
    if (apiKey.revokedAt) return null;
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;
    if (apiKey.company && apiKey.company.status === 'SUSPENDED') return null;

    // Update lastUsedAt asynchronously
    prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() }
    }).catch(() => {});

    return apiKey;
  }

  async logApiRequest(companyId, apiKeyId, method, path, statusCode, responseTime) {
    try {
      await prisma.apiRequestLog.create({
        data: {
          companyId,
          apiKeyId: apiKeyId || null,
          method,
          path,
          statusCode,
          responseTime
        }
      });
    } catch {
      // Ignore logging failures
    }
  }

  async getApiKeyUsage(companyId, apiKeyId) {
    const logs = await prisma.apiRequestLog.findMany({
      where: { companyId, apiKeyId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const totalRequests = await prisma.apiRequestLog.count({
      where: { companyId, apiKeyId }
    });

    return {
      totalRequests,
      recentRequests: logs
    };
  }
}

module.exports = new ApiKeyService();
