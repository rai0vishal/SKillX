import React from 'react';

const ParticipantsPanel = ({ participants, currentUserEmail, joinedAt }) => {
  const formatTime = (ts) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col gap-3">
      {participants.map((email) => {
        const isYou = email === currentUserEmail;
        return (
          <div key={email} className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
              {email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {email} {isYou && <span className="text-indigo-400 text-xs">(You)</span>}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">
                Joined at {formatTime(joinedAt)}
              </p>
            </div>
            {/* Online dot */}
            <div className="flex-shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 block" title="Online" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ParticipantsPanel;
