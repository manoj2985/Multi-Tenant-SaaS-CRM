const meetingRepository = require('../repositories/meeting.repository');
const customerRepository = require('../repositories/customer.repository');
const activityService = require('./activity.service');
const auditService = require('./audit.service');
const ApiError = require('../utils/apiError');

class MeetingService {
  async createMeeting(requestingUser, dto, req = null) {
    // Verify customer exists in current tenant
    const customer = await customerRepository.findByIdAndCompany(dto.customerId, requestingUser.companyId);
    if (!customer) {
      throw new ApiError(403, 'Customer does not exist or belongs to another tenant', true, '', 'TENANT_ACCESS_DENIED');
    }

    // Meeting Conflict Detection
    const conflict = await meetingRepository.findOverlappingMeeting({
      companyId: requestingUser.companyId,
      createdById: requestingUser.id,
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime
    });

    if (conflict) {
      throw new ApiError(409, 'Meeting conflicts with an existing scheduled meeting', true, '', 'MEETING_CONFLICT');
    }

    const meetingData = {
      companyId: requestingUser.companyId,
      customerId: dto.customerId,
      createdById: requestingUser.id,
      title: dto.title,
      date: new Date(`${dto.date}T00:00:00.000Z`),
      startTime: dto.startTime,
      endTime: dto.endTime,
      location: dto.location || null,
      meetingLink: dto.meetingLink || null,
      notes: dto.notes || null,
      status: dto.status || 'SCHEDULED'
    };

    const meeting = await meetingRepository.create(meetingData);

    // Record Customer Activity Timeline Event
    await activityService.logCustomerActivity({
      companyId: requestingUser.companyId,
      userId: requestingUser.id,
      customerId: dto.customerId,
      action: 'MEETING_SCHEDULED',
      description: `Scheduled meeting "${meeting.title}" on ${dto.date} (${dto.startTime} - ${dto.endTime})`
    });

    // Record Audit Log Entry
    await auditService.logAudit({
      companyId: requestingUser.companyId,
      userId: requestingUser.id,
      action: 'MEETING_CREATED',
      entityType: 'Meeting',
      entityId: meeting.id,
      description: `Scheduled meeting "${meeting.title}" with ${customer.name}`,
      req
    });

    return {
      success: true,
      message: 'Meeting scheduled successfully',
      data: meeting
    };
  }

  async getMeetings(requestingUser, query) {
    const { page = 0, limit = 10, search, status, customerId, date, from, to, sortBy, sortOrder } = query;
    const result = await meetingRepository.findManyWithPagination({
      companyId: requestingUser.companyId,
      page: Number(page),
      limit: Number(limit),
      search,
      status,
      customerId,
      date,
      from,
      to,
      sortBy,
      sortOrder
    });

    const totalPages = Math.ceil(result.total / limit) || 0;

    return {
      success: true,
      data: result.data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: result.total,
        totalPages
      }
    };
  }

  async getMeetingById(requestingUser, meetingId) {
    const meeting = await meetingRepository.findByIdAndCompany(meetingId, requestingUser.companyId);
    if (!meeting) {
      throw new ApiError(404, 'Meeting not found or access denied', true, '', 'NOT_FOUND');
    }

    return {
      success: true,
      data: meeting
    };
  }

  async updateMeeting(requestingUser, meetingId, dto, req = null) {
    const existing = await meetingRepository.findByIdAndCompany(meetingId, requestingUser.companyId);
    if (!existing) {
      throw new ApiError(404, 'Meeting not found or access denied', true, '', 'NOT_FOUND');
    }

    const dateToUse = dto.date || existing.date.toISOString().split('T')[0];
    const startToUse = dto.startTime || existing.startTime;
    const endToUse = dto.endTime || existing.endTime;

    // Check conflict if date/time changed
    if (dto.date || dto.startTime || dto.endTime) {
      const conflict = await meetingRepository.findOverlappingMeeting({
        companyId: requestingUser.companyId,
        createdById: requestingUser.id,
        date: dateToUse,
        startTime: startToUse,
        endTime: endToUse,
        excludeMeetingId: meetingId
      });

      if (conflict) {
        throw new ApiError(409, 'Meeting conflicts with an existing scheduled meeting', true, '', 'MEETING_CONFLICT');
      }
    }

    await meetingRepository.update(meetingId, requestingUser.companyId, {
      ...dto,
      ...(dto.date && { date: new Date(`${dto.date}T00:00:00.000Z`) })
    });

    const updated = await meetingRepository.findByIdAndCompany(meetingId, requestingUser.companyId);

    return {
      success: true,
      message: 'Meeting updated successfully',
      data: updated
    };
  }

  async updateMeetingStatus(requestingUser, meetingId, status, req = null) {
    const existing = await meetingRepository.findByIdAndCompany(meetingId, requestingUser.companyId);
    if (!existing) {
      throw new ApiError(404, 'Meeting not found or access denied', true, '', 'NOT_FOUND');
    }

    await meetingRepository.updateStatus(meetingId, requestingUser.companyId, status);
    const updated = await meetingRepository.findByIdAndCompany(meetingId, requestingUser.companyId);

    // Record activity timeline if completed or cancelled
    await activityService.logCustomerActivity({
      companyId: requestingUser.companyId,
      userId: requestingUser.id,
      customerId: existing.customerId,
      action: status === 'COMPLETED' ? 'MEETING_COMPLETED' : 'MEETING_CANCELLED',
      description: `Meeting "${existing.title}" status set to ${status}`
    });

    return {
      success: true,
      message: `Meeting status updated to ${status}`,
      data: updated
    };
  }

  async deleteMeeting(requestingUser, meetingId, req = null) {
    const existing = await meetingRepository.findByIdAndCompany(meetingId, requestingUser.companyId);
    if (!existing) {
      throw new ApiError(404, 'Meeting not found or access denied', true, '', 'NOT_FOUND');
    }

    await meetingRepository.delete(meetingId, requestingUser.companyId);

    return {
      success: true,
      message: 'Meeting deleted successfully'
    };
  }
}

module.exports = new MeetingService();
