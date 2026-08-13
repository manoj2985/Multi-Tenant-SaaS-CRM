const { prisma } = require('../config/db');
const ApiError = require('../utils/apiError');

class CustomFieldService {
  async createCustomField(companyId, userId, dto) {
    const existing = await prisma.customFieldDefinition.findFirst({
      where: { companyId, entityType: dto.entityType, name: dto.name }
    });

    if (existing) {
      throw new ApiError(400, `Custom field '${dto.name}' already exists for ${dto.entityType}`, true, null, 'DUPLICATE_CUSTOM_FIELD');
    }

    return await prisma.customFieldDefinition.create({
      data: {
        companyId,
        createdById: userId,
        entityType: dto.entityType,
        name: dto.name,
        label: dto.label,
        fieldType: dto.fieldType || 'TEXT',
        isRequired: dto.isRequired || false,
        options: dto.options || null,
        defaultValue: dto.defaultValue || null
      }
    });
  }

  async getCustomFields(companyId, entityType = null) {
    const where = { companyId };
    if (entityType) where.entityType = entityType;

    return await prisma.customFieldDefinition.findMany({
      where,
      orderBy: { createdAt: 'asc' }
    });
  }

  async updateCustomField(companyId, id, dto) {
    const field = await prisma.customFieldDefinition.findFirst({
      where: { id, companyId }
    });

    if (!field) {
      throw new ApiError(404, 'Custom field definition not found', true, null, 'NOT_FOUND');
    }

    return await prisma.customFieldDefinition.update({
      where: { id },
      data: {
        label: dto.label !== undefined ? dto.label : field.label,
        isRequired: dto.isRequired !== undefined ? dto.isRequired : field.isRequired,
        options: dto.options !== undefined ? dto.options : field.options,
        defaultValue: dto.defaultValue !== undefined ? dto.defaultValue : field.defaultValue
      }
    });
  }

  async deleteCustomField(companyId, id) {
    const field = await prisma.customFieldDefinition.findFirst({
      where: { id, companyId }
    });

    if (!field) {
      throw new ApiError(404, 'Custom field definition not found', true, null, 'NOT_FOUND');
    }

    await prisma.customFieldDefinition.delete({ where: { id } });
    return { success: true, message: 'Custom field definition deleted' };
  }

  async validateAndSanitizeCustomFields(companyId, entityType, customFieldsData) {
    if (!customFieldsData || typeof customFieldsData !== 'object') return {};

    const definitions = await this.getCustomFields(companyId, entityType);
    const sanitized = {};

    for (const def of definitions) {
      const val = customFieldsData[def.name];

      if (def.isRequired && (val === undefined || val === null || val === '')) {
        throw new ApiError(400, `Required custom field '${def.label}' is missing`, true, null, 'CUSTOM_FIELD_REQUIRED');
      }

      if (val !== undefined && val !== null) {
        if (def.fieldType === 'NUMBER' && isNaN(Number(val))) {
          throw new ApiError(400, `Custom field '${def.label}' must be a number`, true, null, 'INVALID_CUSTOM_FIELD_TYPE');
        }
        if (def.fieldType === 'BOOLEAN' && typeof val !== 'boolean') {
          sanitized[def.name] = Boolean(val);
        } else {
          sanitized[def.name] = val;
        }
      }
    }

    return sanitized;
  }
}

module.exports = new CustomFieldService();
