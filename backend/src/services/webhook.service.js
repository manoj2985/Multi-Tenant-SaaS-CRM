const crypto = require('crypto');
const axios = require('axios');
const { prisma } = require('../config/db');
const logger = require('../utils/logger');
const ApiError = require('../utils/apiError');
const eventBus = require('../events/eventBus');

class WebhookService {
  constructor() {
    this.listenToEvents();
  }

  listenToEvents() {
    eventBus.on('*', async (eventData) => {
      try {
        const { event, companyId, entityType, entityId, payload } = eventData;
        if (!companyId) return;

        await this.triggerOutboundWebhook(companyId, event, {
          event,
          entityType,
          entityId,
          timestamp: new Date().toISOString(),
          data: payload || {}
        });
      } catch (err) {
        logger.error({ error: err.message }, 'Webhook event listener error');
      }
    });
  }

  async createWebhook(companyId, userId, dto) {
    const secret = dto.secret || `whsec_${crypto.randomBytes(24).toString('hex')}`;
    return await prisma.webhook.create({
      data: {
        companyId,
        createdById: userId,
        name: dto.name,
        url: dto.url,
        secret,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        events: dto.events || []
      }
    });
  }

  async getWebhooks(companyId) {
    return await prisma.webhook.findMany({
      where: { companyId },
      include: {
        deliveries: { orderBy: { createdAt: 'desc' }, take: 5 }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getWebhookById(companyId, id) {
    const wh = await prisma.webhook.findFirst({
      where: { id, companyId },
      include: { deliveries: { orderBy: { createdAt: 'desc' }, take: 20 } }
    });

    if (!wh) throw new ApiError(404, 'Webhook not found', true, null, 'NOT_FOUND');
    return wh;
  }

  async toggleWebhook(companyId, id) {
    const wh = await this.getWebhookById(companyId, id);
    return await prisma.webhook.update({
      where: { id: wh.id },
      data: { isActive: !wh.isActive }
    });
  }

  async deleteWebhook(companyId, id) {
    const wh = await this.getWebhookById(companyId, id);
    await prisma.webhook.delete({ where: { id: wh.id } });
    return { success: true, message: 'Webhook deleted' };
  }

  async triggerOutboundWebhook(companyId, event, payloadData) {
    const activeWebhooks = await prisma.webhook.findMany({
      where: { companyId, isActive: true }
    });

    const matchingWebhooks = activeWebhooks.filter(w => {
      const subscribedEvents = Array.isArray(w.events) ? w.events : [];
      return subscribedEvents.includes(event) || subscribedEvents.includes('*');
    });

    for (const webhook of matchingWebhooks) {
      await this.dispatchWebhookPayload(webhook, event, payloadData);
    }
  }

  async dispatchWebhookPayload(webhook, event, payloadData) {
    const jsonPayload = JSON.stringify(payloadData);
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(jsonPayload)
      .digest('hex');

    const delivery = await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event,
        status: 'PENDING',
        payload: payloadData
      }
    });

    try {
      const response = await axios.post(webhook.url, jsonPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-CRM-Signature': signature,
          'X-CRM-Event': event
        },
        timeout: 5000
      });

      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'SUCCESS',
          responseStatus: response.status,
          completedAt: new Date()
        }
      });
    } catch (err) {
      logger.warn({ webhookId: webhook.id, url: webhook.url, error: err.message }, 'Webhook dispatch failed');
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'FAILED',
          responseStatus: err.response?.status || 500,
          error: err.message,
          completedAt: new Date()
        }
      });
    }
  }
}

module.exports = new WebhookService();
