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

  const ALL_BADGES = [
    { id: 'first_exchange', name: 'First Exchange', icon: '🏆', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { id: 'session_master', name: 'Session Master', icon: '🔥', color: 'bg-red-100 text-red-700 border-red-200' },
    { id: 'top_rated', name: 'Top Rated User', icon: '⭐', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 'skill_explorer', name: 'Skill Explorer', icon: '🚀', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Achievements & Badges
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {ALL_BADGES.map((badgeDef) => {
          const isUnlocked = badges.some((b) => b.id === badgeDef.id);
          
          return (
            <div 
              key={badgeDef.id} 
              className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 ${
                isUnlocked 
                  ? `${badgeDef.color} shadow-sm hover:-translate-y-1` 
                  : 'bg-gray-50 border-gray-100 opacity-50 grayscale'
              }`}
            >
              <div className="text-3xl mb-2">{badgeDef.icon}</div>
              <p className={`text-xs font-bold text-center leading-tight ${isUnlocked ? '' : 'text-gray-500'}`}>
                {badgeDef.name}
              </p>
              {!isUnlocked && (
                <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-widest font-semibold">Locked</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Achievements;
