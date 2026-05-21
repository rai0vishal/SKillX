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
    const handleSessionUpdated = (data) => {
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center items-center h-48 animate-pulse">
        <div className="w-12 h-12 bg-gray-200 rounded-full mb-3"></div>
        <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
        <div className="w-24 h-3 bg-gray-100 rounded"></div>
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
    <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 rounded-2xl shadow-xl p-1 relative overflow-hidden mb-8">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
      
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/20">
        
        {/* Left Section: Details */}
        <div className="flex-1 text-white">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-indigo-500/30 text-indigo-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Upcoming Session
            </span>
            {joinState === 'soon' && (
              <span className="bg-yellow-500/90 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse shadow-sm">
                ⚠ Starting Soon
              </span>
            )}
            {joinState === 'live' && (
              <span className="bg-red-500/90 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse shadow-sm flex items-center gap-1">
                <span className="w-2 h-2 bg-white rounded-full"></span> Session Live
              </span>
            )}
            {joinState === 'completed' && (
              <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                ✓ Session Completed
              </span>
            )}
          </div>

          <h3 className="text-2xl font-bold mt-3 capitalize text-white">
            {myName} <span className="text-indigo-300 font-light mx-2">↔</span> {otherName}
          </h3>

          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-indigo-100/80 text-sm font-medium">
            <div className="flex items-center gap-1.5">
              <span className="opacity-70">Date:</span>
              <span className="text-white">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="opacity-70">Time:</span>
              <span className="text-white">{formattedTime}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="opacity-70">Mode:</span>
              <span className="text-white">{nearestSession.mode}</span>
            </div>
          </div>
        </div>

        {/* Right Section: Countdown & Actions */}
        <div className="flex flex-col items-center md:items-end w-full md:w-auto bg-black/20 p-5 rounded-2xl border border-white/10">
          <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-2">
            {joinState === 'upcoming' || joinState === 'soon' ? 'Starts In:' : 'Status:'}
          </p>
          <div className="text-3xl md:text-4xl font-black text-white tabular-nums tracking-tight font-mono mb-5 drop-shadow-md">
            {timeLeft || '00h 00m'}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {canJoin && isVideo && joinState !== 'completed' ? (
              <Link
                to={`/session/${nearestSession._id}`}
                className="w-full sm:w-auto px-8 py-3 bg-white text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 text-center flex items-center justify-center gap-2"
              >
                🎥 {joinState === 'live' ? 'Join Now' : 'Join Session'}
              </Link>
            ) : (
              <button
                disabled
                className="w-full sm:w-auto px-8 py-3 bg-white/10 text-white/50 font-bold rounded-xl border border-white/10 cursor-not-allowed text-center flex items-center justify-center gap-2"
              >
                {joinState === 'completed' ? '✓ Completed' : '🎥 Upcoming'}
              </button>
            )}

            <button
              onClick={onViewAll}
              className="w-full sm:w-auto px-6 py-3 bg-transparent hover:bg-white/10 text-indigo-100 font-semibold rounded-xl border border-indigo-300/30 transition-colors text-sm text-center"
            >
              View All
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SessionCountdownCard;
