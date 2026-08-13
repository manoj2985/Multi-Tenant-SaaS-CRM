const { prisma } = require('../config/db');

class TaskRepository {
  async create(data, tx = prisma) {
    return await tx.task.create({
      data,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } }
      }
    });
  }

  async findByIdAndCompany(id, companyId) {
    return await prisma.task.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } }
      }
    });
  }

  async findManyWithPagination({ companyId, page, limit, search, status, priority, assignedTo, dueDate, sortBy, sortOrder }) {
    const where = {
      companyId,
      deletedAt: null,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(assignedTo && { assignedToId: assignedTo }),
      ...(dueDate && {
        dueDate: {
          gte: new Date(`${dueDate}T00:00:00.000Z`),
          lte: new Date(`${dueDate}T23:59:59.999Z`)
        }
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [total, data] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } }
        }
      })
    ]);

    return { total, data };
  }

  async update(id, companyId, data, tx = prisma) {
    return await tx.task.updateMany({
      where: { id, companyId, deletedAt: null },
      data
    });
  }

  async updateStatus(id, companyId, status, tx = prisma) {
    return await tx.task.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { status }
    });
  }

  async assignUser(id, companyId, assignedToId, tx = prisma) {
    return await tx.task.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { assignedToId }
    });
  }

  async softDelete(id, companyId) {
    return await prisma.task.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { deletedAt: new Date() }
    });
  }
}

module.exports = new TaskRepository();
