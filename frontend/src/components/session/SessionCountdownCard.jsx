import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api.js';
import { getSocket } from '../../config/socket.js';

const SessionCountdownCard = ({ userEmail, onViewAll }) => {
  const [nearestSession, setNearestSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [joinState, setJoinState] = useState('upcoming'); // 'upcoming', 'soon', 'live', 'completed'
  const [canJoin, setCanJoin] = useState(false);

  // Use refs to prevent duplicate notifications
  const notified30m = useRef(false);
  const notified10m = useRef(false);
  const notified0m = useRef(false);

  const fetchUpcomingSession = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/sessions/upcoming?email=${encodeURIComponent(userEmail)}`);
      if (res.status === 404) {
        setNearestSession(null);
      } else if (res.ok) {
        const data = await res.json();
        setNearestSession(data);
        // reset notifications if a new session is fetched
        notified30m.current = false;
        notified10m.current = false;
        notified0m.current = false;
      } else {
        throw new Error('Failed to fetch upcoming session');
      }
    } catch (err) {
      console.error(err);
      setError('Could not load countdown.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail) {
      fetchUpcomingSession();
    }
  }, [userEmail]);

  // Real-time: re-fetch when any session involving this user changes
  useEffect(() => {
    if (!userEmail) return;
    const socket = getSocket();
    const handleSessionUpdated = () => {
      // Re-fetch to get the latest upcoming session
      fetchUpcomingSession();
    };
    socket.on('sessionUpdated', handleSessionUpdated);
    return () => {
      socket.off('sessionUpdated', handleSessionUpdated);
    };
  }, [userEmail]);

  useEffect(() => {
    if (!nearestSession || nearestSession.status === 'Completed' || nearestSession.status === 'Cancelled') {
      return;
    }

    const sessionTime = new Date(`${nearestSession.date}T${nearestSession.time}`).getTime();
    const durationMs = parseInt(nearestSession.duration || '60') * 60 * 1000;

    const updateCountdown = () => {
      const now = Date.now();
      const distance = sessionTime - now;

      // Completed
      if (now > sessionTime + durationMs) {
        setTimeLeft('Completed');
        setJoinState('completed');
        setCanJoin(false);
        return;
      }

      // Live
      if (distance <= 0 && now <= sessionTime + durationMs) {
        setTimeLeft('Session Live');
        setJoinState('live');
        setCanJoin(true);
        if (!notified0m.current) {
          alert('📅 Your session is starting NOW!');
          notified0m.current = true;
        }
        return;
      }

      // Upcoming
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      // Join button logic (15 mins early)
      if (distance <= 15 * 60 * 1000) {
        setCanJoin(true);
      } else {
        setCanJoin(false);
      }

      // Notifications
      if (distance <= 30 * 60 * 1000 && distance > 29 * 60 * 1000 && !notified30m.current) {
        alert('📅 Session starts in 30 mins');
        notified30m.current = true;
      }
      if (distance <= 10 * 60 * 1000 && distance > 9 * 60 * 1000 && !notified10m.current) {
        alert('📅 Session starts in 10 mins');
        notified10m.current = true;
      }

      // Text Formatting logic
      if (days > 1) {
        setTimeLeft(`Starts in ${days} days`);
        setJoinState('upcoming');
      } else if (days === 1) {
        setTimeLeft(`Starts Tomorrow`);
        setJoinState('upcoming');
      } else if (hours > 0 || minutes >= 60) {
        // e.g. 05h 17m
        const hStr = hours.toString().padStart(2, '0');
        const mStr = minutes.toString().padStart(2, '0');
        setTimeLeft(`${hStr}h ${mStr}m`);
        setJoinState('upcoming');
      } else if (minutes > 0 || seconds > 0) {
        // e.g. 00h 42m (or showing seconds if we want, but requirement says 00h 42m except for <1h wait)
        // Wait, the prompt said: 
        // Session <24 hours -> 05h 17m
        // Session <1 hour -> 00h 42m
        // Dashboard "Starts in: 01h 23m 18s". 
        // I will just show HHh MMm SSs if it's less than 24h
        const hStr = hours.toString().padStart(2, '0');
        const mStr = minutes.toString().padStart(2, '0');
        const sStr = seconds.toString().padStart(2, '0');
        
        setTimeLeft(`${hStr}h ${mStr}m ${sStr}s`);
        
        if (hours === 0) {
          setJoinState('soon');
        } else {
          setJoinState('upcoming');
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000); // Update every second to show seconds

    return () => clearInterval(interval);
  }, [nearestSession]);

  if (loading) {
    return (
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center items-center h-48 animate-pulse">
        <div className="w-12 h-12 bg-gray-200 rounded-full mb-3"></div>
        <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
        <div className="w-24 h-3 bg-[var(--bg-card)] rounded"></div>
      </div>
    );
  }

  if (error || !nearestSession) {
    // If no upcoming sessions, we don't necessarily want a big empty block,
    // but we can show a placeholder or hide entirely. Returning null keeps it clean.
    return null;
  }

  const otherParticipant = nearestSession.participants?.find(p => p !== userEmail) || 'Unknown';
  // Attempt to split email for a display name if we don't have full profiles loaded here
  const otherName = otherParticipant.split('@')[0];
  const myName = userEmail.split('@')[0];

  const dateObj = new Date(nearestSession.date);
  const formattedDate = dateObj.toLocaleDateString(undefined, { day: 'numeric', month: 'long' });
  const formattedTime = new Date(`1970-01-01T${nearestSession.time}`).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  const isVideo = nearestSession.mode === 'Video Session';

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-md p-4 relative overflow-hidden mb-6 text-white group hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
        
        {/* Left Section: Details */}
        <div className="flex-1 w-full md:w-auto">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">
              Upcoming Session
            </span>
            {joinState === 'soon' && (
              <span className="bg-yellow-500/20 text-yellow-100 border border-yellow-500/50 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                ⚠ Starting Soon
              </span>
            )}
            {joinState === 'live' && (
              <span className="bg-red-500/20 text-red-100 border border-red-500/50 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span> Live
              </span>
            )}
            {joinState === 'completed' && (
              <span className="bg-green-500/20 text-green-100 border border-green-500/50 text-[10px] font-bold px-2 py-0.5 rounded-full">
                ✓ Completed
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold capitalize text-white mb-2">
            {myName} <span className="text-indigo-300 font-light mx-1">↔</span> {otherName}
          </h3>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-indigo-100 text-xs font-medium">
            <div className="flex items-center gap-1">
              <span>📅</span> <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🕒</span> <span>{formattedTime}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🎥</span> <span>{nearestSession.mode}</span>
            </div>
          </div>
        </div>

        {/* Right Section: Countdown & Actions */}
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
          <div className="text-center md:text-right flex-1">
            <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-0.5">
              {joinState === 'upcoming' || joinState === 'soon' ? '⏳ Starts In:' : 'Status:'}
            </p>
            <div className="text-2xl font-black tabular-nums tracking-tight font-mono drop-shadow">
              {timeLeft || '00h 00m'}
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {canJoin && isVideo && joinState !== 'completed' ? (
              <Link
                to={`/session/${nearestSession._id}`}
                className="flex-1 md:flex-none px-4 py-2 bg-[var(--bg-card)] text-indigo-600 hover:bg-indigo-50 text-sm font-bold rounded-lg shadow-sm transition-transform hover:scale-105 active:scale-95 flex items-center justify-center whitespace-nowrap"
              >
                {joinState === 'live' ? 'Join Now' : 'Join Session'}
              </Link>
            ) : (
              <button
                disabled
                className="flex-1 md:flex-none px-4 py-2 bg-[var(--bg-card)]/10 text-white/50 text-sm font-bold rounded-lg border border-white/10 cursor-not-allowed flex items-center justify-center whitespace-nowrap"
              >
                {joinState === 'completed' ? 'Completed' : 'Upcoming'}
              </button>
            )}

            <button
              onClick={onViewAll}
              className="flex-1 md:flex-none px-4 py-2 bg-transparent hover:bg-[var(--bg-card)]/10 text-white font-semibold rounded-lg border border-white/20 transition-colors text-sm whitespace-nowrap"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionCountdownCard;
