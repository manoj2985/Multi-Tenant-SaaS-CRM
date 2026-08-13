import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Building2, Mail, Phone, Globe, MapPin, ArrowLeft, DollarSign, Calendar } from 'lucide-react';

import AttachmentsList from '../components/AttachmentsList';

export function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/customers/${id}`);
      setCustomer(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch customer details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (loading) {
    return (
      <div className="p-8 text-center glass-card rounded-2xl border border-slate-800 text-slate-500 text-sm">
        Loading customer information...
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-8 text-center glass-card rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-rose-400">Customer Not Found</h2>
        <p className="text-xs text-slate-400">{error || 'Access denied or record deleted'}</p>
        <Link to="/customers" className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300">
          <ArrowLeft className="w-4 h-4" /> Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link to="/customers" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Customer Directory
      </Link>

      <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">{customer.name}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{customer.companyName || 'Individual Customer'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
            {customer.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Box */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
            Contact & Location
          </h3>

          <div className="space-y-3 text-slate-300">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{customer.email || 'No email specified'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{customer.phone || 'No phone specified'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{customer.website || 'No website'}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>{customer.address || 'No address specified'}</span>
            </div>
          </div>
        </div>

        {/* Assigned Rep & Meta */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
            Account Management
          </h3>

          <div className="space-y-3">
            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px]">Assigned Representative</span>
              <div className="text-white font-semibold mt-0.5">{customer.assignedTo?.name || 'Unassigned'}</div>
              <div className="text-slate-400">{customer.assignedTo?.email}</div>
            </div>

            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px]">Industry</span>
              <div className="text-white font-semibold mt-0.5">{customer.industry || 'General'}</div>
            </div>

            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px]">Date Added</span>
              <div className="text-slate-300 mt-0.5">{new Date(customer.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Linked Deals Summary */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
            Associated Deals ({customer.deals?.length || 0})
          </h3>

          {customer.deals?.length > 0 ? (
            <div className="space-y-2">
              {customer.deals.map((deal) => (
                <div key={deal.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>{deal.title}</span>
                    <span className="text-emerald-400">${deal.value?.toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">{deal.stage}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-500 text-center py-4">No active deals for this customer.</div>
          )}
        </div>
      </div>

      {/* Attachments Section */}
      <AttachmentsList entityType="CUSTOMER" entityId={customer.id} />
    </div>
  );
}
