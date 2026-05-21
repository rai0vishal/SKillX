import React, { useEffect, useState, useRef } from 'react';
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

const Chat = () => {
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({}); // { email: true/false }
  const [onlineUsers, setOnlineUsers] = useState({}); // { email: true/false }
  const [expandedUsers, setExpandedUsers] = useState({}); // { email: boolean }

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
  const activeRoomRef = useRef(null); // Ref to track current room inside socket handlers

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const userEmail = user?.email;
  const messagesEndRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    socket = getSocket();

    if (user) {
      socket.emit('registerUser', user.email);
    }

    // Listen for incoming messages — only append if message belongs to the active room
    socket.on('receiveMessage', (message) => {
      if (activeRoomRef.current && message.chatRoomId === activeRoomRef.current._id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    socket.on('userTyping', ({ email }) => {
      setTypingUsers(prev => ({ ...prev, [email]: true }));
    });

    socket.on('userStoppedTyping', ({ email }) => {
      setTypingUsers(prev => ({ ...prev, [email]: false }));
    });

    socket.on('userStatusChange', ({ email, isOnline }) => {
      setOnlineUsers(prev => ({ ...prev, [email]: isOnline }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (userEmail) {
      fetchRooms();
    }
  }, [userEmail]);

  useEffect(() => {
    if (activeRoom) {
      activeRoomRef.current = activeRoom; // Keep ref in sync
      const otherUser = activeRoom.participants.find((p) => p !== userEmail);
      if (otherUser) {
        setExpandedUsers((prev) => ({ ...prev, [otherUser]: true }));
      }
    }
  }, [activeRoom, userEmail]);

  const fetchRooms = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/${user.email}`);
      const data = await res.json();
      setRooms(data);

      // Auto-select room if passed via navigation
      if (location.state?.roomId) {
        const targetRoom = data.find(r => r._id === location.state.roomId);
        if (targetRoom) {
          setActiveRoom(targetRoom);
          fetchMessages(targetRoom._id);
          if (socket) socket.emit('joinRoom', targetRoom._id);

          // Clear state so it doesn't re-trigger on refresh
          window.history.replaceState({}, document.title);
        }
      }
    } catch (error) {
      console.error('Failed to fetch rooms', error);
    }
  };

  const getContextIcon = (type) => {
    switch (type) {
      case 'gig':
        return '💼';
      case 'exchange':
        return '🔁';
      case 'session':
        return '📅';
      case 'video_session':
        return '🎥';
      default:
        return '💬';
    }
  };

  const toggleUserExpand = (email) => {
    setExpandedUsers((prev) => ({ ...prev, [email]: !prev[email] }));
  };

  // Group rooms by other participant
  const groupedRooms = rooms.reduce((acc, room) => {
    const otherUser = room.participants.find((p) => p !== userEmail);
    if (!otherUser) return acc;
    if (!acc[otherUser]) {
      acc[otherUser] = [];
    }
    acc[otherUser].push(room);
    return acc;
  }, {});

  const fetchMessages = async (roomId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/messages/${roomId}`);
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error('Failed to fetch messages', error);
    }
  };

  const fetchRoomSessions = async (roomId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/sessions/room/${roomId}`);
      const data = await res.json();
      setRoomSessions(data);
    } catch (error) {
      console.error('Failed to fetch sessions', error);
    }
  };

  const fetchWorkspace = async (roomId, roomParticipants) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/workspace/${roomId}`, {
        headers: { participants: roomParticipants.join(',') }
      });
      const data = await res.json();
      setWorkspace(data);
    } catch (err) {
      console.error('Failed to fetch workspace', err);
    }
  };

  const handleRoomClick = (room) => {
    // Leave previous room before joining new one
    if (activeRoom && activeRoom._id !== room._id) {
      socket.emit('leaveRoom', activeRoom._id);
    }
    setActiveRoom(room);
    activeRoomRef.current = room; // Sync ref immediately
    setActiveTab('chat'); // Reset tab on room change

    fetchMessages(room._id);
    fetchRoomSessions(room._id);
    fetchWorkspace(room._id, room.participants);

    socket.emit('joinRoom', room._id);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoom) return;

    socket.emit('sendMessage', {
      chatRoomId: activeRoom._id,
      senderEmail: user.email,
      text: newMessage,
    });
    setNewMessage('');
    socket.emit('stopTyping', { chatRoomId: activeRoom._id, email: user.email });
    setIsTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!activeRoom) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { chatRoomId: activeRoom._id, email: userEmail });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('stopTyping', { chatRoomId: activeRoom._id, email: userEmail });
    }, 2000);
  };

  // Session Handlers
  const openScheduleModal = (initialData = null) => {
    setEditingSession(initialData);
    setIsSessionModalOpen(true);
  };

  const handleSessionSubmit = async (sessionData) => {
    setIsSubmittingSession(true);
    try {
      if (editingSession && editingSession._id && editingSession.status !== 'Pending') {
        // Reschedule an existing active session
        const res = await fetch(`${API_BASE_URL}/api/sessions/${editingSession._id}/reschedule`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionData),
        });
        if (!res.ok) throw new Error(await res.text());
      } else {
        // Create new session request or suggest alternative for pending
        const otherUser = activeRoom.participants.find(p => p !== userEmail);

        // Calculate end time
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
          force: true // since we already warned user in UI
        };
        const res = await fetch(`${API_BASE_URL}/api/schedule/session/schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          const reason = errData.error || errData.message || 'Failed to create session';
          alert(`Failed to create session: ${reason}`);
          throw new Error('Failed to create session');
        }

        // If we were suggesting an alternative to a pending session, cancel the old one
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
      // Use the dedicated endpoint for every action (accept, cancel, complete)
      const res = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/${action}`, { method: 'PUT' });
      if (!res.ok) throw new Error(`Failed to ${action} session`);
      fetchRoomSessions(activeRoom._id);
    } catch (error) {
      console.error('Failed session action', error);
    }
  };

  // Review Handlers
  const handleReviewSubmit = async ({ sessionId, reviewedUserEmail, rating, feedback }) => {
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerEmail: userEmail,
          reviewedUserEmail,
          sessionId,
          rating,
          feedback,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.message || 'Failed to submit review');
        return;
      }
      setIsReviewModalOpen(false);
      setReviewingSession(null);
      fetchRoomSessions(activeRoom._id);
    } catch (error) {
      console.error('Failed to submit review', error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, roomSessions]);

  if (!user) return <div className="p-8 text-center">Please sign in to view messages.</div>;

  return (
    <div className="flex h-[calc(100vh-160px)] bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 max-w-6xl mx-auto">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-gray-100 bg-gray-50/50 flex flex-col">
        <div className="p-5 border-b border-gray-100 bg-white shadow-sm z-10">
          <h2 className="text-xl font-bold text-gray-800">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {rooms.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-sm">No active chats yet.</p>
              <p className="text-xs mt-2">Accept a gig or skill exchange to start chatting!</p>
            </div>
          ) : (
            Object.keys(groupedRooms).map((otherUser) => {
              const isExpanded = !!expandedUsers[otherUser];
              const userRooms = groupedRooms[otherUser];

              return (
                <div key={otherUser} className="border-b border-gray-100">
                  {/* User Accordion Header */}
                  <div
                    onClick={() => toggleUserExpand(otherUser)}
                    className="p-4 bg-white hover:bg-gray-50/50 cursor-pointer flex items-center justify-between transition-colors select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg relative">
                        {otherUser[0].toUpperCase()}
                        {onlineUsers[otherUser] && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                          {otherUser.split('@')[0]}
                          {typingUsers[otherUser] && (
                            <span className="text-[10px] text-indigo-500 font-normal italic animate-pulse">
                              typing...
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-gray-400 font-medium">
                          {userRooms.length} thread{userRooms.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-gray-400 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                      ▶
                    </span>
                  </div>

                  {/* Grouped Threads */}
                  {isExpanded && (
                    <div className="bg-gray-50/50 border-t border-gray-50 py-1 pl-4 pr-2 space-y-1">
                      {userRooms.map((room) => {
                        const isCurrentActive = activeRoom?._id === room._id;
                        return (
                          <div
                            key={room._id}
                            onClick={() => handleRoomClick(room)}
                            className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between ${isCurrentActive
                                ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/10'
                                : 'hover:bg-white text-gray-700 hover:text-gray-900 border border-transparent hover:border-gray-100'
                              }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-lg shrink-0">
                                {getContextIcon(room.referenceType)}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs truncate font-medium">
                                  {room.title || `${room.referenceType === 'gig' ? 'Gig' : 'Exchange'} Chat`}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#f8f9fa] relative">
        {activeRoom ? (
          <>
            <div className="p-5 border-b border-gray-100 bg-white shadow-sm z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg relative">
                  {activeRoom.participants.find((p) => p !== user.email)?.[0]?.toUpperCase()}
                  {onlineUsers[activeRoom.participants.find((p) => p !== user.email)] && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg leading-tight">
                    {activeRoom.participants.find((p) => p !== userEmail)}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    {onlineUsers[activeRoom.participants.find((p) => p !== userEmail)] ? (
                      <span className="text-green-500">Online</span>
                    ) : (
                      'Offline'
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={openScheduleModal}
                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <span>📅</span> Schedule Session
              </button>
            </div>

            <WorkspaceTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {activeTab === 'chat' && (
              <>
                <div className="flex-1 overflow-y-auto p-6 flex flex-col space-y-4">
                  {roomSessions.length > 0 && (
                    <div className="flex flex-col gap-3 mb-4">
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
                            const otherUser = activeRoom.participants.find(p => p !== userEmail);
                            setReviewingSession({ ...s, reviewedUserEmail: otherUser });
                            setIsReviewModalOpen(true);
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-3 min-h-[200px]">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-2xl">👋</div>
                      <p>Say hello to start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isMe = msg.senderEmail === user.email;
                      return (
                        <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[75%] px-5 py-3 rounded-2xl shadow-sm ${isMe
                                ? 'bg-indigo-600 text-white rounded-br-sm'
                                : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                              }`}
                          >
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                            <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {typingUsers[activeRoom.participants.find(p => p !== user.email)] && (
                    <div className="flex justify-start">
                      <div className="bg-white text-gray-500 px-4 py-2 rounded-2xl rounded-bl-sm border border-gray-100 shadow-sm text-sm italic flex items-center gap-2">
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                        </span>
                        Typing...
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white border-t border-gray-100">
                  <form onSubmit={handleSendMessage} className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={handleTyping}
                      placeholder="Type a message..."
                      className="flex-1 bg-gray-50 px-5 py-3 rounded-full text-sm border-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-full font-medium hover:bg-indigo-700 transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </>
            )}

            {activeTab === 'resources' && workspace && (
              <div className="flex-1 overflow-hidden bg-white">
                <ResourcesPanel workspaceId={workspace._id} currentUserEmail={userEmail} />
              </div>
            )}

            {activeTab === 'notes' && workspace && (
              <div className="flex-1 overflow-hidden bg-white">
                <NotesPanel workspaceId={workspace._id} initialNotes={workspace.notes} />
              </div>
            )}

            {activeTab === 'tasks' && workspace && (
              <div className="flex-1 overflow-hidden bg-white">
                <TaskPanel workspaceId={workspace._id} currentUserEmail={userEmail} />
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"></path>
              </svg>
            </div>
            <p className="text-lg font-medium">Your Messages</p>
            <p className="text-sm">Select a chat from the sidebar to start messaging.</p>
          </div>
        )}
      </div>

      <SessionModal
        isOpen={isSessionModalOpen}
        onClose={() => { setIsSessionModalOpen(false); setEditingSession(null); }}
        onSubmit={handleSessionSubmit}
        isSubmitting={isSubmittingSession}
        initialData={editingSession}
        currentUserEmail={userEmail}
        recipientEmail={activeRoom?.participants?.find(p => p !== userEmail)}
      />

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => { setIsReviewModalOpen(false); setReviewingSession(null); }}
        onSubmit={handleReviewSubmit}
        isSubmitting={isSubmittingReview}
        sessionId={reviewingSession?._id}
        reviewedUserEmail={reviewingSession?.reviewedUserEmail}
      />
    </div>
  );
};

export default Chat;
