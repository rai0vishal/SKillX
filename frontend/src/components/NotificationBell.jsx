import React, { useState, useEffect, useRef } from 'react';
import NotificationDropdown from './NotificationDropdown';
import { connectSocket, getSocket } from '../config/socket';
import { API_BASE_URL } from '../config/api.js';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(false);
  
  const dropdownRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const userEmail = user?.email;

  // Initialize Socket and Fetch Initial Data
  useEffect(() => {
    if (!userEmail) return;

    // Connect socket context
    const socket = connectSocket(userEmail);

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        // Fetch unread count
        const countRes = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
          headers: { 'user-email': userEmail }
        });
        const countData = await countRes.json();
        setUnreadCount(countData.count || 0);

        // Fetch notifications list
        const notifRes = await fetch(`${API_BASE_URL}/api/notifications`, {
          headers: { 'user-email': userEmail }
        });
        const notifData = await notifRes.json();
        setNotifications(notifData);
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    // Socket Listeners
    socket.on('newNotification', (notification) => {
      setNotifications(prev => [notification, ...prev.filter(n => n._id !== notification._id)]);
      // Show urgent toast if needed (simplified: native alert or a custom toast could go here)
      if (['REVIEW', 'SESSION'].includes(notification.type)) {
        // Here you would integrate with your toast provider
        console.log(`URGENT: ${notification.message}`);
      }
    });

    socket.on('notificationCountUpdated', (count) => {
      setUnreadCount(count);
    });

    return () => {
      socket.off('newNotification');
      socket.off('notificationCountUpdated');
    };
  }, [userEmail]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await fetch(`${API_BASE_URL}/api/notifications/${notification._id}/read`, {
          method: 'PUT',
          headers: { 'user-email': userEmail }
        });
        setNotifications(prev => 
          prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
        );
      } catch (error) {
        console.error('Failed to mark read', error);
      }
    }
    setIsOpen(false);
    // Optionally: navigate based on notification.type or referenceId here
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { 'user-email': userEmail }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all read', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/archive`, {
        method: 'PUT',
        headers: { 'user-email': userEmail }
      });
      setNotifications([]);
      setUnreadCount(0);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to archive notifications', error);
    }
  };

  if (!userEmail) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        className="relative p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown 
          notifications={notifications}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onMarkAllRead={handleMarkAllRead}
          onClearAll={handleClearAll}
          onNotificationClick={handleNotificationClick}
          loading={loading}
        />
      )}
    </div>
  );
};

export default NotificationBell;
