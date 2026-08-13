const { prisma } = require('../config/db');

class DashboardRepository {
  /**
   * Helper to build date range filter condition
   */
  buildDateFilter(from, to, field = 'createdAt') {
    if (!from && !to) return {};
    const dateFilter = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) {
      const endOfDay = new Date(to);
      endOfDay.setHours(23, 59, 59, 999);
      dateFilter.lte = endOfDay;
    }
    return { [field]: dateFilter };
  }

  async getKpis({ companyId, from, to, employeeId }) {
    const dateFilter = this.buildDateFilter(from, to);
    const employeeFilter = employeeId ? { assignedToId: employeeId } : {};

    const [
      customersCount,
      leadsCount,
      activeDealsAgg,
      wonDealsAgg,
      lostDealsAgg,
      totalDealsAgg,
      openTasksCount,
      overdueTasksCount,
      upcomingMeetingsCount
    ] = await Promise.all([
      prisma.customer.count({
        where: { companyId, deletedAt: null, ...dateFilter, ...employeeFilter }
      }),
      prisma.lead.count({
        where: { companyId, deletedAt: null, ...dateFilter, ...employeeFilter }
      }),
      prisma.deal.aggregate({
        where: { companyId, deletedAt: null, stage: { notIn: ['WON', 'LOST'] }, ...dateFilter, ...employeeFilter },
        _count: { _all: true },
        _sum: { value: true }
      }),
      prisma.deal.aggregate({
        where: { companyId, deletedAt: null, stage: 'WON', ...dateFilter, ...employeeFilter },
        _count: { _all: true },
        _sum: { value: true }
      }),
      prisma.deal.aggregate({
        where: { companyId, deletedAt: null, stage: 'LOST', ...dateFilter, ...employeeFilter },
        _count: { _all: true },
        _sum: { value: true }
      }),
      prisma.deal.aggregate({
        where: { companyId, deletedAt: null, ...dateFilter, ...employeeFilter },
        _sum: { value: true }
      }),
      prisma.task.count({
        where: { companyId, deletedAt: null, status: { in: ['TODO', 'IN_PROGRESS'] }, ...dateFilter, ...employeeFilter }
      }),
      prisma.task.count({
        where: {
          companyId,
          deletedAt: null,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
          dueDate: { lt: new Date() },
          ...employeeFilter
        }
      }),
      prisma.meeting.count({
        where: {
          companyId,
          status: 'SCHEDULED',
          date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          ...employeeFilter
        }
      })
    ]);

    return {
      customers: customersCount,
      leads: leadsCount,
      activeDeals: activeDealsAgg._count._all || 0,
      wonDeals: wonDealsAgg._count._all || 0,
      lostDeals: lostDealsAgg._count._all || 0,
      totalDealValue: totalDealsAgg._sum.value || 0,
      wonDealValue: wonDealsAgg._sum.value || 0,
      openTasks: openTasksCount,
      overdueTasks: overdueTasksCount,
      upcomingMeetings: upcomingMeetingsCount
    };
  }

  async getPipelineAnalytics({ companyId, from, to, employeeId }) {
    const dateFilter = this.buildDateFilter(from, to);
    const employeeFilter = employeeId ? { assignedToId: employeeId } : {};

    const stageGroups = await prisma.deal.groupBy({
      by: ['stage'],
      where: {
        companyId,
        deletedAt: null,
        ...dateFilter,
        ...employeeFilter
      },
      _count: { _all: true },
      _sum: { value: true }
    });

    const stages = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
    const result = {};

    stages.forEach((stage) => {
      const match = stageGroups.find(g => g.stage === stage);
      const count = match ? match._count._all : 0;
      const value = match ? (match._sum.value || 0) : 0;
      const averageValue = count > 0 ? Math.round((value / count) * 100) / 100 : 0;

      result[stage] = {
        count,
        value,
        averageValue
      };
    });

    return result;
  }

  async getLeadAnalytics({ companyId, from, to, employeeId }) {
    const dateFilter = this.buildDateFilter(from, to);
    const employeeFilter = employeeId ? { assignedToId: employeeId } : {};

    const [statusGroups, sourceGroups, priorityGroups] = await Promise.all([
      prisma.lead.groupBy({
        by: ['status'],
        where: { companyId, deletedAt: null, ...dateFilter, ...employeeFilter },
        _count: { _all: true }
      }),
      prisma.lead.groupBy({
        by: ['source'],
        where: { companyId, deletedAt: null, ...dateFilter, ...employeeFilter },
        _count: { _all: true }
      }),
      prisma.lead.groupBy({
        by: ['priority'],
        where: { companyId, deletedAt: null, ...dateFilter, ...employeeFilter },
        _count: { _all: true }
      })
    ]);

    const byStatus = {};
    ['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATION', 'WON', 'LOST'].forEach((s) => {
      const match = statusGroups.find(g => g.status === s);
      byStatus[s] = match ? match._count._all : 0;
    });

    const bySource = {};
    ['WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'EMAIL', 'PHONE', 'ADVERTISEMENT', 'OTHER'].forEach((src) => {
      const match = sourceGroups.find(g => g.source === src);
      bySource[src] = match ? match._count._all : 0;
    });

    const byPriority = {};
    ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].forEach((p) => {
      const match = priorityGroups.find(g => g.priority === p);
      byPriority[p] = match ? match._count._all : 0;
    });

    return {
      byStatus,
      bySource,
      byPriority
    };
  }

  async getDealAnalytics({ companyId, startDate, endDate, employeeId }) {
    const dateFilter = { createdAt: { gte: startDate, lte: endDate } };
    const employeeFilter = employeeId ? { assignedToId: employeeId } : {};

    const [createdCount, wonAgg, lostCount, totalValueAgg, deals] = await Promise.all([
      prisma.deal.count({
        where: { companyId, deletedAt: null, ...dateFilter, ...employeeFilter }
      }),
      prisma.deal.aggregate({
        where: { companyId, deletedAt: null, stage: 'WON', ...dateFilter, ...employeeFilter },
        _count: { _all: true },
        _sum: { value: true }
      }),
      prisma.deal.count({
        where: { companyId, deletedAt: null, stage: 'LOST', ...dateFilter, ...employeeFilter }
      }),
      prisma.deal.aggregate({
        where: { companyId, deletedAt: null, ...dateFilter, ...employeeFilter },
        _sum: { value: true }
      }),
      prisma.deal.findMany({
        where: { companyId, deletedAt: null, ...dateFilter, ...employeeFilter },
        select: {
          id: true,
          stage: true,
          value: true,
          createdAt: true
        }
      })
    ]);

    const dealsWon = wonAgg._count._all || 0;
    const dealsLost = lostCount;
    const wonRevenue = wonAgg._sum.value || 0;
    const totalPipelineValue = totalValueAgg._sum.value || 0;
    const totalFinished = dealsWon + dealsLost;
    const winRate = totalFinished > 0 ? Math.round((dealsWon / totalFinished) * 1000) / 10 : 0;
    const averageDealValue = createdCount > 0 ? Math.round((totalPipelineValue / createdCount) * 100) / 100 : 0;

    // Build time series grouped by day YYYY-MM-DD
    const timeMap = {};
    let curr = new Date(startDate);
    while (curr <= endDate) {
      const dateStr = curr.toISOString().split('T')[0];
      timeMap[dateStr] = { date: dateStr, dealsCreated: 0, dealsWon: 0, revenue: 0 };
      curr.setDate(curr.getDate() + 1);
    }

    deals.forEach((d) => {
      const dateStr = new Date(d.createdAt).toISOString().split('T')[0];
      if (timeMap[dateStr]) {
        timeMap[dateStr].dealsCreated += 1;
        if (d.stage === 'WON') {
          timeMap[dateStr].dealsWon += 1;
          timeMap[dateStr].revenue += (d.value || 0);
        }
      }
    });

    return {
      dealsCreated: createdCount,
      dealsWon,
      dealsLost,
      winRate,
      totalPipelineValue,
      wonRevenue,
      averageDealValue,
      timeSeries: Object.values(timeMap)
    };
  }

  async getSalesPerformance({ companyId, from, to }) {
    const dateFilter = this.buildDateFilter(from, to);

    const employees = await prisma.user.findMany({
      where: { companyId, status: 'ACTIVE' },
      select: { id: true, name: true, email: true, role: true }
    });

    const performance = await Promise.all(
      employees.map(async (emp) => {
        const [leadsAssigned, leadsConverted, dealsAssigned, wonAgg, lostCount] = await Promise.all([
          prisma.lead.count({
            where: { companyId, assignedToId: emp.id, deletedAt: null, ...dateFilter }
          }),
          prisma.lead.count({
            where: { companyId, assignedToId: emp.id, status: 'WON', deletedAt: null, ...dateFilter }
          }),
          prisma.deal.count({
            where: { companyId, assignedToId: emp.id, deletedAt: null, ...dateFilter }
          }),
          prisma.deal.aggregate({
            where: { companyId, assignedToId: emp.id, stage: 'WON', deletedAt: null, ...dateFilter },
            _count: { _all: true },
            _sum: { value: true }
          }),
          prisma.deal.count({
            where: { companyId, assignedToId: emp.id, stage: 'LOST', deletedAt: null, ...dateFilter }
          })
        ]);

        const dealsWon = wonAgg._count._all || 0;
        const wonRevenue = wonAgg._sum.value || 0;
        const totalFinished = dealsWon + lostCount;
        const winRate = totalFinished > 0 ? Math.round((dealsWon / totalFinished) * 1000) / 10 : 0;

        return {
          employeeId: emp.id,
          employeeName: emp.name,
          email: emp.email,
          role: emp.role,
          leadsAssigned,
          leadsConverted,
          dealsAssigned,
          dealsWon,
          wonRevenue,
          winRate
        };
      })
    );

    return performance;
  }

  async getTaskAnalytics({ companyId, from, to, employeeId }) {
    const dateFilter = this.buildDateFilter(from, to);
    const employeeFilter = employeeId ? { assignedToId: employeeId } : {};

    const [statusGroups, priorityGroups, overdueCount, employeeGroups] = await Promise.all([
      prisma.task.groupBy({
        by: ['status'],
        where: { companyId, deletedAt: null, ...dateFilter, ...employeeFilter },
        _count: { _all: true }
      }),
      prisma.task.groupBy({
        by: ['priority'],
        where: { companyId, deletedAt: null, ...dateFilter, ...employeeFilter },
        _count: { _all: true }
      }),
      prisma.task.count({
        where: {
          companyId,
          deletedAt: null,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
          dueDate: { lt: new Date() },
          ...employeeFilter
        }
      }),
      prisma.task.groupBy({
        by: ['assignedToId'],
        where: { companyId, deletedAt: null, assignedToId: { not: null }, ...dateFilter },
        _count: { _all: true }
      })
    ]);

    const statusMap = {};
    let totalTasks = 0;
    ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].forEach((s) => {
      const match = statusGroups.find(g => g.status === s);
      const count = match ? match._count._all : 0;
      statusMap[s] = count;
      totalTasks += count;
    });

    const priorityMap = {};
    ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].forEach((p) => {
      const match = priorityGroups.find(g => g.priority === p);
      priorityMap[p] = match ? match._count._all : 0;
    });

    return {
      totalTasks,
      completed: statusMap.COMPLETED || 0,
      pending: statusMap.TODO || 0,
      inProgress: statusMap.IN_PROGRESS || 0,
      cancelled: statusMap.CANCELLED || 0,
      overdue: overdueCount,
      tasksByPriority: priorityMap
    };
  }

  async getMeetingAnalytics({ companyId, from, to, employeeId }) {
    const dateFilter = this.buildDateFilter(from, to, 'date');
    const employeeFilter = employeeId ? { createdById: employeeId } : {};

    const [statusGroups, upcomingCount] = await Promise.all([
      prisma.meeting.groupBy({
        by: ['status'],
        where: { companyId, ...dateFilter, ...employeeFilter },
        _count: { _all: true }
      }),
      prisma.meeting.count({
        where: {
          companyId,
          status: 'SCHEDULED',
          date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          ...employeeFilter
        }
      })
    ]);

    let totalMeetings = 0;
    const statusMap = {};
    ['SCHEDULED', 'COMPLETED', 'CANCELLED'].forEach((s) => {
      const match = statusGroups.find(g => g.status === s);
      const count = match ? match._count._all : 0;
      statusMap[s] = count;
      totalMeetings += count;
    });

    return {
      totalMeetings,
      scheduled: statusMap.SCHEDULED || 0,
      completed: statusMap.COMPLETED || 0,
      cancelled: statusMap.CANCELLED || 0,
      upcomingMeetings: upcomingCount
    };
  }
}

module.exports = new DashboardRepository();
