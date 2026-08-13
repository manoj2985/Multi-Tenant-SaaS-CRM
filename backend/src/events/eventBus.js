const EventEmitter = require('events');
const logger = require('../utils/logger');

class CRMEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }

  publish(event, data) {
    if (!event || !data || !data.companyId) {
      logger.warn({ event }, 'Attempted to publish invalid event without companyId');
      return;
    }
    logger.info({ event, companyId: data.companyId, entityType: data.entityType, entityId: data.entityId }, `Domain Event Published: ${event}`);
    this.emit(event, data);
    this.emit('*', { event, ...data });
  }
}

const eventBus = new CRMEventBus();
module.exports = eventBus;
