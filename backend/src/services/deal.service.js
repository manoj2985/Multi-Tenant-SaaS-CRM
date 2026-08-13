const dealRepository = require('../repositories/deal.repository');
const customerRepository = require('../repositories/customer.repository');
const userRepository = require('../repositories/user.repository');
const ApiError = require('../utils/apiError');

class DealService {
  async createDeal(requestingUser, dto) {
    // CRITICAL: Verify Customer belongs to the current tenant
    const customer = await customerRepository.findByIdAndCompany(dto.customerId, requestingUser.companyId);
    if (!customer) {
      throw new ApiError(403, 'Customer does not exist or belongs to another tenant', true, '', 'TENANT_ACCESS_DENIED');
    }

    if (dto.assignedToId) {
      const assignedUser = await userRepository.findByIdAndCompany(dto.assignedToId, requestingUser.companyId);
      if (!assignedUser) {
        throw new ApiError(400, 'Assigned user does not exist in this tenant company', true, '', 'TENANT_ACCESS_DENIED');
      }
    }

    const dealData = {
      companyId: requestingUser.companyId,
      customerId: dto.customerId,
      title: dto.title,
      value: Number(dto.value) || 0,
      currency: dto.currency || 'USD',
      stage: dto.stage || 'LEAD',
      probability: Number(dto.probability) || 50,
      expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : null,
      assignedToId: dto.assignedToId || null
    };

    const deal = await dealRepository.create(dealData);

    const notificationService = require('./notification.service');
    if (dto.assignedToId) {
      await notificationService.createNotification({
        companyId: requestingUser.companyId,
        userId: dto.assignedToId,
        type: 'DEAL_ASSIGNED',
        title: 'New Deal Assigned',
        message: `You have been assigned a new deal: "${deal.title}"`,
        entityType: 'Deal',
        entityId: deal.id
      });
    }

    return {
      success: true,
      message: 'Deal created successfully',
      data: deal
    };
  }

  async getDeals(requestingUser, query) {
    const { page, limit, search, stage, assignedTo, customerId, sortBy, sortOrder } = query;
    const result = await dealRepository.findManyWithPagination({
      companyId: requestingUser.companyId,
      page,
      limit,
      search,
      stage,
      assignedTo,
      customerId,
      sortBy,
      sortOrder
    });

    const totalPages = Math.ceil(result.total / limit) || 0;

    return {
      success: true,
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages
      }
    };
  }

  async getPipeline(requestingUser, query) {
    const { assignedTo, customerId } = query;
    const pipeline = await dealRepository.getPipelineData({
      companyId: requestingUser.companyId,
      assignedTo,
      customerId
    });

    return {
      success: true,
      data: pipeline
    };
  }

  async getDealById(requestingUser, dealId) {
    const deal = await dealRepository.findByIdAndCompany(dealId, requestingUser.companyId);
    if (!deal) {
      throw new ApiError(404, 'Deal not found or access denied', true, '', 'NOT_FOUND');
    }

    return {
      success: true,
      data: deal
    };
  }

  async updateDeal(requestingUser, dealId, dto) {
    const existing = await dealRepository.findByIdAndCompany(dealId, requestingUser.companyId);
    if (!existing) {
      throw new ApiError(404, 'Deal not found or access denied', true, '', 'NOT_FOUND');
    }

    if (dto.assignedToId) {
      const assignedUser = await userRepository.findByIdAndCompany(dto.assignedToId, requestingUser.companyId);
      if (!assignedUser) {
        throw new ApiError(400, 'Assigned user does not exist in this tenant company', true, '', 'TENANT_ACCESS_DENIED');
      }
    }

    await dealRepository.update(dealId, requestingUser.companyId, {
      ...dto,
      ...(dto.expectedCloseDate && { expectedCloseDate: new Date(dto.expectedCloseDate) })
    });

    const updated = await dealRepository.findByIdAndCompany(dealId, requestingUser.companyId);

    return {
      success: true,
      message: 'Deal updated successfully',
      data: updated
    };
  }

  async updateDealStage(requestingUser, dealId, stage) {
    const existing = await dealRepository.findByIdAndCompany(dealId, requestingUser.companyId);
    if (!existing) {
      throw new ApiError(404, 'Deal not found or access denied', true, '', 'NOT_FOUND');
    }

    await dealRepository.updateStage(dealId, requestingUser.companyId, stage);
    const updated = await dealRepository.findByIdAndCompany(dealId, requestingUser.companyId);

    const notificationService = require('./notification.service');
    if (updated.assignedToId) {
      await notificationService.createNotification({
        companyId: requestingUser.companyId,
        userId: updated.assignedToId,
        type: 'DEAL_STAGE_CHANGED',
        title: 'Deal Stage Changed',
        message: `Deal "${updated.title}" moved to ${stage}`,
        entityType: 'Deal',
        entityId: dealId
      });
    }

    return {
      success: true,
      message: `Deal stage changed to ${stage}`,
      data: updated
    };
  }

  async assignDeal(requestingUser, dealId, targetUserId) {
    const existing = await dealRepository.findByIdAndCompany(dealId, requestingUser.companyId);
    if (!existing) {
      throw new ApiError(404, 'Deal not found or access denied', true, '', 'NOT_FOUND');
    }

    const targetUser = await userRepository.findByIdAndCompany(targetUserId, requestingUser.companyId);
    if (!targetUser) {
      throw new ApiError(400, 'Target assigned user does not exist in this tenant company', true, '', 'TENANT_ACCESS_DENIED');
    }

    await dealRepository.assignUser(dealId, requestingUser.companyId, targetUserId);
    const updated = await dealRepository.findByIdAndCompany(dealId, requestingUser.companyId);

    const notificationService = require('./notification.service');
    await notificationService.createNotification({
      companyId: requestingUser.companyId,
      userId: targetUserId,
      type: 'DEAL_ASSIGNED',
      title: 'Deal Assigned',
      message: `Deal "${existing.title}" has been assigned to you`,
      entityType: 'Deal',
      entityId: dealId
    });

    return {
      success: true,
      message: `Deal assigned to ${targetUser.name}`,
      data: updated
    };
  }

  async deleteDeal(requestingUser, dealId) {
    if (requestingUser.role === 'SALES_EXECUTIVE') {
      throw new ApiError(403, 'Sales executives cannot delete deals', true, '', 'FORBIDDEN');
    }

    const existing = await dealRepository.findByIdAndCompany(dealId, requestingUser.companyId);
    if (!existing) {
      throw new ApiError(404, 'Deal not found or access denied', true, '', 'NOT_FOUND');
    }

    await dealRepository.softDelete(dealId, requestingUser.companyId);

    return {
      success: true,
      message: 'Deal deleted successfully'
    };
  }
}

module.exports = new DealService();
