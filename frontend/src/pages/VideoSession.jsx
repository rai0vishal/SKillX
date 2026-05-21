import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import VideoPlayer from '../components/video/VideoPlayer';
import SessionControls from '../components/video/SessionControls';
import Timer from '../components/video/Timer';
import SessionChat from '../components/video/SessionChat';
import NotesPanel from '../components/video/NotesPanel';
import ParticipantsPanel from '../components/video/ParticipantsPanel';
import ReviewModal from '../components/ReviewModal';

import { API_BASE_URL, SOCKET_URL } from '../config/api.js';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const VideoSession = () => {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const userEmail = user?.email;

  // ── Session state ──────────────────────────────────────────────────────────
  const [session, setSession] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [pageStatus, setPageStatus] = useState('loading'); // loading | joining | live | error | expired | denied | too-early
  const [errorMessage, setErrorMessage] = useState('');
  const [sessionStartTime, setSessionStartTime] = useState(null);

  // ── Media state ───────────────────────────────────────────────────────────
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // connecting | waiting | connected | disconnected

  // ── UI panels ─────────────────────────────────────────────────────────────
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [notification, setNotification] = useState('');
  
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [activeSideTab, setActiveSideTab] = useState('chat');

  // ── Refs (not state — no re-render needed) ────────────────────────────────
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const remoteSocketIdRef = useRef(null);
  const hasInitiatedOffer = useRef(false);
  const hasJoinedRef = useRef(false);
  const isChatOpenRef = useRef(isChatOpen);

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  // ── Timer display (derived from Timer component) ──────────────────────────
  const [timerDisplay, setTimerDisplay] = useState('00:00');

  // Update timer display every second
  useEffect(() => {
    if (!sessionStartTime) return;
    const tick = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - sessionStartTime) / 1000));
      const h = Math.floor(elapsed / 3600);
      const m = Math.floor((elapsed % 3600) / 60);
      const s = elapsed % 60;
      const pad = (n) => String(n).padStart(2, '0');
      setTimerDisplay(h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [sessionStartTime]);

  // ── Notification helper ───────────────────────────────────────────────────
  const showNotification = useCallback((msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  }, []);

  // ── Create peer connection ────────────────────────────────────────────────
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) => {
      if (e.candidate && remoteSocketIdRef.current) {
        socketRef.current?.emit('rtc:ice-candidate', {
          candidate: e.candidate,
          targetSocketId: remoteSocketIdRef.current,
        });
      }
    };

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
      setConnectionStatus('connected');
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        setConnectionStatus('disconnected');
        showNotification('⚠️ Connection lost. The other participant may have left.');
      } else if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setConnectionStatus('connected');
      }
    };

    // Add all local tracks to the peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    peerRef.current = pc;
    return pc;
  }, [showNotification]);

  // ── Acquire media ─────────────────────────────────────────────────────────
  const acquireMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        // Try audio-only fallback
        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          setLocalStream(audioOnly);
          localStreamRef.current = audioOnly;
          setIsCameraOff(true);
          showNotification('📷 Camera access denied — joining with audio only.');
          return audioOnly;
        } catch {
          setPageStatus('denied');
          setErrorMessage('Microphone access is required to join the session. Please allow mic access and try again.');
          return null;
        }
      }
      setPageStatus('error');
      setErrorMessage('Could not access camera or microphone. Please check your device settings.');
      return null;
    }
  };

  // ── Join the session ──────────────────────────────────────────────────────
  const joinSession = useCallback(async () => {
    if (hasJoinedRef.current) return;
    hasJoinedRef.current = true;
    setPageStatus('joining');

    // 1. Acquire media first
    const stream = await acquireMedia();
    if (!stream) return;

    // 2. Hit the backend to validate + record attendance
    try {
      const res = await fetch(`${API_BASE_URL}/api/video-session/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userEmail }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 400 && data.scheduledAt) {
          setPageStatus('too-early');
        } else if (res.status === 403) {
          setPageStatus('error');
          setErrorMessage('You are not a participant in this session.');
        } else {
          setPageStatus('error');
          setErrorMessage(data.message || 'Failed to join session.');
        }
        // Stop media if join failed
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      setRoomId(data.roomId);
      setSessionStartTime(Date.now());
      setPageStatus('live');
      setConnectionStatus('waiting');

      // 3. Set up Socket.IO signaling
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      const socket = io(SOCKET_URL, { transports: ['websocket'] });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('rtc:join-room', { roomId: data.roomId, userEmail });
      });

      // A peer joined → we become the offerer
      socket.on('rtc:peer-joined', async ({ userEmail: peerEmail, socketId }) => {
        if (hasInitiatedOffer.current) return;
        hasInitiatedOffer.current = true;
        remoteSocketIdRef.current = socketId;
        showNotification(`👋 ${peerEmail} joined the session`);

        const pc = createPeerConnection();
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('rtc:offer', {
          roomId: data.roomId,
          offer,
          targetSocketId: socketId,
        });
      });

      // We received an offer → create answer
      socket.on('rtc:offer', async ({ offer, fromSocketId }) => {
        remoteSocketIdRef.current = fromSocketId;
        const pc = createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('rtc:answer', { answer, targetSocketId: fromSocketId });
      });

      // Received answer → set remote description
      socket.on('rtc:answer', async ({ answer }) => {
        if (peerRef.current) {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });

      // ICE candidate from peer
      socket.on('rtc:ice-candidate', async ({ candidate }) => {
        try {
          if (peerRef.current && candidate) {
            await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          }
        } catch (e) {
          console.warn('ICE candidate error:', e);
        }
      });

      // Peer left
      socket.on('rtc:peer-left', ({ userEmail: peerEmail }) => {
        setRemoteStream(null);
        setConnectionStatus('waiting');
        hasInitiatedOffer.current = false;
        peerRef.current?.close();
        peerRef.current = null;
        showNotification(`🚪 ${peerEmail} left the session`);
      });

      // In-session chat
      socket.on('rtc:chat-message', (msg) => {
        setChatMessages((prev) => {
          if (prev.some(m => m.timestamp === msg.timestamp && m.senderEmail === msg.senderEmail)) {
            return prev;
          }
          return [...prev, msg];
        });
        if (!isChatOpenRef.current) showNotification(`💬 ${msg.senderEmail.split('@')[0]}: ${msg.text}`);
      });

    } catch (err) {
      console.error('Join session error:', err);
      setPageStatus('error');
      setErrorMessage('Failed to join session. Please try again.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, userEmail, createPeerConnection, showNotification]);

  // ── Leave session ─────────────────────────────────────────────────────────
  const leaveSession = useCallback(async (silent = false) => {
    // Stop all local media
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());

    // Close WebRTC
    peerRef.current?.close();
    peerRef.current = null;

    // Signal leave + disconnect socket
    if (socketRef.current) {
      if (roomId) {
        socketRef.current.emit('rtc:leave-room', { roomId, userEmail });
      }
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Record attendance and update session status
    try {
      await fetch(`${API_BASE_URL}/api/video-session/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userEmail }),
      });
      if (!silent) {
        await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/complete`, {
          method: 'PUT'
        });
      }
    } catch (e) {
      console.warn('Failed to record leave:', e);
    }

    if (!silent) {
      setIsReviewOpen(true);
    }
  }, [roomId, sessionId, userEmail]);

  // ── Fetch session details then join ───────────────────────────────────────
  useEffect(() => {
    if (!userEmail) {
      navigate('/signin');
      return;
    }

    fetch(`${API_BASE_URL}/api/video-session/${sessionId}?email=${encodeURIComponent(userEmail)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.session) {
          setSession(data.session);
          joinSession();
        } else {
          setPageStatus('error');
          setErrorMessage(data.message || 'Session not found.');
        }
      })
      .catch(() => {
        setPageStatus('error');
        setErrorMessage('Could not connect to the server. Please try again.');
      });

    return () => {
      // Cleanup on unmount
      leaveSession(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // ── Media controls ────────────────────────────────────────────────────────
  const toggleMic = () => {
    if (!localStreamRef.current) return;
    const audioTracks = localStreamRef.current.getAudioTracks();
    audioTracks.forEach((t) => { t.enabled = !t.enabled; });
    setIsMuted((prev) => !prev);
  };

  const toggleCamera = () => {
    if (!localStreamRef.current) return;
    const videoTracks = localStreamRef.current.getVideoTracks();
    videoTracks.forEach((t) => { t.enabled = !t.enabled; });
    setIsCameraOff((prev) => !prev);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Revert to camera
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (peerRef.current && videoTrack) {
        const sender = peerRef.current.getSenders().find((s) => s.track?.kind === 'video');
        sender?.replaceTrack(videoTrack);
      }
      setIsScreenSharing(false);
      setLocalStream(localStreamRef.current);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace video track in peer connection
        if (peerRef.current) {
          const sender = peerRef.current.getSenders().find((s) => s.track?.kind === 'video');
          sender?.replaceTrack(screenTrack);
        }

        // When screen share ends natively (e.g. OS stop button)
        screenTrack.onended = () => {
          setIsScreenSharing(false);
          const camTrack = localStreamRef.current?.getVideoTracks()[0];
          if (peerRef.current && camTrack) {
            const sender = peerRef.current.getSenders().find((s) => s.track?.kind === 'video');
            sender?.replaceTrack(camTrack);
          }
          setLocalStream(localStreamRef.current);
        };

        setIsScreenSharing(true);
        // Show screen stream in local preview
        const previewStream = new MediaStream([screenTrack, ...(localStreamRef.current?.getAudioTracks() || [])]);
        setLocalStream(previewStream);
      } catch (err) {
        if (err.name !== 'NotAllowedError') {
          showNotification('❌ Screen sharing failed. Please try again.');
        }
      }
    }
  };

  // ── Send in-session chat ──────────────────────────────────────────────────
  const sendChatMessage = (text) => {
    const msg = { senderEmail: userEmail, text, timestamp: Date.now() };
    socketRef.current?.emit('rtc:chat-message', { roomId, ...msg });
    setChatMessages((prev) => [...prev, msg]);
  };

  // ── Prevent browser back without cleanup ──────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      leaveSession(true);
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [leaveSession]);

  // ── Review Handling ───────────────────────────────────────────────────────
  const handleReviewSubmit = async ({ sessionId: sId, reviewedUserEmail, rating, feedback }) => {
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerEmail: userEmail,
          reviewedUserEmail,
          sessionId: sId,
          rating,
          feedback,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.message || 'Failed to submit review');
        return;
      }
    } catch (error) {
      console.error('Failed to submit review', error);
    } finally {
      setIsSubmittingReview(false);
      setIsReviewOpen(false);
      navigate('/dashboard');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ── RENDER STATES ──────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  if (pageStatus === 'loading' || pageStatus === 'joining') {
    return (
      <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center z-50">
        <div className="relative mb-8">
          <div className="w-20 h-20 border-4 border-indigo-500/30 rounded-full" />
          <div className="absolute inset-0 w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <h2 className="text-white text-xl font-bold mb-2">
          {pageStatus === 'loading' ? 'Loading Session…' : 'Joining Session…'}
        </h2>
        <p className="text-gray-400 text-sm">Setting up your camera and microphone</p>
        <div className="flex items-center gap-3 mt-6 text-xs text-gray-600">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Camera</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Microphone</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" /> Network</span>
        </div>
      </div>
    );
  }

  if (pageStatus === 'denied') {
    return (
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full text-center border border-red-800/50 shadow-2xl shadow-red-900/10">
          <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center text-3xl mx-auto mb-5">
            🎤
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Permission Required</h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">{errorMessage}</p>
          <button onClick={() => navigate('/dashboard')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-medium transition-colors">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (pageStatus === 'error' || pageStatus === 'expired') {
    return (
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full text-center border border-gray-700/50 shadow-2xl">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-5 ${pageStatus === 'expired' ? 'bg-yellow-600/20' : 'bg-red-600/20'}`}>
            {pageStatus === 'expired' ? '⏰' : '❌'}
          </div>
          <h2 className="text-white text-xl font-bold mb-2">
            {pageStatus === 'expired' ? 'Session Expired' : 'Unable to Join Session'}
          </h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">{errorMessage}</p>
          <button onClick={() => navigate('/dashboard')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-medium transition-colors">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (pageStatus === 'too-early') {
    return (
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full text-center border border-yellow-800/50 shadow-2xl shadow-yellow-900/10">
          <div className="w-16 h-16 rounded-full bg-yellow-600/20 flex items-center justify-center text-3xl mx-auto mb-5 animate-pulse">
            ⏳
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Too Early to Join</h2>
          <p className="text-gray-400 text-sm mb-3 leading-relaxed">
            You can join up to 15 minutes before the scheduled time.
          </p>
          {session && (
            <div className="bg-gray-800/60 rounded-xl px-4 py-3 mb-6 border border-gray-700/50">
              <p className="text-indigo-400 font-semibold text-sm">
                📅 {session.date} at {new Date(`1970-01-01T${session.time}`).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
          )}
          <button onClick={() => navigate('/dashboard')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-medium transition-colors">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── LIVE SESSION UI ────────────────────────────────────────────────────────
  const remoteUserEmail = session?.participants?.find((p) => p !== userEmail);
  const showSidePanel = isChatOpen || isNotesOpen;
  const participantCount = session?.participants?.length || 0;

  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col z-50 overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 flex-shrink-0">
        {/* Left: live indicator + session info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 bg-red-600/20 border border-red-600/30 rounded-full px-3 py-1 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 font-semibold text-xs tracking-wide uppercase">Live</span>
          </div>
          <div className="hidden sm:flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm truncate">
                {session?.notes ? session.notes.substring(0, 40) : 'SkillX Session'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              {session && (
                <>
                  <span>{session.mode}</span>
                  <span>•</span>
                  <span>{session.duration}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center: Participants */}
        <div className="hidden md:flex items-center gap-1.5 bg-gray-800/60 rounded-full px-3 py-1.5">
          <span className="text-gray-500 text-[11px] font-medium mr-1">Participants ({participantCount})</span>
          {session?.participants?.map((email) => {
            const isYou = email === userEmail;
            const isOnline = isYou || (remoteStream !== null);
            return (
              <div key={email} className="flex items-center gap-1.5 bg-gray-700/60 rounded-full px-2.5 py-1 hover:bg-gray-700 transition-colors">
                <div className="relative flex-shrink-0">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
                    {email.charAt(0).toUpperCase()}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-gray-800 ${isOnline ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                </div>
                <span className="text-gray-300 text-xs font-medium">{email.split('@')[0]}</span>
                {isYou && <span className="text-indigo-400 text-[9px] font-medium">(You)</span>}
              </div>
            );
          })}
        </div>

        {/* Right: Timer */}
        <div className="flex items-center gap-2 bg-gray-800/60 rounded-full px-3 py-1.5">
          <span className="text-base">⏱</span>
          <span className="text-white font-mono font-bold text-sm tracking-wider">{timerDisplay}</span>
        </div>
      </div>

      {/* ── Notification toast ────────────────────────────────────────────── */}
      {notification && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-gray-800/95 backdrop-blur-sm text-white text-sm px-5 py-2.5 rounded-xl shadow-2xl border border-gray-600/50 transition-all duration-300"
          style={{ animation: 'slideDown 0.3s ease-out' }}
        >
          {notification}
        </div>
      )}

      {/* ── Main body ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video area */}
        <div className="flex-1 p-3 overflow-hidden">
          <VideoPlayer
            localStream={localStream}
            remoteStream={remoteStream}
            connectionStatus={connectionStatus}
            remoteUserEmail={remoteUserEmail}
            isMuted={isMuted}
            isCameraOff={isCameraOff}
            userEmail={userEmail}
          />
        </div>

        {/* Side panel */}
        {showSidePanel && (
          <div className="w-[360px] flex-shrink-0 flex flex-col border-l border-gray-800 overflow-hidden bg-gray-900 transition-all duration-300">
            {/* Panel tabs */}
            <div className="flex border-b border-gray-800 flex-shrink-0 bg-gray-900/80">
              <button
                onClick={() => { setIsChatOpen(true); setIsNotesOpen(false); setActiveSideTab('chat'); }}
                className={`flex-1 py-3 text-xs font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  isChatOpen && !isNotesOpen
                    ? 'text-white border-b-2 border-indigo-500 bg-gray-800/40'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/20'
                }`}
              >
                💬 Chat
                {chatMessages.length > 0 && (
                  <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                    {chatMessages.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setIsNotesOpen(true); setIsChatOpen(false); setActiveSideTab('notes'); }}
                className={`flex-1 py-3 text-xs font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  isNotesOpen && !isChatOpen
                    ? 'text-white border-b-2 border-amber-500 bg-gray-800/40'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/20'
                }`}
              >
                📝 Notes
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-hidden">
              {isChatOpen && !isNotesOpen && (
                <SessionChat
                  messages={chatMessages}
                  onSendMessage={sendChatMessage}
                  currentUserEmail={userEmail}
                />
              )}
              {isNotesOpen && !isChatOpen && (
                <NotesPanel sessionId={sessionId} userEmail={userEmail} />
              )}
              {isChatOpen && isNotesOpen && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-hidden">
                    <SessionChat
                      messages={chatMessages}
                      onSendMessage={sendChatMessage}
                      currentUserEmail={userEmail}
                    />
                  </div>
                  <div className="flex-1 overflow-hidden border-t border-gray-700">
                    <NotesPanel sessionId={sessionId} userEmail={userEmail} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Controls bar ──────────────────────────────────────────────────── */}
      <SessionControls
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        isChatOpen={isChatOpen}
        isNotesOpen={isNotesOpen}
        timerDisplay={timerDisplay}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onToggleScreen={toggleScreenShare}
        onToggleChat={() => { setIsChatOpen((p) => !p); setIsNotesOpen(false); }}
        onToggleNotes={() => { setIsNotesOpen((p) => !p); setIsChatOpen(false); }}
        onLeave={() => leaveSession(false)}
      />

      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => {
          setIsReviewOpen(false);
          navigate('/dashboard');
        }}
        onSubmit={handleReviewSubmit}
        isSubmitting={isSubmittingReview}
        sessionId={sessionId}
        reviewedUserEmail={remoteUserEmail}
      />

      {/* Notification animation keyframe */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
};

export default VideoSession;
