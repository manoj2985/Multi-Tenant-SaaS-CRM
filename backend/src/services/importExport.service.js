const { prisma } = require('../config/db');
const ApiError = require('../utils/apiError');
const customFieldService = require('./customField.service');
const eventBus = require('../events/eventBus');

class ImportExportService {
  parseCsv(content) {
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) return { headers: [], rows: [] };

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] !== undefined ? values[idx] : '';
      });
      rows.push(row);
    }

    return { headers, rows };
  }

  async previewImport(companyId, entityType, fileContent) {
    const { headers, rows } = this.parseCsv(fileContent);
    const customFields = await customFieldService.getCustomFields(companyId, entityType);
    const customFieldNames = customFields.map(f => f.name);

    let validRows = 0;
    let invalidRows = 0;
    const warnings = [];

    rows.forEach((row, idx) => {
      let isRowValid = true;
      if (entityType === 'CUSTOMER' && !row.name) isRowValid = false;
      if (entityType === 'LEAD' && !row.name) isRowValid = false;
      if (entityType === 'DEAL' && (!row.title || !row.customerId)) isRowValid = false;

      if (isRowValid) {
        validRows++;
      } else {
        invalidRows++;
        warnings.push(`Row ${idx + 2}: Required core fields missing`);
      }
    });

    return {
      totalRows: rows.length,
      validRows,
      invalidRows,
      detectedColumns: headers,
      customFieldsDetected: headers.filter(h => customFieldNames.includes(h)),
      warnings,
      sampleRows: rows.slice(0, 5)
    };
  }

  async processImport(companyId, userId, entityType, fileName, fileContent) {
    const { rows } = this.parseCsv(fileContent);
    const customFields = await customFieldService.getCustomFields(companyId, entityType);

    const importJob = await prisma.importJob.create({
      data: {
        companyId,
        userId,
        entityType,
        fileName,
        status: 'PROCESSING',
        totalRows: rows.length
      }
    });

    let successCount = 0;
    let failCount = 0;

    for (const row of rows) {
      try {
        const customData = {};
        customFields.forEach(f => {
          if (row[f.name] !== undefined) customData[f.name] = row[f.name];
        });

        if (entityType === 'CUSTOMER') {
          if (!row.name) throw new Error('Name required');
          const cust = await prisma.customer.create({
            data: {
              companyId,
              name: row.name,
              email: row.email || null,
              phone: row.phone || null,
              companyName: row.companyName || null,
              industry: row.industry || null,
              customFields: Object.keys(customData).length > 0 ? customData : undefined
            }
          });
          eventBus.publish('RECORD_CREATED', { companyId, entityType: 'CUSTOMER', entityId: cust.id, payload: cust });
        } else if (entityType === 'LEAD') {
          if (!row.name) throw new Error('Name required');
          const lead = await prisma.lead.create({
            data: {
              companyId,
              name: row.name,
              email: row.email || null,
              phone: row.phone || null,
              notes: row.notes || null,
              customFields: Object.keys(customData).length > 0 ? customData : undefined
            }
          });
          eventBus.publish('LEAD_CREATED', { companyId, entityType: 'LEAD', entityId: lead.id, payload: lead });
        }
        successCount++;
      } catch {
        failCount++;
      }
    }

    return await prisma.importJob.update({
      where: { id: importJob.id },
      data: {
        status: 'COMPLETED',
        processedRows: rows.length,
        successfulRows: successCount,
        failedRows: failCount,
        completedAt: new Date()
      }
    });
  }

  async getImportJobStatus(companyId, jobId) {
    const job = await prisma.importJob.findFirst({
      where: { id: jobId, companyId }
    });
    if (!job) throw new ApiError(404, 'Import job not found', true, null, 'NOT_FOUND');
    return job;
  }

  async exportToCsv(companyId, entityType) {
    let data = [];
    let fields = [];

    if (entityType === 'CUSTOMER') {
      data = await prisma.customer.findMany({ where: { companyId, deletedAt: null } });
      fields = ['id', 'name', 'email', 'phone', 'companyName', 'industry', 'status', 'createdAt'];
    } else if (entityType === 'LEAD') {
      data = await prisma.lead.findMany({ where: { companyId, deletedAt: null } });
      fields = ['id', 'name', 'email', 'phone', 'source', 'status', 'priority', 'createdAt'];
    } else if (entityType === 'DEAL') {
      data = await prisma.deal.findMany({ where: { companyId, deletedAt: null } });
      fields = ['id', 'title', 'value', 'currency', 'stage', 'probability', 'createdAt'];
    } else if (entityType === 'TASK') {
      data = await prisma.task.findMany({ where: { companyId, deletedAt: null } });
      fields = ['id', 'title', 'priority', 'status', 'dueDate', 'createdAt'];
    } else {
      throw new ApiError(400, 'Invalid entityType for CSV export', true, null, 'INVALID_ENTITY_TYPE');
    }

    const csvLines = [fields.join(',')];
    data.forEach(row => {
      const line = fields.map(f => `"${String(row[f] !== undefined && row[f] !== null ? row[f] : '').replace(/"/g, '""')}"`).join(',');
      csvLines.push(line);
    });

    return csvLines.join('\n');
  }
}

module.exports = new ImportExportService();
