import React from 'react';

const Achievements = ({ badges, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[200px] animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-16 h-16 bg-gray-200 rounded-full"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>🎖️</span> Achievements & Badges
      </h3>
      
      {badges.length === 0 ? (
        <div className="text-center py-6 text-gray-400 text-sm">
          <p>No badges earned yet.</p>
          <p className="text-xs mt-1">Complete your first session to earn a badge!</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {badges.map((badge) => (
            <div 
              key={badge.id} 
              className={`flex flex-col items-center justify-center p-4 rounded-xl border border-gray-50 hover:-translate-y-1 transition-transform shadow-sm ${badge.color} bg-opacity-20`}
            >
              <div className="text-3xl mb-2">{badge.icon}</div>
              <p className="text-xs font-bold text-center max-w-[80px] leading-tight">{badge.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Achievements;
