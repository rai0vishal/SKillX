import React, { useState, useEffect, useRef, useCallback } from 'react';

import { API_BASE_URL } from '../../config/api.js';

const NotesPanel = ({ sessionId, userEmail }) => {
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const debounceRef = useRef(null);

  // Load existing notes on mount
  useEffect(() => {
    if (!sessionId || !userEmail) return;
    fetch(`${API_BASE_URL}/api/video-session/notes/${sessionId}?email=${encodeURIComponent(userEmail)}`)
      .then((r) => r.ok ? r.json() : { content: '' })
      .then((data) => setContent(data.content || ''))
      .catch(() => {});
  }, [sessionId, userEmail]);

  const saveNotes = useCallback(
    async (text) => {
      setSaveStatus('saving');
      try {
        const res = await fetch(`${API_BASE_URL}/api/video-session/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, userEmail, content: text }),
        });
        if (!res.ok) throw new Error();
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    },
    [sessionId, userEmail]
  );

  const handleChange = (e) => {
    const text = e.target.value;
    setContent(text);
    setSaveStatus('idle');
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveNotes(text), 1500);
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const statusText = {
    idle: '',
    saving: '💾 Saving…',
    saved: '✅ Saved',
    error: '❌ Save failed',
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-700">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex-shrink-0 flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          📝 Session Notes
        </h3>
        <span className={`text-xs ${saveStatus === 'error' ? 'text-red-400' : saveStatus === 'saved' ? 'text-green-400' : 'text-gray-400'}`}>
          {statusText[saveStatus]}
        </span>
      </div>

      {/* Notes textarea */}
      <div className="flex-1 p-3">
        <textarea
          value={content}
          onChange={handleChange}
          placeholder="Take notes here… They auto-save every 1.5 seconds."
          className="w-full h-full bg-gray-800 text-gray-100 text-sm rounded-xl p-3 resize-none outline-none border border-gray-600 focus:border-indigo-500 placeholder-gray-500 leading-relaxed transition"
        />
      </div>

      <div className="px-4 py-2 border-t border-gray-700 flex-shrink-0">
        <p className="text-gray-500 text-[10px]">Notes are saved per-session and visible only to you.</p>
      </div>
    </div>
  );
};

export default NotesPanel;
