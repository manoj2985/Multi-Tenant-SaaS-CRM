import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Target, 
  Briefcase, 
  DollarSign, 
  CheckSquare, 
  AlertTriangle, 
  Calendar, 
  TrendingUp,
  Filter,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  getDashboardKpis,
  getPipelineAnalytics,
  getLeadAnalytics,
  getDealAnalytics,
  getSalesPerformance,
  getTaskAnalytics
} from '../services/dashboardService';

const STAGE_COLORS = {
  LEAD: '#3b82f6',
  QUALIFIED: '#6366f1',
  PROPOSAL: '#8b5cf6',
  NEGOTIATION: '#ec4899',
  WON: '#10b981',
  LOST: '#ef4444'
};

const SOURCE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];

export default function DashboardPage() {
  const [period, setPeriod] = useState('30d');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  const [kpis, setKpis] = useState(null);
  const [pipelineData, setPipelineData] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [dealPerformance, setDealPerformance] = useState(null);
  const [salesRoster, setSalesRoster] = useState([]);
  const [taskStats, setTaskStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (period !== 'custom') {
        params.period = period;
      } else {
        if (fromDate) params.from = fromDate;
        if (toDate) params.to = toDate;
      }
      if (employeeId) params.employeeId = employeeId;

      const [kpiRes, pipeRes, leadRes, dealRes, salesRes, taskRes] = await Promise.all([
        getDashboardKpis(params),
        getPipelineAnalytics(params),
        getLeadAnalytics(params),
        getDealAnalytics(params),
        getSalesPerformance(params),
        getTaskAnalytics(params)
      ]);

      if (kpiRes.success) setKpis(kpiRes.data);

      if (pipeRes.success && pipeRes.data) {
        const pipeArr = Object.keys(pipeRes.data).map(stage => ({
          stage,
          count: pipeRes.data[stage].count,
          value: pipeRes.data[stage].value,
          averageValue: pipeRes.data[stage].averageValue
        }));
        setPipelineData(pipeArr);
      }

      if (leadRes.success && leadRes.data?.bySource) {
        const sourcesArr = Object.keys(leadRes.data.bySource).map(source => ({
          name: source.replace('_', ' '),
          value: leadRes.data.bySource[source]
        })).filter(item => item.value > 0);
        setLeadSources(sourcesArr);
      }

      if (dealRes.success) setDealPerformance(dealRes.data);
      if (salesRes.success) setSalesRoster(salesRes.data);
      if (taskRes.success) setTaskStats(taskRes.data);

    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  }, [period, fromDate, toDate, employeeId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header & Filter Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Executive Dashboard</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', margin: 0 }}>Real-time sales analytics & multi-tenant productivity metrics</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px' }}>
            {['7d', '30d', '90d', '1y'].map((p) => (
              <button
                key={p}
                onClick={() => { setPeriod(p); setFromDate(''); setToDate(''); }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: period === p ? '#2563eb' : 'transparent',
                  color: period === p ? '#fff' : '#64748b',
                  transition: 'all 0.2s ease'
                }}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={fetchDashboardData}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              color: '#334155',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '500' }}>Customers</span>
            <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '8px', color: '#2563eb' }}><Users size={18} /></div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '12px' }}>{kpis?.customers ?? 0}</div>
        </div>

        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '500' }}>Total Leads</span>
            <div style={{ background: '#f0fdf4', padding: '8px', borderRadius: '8px', color: '#16a34a' }}><Target size={18} /></div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '12px' }}>{kpis?.leads ?? 0}</div>
        </div>

        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '500' }}>Active Deals</span>
            <div style={{ background: '#faf5ff', padding: '8px', borderRadius: '8px', color: '#9333ea' }}><Briefcase size={18} /></div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '12px' }}>{kpis?.activeDeals ?? 0}</div>
        </div>

        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '500' }}>Won Revenue</span>
            <div style={{ background: '#ecfdf5', padding: '8px', borderRadius: '8px', color: '#059669' }}><DollarSign size={18} /></div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#059669', marginTop: '12px' }}>{formatCurrency(kpis?.wonDealValue)}</div>
        </div>

        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '500' }}>Open Tasks</span>
            <div style={{ background: '#fff7ed', padding: '8px', borderRadius: '8px', color: '#ea580c' }}><CheckSquare size={18} /></div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '12px' }}>{kpis?.openTasks ?? 0}</div>
        </div>

        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '500' }}>Overdue Tasks</span>
            <div style={{ background: '#fef2f2', padding: '8px', borderRadius: '8px', color: '#dc2626' }}><AlertTriangle size={18} /></div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#dc2626', marginTop: '12px' }}>{kpis?.overdueTasks ?? 0}</div>
        </div>

        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '500' }}>Meetings</span>
            <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '8px', color: '#2563eb' }}><Calendar size={18} /></div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '12px' }}>{kpis?.upcomingMeetings ?? 0}</div>
        </div>

        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '500' }}>Win Rate</span>
            <div style={{ background: '#f0fdf4', padding: '8px', borderRadius: '8px', color: '#16a34a' }}><TrendingUp size={18} /></div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#16a34a', marginTop: '12px' }}>
            {dealPerformance?.winRate !== undefined ? `${dealPerformance.winRate}%` : '0%'}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Sales Pipeline Chart */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', marginBottom: '20px' }}>Sales Pipeline by Stage</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="stage" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  formatter={(val, name) => [name === 'value' ? formatCurrency(val) : val, name === 'value' ? 'Total Value' : 'Deals Count']}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STAGE_COLORS[entry.stage] || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Trend Chart */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', marginBottom: '20px' }}>Revenue Trend ({period.toUpperCase()})</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dealPerformance?.timeSeries || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip formatter={(val) => [formatCurrency(val), 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Sources Chart */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', marginBottom: '20px' }}>Lead Acquisition Sources</h3>
          <div style={{ height: '300px' }}>
            {leadSources.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadSources}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {leadSources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '14px' }}>
                No lead source data available
              </div>
            )}
          </div>
        </div>

        {/* Employee Sales Leaderboard */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', marginBottom: '20px' }}>Top Sales Performance by Employee</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesRoster} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis dataKey="employeeName" type="category" stroke="#94a3b8" fontSize={12} width={100} />
                <Tooltip formatter={(val) => [formatCurrency(val), 'Won Revenue']} />
                <Bar dataKey="wonRevenue" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
