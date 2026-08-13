const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const fileRepository = require('../repositories/file.repository');
const storageService = require('./storage.service');
const usageService = require('./usage.service');
const { prisma } = require('../config/db');
const ApiError = require('../utils/apiError');

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'text/plain'
];

const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.png', '.jpg', '.jpeg', '.txt'
];

class FileService {
  async validateEntityOwnership(companyId, entityType, entityId) {
    if (!entityType || !entityId) return;

    let entity = null;
    switch (entityType.toUpperCase()) {
      case 'CUSTOMER':
        entity = await prisma.customer.findFirst({ where: { id: entityId, companyId, deletedAt: null } });
        break;
      case 'LEAD':
        entity = await prisma.lead.findFirst({ where: { id: entityId, companyId, deletedAt: null } });
        break;
      case 'DEAL':
        entity = await prisma.deal.findFirst({ where: { id: entityId, companyId, deletedAt: null } });
        break;
      case 'TASK':
        entity = await prisma.task.findFirst({ where: { id: entityId, companyId, deletedAt: null } });
        break;
      case 'MEETING':
        entity = await prisma.meeting.findFirst({ where: { id: entityId, companyId } });
        break;
      default:
        throw new ApiError(400, `Invalid entity type: ${entityType}`, true, '', 'INVALID_ENTITY_TYPE');
    }

    if (!entity) {
      throw new ApiError(404, `Target ${entityType} not found in this company tenant`, true, '', 'TENANT_ACCESS_DENIED');
    }
  }

  async uploadFile(requestingUser, file, dto) {
    if (!file) {
      throw new ApiError(400, 'No file uploaded', true, '', 'FILE_REQUIRED');
    }

    const companyId = requestingUser.companyId;

    // Validate MIME type & File extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype) || !ALLOWED_EXTENSIONS.includes(ext)) {
      throw new ApiError(
        400,
        `File format '${ext}' (${file.mimetype}) is not supported. Allowed formats: PDF, DOC, DOCX, XLS, XLSX, CSV, PNG, JPG, TXT`,
        true,
        '',
        'UNSUPPORTED_FILE_TYPE'
      );
    }

    // Validate plan storage limit
    await usageService.checkLimit(companyId, 'storage', file.size);

    // Validate CRM entity linkage
    if (dto.entityType && dto.entityId) {
      await this.validateEntityOwnership(companyId, dto.entityType, dto.entityId);
    }

    // Unique storage key
    const storageKey = `${Date.now()}-${crypto.randomUUID()}${ext}`;

    // Save file to storage abstraction
    await storageService.saveFile({
      companyId,
      storageKey,
      fileBuffer: file.buffer
    });

    // Create DB record
    const newFile = await fileRepository.create({
      companyId,
      uploadedById: requestingUser.id || requestingUser.userId,
      fileName: file.originalname,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storageKey,
      entityType: dto.entityType ? dto.entityType.toUpperCase() : null,
      entityId: dto.entityId || null
    });

    // Sync usage counter
    await usageService.syncUsage(companyId);

    return {
      success: true,
      message: 'File uploaded successfully',
      data: newFile
    };
  }

  async getFileById(requestingUser, fileId) {
    const file = await fileRepository.findByIdAndCompany(fileId, requestingUser.companyId);
    if (!file) {
      throw new ApiError(404, 'File not found or access denied', true, '', 'NOT_FOUND');
    }
    return {
      success: true,
      data: file
    };
  }

  async getFileStream(requestingUser, fileId) {
    const file = await fileRepository.findByIdAndCompany(fileId, requestingUser.companyId);
    if (!file) {
      throw new ApiError(404, 'File not found or access denied', true, '', 'NOT_FOUND');
    }

    const filePath = await storageService.getFilePath({
      companyId: requestingUser.companyId,
      storageKey: file.storageKey
    });

    if (!filePath) {
      throw new ApiError(404, 'File asset not found on storage server', true, '', 'FILE_NOT_FOUND');
    }

    return {
      file,
      filePath
    };
  }

  async deleteFile(requestingUser, fileId) {
    const file = await fileRepository.findByIdAndCompany(fileId, requestingUser.companyId);
    if (!file) {
      throw new ApiError(404, 'File not found or access denied', true, '', 'NOT_FOUND');
    }

    await fileRepository.softDelete(fileId, requestingUser.companyId);

    // Sync storage usage
    await usageService.syncUsage(requestingUser.companyId);

    return {
      success: true,
      message: 'File deleted successfully'
    };
  }

  async listFiles(requestingUser, query) {
    const { entityType, entityId, page, limit } = query;
    const companyId = requestingUser.companyId;

    const result = await fileRepository.findMany({
      companyId,
      entityType: entityType ? entityType.toUpperCase() : undefined,
      entityId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20
    });

    return {
      success: true,
      ...result
    };
  }
}

module.exports = new FileService();
