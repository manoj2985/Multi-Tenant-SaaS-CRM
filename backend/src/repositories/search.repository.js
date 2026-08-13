const { prisma } = require('../config/db');

class SearchRepository {
  /**
   * Sort items by exact match (1st), starts-with (2nd), and partial match (3rd)
   */
  rankResults(items, query, nameField = 'name') {
    const qLower = query.toLowerCase().trim();
    return items.sort((a, b) => {
      const nameA = String(a[nameField] || '').toLowerCase();
      const nameB = String(b[nameField] || '').toLowerCase();

      const exactA = nameA === qLower ? 0 : 1;
      const exactB = nameB === qLower ? 0 : 1;
      if (exactA !== exactB) return exactA - exactB;

      const startsA = nameA.startsWith(qLower) ? 0 : 1;
      const startsB = nameB.startsWith(qLower) ? 0 : 1;
      if (startsA !== startsB) return startsA - startsB;

      return nameA.localeCompare(nameB);
    });
  }

  async searchAll(companyId, queryStr) {
    const q = queryStr.trim();
    if (!q) {
      return { customers: [], leads: [], deals: [], tasks: [], meetings: [] };
    }

    const [customers, leads, deals, tasks, meetings] = await Promise.all([
      prisma.customer.findMany({
        where: {
          companyId,
          deletedAt: null,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { companyName: { contains: q, mode: 'insensitive' } }
          ]
        },
        take: 10,
        select: { id: true, name: true, email: true, companyName: true, status: true }
      }),
      prisma.lead.findMany({
        where: {
          companyId,
          deletedAt: null,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } }
          ]
        },
        take: 10,
        select: { id: true, name: true, email: true, status: true }
      }),
      prisma.deal.findMany({
        where: {
          companyId,
          deletedAt: null,
          title: { contains: q, mode: 'insensitive' }
        },
        take: 10,
        select: { id: true, title: true, stage: true, value: true }
      }),
      prisma.task.findMany({
        where: {
          companyId,
          deletedAt: null,
          title: { contains: q, mode: 'insensitive' }
        },
        take: 10,
        select: { id: true, title: true, status: true, priority: true }
      }),
      prisma.meeting.findMany({
        where: {
          companyId,
          title: { contains: q, mode: 'insensitive' }
        },
        take: 10,
        select: { id: true, title: true, date: true, status: true }
      })
    ]);

    return {
      customers: this.rankResults(customers, q, 'name'),
      leads: this.rankResults(leads, q, 'name'),
      deals: this.rankResults(deals, q, 'title'),
      tasks: this.rankResults(tasks, q, 'title'),
      meetings: this.rankResults(meetings, q, 'title')
    };
  }
}

module.exports = new SearchRepository();
