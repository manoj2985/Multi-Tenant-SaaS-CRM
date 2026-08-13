const { prisma } = require('../config/db');

class DealRepository {
  async create(data, tx = prisma) {
    return await tx.deal.create({
      data,
      include: {
        customer: {
          select: { id: true, name: true, companyName: true, email: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  }

  async findByIdAndCompany(id, companyId) {
    return await prisma.deal.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null
      },
      include: {
        customer: {
          select: { id: true, name: true, companyName: true, email: true, phone: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  }

  async findManyWithPagination({ companyId, page, limit, search, stage, assignedTo, customerId, sortBy, sortOrder }) {
    const where = {
      companyId,
      deletedAt: null,
      ...(stage && { stage }),
      ...(assignedTo && { assignedToId: assignedTo }),
      ...(customerId && { customerId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { customer: { name: { contains: search, mode: 'insensitive' } } },
          { customer: { companyName: { contains: search, mode: 'insensitive' } } }
        ]
      })
    };

    const [total, data] = await Promise.all([
      prisma.deal.count({ where }),
      prisma.deal.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: {
            select: { id: true, name: true, companyName: true, email: true }
          },
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

  async getPipelineData({ companyId, assignedTo, customerId }) {
    const where = {
      companyId,
      deletedAt: null,
      ...(assignedTo && { assignedToId: assignedTo }),
      ...(customerId && { customerId })
    };

    const deals = await prisma.deal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, name: true, companyName: true }
        },
        assignedTo: {
          select: { id: true, name: true }
        }
      }
    });

    const pipeline = {
      LEAD: [],
      QUALIFIED: [],
      PROPOSAL: [],
      NEGOTIATION: [],
      WON: [],
      LOST: []
    };

    deals.forEach((deal) => {
      if (pipeline[deal.stage]) {
        pipeline[deal.stage].push(deal);
      }
    });

    return pipeline;
  }

  async update(id, companyId, data, tx = prisma) {
    return await tx.deal.updateMany({
      where: {
        id,
        companyId,
        deletedAt: null
      },
      data
    });
  }

  async updateStage(id, companyId, stage, tx = prisma) {
    return await tx.deal.updateMany({
      where: {
        id,
        companyId,
        deletedAt: null
      },
      data: {
        stage,
        updatedAt: new Date()
      }
    });
  }

  async assignUser(id, companyId, assignedToId, tx = prisma) {
    return await tx.deal.updateMany({
      where: {
        id,
        companyId,
        deletedAt: null
      },
      data: { assignedToId }
    });
  }

  async softDelete(id, companyId) {
    return await prisma.deal.updateMany({
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

module.exports = new DealRepository();
