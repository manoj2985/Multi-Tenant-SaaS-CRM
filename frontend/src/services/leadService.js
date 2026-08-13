import api from './api';

export const getLeads = async (params = {}) => {
  const response = await api.get('/leads', { params });
  return response.data;
};

export const createLead = async (data) => {
  const response = await api.post('/leads', data);
  return response.data;
};

export const updateLeadStatus = async (id, status) => {
  const response = await api.patch(`/leads/${id}/status`, { status });
  return response.data;
};

export const convertLead = async (id, data) => {
  const response = await api.post(`/leads/${id}/convert`, data);
  return response.data;
};

export const deleteLead = async (id) => {
  const response = await api.delete(`/leads/${id}`);
  return response.data;
};
