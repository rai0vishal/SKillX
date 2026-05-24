import React from 'react';

const NotificationCard = ({ notification, onClick }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'MESSAGE': return '💬';
      case 'REQUEST': return '🔁';
      case 'SESSION': return '📅';
      case 'REVIEW': return '⭐';
      case 'GIG': return '💼';
      case 'SYSTEM': return '⚠';
      case 'ADMIN': return '🛡';
      default: return '🔔';
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div
      onClick={() => onClick(notification)}
      className={`p-4 flex gap-3 cursor-pointer transition-colors border-b border-gray-50 last:border-0 hover:bg-[var(--bg-card)] ${
        !notification.isRead ? 'bg-indigo-50/30' : 'bg-[var(--bg-card)]'
      }`}
    >
      <div className="flex-shrink-0 text-xl w-10 h-10 bg-[var(--bg-card)] rounded-full flex items-center justify-center">
        {getIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm text-gray-800 ${!notification.isRead ? 'font-semibold' : ''}`}>
          {notification.message}
        </p>
        <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{timeAgo(notification.createdAt)}</span>
      </div>
      {!notification.isRead && (
        <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
      )}
    </div>
  );
};

export default NotificationCard;
