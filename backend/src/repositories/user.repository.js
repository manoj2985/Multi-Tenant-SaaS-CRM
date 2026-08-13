const { prisma } = require('../config/db');

class UserRepository {
  async create(userData, tx = prisma) {
    return await tx.user.create({
      data: userData
    });
  }

  async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        company: true
      }
    });
  }

  async findById(id) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true, status: true, subscriptionPlan: true }
        }
      }
    });
  }

  async findByIdAndCompany(id, companyId) {
    return await prisma.user.findFirst({
      where: { id, companyId },
      include: {
        company: {
          select: { id: true, name: true, status: true, subscriptionPlan: true }
        }
      }
    });
  }

  async findByCompany(companyId) {
    return await prisma.user.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        companyId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async update(id, companyId, data) {
    return await prisma.user.updateMany({
      where: { id, companyId },
      data
    });
  }

  async updateStatus(id, companyId, status) {
    return await prisma.user.updateMany({
      where: { id, companyId },
      data: { status }
    });
  }
}

module.exports = new UserRepository();
