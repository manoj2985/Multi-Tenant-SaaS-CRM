import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  RefreshCw, 
  X, 
  AlertCircle, 
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Building2,
  Trash2
} from 'lucide-react';

const STAGES = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

export function DealsPage() {
  const { user } = useAuth();
  const [pipeline, setPipeline] = useState({
    LEAD: [],
    QUALIFIED: [],
    PROPOSAL: [],
    NEGOTIATION: [],
    WON: [],
    LOST: []
  });
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search filter
  const [search, setSearch] = useState('');

  // Add Deal Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    title: '',
    value: 10000,
    currency: 'USD',
    stage: 'LEAD',
    probability: 50
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const fetchPipeline = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/deals/pipeline');
      setPipeline(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pipeline');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCustomersList = useCallback(async () => {
    try {
      const res = await api.get('/api/customers?limit=100');
      setCustomers(res.data.data);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchPipeline();
    fetchCustomersList();
  }, [fetchPipeline, fetchCustomersList]);

  const handleOpenAddModal = () => {
    setFormData({
      customerId: customers.length > 0 ? customers[0].id : '',
      title: '',
      value: 10000,
      currency: 'USD',
      stage: 'LEAD',
      probability: 50
    });
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleCreateDeal = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await api.post('/api/deals', formData);
      setIsModalOpen(false);
      fetchPipeline();
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to create deal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveStage = async (dealId, nextStage) => {
    try {
      await api.patch(`/api/deals/${dealId}/stage`, { stage: nextStage });
      fetchPipeline();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update deal stage');
    }
  };

  const handleDeleteDeal = async (dealId, title) => {
    if (!window.confirm(`Are you sure you want to delete deal "${title}"?`)) return;
    try {
      await api.delete(`/api/deals/${dealId}`);
      fetchPipeline();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete deal');
    }
  };

  const calculateStageTotal = (stageDeals) => {
    if (!stageDeals) return 0;
    return stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-extrabold text-white">Sales Pipeline Kanban</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visual Deal Stages &bull; Multi-Tenant Revenue Metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPipeline}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>New Deal</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Kanban Pipeline Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageDeals = (pipeline[stage] || []).filter((d) => 
            !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.customer?.name.toLowerCase().includes(search.toLowerCase())
          );
          const stageValue = calculateStageTotal(stageDeals);

          return (
            <div key={stage} className="glass-card p-4 rounded-2xl border border-slate-800/90 space-y-3 min-w-[240px] flex flex-col">
              {/* Stage Column Header */}
              <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">{stage}</h3>
                  <div className="text-[11px] font-semibold text-emerald-400 mt-0.5">
                    ${stageValue.toLocaleString()}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">
                  {stageDeals.length}
                </span>
              </div>

              {/* Stage Deal Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[65vh] pr-1">
                {loading ? (
                  <div className="text-[11px] text-slate-500 text-center py-4 animate-pulse">Loading...</div>
                ) : stageDeals.length === 0 ? (
                  <div className="text-[11px] text-slate-600 text-center py-6 border border-dashed border-slate-800/60 rounded-xl">
                    Empty Stage
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-indigo-500/40 space-y-2.5 transition-all shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-white text-xs leading-snug">{deal.title}</div>
                        {(user?.role === 'COMPANY_ADMIN' || user?.role === 'SALES_MANAGER') && (
                          <button
                            onClick={() => handleDeleteDeal(deal.id, deal.title)}
                            className="text-slate-500 hover:text-rose-400 p-0.5 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{deal.customer?.name || 'Unlinked Customer'}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                        <div className="text-xs font-extrabold text-emerald-400">
                          ${deal.value?.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded font-mono">
                          {deal.probability}%
                        </div>
                      </div>

                      {/* Move Stage Controls */}
                      <div className="flex items-center justify-between pt-1 text-[10px]">
                        {STAGES.indexOf(stage) > 0 ? (
                          <button
                            onClick={() => handleMoveStage(deal.id, STAGES[STAGES.indexOf(stage) - 1])}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="Move Previous"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                        ) : <div />}

                        {STAGES.indexOf(stage) < STAGES.length - 1 && (
                          <button
                            onClick={() => handleMoveStage(deal.id, STAGES[STAGES.indexOf(stage) + 1])}
                            className="p-1 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-all flex items-center gap-0.5 font-semibold"
                            title="Advance Stage"
                          >
                            <span>Move Next</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Deal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border border-slate-800 space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                Create New Sales Deal
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {submitError}
              </div>
            )}

            <form onSubmit={handleCreateDeal} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Customer *</label>
                <select
                  required
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.companyName ? `(${c.companyName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Deal Contract Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enterprise License Renewal"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Deal Value ($) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Initial Stage</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30"
                >
                  {isSubmitting ? 'Creating...' : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
