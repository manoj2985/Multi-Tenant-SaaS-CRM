import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { getUnreadCount, getNotifications, markAsRead, markAllAsRead } from '../services/notificationService';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);

  const fetchUnread = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getUnreadCount();
      if (res.success) {
        setUnreadCount(res.unreadCount);
      }
    } catch {
      // Ignore initial unread fetch error if unauthenticated
    }
  }, [user]);

  const fetchRecent = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getNotifications({ page: 1, limit: 5 });
      if (res.success) {
        setRecentNotifications(res.data);
      }
    } catch {
      // Ignore initial notifications fetch error
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setUnreadCount(0);
      setRecentNotifications([]);
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // Server socket URL
    const socketUrl = window.location.origin.includes('localhost')
      ? 'http://localhost:5000'
      : window.location.origin;

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      // Connection established
    });

    newSocket.on('notification', (newNotif) => {
      setUnreadCount(prev => prev + 1);
      setRecentNotifications(prev => [newNotif, ...prev.slice(0, 4)]);
    });

    setSocket(newSocket);
    fetchUnread();
    fetchRecent();

    return () => {
      newSocket.disconnect();
    };
  }, [user, fetchUnread, fetchRecent]);

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setRecentNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setRecentNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  return (
    <SocketContext.Provider value={{
      socket,
      unreadCount,
      recentNotifications,
      refreshUnreadCount: fetchUnread,
      refreshNotifications: fetchRecent,
      markAsRead: handleMarkAsRead,
      markAllAsRead: handleMarkAllAsRead
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
