import React, { useState, useEffect } from 'react';
import { getApiKeys, createApiKey, revokeApiKey } from '../services/apiKeyService';
import { Key, Plus, Trash2, Shield, Eye, Copy, Check } from 'lucide-react';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [createdSecret, setCreatedSecret] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res = await getApiKeys();
      if (res.success) setKeys(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name) return;
    try {
      const res = await createApiKey({ name, scopes: ['CUSTOMERS_READ', 'LEADS_READ', 'DEALS_READ'] });
      if (res.success) {
        setCreatedSecret(res.data.secretKey);
        setName('');
        fetchKeys();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate API Key');
    }
  };

  const handleRevoke = async (id) => {
    if (!confirm('Revoke this API Key immediately? External integrations using this key will be blocked.')) return;
    try {
      await revokeApiKey(id);
      fetchKeys();
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Key className="w-7 h-7 text-indigo-400" /> Developer API Keys & Authentication
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Generate scoped API keys to integrate external applications with your tenant CRM.
        </p>
      </div>

      {/* Generated Key Modal Notice */}
      {createdSecret && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400 shrink-0" />
            <h3 className="font-bold text-sm text-white">Save Your API Key Secret</h3>
          </div>
          <p className="text-xs text-slate-300">
            Copy your secret key now. <strong>It will never be displayed again.</strong>
          </p>
          <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400">
            <span className="flex-1 break-all">{createdSecret}</span>
            <button onClick={() => copyToClipboard(createdSecret)} className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <button onClick={() => setCreatedSecret(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl">
            I Have Saved My Secret Key
          </button>
        </div>
      )}

      {/* Create Key Form */}
      <form onSubmit={handleCreate} className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Integration Name (e.g. Zapier Integration, Mobile App Backend)"
          className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" /> Generate API Key
        </button>
      </form>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Loading active API keys...</div>
      ) : keys.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-slate-800 space-y-3">
          <Key className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Active Developer API Keys</h3>
          <p className="text-xs text-slate-400">Generate your first API key above to connect external services.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Key Identifier</th>
                <th className="p-3.5">Key Prefix</th>
                <th className="p-3.5">Total Requests</th>
                <th className="p-3.5">Last Used</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-slate-900/40">
                  <td className="p-3.5">
                    <div className="font-bold text-white">{k.name}</div>
                    <div className="text-[10px] text-slate-500">Created {new Date(k.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-indigo-300">{k.keyPrefix}</td>
                  <td className="p-3.5 font-bold text-white">{k.totalRequests || 0}</td>
                  <td className="p-3.5 text-slate-400">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : 'Never'}</td>
                  <td className="p-3.5 text-right">
                    {k.revokedAt ? (
                      <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] font-bold">REVOKED</span>
                    ) : (
                      <button onClick={() => handleRevoke(k.id)} className="text-slate-400 hover:text-rose-400 font-bold text-[11px]">
                        Revoke Key
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
