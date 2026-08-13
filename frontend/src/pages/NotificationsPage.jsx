import React, { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../services/notificationService';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [filterRead, setFilterRead] = useState('all'); // all, unread
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filterRead === 'unread') params.isRead = 'false';

      const res = await getNotifications(params);
      if (res.success) {
        setNotifications(res.data);
        setTotalPages(res.meta.totalPages);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filterRead]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Notifications</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', margin: 0 }}>Manage real-time alerts and user activity updates</p>
        </div>

        <button
          onClick={handleMarkAllRead}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: '#eff6ff',
            color: '#2563eb',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <CheckCheck size={16} /> Mark All as Read
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
        <button
          onClick={() => { setFilterRead('all'); setPage(1); }}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: 'transparent',
            borderBottom: filterRead === 'all' ? '2px solid #2563eb' : '2px solid transparent',
            color: filterRead === 'all' ? '#2563eb' : '#64748b',
            fontWeight: filterRead === 'all' ? '600' : '500',
            cursor: 'pointer'
          }}
        >
          All Notifications
        </button>
        <button
          onClick={() => { setFilterRead('unread'); setPage(1); }}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: 'transparent',
            borderBottom: filterRead === 'unread' ? '2px solid #2563eb' : '2px solid transparent',
            color: filterRead === 'unread' ? '#2563eb' : '#64748b',
            fontWeight: filterRead === 'unread' ? '600' : '500',
            cursor: 'pointer'
          }}
        >
          Unread Only
        </button>
      </div>

      {/* Notifications List */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No notifications found.</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid #f1f5f9',
                background: n.isRead ? '#fff' : '#f0f9ff',
                transition: 'background 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{
                  padding: '10px',
                  borderRadius: '50%',
                  background: n.isRead ? '#f1f5f9' : '#dbeafe',
                  color: n.isRead ? '#64748b' : '#2563eb',
                  marginTop: '2px'
                }}>
                  <Bell size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    title="Mark as read"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#2563eb',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '4px'
                    }}
                  >
                    <CheckCircle size={18} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(n.id)}
                  title="Delete notification"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#ef4444',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '4px'
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}
          >
            Previous
          </button>
          <span style={{ padding: '6px 12px', fontSize: '14px', color: '#64748b' }}>Page {page} of {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
