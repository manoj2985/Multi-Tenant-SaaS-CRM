import api from './api';

export const getCompanies = async (params) => {
  const res = await api.get('/api/admin/companies', { params });
  return res.data;
};

export const getCompanyDetails = async (companyId) => {
  const res = await api.get(`/api/admin/companies/${companyId}`);
  return res.data;
};

export const updateCompanyStatus = async (companyId, status) => {
  const res = await api.patch(`/api/admin/companies/${companyId}/status`, { status });
  return res.data;
};

export const overrideCompanyPlan = async (companyId, plan) => {
  const res = await api.patch(`/api/admin/companies/${companyId}/plan`, { plan });
  return res.data;
};

export const getPlatformAuditLogs = async (params) => {
  const res = await api.get('/api/admin/audit-logs', { params });
  return res.data;
};
