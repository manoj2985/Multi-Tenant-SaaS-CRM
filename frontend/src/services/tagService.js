import api from './api';

export async function getTags() {
  const response = await api.get('/api/tags');
  return response.data;
}

export async function createTag(data) {
  const response = await api.post('/api/tags', data);
  return response.data;
}

export async function deleteTag(id) {
  const response = await api.delete(`/api/tags/${id}`);
  return response.data;
}

export async function assignTag(tagId, entityType, entityId) {
  const response = await api.post('/api/tags/assign', { tagId, entityType, entityId });
  return response.data;
}

export async function removeTag(tagId, entityType, entityId) {
  const response = await api.post('/api/tags/remove', { tagId, entityType, entityId });
  return response.data;
}
