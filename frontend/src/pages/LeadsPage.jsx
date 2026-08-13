import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  X, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  ArrowRightLeft,
  UserPlus
} from 'lucide-react';

export function LeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 0, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'WEBSITE',
    status: 'NEW',
    priority: 'MEDIUM',
    notes: ''
  });

  // Convert Modal
  const [convertLeadData, setConvertLeadData] = useState(null);
  const [convertOptions, setConvertOptions] = useState({
    createCustomer: true,
    createDeal: true,
    dealTitle: '',
    dealValue: 50000
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const fetchLeads = useCallback(async (pageIndex = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageIndex,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
        ...(sourceFilter && { source: sourceFilter })
      });

      const response = await api.get(`/api/leads?${params.toString()}`);
      setLeads(response.data.data);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, sourceFilter]);

  useEffect(() => {
    fetchLeads(0);
  }, [fetchLeads]);

  const handleOpenCreateModal = (lead = null) => {
    if (lead) {
      setEditingLead(lead);
      setFormData({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        source: lead.source || 'OTHER',
        status: lead.status || 'NEW',
        priority: lead.priority || 'MEDIUM',
        notes: lead.notes || ''
      });
    } else {
      setEditingLead(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        source: 'WEBSITE',
        status: 'NEW',
        priority: 'MEDIUM',
        notes: ''
      });
    }
    setSubmitError(null);
    setIsCreateModalOpen(true);
  };

  const handleSaveLead = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (editingLead) {
        await api.put(`/api/leads/${editingLead.id}`, formData);
      } else {
        await api.post('/api/leads', formData);
      }
      setIsCreateModalOpen(false);
      fetchLeads(pagination.page);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to save lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await api.patch(`/api/leads/${leadId}/status`, { status: newStatus });
      fetchLeads(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleOpenConvertModal = (lead) => {
    setConvertLeadData(lead);
    setConvertOptions({
      createCustomer: true,
      createDeal: true,
      dealTitle: `${lead.name} Contract`,
      dealValue: 50000
    });
    setSubmitError(null);
  };

  const handleConvertLead = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await api.post(`/api/leads/${convertLeadData.id}/convert`, convertOptions);
      setConvertLeadData(null);
      fetchLeads(pagination.page);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Conversion failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (leadId, name) => {
    if (!window.confirm(`Are you sure you want to delete lead "${name}"?`)) return;
    try {
      await api.delete(`/api/leads/${leadId}`);
      fetchLeads(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete lead');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-extrabold text-white">Sales Leads Directory</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Prospect Qualification &bull; Atomic Lead-to-Customer Conversion
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchLeads(pagination.page)}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => handleOpenCreateModal(null)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Create Lead</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="NEGOTIATION">Negotiation</option>
            <option value="WON">Won</option>
            <option value="LOST">Lost</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="relative">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        {/* Source Filter */}
        <div className="relative">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Sources</option>
            <option value="WEBSITE">Website</option>
            <option value="REFERRAL">Referral</option>
            <option value="SOCIAL_MEDIA">Social Media</option>
            <option value="EMAIL">Email</option>
            <option value="PHONE">Phone</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Leads Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-6 font-semibold">Lead Name</th>
                <th className="py-3.5 px-6 font-semibold">Source</th>
                <th className="py-3.5 px-6 font-semibold">Priority</th>
                <th className="py-3.5 px-6 font-semibold">Status</th>
                <th className="py-3.5 px-6 font-semibold">Assigned Rep</th>
                <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    <span className="inline-block animate-pulse">Loading leads...</span>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No leads found matching criteria.
                  </td>
                </tr>
              ) : (
                leads.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-white text-sm">{l.name}</div>
                      <div className="text-slate-400 text-xs">{l.email} &bull; {l.phone}</div>
                    </td>

                    <td className="py-4 px-6 text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] uppercase font-mono">
                        {l.source}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        l.priority === 'URGENT'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : l.priority === 'HIGH'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {l.priority}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <select
                        value={l.status}
                        onChange={(e) => handleStatusChange(l.id, e.target.value)}
                        className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-indigo-300 font-semibold focus:outline-none"
                      >
                        <option value="NEW">NEW</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="QUALIFIED">QUALIFIED</option>
                        <option value="NEGOTIATION">NEGOTIATION</option>
                        <option value="WON">WON</option>
                        <option value="LOST">LOST</option>
                      </select>
                    </td>

                    <td className="py-4 px-6 text-slate-400">
                      {l.assignedTo?.name || 'Unassigned'}
                    </td>

                    <td className="py-4 px-6 text-right space-x-2">
                      {l.status !== 'WON' && (
                        <button
                          onClick={() => handleOpenConvertModal(l)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all text-[11px] font-semibold"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Convert</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenCreateModal(l)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500 text-slate-300 hover:text-white transition-all"
                        title="Edit Lead"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {(user?.role === 'COMPANY_ADMIN' || user?.role === 'SALES_MANAGER') && (
                        <button
                          onClick={() => handleDelete(l.id, l.name)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-all"
                          title="Soft Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-900/60 border-t border-slate-800 text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-white">{leads.length}</span> of{' '}
            <span className="font-semibold text-white">{pagination.total}</span> leads
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLeads(pagination.page - 1)}
              disabled={pagination.page === 0}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page {pagination.page + 1} of {Math.max(1, pagination.totalPages)}
            </span>
            <button
              onClick={() => fetchLeads(pagination.page + 1)}
              disabled={pagination.page + 1 >= pagination.totalPages}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl border border-slate-800 space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                {editingLead ? 'Edit Lead' : 'Create New Lead'}
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSaveLead} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Lead Prospect Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Sarah Jenkins"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="sarah@company.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 555-0199"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="WEBSITE">Website</option>
                    <option value="REFERRAL">Referral</option>
                    <option value="SOCIAL_MEDIA">Social Media</option>
                    <option value="EMAIL">Email</option>
                    <option value="PHONE">Phone</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="NEW">NEW</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="QUALIFIED">QUALIFIED</option>
                    <option value="NEGOTIATION">NEGOTIATION</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30"
                >
                  {isSubmitting ? 'Saving...' : editingLead ? 'Update Lead' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert Lead Modal */}
      {convertLeadData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border border-slate-800 space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
                Convert Lead &bull; {convertLeadData.name}
              </h3>
              <button onClick={() => setConvertLeadData(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {submitError}
              </div>
            )}

            <form onSubmit={handleConvertLead} className="space-y-4 text-xs">
              <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-slate-200 font-semibold">
                  <input
                    type="checkbox"
                    checked={convertOptions.createCustomer}
                    onChange={(e) => setConvertOptions({ ...convertOptions, createCustomer: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600"
                  />
                  <span>Create Customer Record</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-200 font-semibold">
                  <input
                    type="checkbox"
                    checked={convertOptions.createDeal}
                    onChange={(e) => setConvertOptions({ ...convertOptions, createDeal: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600"
                  />
                  <span>Create Deal in Pipeline</span>
                </label>
              </div>

              {convertOptions.createDeal && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Deal Title *</label>
                    <input
                      type="text"
                      required
                      value={convertOptions.dealTitle}
                      onChange={(e) => setConvertOptions({ ...convertOptions, dealTitle: e.target.value })}
                      placeholder="Contract Title"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Estimated Deal Value ($) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={convertOptions.dealValue}
                      onChange={(e) => setConvertOptions({ ...convertOptions, dealValue: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setConvertLeadData(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/30"
                >
                  {isSubmitting ? 'Converting...' : 'Execute Conversion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
