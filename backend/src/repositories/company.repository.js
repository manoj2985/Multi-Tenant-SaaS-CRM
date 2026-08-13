const { prisma } = require('../config/db');

class CompanyRepository {
  async create(companyData, tx = prisma) {
    return await tx.company.create({
      data: companyData
    });
  }

  async findById(id) {
    return await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });
  }

  async findByEmail(email) {
    return await prisma.company.findUnique({
      where: { email }
    });
  }

  async update(id, data) {
    return await prisma.company.update({
      where: { id },
      data
    });
  }

  async updateStatus(id, status) {
    return await prisma.company.update({
      where: { id },
      data: { status }
    });
  }

  async findAll() {
    return await prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });
  }
}

module.exports = new CompanyRepository();
