import React, { useState, useEffect } from 'react';
import { getTags, createTag, deleteTag } from '../services/tagService';
import { Tag as TagIcon, Plus, Trash2 } from 'lucide-react';

export default function TagsPage() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const res = await getTags();
      if (res.success) setTags(res.data);
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
      await createTag({ name, color });
      setName('');
      fetchTags();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create tag');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this tag taxonomy entry?')) return;
    try {
      await deleteTag(id);
      fetchTags();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <TagIcon className="w-7 h-7 text-indigo-400" /> Organization Tag Taxonomy
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Define color-coded tags for labeling customers, leads, and deals.
        </p>
      </div>

      <form onSubmit={handleCreate} className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New tag name (e.g. Enterprise, VIP, Renewal)"
          className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
        />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-9 h-9 p-0.5 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Tag
        </button>
      </form>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Loading tag taxonomy...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {tags.map((t) => (
            <div key={t.id} className="glass-card p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                <span className="text-xs font-bold text-white">{t.name}</span>
              </div>
              <button onClick={() => handleDelete(t.id)} className="text-slate-500 hover:text-rose-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
