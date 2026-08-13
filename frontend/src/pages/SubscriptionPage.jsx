import React, { useState, useEffect } from 'react';
import { getSubscription, getPlans, changePlan } from '../services/subscriptionService';

const SubscriptionPage = () => {
  const [subData, setSubData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [subRes, plansRes] = await Promise.all([getSubscription(), getPlans()]);
      if (subRes.success) setSubData(subRes.data);
      if (plansRes.success) setPlans(plansRes.plans);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePlanChange = async (targetPlan) => {
    if (!subData) return;
    if (subData.plan === targetPlan) return;

    const isDowngrade = targetPlan === 'FREE' || (targetPlan === 'PREMIUM' && subData.plan === 'ENTERPRISE');
    const actionName = isDowngrade ? 'downgrade' : 'upgrade';

    if (!window.confirm(`Are you sure you want to ${actionName} your subscription to ${targetPlan}?`)) {
      return;
    }

    try {
      setUpdatingPlan(true);
      setError(null);
      setSuccessMsg(null);

      const res = await changePlan(targetPlan);
      if (res.success) {
        setSuccessMsg(`Successfully changed subscription plan to ${targetPlan}!`);
        await fetchData();
      }
    } catch (err) {
      const errRes = err.response?.data;
      if (errRes?.errorCode === 'DOWNGRADE_LIMIT_EXCEEDED') {
        setError(`Cannot Downgrade: ${errRes.message}`);
      } else {
        setError(errRes?.message || 'Failed to change plan');
      }
    } finally {
      setUpdatingPlan(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', color: '#94a3b8', textAlign: 'center' }}>
        Loading subscription & plan details...
      </div>
    );
  }

  const currentPlan = subData?.plan || 'FREE';
  const status = subData?.status || 'ACTIVE';

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', color: '#f8fafc' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '1.8rem', color: '#f8fafc', fontWeight: 700 }}>
          💳 SaaS Subscription & Tier Management
        </h1>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>
          Manage your organization's CRM plan, quotas, and feature entitlements.
        </p>
      </div>

      {error && (
        <div style={{ padding: '14px 18px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '10px', color: '#fca5a5', fontSize: '0.9rem', marginBottom: '24px' }}>
          ⚠️ {error}
        </div>
      )}

      {successMsg && (
        <div style={{ padding: '14px 18px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid #22c55e', borderRadius: '10px', color: '#86efac', fontSize: '0.9rem', marginBottom: '24px' }}>
          ✅ {successMsg}
        </div>
      )}

      {/* Current Subscription Status Header */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '24px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Active Tenant Subscription
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#38bdf8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>{currentPlan} PLAN</span>
            <span style={{
              fontSize: '0.75rem',
              padding: '4px 10px',
              borderRadius: '20px',
              fontWeight: 600,
              background: status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: status === 'ACTIVE' ? '#4ade80' : '#f87171',
              border: `1px solid ${status === 'ACTIVE' ? '#22c55e' : '#ef4444'}`
            }}>
              {status}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Billing Status</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', marginTop: '4px' }}>
            {subData?.billingProvider ? `${subData.billingProvider.toUpperCase()} Integrated` : 'Standard SaaS License'}
          </div>
        </div>
      </div>

      {/* Plans Pricing Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {plans.map((p) => {
          const isCurrent = p.key === currentPlan;
          return (
            <div
              key={p.key}
              style={{
                background: isCurrent ? '#0f172a' : '#1e293b',
                border: isCurrent ? '2px solid #38bdf8' : '1px solid #334155',
                borderRadius: '16px',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                position: 'relative',
                boxShadow: isCurrent ? '0 0 20px rgba(56, 189, 248, 0.15)' : 'none'
              }}
            >
              {isCurrent && (
                <div style={{ position: 'absolute', top: '-14px', right: '20px', background: '#38bdf8', color: '#0f172a', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  Current Plan
                </div>
              )}

              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.3rem', color: '#f8fafc', fontWeight: 700 }}>
                  {p.name}
                </h3>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', marginBottom: '16px' }}>
                  {p.price}
                </div>

                <div style={{ borderTop: '1px solid #334155', paddingTop: '16px', marginBottom: '24px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '12px' }}>
                    Resource Quotas:
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: '#94a3b8' }}>
                    <li>👥 <strong>{p.limits.maxUsers === -1 ? 'Unlimited' : p.limits.maxUsers}</strong> Active Users</li>
                    <li>🏢 <strong>{p.limits.maxCustomers === -1 ? 'Unlimited' : p.limits.maxCustomers}</strong> Customers</li>
                    <li>🎯 <strong>{p.limits.maxLeads === -1 ? 'Unlimited' : p.limits.maxLeads}</strong> Leads</li>
                    <li>💼 <strong>{p.limits.maxDeals === -1 ? 'Unlimited' : p.limits.maxDeals}</strong> Deals</li>
                    <li>☁️ <strong>{p.limits.maxStorageMB === -1 ? 'Unlimited' : `${p.limits.maxStorageMB} MB`}</strong> Cloud Storage</li>
                  </ul>
                </div>
              </div>

              <button
                onClick={() => handlePlanChange(p.key)}
                disabled={isCurrent || updatingPlan}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: isCurrent || updatingPlan ? 'default' : 'pointer',
                  background: isCurrent ? '#334155' : p.key === 'ENTERPRISE' ? '#8b5cf6' : '#3b82f6',
                  color: isCurrent ? '#94a3b8' : '#ffffff',
                  transition: 'all 0.2s'
                }}
              >
                {isCurrent ? 'Active Plan' : updatingPlan ? 'Updating...' : `Select ${p.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionPage;
