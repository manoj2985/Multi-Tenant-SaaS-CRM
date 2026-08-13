import api from './api';

export async function previewImport(entityType, fileContent) {
  const response = await api.post('/api/import/preview', { entityType, fileContent });
  return response.data;
}

export async function processImport(entityType, fileName, fileContent) {
  const response = await api.post('/api/import', { entityType, fileName, fileContent });
  return response.data;
}

export async function getImportJobStatus(id) {
  const response = await api.get(`/api/import/status/${id}`);
  return response.data;
}

export async function exportCsv(entityType) {
  const response = await api.get(`/api/export?entityType=${entityType}`, {
    responseType: 'blob'
  });
  return response;
}
