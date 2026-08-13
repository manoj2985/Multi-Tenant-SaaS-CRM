const { prisma } = require('../config/db');
const eventBus = require('../events/eventBus');
const logger = require('../utils/logger');
const ApiError = require('../utils/apiError');
const notificationService = require('./notification.service');
const emailService = require('./email.service');

class WorkflowService {
  constructor() {
    this.listenToEvents();
  }

  listenToEvents() {
    eventBus.on('*', async (eventData) => {
      try {
        await this.handleDomainEvent(eventData);
      } catch (err) {
        logger.error({ error: err.message }, 'Workflow event handler error');
      }
    });
  }

  async handleDomainEvent(eventData) {
    const { event, companyId, entityType, entityId, payload } = eventData;
    if (!companyId || !entityType) return;

    // Find active workflows matching trigger and tenant
    const workflows = await prisma.workflow.findMany({
      where: {
        companyId,
        entityType,
        triggerType: event,
        isActive: true
      },
      include: {
        conditions: true,
        actions: { orderBy: { order: 'asc' } }
      }
    });

    for (const workflow of workflows) {
      await this.executeWorkflow(workflow.id, { event, companyId, entityType, entityId, payload });
    }
  }

  evaluateCondition(condition, record) {
    const fieldValue = record[condition.field] !== undefined ? record[condition.field] : (record.customFields ? record.customFields[condition.field] : undefined);
    const targetValue = condition.value;

    switch (condition.operator) {
      case 'EQUALS':
        return String(fieldValue) === String(targetValue);
      case 'NOT_EQUALS':
        return String(fieldValue) !== String(targetValue);
      case 'GREATER_THAN':
        return Number(fieldValue) > Number(targetValue);
      case 'LESS_THAN':
        return Number(fieldValue) < Number(targetValue);
      case 'GREATER_THAN_OR_EQUAL':
        return Number(fieldValue) >= Number(targetValue);
      case 'LESS_THAN_OR_EQUAL':
        return Number(fieldValue) <= Number(targetValue);
      case 'CONTAINS':
        return String(fieldValue || '').toLowerCase().includes(String(targetValue || '').toLowerCase());
      case 'STARTS_WITH':
        return String(fieldValue || '').toLowerCase().startsWith(String(targetValue || '').toLowerCase());
      case 'ENDS_WITH':
        return String(fieldValue || '').toLowerCase().endsWith(String(targetValue || '').toLowerCase());
      case 'IS_EMPTY':
        return fieldValue === null || fieldValue === undefined || fieldValue === '';
      case 'IS_NOT_EMPTY':
        return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
      default:
        return false;
    }
  }

  evaluateAllConditions(conditions, record) {
    if (!conditions || conditions.length === 0) return true;

    let result = true;
    for (let i = 0; i < conditions.length; i++) {
      const cond = conditions[i];
      const match = this.evaluateCondition(cond, record);

      if (i === 0) {
        result = match;
      } else {
        if (cond.logicalOperator === 'OR') {
          result = result || match;
        } else {
          result = result && match;
        }
      }
    }
    return result;
  }

