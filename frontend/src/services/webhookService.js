import api from './api';

export async function getWebhooks() {
  const response = await api.get('/api/webhooks');
  return response.data;
}

export async function getWebhookById(id) {
  const response = await api.get(`/api/webhooks/${id}`);
  return response.data;
}

export async function createWebhook(data) {
  const response = await api.post('/api/webhooks', data);
  return response.data;
}

export async function toggleWebhook(id) {
  const response = await api.patch(`/api/webhooks/${id}/toggle`);
  return response.data;
}

export async function deleteWebhook(id) {
  const response = await api.delete(`/api/webhooks/${id}`);
  return response.data;
}
