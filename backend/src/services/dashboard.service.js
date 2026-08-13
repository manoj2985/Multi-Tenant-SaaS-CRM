const dashboardRepository = require('../repositories/dashboard.repository');

class DashboardService {
  /**
   * Calculate start and end date from period string or custom range
   */
  resolveDateRange(period, from, to) {
    if (from || to) {
      return {
        startDate: from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: to ? new Date(to) : new Date()
      };
    }

    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case '30d':
      default:
        startDate.setDate(endDate.getDate() - 30);
        break;
    }

    return { startDate, endDate };
  }

  async getKpis(requestingUser, query) {
    const { from, to, employeeId } = query;
    const companyId = requestingUser.companyId;

    // Scoping for SALES_EXECUTIVE if employeeId is not explicitly set
    let scopedEmployeeId = employeeId;
    if (requestingUser.role === 'SALES_EXECUTIVE' && !employeeId) {
      scopedEmployeeId = requestingUser.id || requestingUser.userId;
    }

    const kpis = await dashboardRepository.getKpis({
      companyId,
      from,
      to,
      employeeId: scopedEmployeeId
    });

    return {
      success: true,
      data: kpis
    };
  }

  async getPipeline(requestingUser, query) {
    const { from, to, employeeId } = query;
    const companyId = requestingUser.companyId;

    const pipeline = await dashboardRepository.getPipelineAnalytics({
      companyId,
      from,
      to,
      employeeId
    });

    return {
      success: true,
      data: pipeline
    };
  }

  async getLeads(requestingUser, query) {
    const { from, to, employeeId } = query;
    const companyId = requestingUser.companyId;

    const leadAnalytics = await dashboardRepository.getLeadAnalytics({
      companyId,
      from,
      to,
      employeeId
    });

    return {
      success: true,
      data: leadAnalytics
    };
  }

  async getDeals(requestingUser, query) {
    const { period, from, to, employeeId } = query;
    const companyId = requestingUser.companyId;
    const { startDate, endDate } = this.resolveDateRange(period, from, to);

    const dealAnalytics = await dashboardRepository.getDealAnalytics({
      companyId,
      startDate,
      endDate,
      employeeId
    });

    return {
      success: true,
      data: dealAnalytics
    };
  }

  async getSalesPerformance(requestingUser, query) {
    const { from, to } = query;
    const companyId = requestingUser.companyId;

    const performance = await dashboardRepository.getSalesPerformance({
      companyId,
      from,
      to
    });

    return {
      success: true,
      data: performance
    };
  }

  async getTasks(requestingUser, query) {
    const { from, to, employeeId } = query;
    const companyId = requestingUser.companyId;

    const taskAnalytics = await dashboardRepository.getTaskAnalytics({
      companyId,
      from,
      to,
      employeeId
    });

    return {
      success: true,
      data: taskAnalytics
    };
  }

  async getMeetings(requestingUser, query) {
    const { from, to, employeeId } = query;
    const companyId = requestingUser.companyId;

    const meetingAnalytics = await dashboardRepository.getMeetingAnalytics({
      companyId,
      from,
      to,
      employeeId
    });

    return {
      success: true,
      data: meetingAnalytics
    };
  }
}

module.exports = new DashboardService();
