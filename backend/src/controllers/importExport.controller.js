const importExportService = require('../services/importExport.service');

const previewImport = async (req, res, next) => {
  try {
    const { entityType, fileContent } = req.body;
    const result = await importExportService.previewImport(req.user.companyId, entityType, fileContent);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const processImport = async (req, res, next) => {
  try {
    const { entityType, fileName, fileContent } = req.body;
    const result = await importExportService.processImport(req.user.companyId, req.user.id, entityType, fileName, fileContent);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getImportJobStatus = async (req, res, next) => {
  try {
    const result = await importExportService.getImportJobStatus(req.user.companyId, req.params.id);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const exportCsv = async (req, res, next) => {
  try {
    const { entityType } = req.query;
    const csvContent = await importExportService.exportToCsv(req.user.companyId, entityType);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${entityType.toLowerCase()}_export.csv"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  previewImport,
  processImport,
  getImportJobStatus,
  exportCsv
};
