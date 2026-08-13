import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCompanyDetails, updateCompanyStatus, overrideCompanyPlan } from '../services/adminService';

const AdminCompanyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCompanyDetails(id);
      if (res.success) {
        setCompany(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch company details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleStatusToggle = async () => {
    if (!company) return;
    const nextStatus = company.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    if (!window.confirm(`Are you sure you want to change status to ${nextStatus}?`)) return;

    try {
      const res = await updateCompanyStatus(company.id, nextStatus);
      if (res.success) {
        await fetchDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to change status');
    }
  };

  const handlePlanOverride = async (newPlan) => {
    try {
      const res = await overrideCompanyPlan(company.id, newPlan);
      if (res.success) {
        await fetchDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to override plan');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', color: '#94a3b8', textAlign: 'center' }}>
        Loading tenant company details...
      </div>
    );
  }

  if (error || !company) {
    return (
      <div style={{ padding: '32px', color: '#fca5a5', textAlign: 'center' }}>
        ⚠️ {error || 'Company not found'}
      </div>
    );
  }

  const { usage } = company;

  return (
    <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto', color: '#f8fafc' }}>
      <button
        onClick={() => navigate('/admin/companies')}
        style={{
          padding: '8px 14px',
          background: '#1e293b',
          color: '#cbd5e1',
          border: '1px solid #334155',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '20px',
          fontSize: '0.85rem'
        }}
      >
        ← Back to Companies
      </button>

      {/* Header Banner */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '28px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Tenant Profile & Administration
          </div>
          <h1 style={{ margin: '4px 0 0 0', fontSize: '1.8rem', color: '#38bdf8', fontWeight: 700 }}>
            {company.name}
          </h1>
          <div style={{ fontSize: '0.9rem', color: '#cbd5e1', marginTop: '4px' }}>
            ID: <code style={{ color: '#94a3b8' }}>{company.id}</code> • Registered {new Date(company.createdAt).toLocaleDateString()}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            value={company.subscriptionPlan}
            onChange={(e) => handlePlanOverride(e.target.value)}
            style={{
              padding: '8px 12px',
              background: '#0f172a',
              border: '1px solid #38bdf8',
              borderRadius: '8px',
              color: '#38bdf8',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}
          >
            <option value="FREE">FREE PLAN</option>
            <option value="PREMIUM">PREMIUM PLAN</option>
            <option value="ENTERPRISE">ENTERPRISE PLAN</option>
          </select>

          <button
            onClick={handleStatusToggle}
            style={{
              padding: '8px 16px',
              background: company.status === 'SUSPENDED' ? '#16a34a' : '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            {company.status === 'SUSPENDED' ? 'Reactivate Tenant' : 'Suspend Tenant'}
          </button>
        </div>
      </div>

      {/* Usage Cards Grid */}
      <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#f8fafc' }}>
        📊 Real-Time Resource Usage Metrics
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '16px' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Active Users</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>
            {usage?.usersCount || 0}
          </div>
        </div>
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '16px' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Customers</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>
            {usage?.customersCount || 0}
          </div>
        </div>
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '16px' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Leads</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>
            {usage?.leadsCount || 0}
          </div>
        </div>
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '16px' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Deals</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>
            {usage?.dealsCount || 0}
          </div>
        </div>
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '16px' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Storage Consumed</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>
            {Math.round((usage?.storageBytes || 0) / (1024 * 1024))} MB
          </div>
        </div>
      </div>

      {/* Users List */}
      <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#f8fafc' }}>
        👥 Registered Tenant Users ({company.users?.length || 0})
      </h3>
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
              <th style={{ padding: '12px 16px' }}>Name</th>
              <th style={{ padding: '12px 16px' }}>Email</th>
              <th style={{ padding: '12px 16px' }}>Role</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {(company.users || []).map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '12px 16px', fontWeight: 500, color: '#f1f5f9' }}>{u.name}</td>
                <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{u.email}</td>
                <td style={{ padding: '12px 16px', color: '#38bdf8', fontWeight: 600 }}>{u.role}</td>
                <td style={{ padding: '12px 16px', color: u.status === 'ACTIVE' ? '#4ade80' : '#f87171' }}>{u.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCompanyDetailPage;
