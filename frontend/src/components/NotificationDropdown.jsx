import React from 'react';
import NotificationCard from './NotificationCard';
import NotificationTabs from './NotificationTabs';

const NotificationDropdown = ({ 
  notifications, 
  activeTab, 
  onTabChange, 
  onMarkAllRead, 
  onClearAll, 
  onNotificationClick,
  loading
}) => {
  const filteredNotifications = activeTab === 'All' 
    ? notifications 
    : notifications.filter(n => {
        if (activeTab === 'Messages') return n.type === 'MESSAGE';
        if (activeTab === 'Sessions') return n.type === 'SESSION';
        if (activeTab === 'Reviews') return n.type === 'REVIEW';
        if (activeTab === 'System') return ['SYSTEM', 'ADMIN'].includes(n.type);
        return true;
      });

  return (
    <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="font-bold text-gray-800 text-lg">Notifications</h3>
      </div>

      <NotificationTabs activeTab={activeTab} onTabChange={onTabChange} />

      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-sm">No notifications here</p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <NotificationCard 
              key={notification._id} 
              notification={notification} 
              onClick={onNotificationClick}
            />
          ))
        )}
      </div>

      <div className="p-3 border-t border-gray-100 bg-gray-50/50 flex justify-between gap-2">
        <button 
          onClick={onMarkAllRead}
          className="flex-1 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          Mark All Read
        </button>
        <button 
          onClick={onClearAll}
          className="flex-1 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
