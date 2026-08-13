const { prisma } = require('../config/db');
const ApiError = require('../utils/apiError');

class AdvancedSearchService {
  buildCondition(filter) {
    const { field, operator, value } = filter;

    switch (operator) {
      case 'EQUALS':
        return { [field]: value };
      case 'NOT_EQUALS':
        return { [field]: { not: value } };
      case 'CONTAINS':
        return { [field]: { contains: value, mode: 'insensitive' } };
      case 'STARTS_WITH':
        return { [field]: { startsWith: value, mode: 'insensitive' } };
      case 'ENDS_WITH':
        return { [field]: { endsWith: value, mode: 'insensitive' } };
      case 'GREATER_THAN':
        return { [field]: { gt: Number(value) || value } };
      case 'LESS_THAN':
        return { [field]: { lt: Number(value) || value } };
      case 'GREATER_THAN_OR_EQUAL':
        return { [field]: { gte: Number(value) || value } };
      case 'LESS_THAN_OR_EQUAL':
        return { [field]: { lte: Number(value) || value } };
      default:
        return { [field]: value };
    }
  }

  async search(companyId, dto) {
    const { entityType, filters = [], logic = 'AND', page = 0, limit = 20 } = dto;

    const allowedEntities = ['CUSTOMER', 'LEAD', 'DEAL', 'TASK', 'MEETING'];
    if (!allowedEntities.includes(entityType)) {
      throw new ApiError(400, 'Invalid entityType for advanced search', true, null, 'INVALID_ENTITY_TYPE');
    }

    const compiledConditions = filters.map(f => this.buildCondition(f));

    const where = {
      companyId,
      ...(entityType !== 'MEETING' && { deletedAt: null })
    };

    if (compiledConditions.length > 0) {
      if (logic === 'OR') {
        where.OR = compiledConditions;
      } else {
        where.AND = compiledConditions;
      }
    }

    const skip = page * limit;
    const modelKey = entityType.toLowerCase() + 's';

    const [data, total] = await Promise.all([
      prisma[entityType.toLowerCase()].findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma[entityType.toLowerCase()].count({ where })
    ]);

    return {
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Saved Filters CRUD
  async createSavedFilter(companyId, userId, dto) {
    return await prisma.savedFilter.create({
      data: {
        companyId,
        userId,
        name: dto.name,
        entityType: dto.entityType,
        filterDefinition: dto.filterDefinition || {}
      }
    });
  }

  async getSavedFilters(companyId, userId) {
    return await prisma.savedFilter.findMany({
      where: { companyId, userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async deleteSavedFilter(companyId, userId, id) {
    const filter = await prisma.savedFilter.findFirst({
      where: { id, companyId, userId }
    });

    if (!filter) throw new ApiError(404, 'Saved filter not found', true, null, 'NOT_FOUND');

    await prisma.savedFilter.delete({ where: { id } });
    return { success: true, message: 'Saved filter deleted' };
  }
}

module.exports = new AdvancedSearchService();
