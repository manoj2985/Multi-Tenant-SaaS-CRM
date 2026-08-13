import api from './api';

export async function getWorkflows() {
  const response = await api.get('/api/workflows');
  return response.data;
}

export async function getWorkflowById(id) {
  const response = await api.get(`/api/workflows/${id}`);
  return response.data;
}

export async function createWorkflow(data) {
  const response = await api.post('/api/workflows', data);
  return response.data;
}

export async function toggleWorkflow(id) {
  const response = await api.patch(`/api/workflows/${id}/toggle`);
  return response.data;
}

export async function deleteWorkflow(id) {
  const response = await api.delete(`/api/workflows/${id}`);
  return response.data;
}
