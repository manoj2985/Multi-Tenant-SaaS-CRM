const { prisma } = require('../config/db');

class LeadRepository {
  async create(data, tx = prisma) {
    return await tx.lead.create({
      data,
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  }

  async findByIdAndCompany(id, companyId) {
    return await prisma.lead.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  }

  async findManyWithPagination({ companyId, page, limit, search, status, priority, source, assignedTo, sortBy, sortOrder }) {
    const where = {
      companyId,
      deletedAt: null,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(source && { source }),
      ...(assignedTo && { assignedToId: assignedTo }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [total, data] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true }
          }
        }
      })
    ]);

    return {
      total,
      data
    };
  }

  async update(id, companyId, data, tx = prisma) {
    return await tx.lead.updateMany({
      where: {
        id,
        companyId,
        deletedAt: null
      },
      data
    });
  }

  async updateStatus(id, companyId, status, tx = prisma) {
    return await tx.lead.updateMany({
      where: {
        id,
        companyId,
        deletedAt: null
      },
      data: { status }
    });
  }

  async assignUser(id, companyId, assignedToId, tx = prisma) {
    return await tx.lead.updateMany({
      where: {
        id,
        companyId,
        deletedAt: null
      },
      data: { assignedToId }
    });
  }

  async softDelete(id, companyId) {
    return await prisma.lead.updateMany({
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

module.exports = new LeadRepository();
