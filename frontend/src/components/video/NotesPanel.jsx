import React, { useState, useEffect, useRef, useCallback, memo } from 'react';

import { API_BASE_URL } from '../../config/api.js';

const NotesPanel = memo(({ sessionId, userEmail }) => {
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

  const statusConfig = {
    idle: { text: '', color: 'text-gray-500' },
    saving: { text: '💾 Saving…', color: 'text-yellow-400' },
    saved: { text: '✅ Saved', color: 'text-emerald-400' },
    error: { text: '❌ Save failed', color: 'text-red-400' },
  };

  const { text: statusText, color: statusColor } = statusConfig[saveStatus];
  const charCount = content.length;

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-700/60 flex-shrink-0 flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <span className="text-base">📝</span>
          Session Notes
        </h3>
        <div className="flex items-center gap-2">
          {statusText && (
            <span className={`text-xs font-medium ${statusColor} transition-colors`}>
              {statusText}
            </span>
          )}
          <span className="text-[10px] text-gray-600">{charCount > 0 ? `${charCount} chars` : ''}</span>
        </div>
      </div>

      {/* Notes textarea */}
      <div className="flex-1 p-3">
        <textarea
          value={content}
          onChange={handleChange}
          placeholder="Take notes here… They auto-save every 1.5 seconds.&#10;&#10;💡 Tips:&#10;• Key takeaways&#10;• Action items&#10;• Questions to follow up"
          className="w-full h-full bg-gray-800/80 text-gray-100 text-sm rounded-xl p-4 resize-none outline-none border border-gray-700 focus:border-indigo-500 placeholder-gray-600 leading-relaxed transition-colors"
        />
      </div>

      <div className="px-4 py-2 border-t border-gray-700/40 flex-shrink-0 flex items-center justify-between">
        <p className="text-gray-600 text-[10px]">Notes are saved per-session and visible only to you</p>
        <div className="flex items-center gap-1">
          <div className={`w-1.5 h-1.5 rounded-full ${saveStatus === 'saving' ? 'bg-yellow-500 animate-pulse' : saveStatus === 'saved' ? 'bg-emerald-500' : saveStatus === 'error' ? 'bg-red-500' : 'bg-gray-600'}`} />
        </div>
      </div>
    </div>
  );
});

NotesPanel.displayName = 'NotesPanel';

export default NotesPanel;
