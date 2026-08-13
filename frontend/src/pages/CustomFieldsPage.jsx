import React, { useState, useEffect } from 'react';
import { getCustomFields, createCustomField, deleteCustomField } from '../services/customFieldService';
import { Sliders, Plus, Trash2, Database } from 'lucide-react';

export default function CustomFieldsPage() {
  const [fields, setFields] = useState([]);
  const [entityType, setEntityType] = useState('CUSTOMER');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [fieldType, setFieldType] = useState('TEXT');
  const [isRequired, setIsRequired] = useState(false);

  useEffect(() => {
    fetchFields();
  }, [entityType]);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const res = await getCustomFields(entityType);
      if (res.success) setFields(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createCustomField({
        entityType,
        name: name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        label,
        fieldType,
        isRequired
      });
      setShowModal(false);
      setName('');
      setLabel('');
      fetchFields();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create custom field');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this custom field definition?')) return;
    try {
      await deleteCustomField(id);
      fetchFields();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-7 h-7 text-indigo-400" /> Custom Fields Configuration
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Extend CRM records with custom data attributes for your organization.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" /> Add Custom Field
        </button>
      </div>

      {/* Entity Selector Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        {['CUSTOMER', 'LEAD', 'DEAL', 'TASK', 'MEETING'].map((type) => (
          <button
            key={type}
            onClick={() => setEntityType(type)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${entityType === type ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
          >
            {type}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Loading custom field definitions...</div>
      ) : fields.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-slate-800 space-y-3">
          <Database className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Custom Fields for {entityType}</h3>
          <p className="text-xs text-slate-400">Click "Add Custom Field" to extend form capabilities.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Field Label</th>
                <th className="p-3.5">Internal Key</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Required</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {fields.map((f) => (
                <tr key={f.id} className="hover:bg-slate-900/40">
                  <td className="p-3.5 font-bold text-white">{f.label}</td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-400">{f.name}</td>
                  <td className="p-3.5"><span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-indigo-300 font-semibold">{f.fieldType}</span></td>
                  <td className="p-3.5">{f.isRequired ? <span className="text-amber-400 font-bold">Yes</span> : 'No'}</td>
                  <td className="p-3.5 text-right">
                    <button onClick={() => handleDelete(f.id)} className="text-slate-400 hover:text-rose-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-lg font-bold text-white">Add Custom Field ({entityType})</h2>
            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Field Label (User Facing)</label>
                <input required value={label} onChange={e => { setLabel(e.target.value); if (!name) setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')); }} placeholder="e.g. Annual Revenue" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Internal Key Name</label>
                <input required value={name} onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))} placeholder="e.g. annual_revenue" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Field Data Type</label>
                <select value={fieldType} onChange={e => setFieldType(e.target.value)} className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white">
                  <option value="TEXT">TEXT</option>
                  <option value="NUMBER">NUMBER</option>
                  <option value="BOOLEAN">BOOLEAN</option>
                  <option value="DATE">DATE</option>
                  <option value="SELECT">SELECT</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="req" checked={isRequired} onChange={e => setIsRequired(e.target.checked)} className="rounded" />
                <label htmlFor="req" className="text-slate-300">Mark as Required Field</label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl">Create Field</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
