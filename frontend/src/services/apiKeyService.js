import api from './api';

export async function getApiKeys() {
  const response = await api.get('/api/api-keys');
  return response.data;
}

export async function createApiKey(data) {
  const response = await api.post('/api/api-keys', data);
  return response.data;
}

export async function revokeApiKey(id) {
  const response = await api.delete(`/api/api-keys/${id}`);
  return response.data;
}

export async function getApiKeyUsage(id) {
  const response = await api.get(`/api/api-keys/${id}/usage`);
  return response.data;
}
