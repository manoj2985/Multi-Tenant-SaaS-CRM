const fileService = require('../services/file.service');
const ApiError = require('../utils/apiError');
const fs = require('fs');

const uploadFile = async (req, res, next) => {
  try {
    const result = await fileService.uploadFile(req.user, req.file, req.body);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const getFiles = async (req, res, next) => {
  try {
    const result = await fileService.listFiles(req.user, req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getFileById = async (req, res, next) => {
  try {
    const result = await fileService.getFileById(req.user, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const downloadFile = async (req, res, next) => {
  try {
    const { file, filePath } = await fileService.getFileStream(req.user, req.params.id);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);

    const filestream = fs.createReadStream(filePath);
    return filestream.pipe(res);
  } catch (error) {
    next(error);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    const result = await fileService.deleteFile(req.user, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadFile,
  getFiles,
  getFileById,
  downloadFile,
  deleteFile
};
