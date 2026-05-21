import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import SessionModal from '../components/SessionModal';
import SessionCard from '../components/SessionCard';
import ReviewModal from '../components/ReviewModal';

// Workspace Components
import WorkspaceTabs from '../components/workspace/WorkspaceTabs';
import ResourcesPanel from '../components/workspace/ResourcesPanel';
import NotesPanel from '../components/workspace/NotesPanel';
import TaskPanel from '../components/workspace/TaskPanel';

import { API_BASE_URL } from '../config/api.js';
import { getSocket } from '../config/socket.js';
let socket;

const formatMessageTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const groupMessagesByDate = (messages) => {
  const groups = {};
  messages.forEach(msg => {
    const dateObj = new Date(msg.createdAt);
    const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    
    const today = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    
    let label = dateStr;
    if (dateStr === today) label = 'Today';
    else if (dateStr === yesterday) label = 'Yesterday';

    if (!groups[label]) groups[label] = [];
    groups[label].push(msg);
  });
  return groups;
};

const Chat = () => {
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [expandedUsers, setExpandedUsers] = useState({});
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const isScrolledToBottomRef = useRef(true);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);

  // Workspace States
  const [activeTab, setActiveTab] = useState('chat');
  const [workspace, setWorkspace] = useState(null);

  // Session states
  const [roomSessions, setRoomSessions] = useState([]);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [isSubmittingSession, setIsSubmittingSession] = useState(false);

  // Review states
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewingSession, setReviewingSession] = useState(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  let typingTimeoutRef = useRef(null);
  const activeRoomRef = useRef(null);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || 'null'), []);
  const userEmail = user?.email;
  const location = useLocation();

  const fetchMessages = useCallback(async (roomId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/messages/${roomId}`);
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error('Failed to fetch messages', error);
    }
  }, []);

  const fetchRoomSessions = useCallback(async (roomId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/sessions/room/${roomId}`);
      const data = await res.json();
      setRoomSessions(data);
    } catch (error) {
      console.error('Failed to fetch sessions', error);
    }
  }, []);

  const fetchWorkspace = useCallback(async (roomId, roomParticipants) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/workspace/${roomId}`, {
        headers: { participants: roomParticipants.join(',') }
      });
      const data = await res.json();
      setWorkspace(data);
    } catch (err) {
      console.error('Failed to fetch workspace', err);
    }
  }, []);

  // Use useCallback so we can call handleRoomClick inside fetchRooms safely
  const handleRoomClick = useCallback((room) => {
    if (activeRoomRef.current && activeRoomRef.current._id !== room._id) {
      socket?.emit('leaveRoom', activeRoomRef.current._id);
    }
    setActiveRoom(room);
    setActiveTab('chat');
    setShowMobileSidebar(false);
    
    // Auto-expand the other user accordion
    const otherUser = room.participants?.find((p) => p !== userEmail);
    if (otherUser) {
      setExpandedUsers((prev) => ({ ...prev, [otherUser]: true }));
    }

    fetchMessages(room._id);
    fetchRoomSessions(room._id);
    fetchWorkspace(room._id, room.participants || []);

    socket?.emit('joinRoom', room._id);
  }, [userEmail, fetchMessages, fetchRoomSessions, fetchWorkspace]);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/${userEmail}`);
      const data = await res.json();
      setRooms(data);

      if (location.state?.roomId) {
        const targetRoom = data.find(r => r._id === location.state.roomId);
        if (targetRoom) {
          handleRoomClick(targetRoom);
          window.history.replaceState({}, document.title);
        }
      }
    } catch (error) {
      console.error('Failed to fetch rooms', error);
    }
  }, [userEmail, location.state, handleRoomClick]);

  useEffect(() => {
    socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }

    if (userEmail) {
      socket.emit('registerUser', userEmail);
    }

    socket.on('receiveMessage', (message) => {
      if (activeRoomRef.current && message.chatRoomId === activeRoomRef.current._id) {
        setMessages((prev) => {
          const newMessages = [...prev, message];
          if (isScrolledToBottomRef.current) {
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 50);
          }
          return newMessages;
        });
      }
    });

    socket.on('userTyping', ({ email }) => setTypingUsers(prev => ({ ...prev, [email]: true })));
    socket.on('userStoppedTyping', ({ email }) => setTypingUsers(prev => ({ ...prev, [email]: false })));
    socket.on('userStatusChange', ({ email, isOnline }) => setOnlineUsers(prev => ({ ...prev, [email]: isOnline })));

    // Do NOT disconnect socket on cleanup in Chat.jsx as it breaks the singleton for other components
    return () => {
      socket.off('receiveMessage');
      socket.off('userTyping');
      socket.off('userStoppedTyping');
      socket.off('userStatusChange');
    };
  }, [userEmail]);

  useEffect(() => {
    if (userEmail) {
      // eslint-disable-next-line
      fetchRooms();
    }
  }, [userEmail, fetchRooms]);

  useEffect(() => {
    if (activeRoom) {
      activeRoomRef.current = activeRoom;
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
    }
  }, [activeRoom]);

  const getContextIcon = (type) => {
    switch (type) {
      case 'gig': return '📁';
      case 'exchange': return '🔄';
      case 'session': return '📅';
      case 'video_session': return '🎥';
      default: return '💬';
    }
  };

  const toggleUserExpand = (email) => {
    setExpandedUsers((prev) => ({ ...prev, [email]: !prev[email] }));
  };

  const groupedRooms = useMemo(() => {
    return rooms.reduce((acc, room) => {
      const otherUser = room.participants.find((p) => p !== userEmail);
      if (!otherUser) return acc;
      if (!acc[otherUser]) acc[otherUser] = [];
      acc[otherUser].push(room);
      return acc;
    }, {});
  }, [rooms, userEmail]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoom) return;

    socket?.emit('sendMessage', {
      chatRoomId: activeRoom._id,
      senderEmail: userEmail,
      text: newMessage,
    });
    setNewMessage('');
    socket?.emit('stopTyping', { chatRoomId: activeRoom._id, email: userEmail });
    setIsTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    setIsScrolledToBottom(true);
    isScrolledToBottomRef.current = true;
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!activeRoom) return;

    if (!isTyping) {
      setIsTyping(true);
      socket?.emit('typing', { chatRoomId: activeRoom._id, email: userEmail });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit('stopTyping', { chatRoomId: activeRoom._id, email: userEmail });
    }, 2000);
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsScrolledToBottom(isBottom);
    isScrolledToBottomRef.current = isBottom;
  };

  const openScheduleModal = (initialData = null) => {
    setEditingSession(initialData);
    setIsSessionModalOpen(true);
  };

  const handleSessionSubmit = async (sessionData) => {
    setIsSubmittingSession(true);
    try {
      if (editingSession && editingSession._id && editingSession.status !== 'Pending') {
        const res = await fetch(`${API_BASE_URL}/api/sessions/${editingSession._id}/reschedule`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionData),
        });
        if (!res.ok) throw new Error(await res.text());
      } else {
        const otherUser = activeRoom.participants.find(p => p !== userEmail);
        const durMins = parseInt(sessionData.duration.split(' ')[0]) || 60;
        const [h, m] = sessionData.time.split(':').map(Number);
        const endMins = (h * 60 + m) + durMins;
        const endH = Math.floor(endMins / 60).toString().padStart(2, '0');
        const endM = (endMins % 60).toString().padStart(2, '0');
        const endTime = `${endH}:${endM}`;

        const payload = {
          ...sessionData,
          startTime: sessionData.time,
          endTime,
          chatRoomId: activeRoom._id,
          participants: [userEmail, otherUser],
          requestedBy: userEmail,
          force: true
        };
        const res = await fetch(`${API_BASE_URL}/api/schedule/session/schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          alert(`Failed to create session: ${errData.error || errData.message}`);
          throw new Error('Failed to create session');
        }

        if (editingSession && editingSession._id && editingSession.status === 'Pending') {
          await fetch(`${API_BASE_URL}/api/sessions/${editingSession._id}/cancel`, { method: 'PUT' });
        }
      }
      setIsSessionModalOpen(false);
      setEditingSession(null);
      fetchRoomSessions(activeRoom._id);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmittingSession(false);
    }
  };

  const handleSessionAction = async (sessionId, action) => {
    if (action === 'cancel' && !window.confirm('Are you sure you want to cancel/reject this session?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/${action}`, { method: 'PUT' });
      if (!res.ok) throw new Error(`Failed to ${action} session`);
      fetchRoomSessions(activeRoom._id);
    } catch (error) {
      console.error('Failed session action', error);
    }
  };

  const handleReviewSubmit = async ({ sessionId, reviewedUserEmail, rating, feedback }) => {
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerEmail: userEmail, reviewedUserEmail, sessionId, rating, feedback }),
      });
      if (!res.ok) throw new Error('Failed to submit review');
      setIsReviewModalOpen(false);
      setReviewingSession(null);
      fetchRoomSessions(activeRoom._id);
    } catch (error) {
      console.error('Failed to submit review', error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (!user) return <div className="p-8 text-center text-gray-500">Please sign in to view messages.</div>;

  const activeOtherUserEmail = activeRoom?.participants?.find((p) => p !== userEmail);
  const isOtherUserOnline = onlineUsers[activeOtherUserEmail];
  const groupedMessages = groupMessagesByDate(messages);

  return (
    <main role="main" aria-label="Messages" className="flex h-[calc(100vh-160px)] bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 max-w-6xl mx-auto font-sans relative">
      
      {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
      <section role="complementary" aria-label="Conversation list" className={`w-full md:w-80 border-r border-gray-100 bg-gray-50/40 flex flex-col transition-transform duration-300 ${showMobileSidebar ? 'block' : 'hidden md:flex'}`}>
        <div className="p-5 border-b border-gray-200 bg-white shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
            {userEmail[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800 leading-tight">Messages</h2>
            <p className="text-xs text-gray-500 font-medium">You have {rooms.length} active threads</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {rooms.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 20px',
              color: '#9ca3af'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>💬</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#6b7280', marginBottom: '4px' }}>
                No conversations yet
              </div>
              <div style={{ fontSize: '0.78rem' }}>
                Start a skill exchange to begin messaging.
              </div>
            </div>
          ) : (
            Object.keys(groupedRooms).map((otherUser) => {
              const isExpanded = !!expandedUsers[otherUser];
              const userRooms = groupedRooms[otherUser];
              const isOnline = onlineUsers[otherUser];

              return (
                <div key={otherUser} className="border-b border-gray-100 last:border-b-0">
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={`Toggle conversations with ${otherUser.split('@')[0]}`}
                    aria-expanded={isExpanded}
                    onClick={() => toggleUserExpand(otherUser)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleUserExpand(otherUser);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      background: isExpanded ? '#f5f3ff' : 'transparent',
                      borderLeft: isExpanded ? '3px solid #7c3aed' : '3px solid transparent',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = '#fafafa' }}
                    onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent' }}
                  >
                    {/* Avatar with initials */}
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: '#ede9fe', color: '#5b21b6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
                      position: 'relative'
                    }}>
                      {otherUser[0].toUpperCase()}
                      <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                    </div>

                    {/* Name + preview */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>
                          {otherUser.split('@')[0]}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#9ca3af', flexShrink: 0, marginLeft: '8px' }}>
                          {userRooms[0]?.lastMessageAt ? timeAgo(userRooms[0].lastMessageAt) : ''}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '0.78rem', color: '#6b7280',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                      }}>
                        {isOnline ? (
                          <span style={{ color: '#059669', fontWeight: 600 }}>● Online</span>
                        ) : (
                          <span>{userRooms.length} Active Thread{userRooms.length !== 1 && 's'}</span>
                        )}
                      </div>
                    </div>

                    {/* Unread badge */}
                    {userRooms.some(r => r.unreadCount > 0) && (
                      <div role="status" aria-label={`${userRooms.reduce((sum, r) => sum + (r.unreadCount || 0), 0)} unread messages`} style={{
                        minWidth: '20px',
                        height: '20px',
                        borderRadius: '999px',
                        background: '#7c3aed',
                        color: '#fff',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 5px',
                        flexShrink: 0
                      }}>
                        {(() => {
                          const total = userRooms.reduce((sum, r) => sum + (r.unreadCount || 0), 0);
                          return total > 99 ? '99+' : total;
                        })()}
                      </div>
                    )}

                    <span className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-indigo-500' : 'rotate-0'}`} style={{ flexShrink: 0 }}>
                      ▶
                    </span>
                  </div>

                  <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96' : 'max-h-0'}`}>
                    <div className="bg-gray-50/60 py-2 px-3 space-y-1">
                      {userRooms.map((room) => {
                        const isCurrentActive = activeRoom?._id === room._id;
                        return (
                          <div
                            key={room._id}
                            role="button"
                            tabIndex={0}
                            aria-label={`Open conversation for ${room.title || 'Gig'}`}
                            aria-pressed={isCurrentActive}
                            // eslint-disable-next-line react-hooks/refs
                            onClick={() => handleRoomClick(room)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleRoomClick(room);
                              }
                            }}
                            className={`p-3 rounded-xl cursor-pointer transition-all flex items-start gap-3 group ${isCurrentActive
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'hover:bg-white text-gray-700 hover:shadow-sm border border-transparent hover:border-gray-200'
                              }`}
                          >
                            <span className="text-lg shrink-0 mt-0.5 opacity-90">{getContextIcon(room.referenceType)}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex justify-between items-baseline mb-0.5">
                                <p className={`text-sm truncate font-bold ${isCurrentActive ? 'text-white' : 'text-gray-900'}`}>
                                  {room.title || `${room.referenceType === 'gig' ? 'Gig' : 'Exchange'} Chat`}
                                </p>
                              </div>
                              <p className={`text-xs truncate ${isCurrentActive ? 'text-indigo-200' : 'text-gray-500'}`}>
                                View conversation
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ── Main Chat Area ───────────────────────────────────────────────── */}
      <section role="region" aria-label="Chat window" className={`flex-1 flex flex-col bg-slate-50 relative ${!showMobileSidebar ? 'block' : 'hidden md:flex'}`}>
        {activeRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white shadow-sm z-10 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <button 
                  aria-label="Back to conversation list"
                  onClick={() => setShowMobileSidebar(true)}
                  className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg mr-1 transition-colors"
                >
                  ←
                </button>
                <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg relative flex-shrink-0 shadow-sm">
                  {activeOtherUserEmail?.[0]?.toUpperCase()}
                  <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white rounded-full ${isOtherUserOnline ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 text-base leading-tight truncate">
                    {activeOtherUserEmail}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs font-medium mt-0.5">
                    {isOtherUserOnline ? (
                      <span className="text-emerald-600 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Online
                      </span>
                    ) : (
                      <span className="text-gray-500">Offline</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openScheduleModal()}
                  className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 group"
                >
                  <span className="group-hover:scale-110 transition-transform">📅</span> 
                  <span className="hidden sm:inline">Schedule Session</span>
                </button>
              </div>
            </div>

            <WorkspaceTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {activeTab === 'chat' && (
              <>
                {/* Messages List */}
                <div 
                  className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col space-y-6"
                  onScroll={handleScroll}
                  ref={scrollContainerRef}
                >
                  {roomSessions.length > 0 && (
                    <div className="flex flex-col gap-3 mb-2">
                      {roomSessions.map(session => (
                        <SessionCard
                          key={session._id}
                          session={session}
                          userEmail={userEmail}
                          onReschedule={(s) => openScheduleModal(s)}
                          onAccept={(id) => handleSessionAction(id, 'accept')}
                          onSuggestAlternative={(s) => openScheduleModal(s)}
                          onCancel={(id) => handleSessionAction(id, 'cancel')}
                          onComplete={(id) => handleSessionAction(id, 'complete')}
                          onReview={(s) => {
                            setReviewingSession({ ...s, reviewedUserEmail: activeOtherUserEmail });
                            setIsReviewModalOpen(true);
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto">
                      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-4xl mb-6 shadow-sm border border-indigo-100/50">💬</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Start Conversation</h3>
                      <p className="text-gray-500 text-sm leading-relaxed mb-6">
                        Choose a thread and begin exchanging ideas. Share resources, schedule sessions, and collaborate smoothly.
                      </p>
                    </div>
                  ) : (
                    Object.keys(groupedMessages).map(dateLabel => (
                      <div key={dateLabel} className="space-y-4">
                        {/* Date Separator */}
                        <div className="flex items-center justify-center sticky top-2 z-10 my-4">
                          <span className="bg-white/90 backdrop-blur-sm text-gray-500 text-xs font-bold px-4 py-1.5 rounded-full shadow-sm border border-gray-100">
                            {dateLabel}
                          </span>
                        </div>
                        
                        {/* Messages for Date */}
                        {groupedMessages[dateLabel].map((msg, index) => {
                          const isMe = msg.senderEmail === userEmail;
                          const showAvatar = !isMe && (index === 0 || groupedMessages[dateLabel][index - 1].senderEmail !== msg.senderEmail);

                          return (
                            <div key={index} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className="flex gap-3 max-w-[85%] sm:max-w-[70%]">
                                {!isMe && (
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs mt-auto">
                                    {showAvatar ? activeOtherUserEmail[0].toUpperCase() : ''}
                                  </div>
                                )}
                                <div
                                  className={`px-4 py-2.5 rounded-2xl shadow-sm relative group transition-all ${
                                    isMe
                                      ? 'bg-indigo-600 text-white rounded-br-sm'
                                      : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200'
                                  }`}
                                >
                                  <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                                  <div className={`flex items-center justify-end gap-1.5 mt-1.5 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                    <span className="text-[10px] font-medium tracking-wide">
                                      {formatMessageTime(msg.createdAt)}
                                    </span>
                                    {isMe && (
                                      <span className="text-[10px]">
                                        {msg.readStatus ? '✓✓' : '✓'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))
                  )}

                  {/* Typing Indicator */}
                  {typingUsers[activeOtherUserEmail] && (
                    <div className="flex justify-start">
                      <div className="flex gap-3 max-w-[85%]">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs mt-auto">
                          {activeOtherUserEmail[0].toUpperCase()}
                        </div>
                        <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm border border-gray-200 shadow-sm flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} className="h-1" />
                </div>

                {/* Message Input Area */}
                <div className="p-4 bg-white border-t border-gray-200">
                  <form onSubmit={handleSendMessage} className="flex gap-3 items-end max-w-4xl mx-auto">
                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-all shadow-inner">
                      <textarea
                        value={newMessage}
                        onChange={handleTyping}
                        placeholder="Type your message..."
                        className="w-full bg-transparent px-4 py-3 text-sm border-none focus:outline-none resize-none min-h-[44px] max-h-32"
                        rows={1}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      aria-label="Send message"
                      className="bg-indigo-600 text-white h-11 px-6 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </>
            )}

            {activeTab === 'resources' && workspace && (
              <div className="flex-1 overflow-hidden bg-white"><ResourcesPanel workspaceId={workspace._id} currentUserEmail={userEmail} /></div>
            )}
            {activeTab === 'notes' && workspace && (
              <div className="flex-1 overflow-hidden bg-white"><NotesPanel workspaceId={workspace._id} initialNotes={workspace.notes} /></div>
            )}
            {activeTab === 'tasks' && workspace && (
              <div className="flex-1 overflow-hidden bg-white"><TaskPanel workspaceId={workspace._id} currentUserEmail={userEmail} /></div>
            )}
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            padding: '48px'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🗨️</div>
            <div style={{ fontWeight: 600, fontSize: '1rem', color: '#6b7280', marginBottom: '6px' }}>
              Select a conversation
            </div>
            <div style={{ fontSize: '0.82rem', textAlign: 'center' }}>
              Choose someone from the left to start chatting.
            </div>
          </div>
        )}
      </section>

      <SessionModal
        isOpen={isSessionModalOpen}
        onClose={() => { setIsSessionModalOpen(false); setEditingSession(null); }}
        onSubmit={handleSessionSubmit}
        isSubmitting={isSubmittingSession}
        initialData={editingSession}
        currentUserEmail={userEmail}
        recipientEmail={activeOtherUserEmail}
      />

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => { setIsReviewModalOpen(false); setReviewingSession(null); }}
        onSubmit={handleReviewSubmit}
        isSubmitting={isSubmittingReview}
        sessionId={reviewingSession?._id}
        reviewedUserEmail={reviewingSession?.reviewedUserEmail}
      />
    </main>
  );
};

export default Chat;
