const { prisma } = require('../config/db');

class CustomerRepository {
  async create(data, tx = prisma) {
    return await tx.customer.create({
      data,
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  }

  async findByIdAndCompany(id, companyId) {
    return await prisma.customer.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        deals: {
          where: { deletedAt: null },
          select: { id: true, title: true, value: true, stage: true, createdAt: true }
        }
      }
    });
  }

  async findManyWithPagination({ companyId, page, limit, search, status, sortBy, sortOrder }) {
    const where = {
      companyId,
      deletedAt: null,
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [total, data] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
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
    return await tx.customer.updateMany({
      where: {
        id,
        companyId,
        deletedAt: null
      },
      data
    });
  }

  async softDelete(id, companyId) {
    return await prisma.customer.updateMany({
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

module.exports = new CustomerRepository();
