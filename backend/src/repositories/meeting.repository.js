const { prisma } = require('../config/db');

class MeetingRepository {
  async findOverlappingMeeting({ companyId, createdById, date, startTime, endTime, excludeMeetingId = null }) {
    const startOfDate = new Date(`${date}T00:00:00.000Z`);
    const endOfDate = new Date(`${date}T23:59:59.999Z`);

    const existingMeetings = await prisma.meeting.findMany({
      where: {
        companyId,
        createdById,
        status: { not: 'CANCELLED' },
        date: {
          gte: startOfDate,
          lte: endOfDate
        },
        ...(excludeMeetingId && { id: { not: excludeMeetingId } })
      }
    });

    // Check time range overlap: startTime < existing.endTime && endTime > existing.startTime
    const conflict = existingMeetings.find((m) => {
      return startTime < m.endTime && endTime > m.startTime;
    });

    return conflict || null;
  }

  async create(data, tx = prisma) {
    return await tx.meeting.create({
      data,
      include: {
        customer: { select: { id: true, name: true, companyName: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } }
      }
    });
  }

  async findByIdAndCompany(id, companyId) {
    return await prisma.meeting.findFirst({
      where: { id, companyId },
      include: {
        customer: { select: { id: true, name: true, companyName: true, email: true, phone: true } },
        createdBy: { select: { id: true, name: true, email: true } }
      }
    });
  }

  async findManyWithPagination({ companyId, page, limit, search, status, customerId, date, from, to, sortBy = 'date', sortOrder = 'asc' }) {
    const where = {
      companyId,
      ...(status && { status }),
      ...(customerId && { customerId }),
      ...(date && {
        date: {
          gte: new Date(`${date}T00:00:00.000Z`),
          lte: new Date(`${date}T23:59:59.999Z`)
        }
      }),
      ...(from && to && {
        date: {
          gte: new Date(`${from}T00:00:00.000Z`),
          lte: new Date(`${to}T23:59:59.999Z`)
        }
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
          { customer: { name: { contains: search, mode: 'insensitive' } } }
        ]
      })
    };

    const [total, data] = await Promise.all([
      prisma.meeting.count({ where }),
      prisma.meeting.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: { select: { id: true, name: true, companyName: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } }
        }
      })
    ]);

    return { total, data };
  }

  async update(id, companyId, data, tx = prisma) {
    return await tx.meeting.updateMany({
      where: { id, companyId },
      data
    });
  }

  async updateStatus(id, companyId, status, tx = prisma) {
    return await tx.meeting.updateMany({
      where: { id, companyId },
      data: { status }
    });
  }

  async delete(id, companyId) {
    return await prisma.meeting.deleteMany({
      where: { id, companyId }
    });
  }
}

module.exports = new MeetingRepository();
