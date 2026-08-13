import api from './api';

export const getSubscription = async () => {
  const res = await api.get('/api/subscription');
  return res.data;
};

export const getPlans = async () => {
  const res = await api.get('/api/subscription/plans');
  return res.data;
};

export const changePlan = async (plan) => {
  const res = await api.post('/api/subscription/change-plan', { plan });
  return res.data;
};
