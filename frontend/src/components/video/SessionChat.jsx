import React, { useState, useRef, useEffect } from 'react';

const SessionChat = ({ messages, onSendMessage, currentUserEmail }) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    onSendMessage(text);
    setInput('');
  };

  const formatTime = (timestamp) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-700">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex-shrink-0">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          💬 Session Chat
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-500 text-xs text-center mt-4">
            Messages are visible only during this session.
          </p>
        )}
        {messages.map((msg, i) => {
          const isOwn = msg.senderEmail === currentUserEmail;
          return (
            <div key={i} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
              {!isOwn && (
                <span className="text-gray-400 text-xs mb-1 ml-1">
                  {msg.senderEmail.split('@')[0]}
                </span>
              )}
              <div
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                  isOwn
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-gray-700 text-gray-100 rounded-bl-sm'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-gray-500 text-[10px] mt-1 mx-1">
                {formatTime(msg.timestamp)}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-gray-700 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 bg-gray-800 text-white text-sm rounded-xl px-3 py-2 outline-none border border-gray-600 focus:border-indigo-500 placeholder-gray-500 transition"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-3 py-2 rounded-xl transition text-sm font-medium"
          >
            ➤
          </button>
        </div>
      </form>
    </div>
  );
};

export default SessionChat;