  async executeWorkflow(workflowId, triggerEvent) {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { conditions: true, actions: { orderBy: { order: 'asc' } } }
    });

    if (!workflow || !workflow.isActive) return;

    // Create execution log
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        companyId: workflow.companyId,
        triggerData: triggerEvent,
        status: 'RUNNING'
      }
    });

    try {
      const record = triggerEvent.payload || {};

      // Check Conditions
      const conditionsPassed = this.evaluateAllConditions(workflow.conditions, record);

      if (!conditionsPassed) {
        await prisma.workflowExecution.update({
          where: { id: execution.id },
          data: { status: 'COMPLETED', completedAt: new Date(), error: 'Conditions not satisfied' }
        });
        return;
      }

      // Execute Actions
      for (const action of workflow.actions) {
        await this.executeAction(action, triggerEvent, workflow.companyId);
      }

      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: { status: 'COMPLETED', completedAt: new Date() }
      });
    } catch (err) {
      logger.error({ workflowId, error: err.message }, 'Workflow execution failed');
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: { status: 'FAILED', completedAt: new Date(), error: err.message }
      });
    }
  }

  async executeAction(action, triggerEvent, companyId) {
    const config = action.configuration || {};

    switch (action.actionType) {
      case 'CREATE_TASK':
        await prisma.task.create({
          data: {
            companyId,
            title: config.title || 'Automated Workflow Task',
            description: config.description || `Generated by workflow for ${triggerEvent.entityType}`,
            priority: config.priority || 'HIGH',
            status: 'TODO',
            dueDate: config.dueDateDays ? new Date(Date.now() + config.dueDateDays * 86400000) : new Date(Date.now() + 86400000),
            createdById: config.assignedToId || triggerEvent.payload?.createdById || triggerEvent.payload?.assignedToId,
            assignedToId: config.assignedToId || triggerEvent.payload?.assignedToId
          }
        });
        break;

      case 'CREATE_NOTIFICATION':
        if (config.userId || triggerEvent.payload?.assignedToId) {
          await notificationService.createNotification({
            companyId,
            userId: config.userId || triggerEvent.payload?.assignedToId,
            type: 'SYSTEM_ALERT',
            title: config.title || 'Workflow Trigger Alert',
            message: config.message || `Automated workflow action completed for ${triggerEvent.entityType}`,
            entityType: triggerEvent.entityType,
            entityId: triggerEvent.entityId
          });
        }
        break;

      case 'SEND_EMAIL':
        if (config.to || triggerEvent.payload?.email) {
          await emailService.sendEmail({
            to: config.to || triggerEvent.payload?.email,
            subject: config.subject || 'Automated CRM Notification',
            text: config.message || 'Notification from workflow automation.',
            html: `<p>${config.message || 'Notification from workflow automation.'}</p>`
          });
        }
        break;

      case 'WEBHOOK':
        const webhookService = require('./webhook.service');
        await webhookService.triggerOutboundWebhook(companyId, 'WORKFLOW_ACTION', {
          workflowId: action.workflowId,
          triggerEvent,
          actionConfig: config
        });
        break;

      default:
        logger.info({ actionType: action.actionType }, 'Executed workflow action type');
        break;
    }
  }

  // CRUD for Workflows
  async createWorkflow(companyId, userId, dto) {
    return await prisma.workflow.create({
      data: {
        companyId,
        createdById: userId,
        name: dto.name,
        description: dto.description || null,
        entityType: dto.entityType,
        triggerType: dto.triggerType,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        conditions: {
          create: (dto.conditions || []).map(c => ({
            field: c.field,
            operator: c.operator,
            value: String(c.value || ''),
            logicalOperator: c.logicalOperator || 'AND'
          }))
        },
        actions: {
          create: (dto.actions || []).map((a, index) => ({
            actionType: a.actionType,
            configuration: a.configuration || {},
            order: a.order !== undefined ? a.order : index
          }))
        }
      },
      include: { conditions: true, actions: true }
    });
  }

  async getWorkflows(companyId) {
    return await prisma.workflow.findMany({
      where: { companyId },
      include: {
        conditions: true,
        actions: true,
        executions: { orderBy: { startedAt: 'desc' }, take: 1 }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getWorkflowById(companyId, id) {
    const wf = await prisma.workflow.findFirst({
      where: { id, companyId },
      include: {
        conditions: true,
        actions: true,
        executions: { orderBy: { startedAt: 'desc' }, take: 10 }
      }
    });
    if (!wf) throw new ApiError(404, 'Workflow not found', true, null, 'WORKFLOW_NOT_FOUND');
    return wf;
  }

  async toggleWorkflow(companyId, id) {
    const wf = await this.getWorkflowById(companyId, id);
    return await prisma.workflow.update({
      where: { id: wf.id },
      data: { isActive: !wf.isActive }
    });
  }

  async deleteWorkflow(companyId, id) {
    const wf = await this.getWorkflowById(companyId, id);
    await prisma.workflow.delete({ where: { id: wf.id } });
    return { success: true, message: 'Workflow deleted' };
  }
}

module.exports = new WorkflowService();
