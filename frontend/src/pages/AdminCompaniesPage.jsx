import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCompanies, updateCompanyStatus, overrideCompanyPlan } from '../services/adminService';

const AdminCompaniesPage = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchTenantList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCompanies({ search, status: statusFilter });
      if (res.success) {
        setCompanies(res.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch platform companies. (Requires SUPER_ADMIN role)');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchTenantList();
  }, [fetchTenantList]);

  const handleStatusToggle = async (companyId, currentStatus) => {
    const nextStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    if (!window.confirm(`Are you sure you want to change tenant status to ${nextStatus}?`)) return;

    try {
      const res = await updateCompanyStatus(companyId, nextStatus);
      if (res.success) {
        await fetchTenantList();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update company status');
    }
  };

  const handlePlanOverride = async (companyId, newPlan) => {
    try {
      const res = await overrideCompanyPlan(companyId, newPlan);
      if (res.success) {
        await fetchTenantList();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to override plan');
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', color: '#f8fafc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '1.8rem', color: '#f8fafc', fontWeight: 700 }}>
            🛡️ Platform Administration Console
          </h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>
            Multi-Tenant Management, Tenant Status Suspension, and Plan Overrides (Super Admin Only).
          </p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '14px 18px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '10px', color: '#fca5a5', fontSize: '0.9rem', marginBottom: '24px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by company name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: '240px',
            padding: '10px 14px',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#f8fafc',
            fontSize: '0.9rem'
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#f8fafc',
            fontSize: '0.9rem'
          }}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>

      {/* Companies Table */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>Loading tenant companies...</div>
        ) : companies.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No tenant companies match the filter criteria.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                <th style={{ padding: '14px 18px' }}>Company Name</th>
                <th style={{ padding: '14px 18px' }}>Email / Contact</th>
                <th style={{ padding: '14px 18px' }}>Subscription Plan</th>
                <th style={{ padding: '14px 18px' }}>Status</th>
                <th style={{ padding: '14px 18px' }}>Users</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 600, color: '#f1f5f9' }}>
                    <span
                      onClick={() => navigate(`/admin/companies/${c.id}`)}
                      style={{ cursor: 'pointer', color: '#38bdf8', textDecoration: 'underline' }}
                    >
                      {c.name}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>{c.email || 'N/A'}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <select
                      value={c.subscriptionPlan}
                      onChange={(e) => handlePlanOverride(c.id, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#38bdf8',
                        fontWeight: 600,
                        fontSize: '0.85rem'
                      }}
                    >
                      <option value="FREE">FREE</option>
                      <option value="PREMIUM">PREMIUM</option>
                      <option value="ENTERPRISE">ENTERPRISE</option>
                    </select>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: c.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: c.status === 'ACTIVE' ? '#4ade80' : '#f87171',
                      border: `1px solid ${c.status === 'ACTIVE' ? '#22c55e' : '#ef4444'}`
                    }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>
                    {c._count?.users ?? (c.users?.length || 0)}
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleStatusToggle(c.id, c.status)}
                      style={{
                        padding: '6px 14px',
                        background: c.status === 'SUSPENDED' ? '#16a34a' : 'rgba(239, 68, 68, 0.2)',
                        color: c.status === 'SUSPENDED' ? '#ffffff' : '#ef4444',
                        border: c.status === 'SUSPENDED' ? 'none' : '1px solid #ef4444',
                        borderRadius: '6px',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      {c.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminCompaniesPage;
