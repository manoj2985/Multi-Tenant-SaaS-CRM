import api from './api';

export const getDeals = async (params = {}) => {
  const response = await api.get('/deals', { params });
  return response.data;
};

export const getPipeline = async (params = {}) => {
  const response = await api.get('/deals/pipeline', { params });
  return response.data;
};

export const createDeal = async (data) => {
  const response = await api.post('/deals', data);
  return response.data;
};

export const updateDealStage = async (id, stage) => {
  const response = await api.patch(`/deals/${id}/stage`, { stage });
  return response.data;
};

export const deleteDeal = async (id) => {
  const response = await api.delete(`/deals/${id}`);
  return response.data;
};
