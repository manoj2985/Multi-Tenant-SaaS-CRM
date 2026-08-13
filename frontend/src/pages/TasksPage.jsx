import React, { useState, useEffect, useCallback } from 'react';
import { CheckSquare, Plus, Search, Filter, Clock, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { getTasks, createTask, updateTaskStatus, deleteTask } from '../services/taskService';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState('kanban'); // 'kanban' or 'list'
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: ''
  });

  const fetchTasksData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTasks({ search, status: statusFilter, limit: 100 });
      if (res.success) {
        setTasks(res.data);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchTasksData();
  }, [fetchTasksData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await createTask(formData);
      if (res.success) {
        setShowModal(false);
        setFormData({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
        fetchTasksData();
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      fetchTasksData();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(taskId);
      fetchTasksData();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const kanbanColumns = [
    { key: 'TODO', label: 'To Do', color: '#3b82f6' },
    { key: 'IN_PROGRESS', label: 'In Progress', color: '#8b5cf6' },
    { key: 'COMPLETED', label: 'Completed', color: '#10b981' },
    { key: 'CANCELLED', label: 'Cancelled', color: '#64748b' }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Task Management</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', margin: 0 }}>Track team assignments, priorities, and deadlines</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          <Plus size={16} /> Create Task
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setView('kanban')}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: view === 'kanban' ? '#2563eb' : '#fff', color: view === 'kanban' ? '#fff' : '#64748b', fontWeight: '600', cursor: 'pointer' }}
          >
            Kanban Board
          </button>
          <button
            onClick={() => setView('list')}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: view === 'list' ? '#2563eb' : '#fff', color: view === 'list' ? '#fff' : '#64748b', fontWeight: '600', cursor: 'pointer' }}
          >
            List View
          </button>
        </div>
      </div>

      {/* Kanban View */}
      {view === 'kanban' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {kanbanColumns.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key);
            return (
              <div key={col.key} style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: col.color }} />
                    {col.label}
                  </h3>
                  <span style={{ background: '#e2e8f0', color: '#475569', fontSize: '12px', fontWeight: '600', padding: '2px 8px', borderRadius: '12px' }}>
                    {colTasks.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {colTasks.map(task => (
                    <div key={task.id} style={{ background: '#fff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '6px' }}>{task.title}</div>
                      {task.description && <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 10px 0' }}>{task.description}</p>}
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '12px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: '600',
                          background: task.priority === 'URGENT' ? '#fef2f2' : task.priority === 'HIGH' ? '#fff7ed' : '#f1f5f9',
                          color: task.priority === 'URGENT' ? '#dc2626' : task.priority === 'HIGH' ? '#ea580c' : '#475569'
                        }}>
                          {task.priority}
                        </span>

                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          style={{ fontSize: '11px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        >
                          {kanbanColumns.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '12px 16px' }}>Task Title</th>
                <th style={{ padding: '12px 16px' }}>Priority</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Due Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0f172a' }}>{t.title}</td>
                  <td style={{ padding: '12px 16px' }}>{t.priority}</td>
                  <td style={{ padding: '12px 16px' }}>{t.status}</td>
                  <td style={{ padding: '12px 16px' }}>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button onClick={() => handleDelete(t.id)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={16} />
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '480px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Create New Task</h2>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Title</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Description</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Due Date</label>
                  <input type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600' }}>Save Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
