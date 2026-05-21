import React from 'react';

const RecentActivity = ({ activities, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0"></div>
              <div className="space-y-2 w-full">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Recent Activity
      </h3>

      {activities.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '36px 16px',
          background: '#fafafa',
          borderRadius: '10px',
          border: '1px dashed #e5e7eb'
        }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '10px' }}>🌱</div>
          <div style={{ fontWeight: 600, color: '#6b7280', fontSize: '0.9rem', marginBottom: '4px' }}>
            No activity yet
          </div>
          <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
            Start a skill exchange to see your activity here.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3 group">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm ${activity.color} shadow-sm group-hover:scale-110 transition-transform`}>
                {activity.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-800 leading-tight mb-0.5">{activity.title}</p>
                <p className="text-xs text-gray-600 line-clamp-1">{activity.description}</p>
                <p className="text-[10px] text-gray-400 mt-1 font-medium">
                  {new Date(activity.date).toLocaleDateString(undefined, { 
                    day: 'numeric',
                    month: 'short',
                  })} • {new Date(activity.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
