const { prisma } = require('../config/db');

class FileRepository {
  async create(data) {
    return prisma.file.create({
      data,
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  }

  async findByIdAndCompany(id, companyId) {
    return prisma.file.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  }

  async findMany({ companyId, entityType, entityId, page = 1, limit = 20 }) {
    const skip = (page - 1) * limit;
    const where = {
      companyId,
      deletedAt: null
    };

    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    const [total, data] = await Promise.all([
      prisma.file.count({ where }),
      prisma.file.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true }
          }
        }
      })
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async softDelete(id, companyId) {
    return prisma.file.updateMany({
      where: {
        id,
        companyId,
        deletedAt: null
      },
      data: {
        deletedAt: new Date()
      }
    });
  }
}

module.exports = new FileRepository();
