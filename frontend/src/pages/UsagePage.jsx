import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsage } from '../services/usageService';

const UsagePage = () => {
  const navigate = useNavigate();
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        setLoading(true);
        const res = await getUsage();
        if (res.success) {
          setUsageData(res.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load tenant usage metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchUsageData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '32px', color: '#94a3b8', textAlign: 'center' }}>
        Loading tenant usage metrics...
      </div>
    );
  }

  const { plan, metrics = {}, limits = {}, warningBanners = [] } = usageData || {};

  const renderMetricCard = (label, current, limit, unit = '') => {
    const isUnlimited = limit === -1 || limit === 'Unlimited';
    const percent = isUnlimited ? 0 : Math.min(100, Math.round((current / limit) * 100));
    const isHigh = percent >= 80;

    return (
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>{label}</span>
          <span style={{ fontSize: '0.85rem', color: isHigh ? '#f87171' : '#38bdf8', fontWeight: 600 }}>
            {current} {unit} / {isUnlimited ? '∞ Unlimited' : `${limit} ${unit}`}
          </span>
        </div>

        {!isUnlimited && (
          <div style={{ width: '100%', height: '8px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden', marginTop: '10px' }}>
            <div
              style={{
                width: `${percent}%`,
                height: '100%',
                background: isHigh ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #3b82f6, #38bdf8)',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto', color: '#f8fafc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '1.8rem', color: '#f8fafc', fontWeight: 700 }}>
            📊 Tenant Resource Usage & Quotas
          </h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>
            Real-time consumption tracking against your <strong>{plan}</strong> plan limits.
          </p>
        </div>

        <button
          onClick={() => navigate('/settings/subscription')}
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Manage Plan & Upgrade
        </button>
      </div>

      {error && (
        <div style={{ padding: '14px 18px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '10px', color: '#fca5a5', fontSize: '0.9rem', marginBottom: '24px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Warning Banners */}
      {warningBanners.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {warningBanners.map((warn, idx) => (
            <div
              key={idx}
              style={{
                padding: '14px 18px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid #f59e0b',
                borderRadius: '10px',
                color: '#fde047',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <div>{warn.message}</div>
            </div>
          ))}
        </div>
      )}

      {/* Usage Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
        {renderMetricCard('Users Quota', metrics.usersCount || 0, limits.maxUsers)}
        {renderMetricCard('Customers Limit', metrics.customersCount || 0, limits.maxCustomers)}
        {renderMetricCard('Leads Limit', metrics.leadsCount || 0, limits.maxLeads)}
        {renderMetricCard('Deals Limit', metrics.dealsCount || 0, limits.maxDeals)}
        {renderMetricCard('Tasks Tracked', metrics.tasksCount || 0, -1)}
        {renderMetricCard('Storage Consumption', Math.round((metrics.storageBytes || 0) / (1024 * 1024)), limits.maxStorageMB, 'MB')}
      </div>
    </div>
  );
};

export default UsagePage;
