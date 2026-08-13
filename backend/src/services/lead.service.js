const { prisma } = require('../config/db');
const leadRepository = require('../repositories/lead.repository');
const customerRepository = require('../repositories/customer.repository');
const dealRepository = require('../repositories/deal.repository');
const userRepository = require('../repositories/user.repository');
const ApiError = require('../utils/apiError');

class LeadService {
  async createLead(requestingUser, dto) {
    if (dto.assignedToId) {
      const assignedUser = await userRepository.findByIdAndCompany(dto.assignedToId, requestingUser.companyId);
      if (!assignedUser) {
        throw new ApiError(400, 'Assigned user does not exist in this tenant company', true, '', 'TENANT_ACCESS_DENIED');
      }
    }

    const leadData = {
      companyId: requestingUser.companyId,
      name: dto.name,
      email: dto.email || null,
      phone: dto.phone || null,
      source: dto.source || 'OTHER',
      status: dto.status || 'NEW',
      priority: dto.priority || 'MEDIUM',
      assignedToId: dto.assignedToId || null,
      notes: dto.notes || null
    };

    const lead = await leadRepository.create(leadData);

    const notificationService = require('./notification.service');
    if (dto.assignedToId) {
      await notificationService.createNotification({
        companyId: requestingUser.companyId,
        userId: dto.assignedToId,
        type: 'LEAD_ASSIGNED',
        title: 'New Lead Assigned',
        message: `You have been assigned a new lead: "${lead.name}"`,
        entityType: 'Lead',
        entityId: lead.id
      });
    }

    return {
      success: true,
      message: 'Lead created successfully',
      data: lead
    };
  }

  async getLeads(requestingUser, query) {
    const { page, limit, search, status, priority, source, assignedTo, sortBy, sortOrder } = query;
    const result = await leadRepository.findManyWithPagination({
      companyId: requestingUser.companyId,
      page,
      limit,
      search,
      status,
      priority,
      source,
      assignedTo,
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

  async getLeadById(requestingUser, leadId) {
    const lead = await leadRepository.findByIdAndCompany(leadId, requestingUser.companyId);
    if (!lead) {
      throw new ApiError(404, 'Lead not found or access denied', true, '', 'NOT_FOUND');
    }

    return {
      success: true,
      data: lead
    };
  }

  async updateLead(requestingUser, leadId, dto) {
    const existing = await leadRepository.findByIdAndCompany(leadId, requestingUser.companyId);
    if (!existing) {
      throw new ApiError(404, 'Lead not found or access denied', true, '', 'NOT_FOUND');
    }

    if (dto.assignedToId) {
      const assignedUser = await userRepository.findByIdAndCompany(dto.assignedToId, requestingUser.companyId);
      if (!assignedUser) {
        throw new ApiError(400, 'Assigned user does not exist in this tenant company', true, '', 'TENANT_ACCESS_DENIED');
      }
    }

    await leadRepository.update(leadId, requestingUser.companyId, dto);
    const updated = await leadRepository.findByIdAndCompany(leadId, requestingUser.companyId);

    return {
      success: true,
      message: 'Lead updated successfully',
      data: updated
    };
  }

  async updateLeadStatus(requestingUser, leadId, status) {
    const existing = await leadRepository.findByIdAndCompany(leadId, requestingUser.companyId);
    if (!existing) {
      throw new ApiError(404, 'Lead not found or access denied', true, '', 'NOT_FOUND');
    }

    await leadRepository.updateStatus(leadId, requestingUser.companyId, status);
    const updated = await leadRepository.findByIdAndCompany(leadId, requestingUser.companyId);

    return {
      success: true,
      message: `Lead status updated to ${status}`,
      data: updated
    };
  }

  async assignLead(requestingUser, leadId, targetUserId) {
    const existing = await leadRepository.findByIdAndCompany(leadId, requestingUser.companyId);
    if (!existing) {
      throw new ApiError(404, 'Lead not found or access denied', true, '', 'NOT_FOUND');
    }

    const targetUser = await userRepository.findByIdAndCompany(targetUserId, requestingUser.companyId);
    if (!targetUser) {
      throw new ApiError(400, 'Target assigned user does not exist in this tenant company', true, '', 'TENANT_ACCESS_DENIED');
    }

    await leadRepository.assignUser(leadId, requestingUser.companyId, targetUserId);
    const updated = await leadRepository.findByIdAndCompany(leadId, requestingUser.companyId);

    const notificationService = require('./notification.service');
    await notificationService.createNotification({
      companyId: requestingUser.companyId,
      userId: targetUserId,
      type: 'LEAD_ASSIGNED',
      title: 'Lead Assigned',
      message: `Lead "${existing.name}" has been assigned to you`,
      entityType: 'Lead',
      entityId: leadId
    });

    return {
      success: true,
      message: `Lead assigned to ${targetUser.name}`,
      data: updated
    };
  }

  /**
   * Atomic Lead Conversion to Customer & Deal
   */
  async convertLead(requestingUser, leadId, options) {
    const lead = await leadRepository.findByIdAndCompany(leadId, requestingUser.companyId);
    if (!lead) {
      throw new ApiError(404, 'Lead not found or access denied', true, '', 'NOT_FOUND');
    }

    if (lead.status === 'WON') {
      throw new ApiError(400, 'Lead has already been converted', true, '', 'ALREADY_CONVERTED');
    }

    const { createCustomer = true, createDeal = false, dealTitle, dealValue = 0 } = options;

    const result = await prisma.$transaction(async (tx) => {
      let customer = null;
      let deal = null;

      if (createCustomer) {
        customer = await customerRepository.create({
          companyId: requestingUser.companyId,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          status: 'ACTIVE',
          assignedToId: lead.assignedToId
        }, tx);
      }

      if (createDeal) {
        if (!customer) {
          throw new ApiError(400, 'A customer must be created or exist to generate a deal', true, '', 'CUSTOMER_REQUIRED');
        }

        deal = await dealRepository.create({
          companyId: requestingUser.companyId,
          customerId: customer.id,
          title: dealTitle || `${lead.name} Deal`,
          value: Number(dealValue) || 0,
          stage: 'QUALIFIED',
          assignedToId: lead.assignedToId
        }, tx);
      }

      // Update lead status to WON
      await leadRepository.updateStatus(leadId, requestingUser.companyId, 'WON', tx);

      return { customer, deal };
    });

    return {
      success: true,
      message: 'Lead converted successfully',
      data: {
        customer: result.customer,
        deal: result.deal
      }
    };
  }

  async deleteLead(requestingUser, leadId) {
    if (requestingUser.role === 'SALES_EXECUTIVE') {
      throw new ApiError(403, 'Sales executives cannot delete leads', true, '', 'FORBIDDEN');
    }

    const existing = await leadRepository.findByIdAndCompany(leadId, requestingUser.companyId);
    if (!existing) {
      throw new ApiError(404, 'Lead not found or access denied', true, '', 'NOT_FOUND');
    }

    await leadRepository.softDelete(leadId, requestingUser.companyId);

    return {
      success: true,
      message: 'Lead deleted successfully'
    };
  }
}

module.exports = new LeadService();
