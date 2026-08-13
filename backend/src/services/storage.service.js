const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);

class StorageService {
  constructor() {
    this.baseUploadDir = path.join(process.cwd(), 'uploads');
  }

  /**
   * Ensures storage directory exists for tenant
   */
  async ensureTenantDir(companyId) {
    const dirPath = path.join(this.baseUploadDir, 'company', companyId);
    if (!fs.existsSync(dirPath)) {
      await mkdirAsync(dirPath, { recursive: true });
    }
    return dirPath;
  }

  /**
   * Save uploaded file buffer to local tenant filesystem
   */
  async saveFile({ companyId, storageKey, fileBuffer }) {
    const dirPath = await this.ensureTenantDir(companyId);
    const filePath = path.join(dirPath, storageKey);
    await writeFileAsync(filePath, fileBuffer);
    return filePath;
  }

  /**
   * Return absolute file path for streaming download
   */
  async getFilePath({ companyId, storageKey }) {
    const filePath = path.join(this.baseUploadDir, 'company', companyId, storageKey);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return filePath;
  }

  /**
   * Delete physical file from storage
   */
  async deleteFile({ companyId, storageKey }) {
    const filePath = path.join(this.baseUploadDir, 'company', companyId, storageKey);
    if (fs.existsSync(filePath)) {
      await unlinkAsync(filePath);
    }
    return true;
  }
}

module.exports = new StorageService();
