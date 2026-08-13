const { prisma } = require('../config/db');

class RefreshTokenRepository {
  async createToken({ tokenHash, userId, expiresAt }) {
    return await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt
      }
    });
  }

  async findByHash(tokenHash) {
    return await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { company: true } } }
    });
  }

  async revokeToken(tokenHash) {
    return await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true }
    });
  }

  async revokeAllUserTokens(userId) {
    return await prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true }
    });
  }
}

module.exports = new RefreshTokenRepository();
