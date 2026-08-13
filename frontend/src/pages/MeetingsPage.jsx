import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Clock, MapPin, Link as LinkIcon, AlertTriangle, Trash2 } from 'lucide-react';
import { getMeetings, createMeeting, deleteMeeting } from '../services/meetingService';
import { getCustomers } from '../services/customerService';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [conflictError, setConflictError] = useState('');
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    location: '',
    meetingLink: '',
    notes: ''
  });

  const fetchMeetingsData = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, cRes] = await Promise.all([
        getMeetings(),
        getCustomers({ limit: 100 })
      ]);
      if (mRes.success) setMeetings(mRes.data);
      if (cRes.success) setCustomers(cRes.data);
    } catch (err) {
      console.error('Failed to load meetings data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetingsData();
  }, [fetchMeetingsData]);

  const handleSchedule = async (e) => {
    e.preventDefault();
    setConflictError('');
    try {
      const res = await createMeeting(formData);
      if (res.success) {
        setShowModal(false);
        setFormData({
          title: '',
          customerId: '',
          date: new Date().toISOString().split('T')[0],
          startTime: '10:00',
          endTime: '11:00',
          location: '',
          meetingLink: '',
          notes: ''
        });
        fetchMeetingsData();
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.errorCode === 'MEETING_CONFLICT') {
        setConflictError(err.response.data.message);
      } else {
        setConflictError('Failed to schedule meeting. Check time ranges and inputs.');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel this scheduled meeting?')) return;
    try {
      await deleteMeeting(id);
      fetchMeetingsData();
    } catch (err) {
      console.error('Failed to cancel meeting:', err);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Meetings & Schedule</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', margin: 0 }}>Manage customer appointments and overlap conflict detection</p>
        </div>

        <button
          onClick={() => { setConflictError(''); setShowModal(true); }}
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
          <Plus size={16} /> Schedule Meeting
        </button>
      </div>

      {/* Meetings Roster */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading scheduled meetings...</div>
        ) : meetings.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No meetings scheduled yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', divideY: '1px solid #f1f5f9' }}>
            {meetings.map((m) => (
              <div key={m.id} style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '10px', color: '#2563eb' }}>
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{m.title}</h3>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} /> {new Date(m.date).toLocaleDateString()} ({m.startTime} - {m.endTime})
                      </span>
                      {m.customer && <span style={{ fontWeight: '600', color: '#3b82f6' }}>Customer: {m.customer.name}</span>}
                    </div>
                  </div>
                </div>

                <button onClick={() => handleDelete(m.id)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '8px' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '520px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Schedule Customer Meeting</h2>

            {conflictError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} /> {conflictError}
              </div>
            )}

            <form onSubmit={handleSchedule}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Meeting Title</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Select Customer</label>
                <select required value={formData.customerId} onChange={e => setFormData({ ...formData, customerId: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                  <option value="">Choose Customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.companyName || c.email})</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Date</label>
                  <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Start Time</label>
                  <input type="text" required placeholder="10:00" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>End Time</label>
                  <input type="text" required placeholder="11:00" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600' }}>Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
