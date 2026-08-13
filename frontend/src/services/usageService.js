import api from './api';

export const getUsage = async () => {
  const res = await api.get('/api/subscription/usage');
  return res.data;
};
