const { prisma } = require('../config/db');
const ApiError = require('../utils/apiError');

class TagService {
  async createTag(companyId, dto) {
    const existing = await prisma.tag.findFirst({
      where: { companyId, name: dto.name }
    });

    if (existing) return existing;

    return await prisma.tag.create({
      data: {
        companyId,
        name: dto.name,
        color: dto.color || '#3b82f6'
      }
    });
  }

  async getTags(companyId) {
    return await prisma.tag.findMany({
      where: { companyId },
      orderBy: { name: 'asc' }
    });
  }

  async deleteTag(companyId, tagId) {
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, companyId }
    });

    if (!tag) throw new ApiError(404, 'Tag not found', true, null, 'NOT_FOUND');

    await prisma.tag.delete({ where: { id: tagId } });
    return { success: true, message: 'Tag deleted' };
  }

  async assignTag(companyId, dto) {
    const tag = await prisma.tag.findFirst({
      where: { id: dto.tagId, companyId }
    });

    if (!tag) throw new ApiError(404, 'Tag not found', true, null, 'NOT_FOUND');

    const existing = await prisma.entityTag.findFirst({
      where: { tagId: dto.tagId, entityType: dto.entityType, entityId: dto.entityId }
    });

    if (existing) return existing;

    return await prisma.entityTag.create({
      data: {
        tagId: dto.tagId,
        entityType: dto.entityType,
        entityId: dto.entityId
      }
    });
  }

  async removeTag(companyId, dto) {
    const tag = await prisma.tag.findFirst({
      where: { id: dto.tagId, companyId }
    });

    if (!tag) throw new ApiError(404, 'Tag not found', true, null, 'NOT_FOUND');

    await prisma.entityTag.deleteMany({
      where: { tagId: dto.tagId, entityType: dto.entityType, entityId: dto.entityId }
    });

    return { success: true, message: 'Tag removed from entity' };
  }
}

module.exports = new TagService();
