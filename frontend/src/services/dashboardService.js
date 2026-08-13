import api from './api';

export const getDashboardKpis = async (params = {}) => {
  const response = await api.get('/dashboard', { params });
  return response.data;
};

export const getPipelineAnalytics = async (params = {}) => {
  const response = await api.get('/dashboard/pipeline', { params });
  return response.data;
};

export const getLeadAnalytics = async (params = {}) => {
  const response = await api.get('/dashboard/leads', { params });
  return response.data;
};

export const getDealAnalytics = async (params = {}) => {
  const response = await api.get('/dashboard/deals', { params });
  return response.data;
};

export const getSalesPerformance = async (params = {}) => {
  const response = await api.get('/dashboard/sales-performance', { params });
  return response.data;
};

export const getTaskAnalytics = async (params = {}) => {
  const response = await api.get('/dashboard/tasks', { params });
  return response.data;
};

export const getMeetingAnalytics = async (params = {}) => {
  const response = await api.get('/dashboard/meetings', { params });
  return response.data;
};
