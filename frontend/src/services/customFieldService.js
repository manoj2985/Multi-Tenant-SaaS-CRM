import api from './api';

export async function getCustomFields(entityType = '') {
  const response = await api.get(`/api/custom-fields${entityType ? `?entityType=${entityType}` : ''}`);
  return response.data;
}

export async function createCustomField(data) {
  const response = await api.post('/api/custom-fields', data);
  return response.data;
}

export async function updateCustomField(id, data) {
  const response = await api.put(`/api/custom-fields/${id}`, data);
  return response.data;
}

export async function deleteCustomField(id) {
  const response = await api.delete(`/api/custom-fields/${id}`);
  return response.data;
}
