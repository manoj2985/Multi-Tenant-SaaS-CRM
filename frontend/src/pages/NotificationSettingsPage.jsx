import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2 } from 'lucide-react';
import { getPreferences, updatePreferences } from '../services/notificationService';

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState({
    taskNotifications: true,
    leadNotifications: true,
    dealNotifications: true,
    meetingNotifications: true,
    systemNotifications: true
  });
  const [loading, setLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const res = await getPreferences();
        if (res.success && res.data) {
          setPrefs(res.data);
        }
      } catch (err) {
        console.error('Failed to load notification preferences:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPreferences();
  }, []);

  const handleToggle = (key) => {
    setPrefs(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    try {
      const res = await updatePreferences({
        taskNotifications: prefs.taskNotifications,
        leadNotifications: prefs.leadNotifications,
        dealNotifications: prefs.dealNotifications,
        meetingNotifications: prefs.meetingNotifications,
        systemNotifications: prefs.systemNotifications
      });
      if (res.success) {
        setSavedMessage(true);
        setTimeout(() => setSavedMessage(false), 3000);
      }
    } catch (err) {
      console.error('Failed to update preferences:', err);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading notification settings...</div>;
  }

  const toggleItems = [
    { key: 'taskNotifications', title: 'Task Notifications', desc: 'Receive real-time alerts when tasks are assigned, due, or updated' },
    { key: 'leadNotifications', title: 'Lead Notifications', desc: 'Receive alerts when new sales leads are assigned to you' },
    { key: 'dealNotifications', title: 'Deal & Pipeline Notifications', desc: 'Receive updates when deal stages change or deals are assigned' },
    { key: 'meetingNotifications', title: 'Meeting Notifications', desc: 'Receive reminders for upcoming scheduled customer meetings' },
    { key: 'systemNotifications', title: 'System & Announcement Alerts', desc: 'Receive essential system updates and workspace announcements' }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings size={24} color="#2563eb" /> Notification Preferences
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', margin: 0 }}>
          Customize which real-time notification categories you want to receive across the app
        </p>
      </div>

      {savedMessage && (
        <div style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} /> Notification preferences updated successfully!
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
        {toggleItems.map((item) => (
          <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>{item.title}</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{item.desc}</div>
            </div>

            <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px' }}>
              <input
                type="checkbox"
                checked={prefs[item.key] ?? true}
                onChange={() => handleToggle(item.key)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: prefs[item.key] ? '#2563eb' : '#cbd5e1',
                  transition: '.3s',
                  borderRadius: '34px'
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    content: '""',
                    height: '20px',
                    width: '20px',
                    left: prefs[item.key] ? '24px' : '3px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    transition: '.3s',
                    borderRadius: '50%'
                  }}
                />
              </span>
            </label>
          </div>
        ))}

        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <button
            onClick={handleSave}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <Save size={16} /> Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
