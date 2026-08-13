import api from './api';

export const getMeetings = async (params = {}) => {
  const response = await api.get('/meetings', { params });
  return response.data;
};

export const createMeeting = async (data) => {
  const response = await api.post('/meetings', data);
  return response.data;
};

export const deleteMeeting = async (id) => {
  const response = await api.delete(`/meetings/${id}`);
  return response.data;
};
