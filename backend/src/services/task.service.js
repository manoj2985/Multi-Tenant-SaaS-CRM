const taskRepository = require('../repositories/task.repository');
const userRepository = require('../repositories/user.repository');
const activityService = require('./activity.service');
const auditService = require('./audit.service');
const ApiError = require('../utils/apiError');

class TaskService {
  async createTask(requestingUser, dto, req = null) {
    if (dto.assignedToId) {
      const assignedUser = await userRepository.findByIdAndCompany(dto.assignedToId, requestingUser.companyId);
      if (!assignedUser) {
        throw new ApiError(400, 'Assigned user does not exist in this tenant company', true, '', 'TENANT_ACCESS_DENIED');
      }
    }

    const taskData = {
      companyId: requestingUser.companyId,
      createdById: requestingUser.id,
      title: dto.title,
      description: dto.description || null,
      assignedToId: dto.assignedToId || null,
      priority: dto.priority || 'MEDIUM',
      status: dto.status || 'TODO',
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null
    };

    const task = await taskRepository.create(taskData);

    const notificationService = require('./notification.service');
    if (dto.assignedToId) {
      await notificationService.createNotification({
        companyId: requestingUser.companyId,
        userId: dto.assignedToId,
        type: 'TASK_ASSIGNED',
        title: 'New Task Assigned',
        message: `You have been assigned a new task: "${task.title}"`,
        entityType: 'Task',
        entityId: task.id
      });
    }

    await auditService.logAudit({
      companyId: requestingUser.companyId,
      userId: requestingUser.id || requestingUser.userId,
      action: 'TASK_CREATED',
      entityType: 'Task',
      entityId: task.id,
      description: `Created task "${task.title}"`,
      req
    });

    return {
      success: true,
      message: 'Task created successfully',
      data: task
    };
  }

  async getTasks(requestingUser, query) {
    const { page, limit, search, status, priority, assignedTo, dueDate, sortBy, sortOrder } = query;
    const result = await taskRepository.findManyWithPagination({
      companyId: requestingUser.companyId,
      page,
      limit,
      search,
      status,
      priority,
      assignedTo,
      dueDate,
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

  async getTaskById(requestingUser, taskId) {
    const task = await taskRepository.findByIdAndCompany(taskId, requestingUser.companyId);
    if (!task) {
      throw new ApiError(404, 'Task not found or access denied', true, '', 'NOT_FOUND');
    }

    return {
      success: true,
      data: task
    };
  }

  async updateTask(requestingUser, taskId, dto, req = null) {
    const existing = await taskRepository.findByIdAndCompany(taskId, requestingUser.companyId);
    if (!existing) {
      throw new ApiError(404, 'Task not found or access denied', true, '', 'NOT_FOUND');
    }

    if (dto.assignedToId) {
      const assignedUser = await userRepository.findByIdAndCompany(dto.assignedToId, requestingUser.companyId);
      if (!assignedUser) {
        throw new ApiError(400, 'Assigned user does not exist in this tenant company', true, '', 'TENANT_ACCESS_DENIED');
      }
    }

    await taskRepository.update(taskId, requestingUser.companyId, {
      ...dto,
      ...(dto.dueDate && { dueDate: new Date(dto.dueDate) })
    });

    const updated = await taskRepository.findByIdAndCompany(taskId, requestingUser.companyId);

    await auditService.logAudit({
      companyId: requestingUser.companyId,
      userId: requestingUser.id,
      action: 'TASK_UPDATED',
      entityType: 'Task',
      entityId: taskId,
      description: `Updated task "${updated.title}"`,
      req
    });

    return {
      success: true,
      message: 'Task updated successfully',
      data: updated
    };
  }

  async updateTaskStatus(requestingUser, taskId, status, req = null) {
    const existing = await taskRepository.findByIdAndCompany(taskId, requestingUser.companyId);
    if (!existing) {
      throw new ApiError(404, 'Task not found or access denied', true, '', 'NOT_FOUND');
    }

    await taskRepository.updateStatus(taskId, requestingUser.companyId, status);
    const updated = await taskRepository.findByIdAndCompany(taskId, requestingUser.companyId);

    await auditService.logAudit({
      companyId: requestingUser.companyId,
      userId: requestingUser.id,
      action: status === 'COMPLETED' ? 'TASK_COMPLETED' : 'TASK_STATUS_CHANGED',
      entityType: 'Task',
      entityId: taskId,
      description: `Changed task status to ${status}`,
      req
    });

    return {
      success: true,
      message: `Task status updated to ${status}`,
      data: updated
    };
  }

  async assignTask(requestingUser, taskId, targetUserId, req = null) {
    const existing = await taskRepository.findByIdAndCompany(taskId, requestingUser.companyId);
    if (!existing) {
      throw new ApiError(404, 'Task not found or access denied', true, '', 'NOT_FOUND');
    }

    const targetUser = await userRepository.findByIdAndCompany(targetUserId, requestingUser.companyId);
    if (!targetUser) {
      throw new ApiError(400, 'Target assigned user does not exist in this tenant company', true, '', 'TENANT_ACCESS_DENIED');
    }

    await taskRepository.assignUser(taskId, requestingUser.companyId, targetUserId);
    const updated = await taskRepository.findByIdAndCompany(taskId, requestingUser.companyId);

    const notificationService = require('./notification.service');
    await notificationService.createNotification({
      companyId: requestingUser.companyId,
      userId: targetUserId,
      type: 'TASK_ASSIGNED',
      title: 'Task Assigned',
      message: `Task "${existing.title}" has been assigned to you`,
      entityType: 'Task',
      entityId: taskId
    });

    await auditService.logAudit({
      companyId: requestingUser.companyId,
      userId: requestingUser.id || requestingUser.userId,
      action: 'TASK_ASSIGNED',
      entityType: 'Task',
      entityId: taskId,
      description: `Assigned task to ${targetUser.name}`,
      req
    });

    return {
      success: true,
      message: `Task assigned to ${targetUser.name}`,
      data: updated
    };
  }

  async deleteTask(requestingUser, taskId, req = null) {
    if (requestingUser.role === 'SALES_EXECUTIVE') {
      throw new ApiError(403, 'Sales executives cannot delete tasks', true, '', 'FORBIDDEN');
    }

    const existing = await taskRepository.findByIdAndCompany(taskId, requestingUser.companyId);
    if (!existing) {
      throw new ApiError(404, 'Task not found or access denied', true, '', 'NOT_FOUND');
    }

    await taskRepository.softDelete(taskId, requestingUser.companyId);

    await auditService.logAudit({
      companyId: requestingUser.companyId,
      userId: requestingUser.id,
      action: 'TASK_DELETED',
      entityType: 'Task',
      entityId: taskId,
      description: `Soft deleted task "${existing.title}"`,
      req
    });

    return {
      success: true,
      message: 'Task deleted successfully'
    };
  }
}

module.exports = new TaskService();
