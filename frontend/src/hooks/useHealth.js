import { useState, useEffect, useCallback } from 'react';
import { fetchHealth } from '../services/api';

export function useHealth(pollIntervalMs = 10000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchHealth();
      setData(result);
      setError(null);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reach API');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    if (!pollIntervalMs) return;

    const timer = setInterval(() => {
      checkHealth();
    }, pollIntervalMs);

    return () => clearInterval(timer);
  }, [checkHealth, pollIntervalMs]);

  return {
    data,
    loading,
    error,
    lastChecked,
    refetch: checkHealth
  };
}
