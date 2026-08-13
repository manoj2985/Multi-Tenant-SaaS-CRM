import api from './api';

export const uploadFile = async (formData) => {
  const res = await api.post('/api/files', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
};

export const getFiles = async (entityType, entityId) => {
  const res = await api.get('/api/files', {
    params: { entityType, entityId }
  });
  return res.data;
};

export const downloadFile = async (fileId, fileName) => {
  const response = await api.get(`/api/files/${fileId}/download`, {
    responseType: 'blob'
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName || `file-${fileId}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const deleteFile = async (fileId) => {
  const res = await api.delete(`/api/files/${fileId}`);
  return res.data;
};
