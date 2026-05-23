import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const SessionCard = ({ session, onReschedule, onCancel, onComplete, onReview, userEmail, onAccept, onSuggestAlternative }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (session.status !== 'Scheduled' && session.status !== 'Rescheduled') {
      setTimeLeft('');
      return;
    }

    const sessionTime = new Date(`${session.date}T${session.time}`).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = sessionTime - now;

      if (distance < 0) {
        setTimeLeft('Session Started');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`In ${days} day${days > 1 ? 's' : ''}`);
      } else if (hours > 0) {
        setTimeLeft(`In ${hours} hour${hours > 1 ? 's' : ''}`);
      } else {
        setTimeLeft(`In ${minutes} minute${minutes > 1 ? 's' : ''}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, [session.date, session.time, session.status]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled':
      case 'Rescheduled':
        return 'bg-blue-100 text-blue-700';
      case 'Completed':
        return 'bg-green-100 text-green-700';
      case 'Cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const isActive = session.status === 'Scheduled' || session.status === 'Rescheduled';
  const isPending = session.status === 'Pending';
  const isCompleted = session.status === 'Completed';
  const hasReviewed = session.reviewedBy && session.reviewedBy.includes(userEmail);
  const isReceiver = session.requestedBy && session.requestedBy !== userEmail;

  // Join button logic — only Video Sessions within the 15-min early window
  const isVideoSession = session.mode === 'Video Session';
  const canJoinNow = (() => {
    if (!isActive || !isVideoSession) return false;
    const sessionTime = new Date(`${session.date}T${session.time}`).getTime();
    const durationMs = parseInt(session.duration || '60') * 60 * 1000;
    const now = Date.now();
    const earlyWindow = 15 * 60 * 1000;
    const lateWindow = durationMs + 30 * 60 * 1000;
    return now >= sessionTime - earlyWindow && now <= sessionTime + lateWindow;
  })();

  const userRoles = session.exchangeRoles?.[userEmail] || { mentorSkills: [], learnerSkills: [] };
  const hasRoles = userRoles.mentorSkills.length > 0 || userRoles.learnerSkills.length > 0;

  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 hover:shadow-md transition-shadow group flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-gray-800 flex items-center gap-1.5 text-sm">
            📅 {new Date(session.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </h4>
          <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>
            with {session.partnerName || session.partner?.name || session.participants?.find(p => p !== userEmail)?.split('@')[0] || 'Unknown'}
          </p>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">
            {new Date(`1970-01-01T${session.time}`).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} • {session.duration} • {session.mode}
          </p>

          {hasRoles && (
            <div className="flex flex-wrap gap-1 mt-2">
              {userRoles.mentorSkills.map((skill, idx) => (
                <span key={`mentor-${idx}`} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                  {skill} Mentor
                </span>
              ))}
              {userRoles.learnerSkills.map((skill, idx) => (
                <span key={`learner-${idx}`} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-700">
                  {skill} Learner
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${getStatusColor(session.status)}`}>
            {session.status === 'Pending'
              ? session.requestedBy === userEmail
                ? 'Awaiting their confirmation'
                : 'Confirm your slot'
              : session.status}
          </span>
          {isActive && timeLeft && (
            <span className={`text-[10px] font-bold ${timeLeft === 'Session Started' ? 'text-green-600 animate-pulse' : 'text-orange-500'}`}>
              ⏳ {timeLeft}
            </span>
          )}
        </div>
      </div>

      {session.notes && (
        <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
          <p className="text-sm text-gray-600 italic">"{session.notes}"</p>
        </div>
      )}

      {isActive && (
        <div className="flex gap-2 pt-2 border-t border-gray-50 mt-4">
          {canJoinNow ? (
            <Link
              to={`/session/${session._id}`}
              className="flex-1 text-sm font-semibold py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-center flex items-center justify-center gap-1.5 shadow-sm"
            >
              🎥 Join Session
            </Link>
          ) : isVideoSession ? (
            <button
              disabled
              className="flex-1 text-sm font-medium py-2 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed relative group"
            >
              🎥 Join Session
              <span className="absolute bottom-full mb-2 hidden group-hover:block w-max bg-gray-800 text-white text-xs px-2 py-1 rounded left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
                Available 15 min before session time
              </span>
            </button>
          ) : (
            <button
              disabled
              className="flex-1 text-sm font-medium py-2 rounded-lg bg-indigo-50 text-indigo-400 cursor-not-allowed relative group"
            >
              Join
              <span className="absolute bottom-full mb-2 hidden group-hover:block w-max bg-gray-800 text-white text-xs px-2 py-1 rounded left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
                Set mode to "Video Session" to join via SkillX
              </span>
            </button>
          )}

          <button
            onClick={() => onReschedule(session)}
            className="flex-1 text-sm font-medium py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Reschedule
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => onComplete(session._id)}
              title="Mark Completed"
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors"
            >
              ✓
            </button>
            <button
              onClick={() => onCancel(session._id)}
              title="Cancel Session"
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Pending session — Accept / Suggest Alternative / Reject */}
      {isPending && (
        <div className="flex gap-2 pt-2 border-t border-gray-50 mt-4">
          {isReceiver ? (
            <>
              <button
                onClick={() => onAccept(session._id)}
                className="flex-1 text-sm font-semibold py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm"
              >
                ✓ Accept
              </button>
              {onSuggestAlternative && (
                <button
                  onClick={() => onSuggestAlternative(session)}
                  className="flex-1 text-sm font-semibold py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  Suggest Alternative
                </button>
              )}
              <button
                onClick={() => onCancel(session._id)}
                className="px-3 text-sm font-semibold py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                Reject
              </button>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-between">
              <span className="text-sm font-medium text-gray-500 italic">Waiting for their confirmation…</span>
              <button
                onClick={() => onCancel(session._id)}
                className="text-xs font-semibold py-1.5 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
              >
                Cancel Request
              </button>
            </div>
          )}
        </div>
      )}

      {isCompleted && !hasReviewed && onReview && (
        <div className="pt-3 border-t border-gray-50 mt-4">
          <button
            onClick={() => onReview(session)}
            className="w-full text-sm font-semibold py-2.5 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-400 text-white hover:from-yellow-500 hover:to-orange-500 transition-all shadow-sm flex items-center justify-center gap-2"
          >
            ⭐ Rate This Session
          </button>
        </div>
      )}

      {isCompleted && hasReviewed && (
        <div className="pt-3 border-t border-gray-50 mt-4">
          <p className="text-xs text-center text-green-600 font-medium">✅ You reviewed this session</p>
        </div>
      )}
    </div>
  );
};

export default SessionCard;
