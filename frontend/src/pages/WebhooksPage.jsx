import React, { useState, useEffect } from 'react';
import { getWebhooks, createWebhook, toggleWebhook, deleteWebhook } from '../services/webhookService';
import { Webhook as WebhookIcon, Plus, ToggleLeft, ToggleRight, Trash2, Shield, Activity } from 'lucide-react';

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('DEAL_WON');

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      const res = await getWebhooks();
      if (res.success) setWebhooks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createWebhook({
        name,
        url,
        events: [selectedEvent]
      });
      setShowModal(false);
      setName('');
      setUrl('');
      fetchWebhooks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register webhook endpoint');
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleWebhook(id);
      fetchWebhooks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this outbound webhook subscription?')) return;
    try {
      await deleteWebhook(id);
      fetchWebhooks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <WebhookIcon className="w-7 h-7 text-indigo-400" /> Outbound Webhooks & HMAC Signatures
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch HTTP POST notifications with HMAC-SHA256 signatures when CRM events trigger.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" /> Add Webhook Subscription
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Loading webhook subscriptions...</div>
      ) : webhooks.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-slate-800 space-y-3">
          <WebhookIcon className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Outbound Webhooks Configured</h3>
          <p className="text-xs text-slate-400">Subscribe your HTTP endpoints to real-time tenant events.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {webhooks.map((wh) => (
            <div key={wh.id} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">{wh.name}</h3>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${wh.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                      {wh.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-400 mt-1 break-all">{wh.url}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggle(wh.id)} className="text-slate-400 hover:text-white">
                    {wh.isActive ? <ToggleRight className="w-6 h-6 text-emerald-400" /> : <ToggleLeft className="w-6 h-6 text-slate-600" />}
                  </button>
                  <button onClick={() => handleDelete(wh.id)} className="text-slate-400 hover:text-rose-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-300">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Subscribed Events: <strong>{Array.isArray(wh.events) ? wh.events.join(', ') : 'All'}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-amber-300 font-mono text-[11px]">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Secret: whsec_••••••••••••</span>
                </div>
              </div>

              {/* Delivery History Preview */}
              {wh.deliveries?.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Recent Deliveries</span>
                  {wh.deliveries.slice(0, 2).map((d) => (
                    <div key={d.id} className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-slate-900/60">
                      <span className="font-mono text-slate-300">{d.event}</span>
                      <span className={`font-bold ${d.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {d.status} ({d.responseStatus || 'ERR'})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-lg font-bold text-white">Add Webhook Subscription</h2>
            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Webhook Name</label>
                <input required value={name} onChange={e => setName(e.target.value)} placeholder="Slack / Zapier Integration Endpoint" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Target Endpoint URL (HTTPS)</label>
                <input type="url" required value={url} onChange={e => setUrl(e.target.value)} placeholder="https://api.example.com/webhooks" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Trigger Event</label>
                <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)} className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white">
                  <option value="DEAL_WON">DEAL_WON</option>
                  <option value="DEAL_LOST">DEAL_LOST</option>
                  <option value="CUSTOMER_CREATED">CUSTOMER_CREATED</option>
                  <option value="LEAD_CREATED">LEAD_CREATED</option>
                  <option value="TASK_COMPLETED">TASK_COMPLETED</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl">Create Webhook</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
