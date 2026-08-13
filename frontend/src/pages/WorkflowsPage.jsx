import React, { useState, useEffect } from 'react';
import { getWorkflows, createWorkflow, toggleWorkflow, deleteWorkflow } from '../services/workflowService';
import { GitBranch, Plus, ToggleLeft, ToggleRight, Trash2, Zap, CheckCircle, AlertTriangle } from 'lucide-react';

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Workflow Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [entityType, setEntityType] = useState('DEAL');
  const [triggerType, setTriggerType] = useState('DEAL_WON');
  const [conditionField, setConditionField] = useState('value');
  const [conditionOperator, setConditionOperator] = useState('GREATER_THAN');
  const [conditionValue, setConditionValue] = useState('100000');
  const [actionType, setActionType] = useState('CREATE_TASK');
  const [actionTitle, setActionTitle] = useState('Follow up on High-Value Deal');

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const res = await getWorkflows();
      if (res.success) setWorkflows(res.data);
    } catch (err) {
      console.error('Failed to fetch workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createWorkflow({
        name,
        description,
        entityType,
        triggerType,
        conditions: [
          { field: conditionField, operator: conditionOperator, value: conditionValue }
        ],
        actions: [
          { actionType, configuration: { title: actionTitle, priority: 'HIGH' } }
        ]
      });
      setShowCreateModal(false);
      setName('');
      setDescription('');
      fetchWorkflows();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create workflow');
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleWorkflow(id);
      fetchWorkflows();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await deleteWorkflow(id);
      fetchWorkflows();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <GitBranch className="w-7 h-7 text-indigo-400" /> Workflow Automation Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Build event-driven rules with triggers, conditions, and automated actions.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" /> Create Workflow Rule
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Loading workflow automation rules...</div>
      ) : workflows.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-slate-800 space-y-3">
          <Zap className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Automated Workflows Configured</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Automate tasks, notifications, and emails when records are created or updated.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflows.map((wf) => (
            <div key={wf.id} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">{wf.name}</h3>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${wf.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                      {wf.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  {wf.description && <p className="text-xs text-slate-400 mt-1">{wf.description}</p>}
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggle(wf.id)} className="text-slate-400 hover:text-white transition-colors">
                    {wf.isActive ? <ToggleRight className="w-6 h-6 text-emerald-400" /> : <ToggleLeft className="w-6 h-6 text-slate-600" />}
                  </button>
                  <button onClick={() => handleDelete(wf.id)} className="text-slate-400 hover:text-rose-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Trigger & Action Flow Card */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-indigo-300">
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                  <span><strong>WHEN:</strong> {wf.entityType} ({wf.triggerType})</span>
                </div>
                {wf.conditions?.length > 0 && (
                  <div className="flex items-center gap-2 text-amber-300 pl-5 text-[11px]">
                    <span>IF: {wf.conditions.map(c => `${c.field} ${c.operator} "${c.value}"`).join(', ')}</span>
                  </div>
                )}
                {wf.actions?.length > 0 && (
                  <div className="flex items-center gap-2 text-emerald-300 pl-5 text-[11px]">
                    <span>THEN: {wf.actions.map(a => `${a.actionType}`).join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Execution Status */}
              <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-800/60">
                <span>Created {new Date(wf.createdAt).toLocaleDateString()}</span>
                {wf.executions?.[0] && (
                  <span className="flex items-center gap-1">
                    {wf.executions[0].status === 'COMPLETED' ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <AlertTriangle className="w-3 h-3 text-rose-400" />}
                    Last run: {new Date(wf.executions[0].startedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-lg font-bold text-white">Create Automated Workflow Rule</h2>
            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Rule Name</label>
                <input required value={name} onChange={e => setName(e.target.value)} placeholder="High Value Deal Alert" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Entity & Trigger Event</label>
                <div className="grid grid-cols-2 gap-2">
                  <select value={entityType} onChange={e => setEntityType(e.target.value)} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white">
                    <option value="DEAL">DEAL</option>
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="LEAD">LEAD</option>
                    <option value="TASK">TASK</option>
                  </select>
                  <select value={triggerType} onChange={e => setTriggerType(e.target.value)} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white">
                    <option value="DEAL_WON">DEAL_WON</option>
                    <option value="RECORD_CREATED">RECORD_CREATED</option>
                    <option value="STATUS_CHANGED">STATUS_CHANGED</option>
                    <option value="STAGE_CHANGED">STAGE_CHANGED</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-slate-300">IF Condition</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <input value={conditionField} onChange={e => setConditionField(e.target.value)} placeholder="field" className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-white" />
                  <select value={conditionOperator} onChange={e => setConditionOperator(e.target.value)} className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-white">
                    <option value="EQUALS">EQUALS</option>
                    <option value="GREATER_THAN">GREATER THAN</option>
                    <option value="CONTAINS">CONTAINS</option>
                  </select>
                  <input value={conditionValue} onChange={e => setConditionValue(e.target.value)} placeholder="value" className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-white" />
                </div>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-slate-300">THEN Action</span>
                <div className="space-y-2">
                  <select value={actionType} onChange={e => setActionType(e.target.value)} className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white">
                    <option value="CREATE_TASK">CREATE_TASK</option>
                    <option value="CREATE_NOTIFICATION">CREATE_NOTIFICATION</option>
                    <option value="SEND_EMAIL">SEND_EMAIL</option>
                    <option value="WEBHOOK">WEBHOOK</option>
                  </select>
                  <input value={actionTitle} onChange={e => setActionTitle(e.target.value)} placeholder="Action Title / Subject" className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl">Save Workflow</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
