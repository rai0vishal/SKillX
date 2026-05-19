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
      <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span>⚡</span> Recent Activity
      </h3>

      {activities.length === 0 ? (
        <div className="text-center py-6 text-gray-400 text-sm">
          No recent activity to show.
        </div>
      ) : (
        <div className="relative border-l-2 border-gray-100 ml-4 space-y-8 pb-4">
          {activities.map((activity) => (
            <div key={activity.id} className="relative pl-6">
              {/* Timeline Dot */}
              <div className={`absolute -left-5 top-0 w-10 h-10 rounded-full flex items-center justify-center text-lg border-4 border-white ${activity.color} shadow-sm z-10`}>
                {activity.icon}
              </div>

              {/* Content */}
              <div className="bg-gray-50 rounded-xl p-4 ml-2 hover:bg-gray-100 transition-colors">
                <p className="font-semibold text-gray-800">{activity.title}</p>
                <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-2 font-medium">
                  {new Date(activity.date).toLocaleDateString(undefined, { 
                    month: 'short', 
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
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
