import api from './api';

export const getCustomerActivities = async (customerId) => {
  const response = await api.get(`/activities/customer/${customerId}`);
  return response.data;
};
