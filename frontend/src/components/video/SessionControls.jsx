import React, { useState, memo } from 'react';

const SessionControls = memo(({
  isMuted,
  isCameraOff,
  isScreenSharing,
  isChatOpen,
  isNotesOpen,
  timerDisplay,
  onToggleMic,
  onToggleCamera,
  onToggleScreen,
  onToggleChat,
  onToggleNotes,
  onLeave,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const ControlButton = ({ onClick, active, activeClass, inactiveClass, icon, label, title }) => (
    <button
      onClick={onClick}
      title={title || label}
      className={`
        flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-2xl transition-all duration-200 font-medium text-[11px]
        hover:scale-105 active:scale-95
        ${active
          ? activeClass || 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
          : inactiveClass || 'bg-gray-800 hover:bg-gray-700 text-gray-300'
        }
      `}
    >
      <span className="text-xl leading-none">{icon}</span>
      <span className="leading-none">{label}</span>
    </button>
  );

  return (
    <>
      {/* ── Leave Confirmation Modal ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-3xl mb-3 text-center">🚪</div>
            <h3 className="text-white font-bold text-lg text-center mb-1">Leave Session?</h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              Are you sure you want to leave this session? The session will continue for the other participant.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 transition font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowConfirm(false); onLeave(); }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition font-medium text-sm"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Control Bar ── */}
      <div className="flex-shrink-0 bg-gray-950/90 backdrop-blur-md border-t border-gray-800 px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">

          {/* Left group: AV controls */}
          <div className="flex items-center gap-2">
            <ControlButton
              onClick={onToggleMic}
              active={isMuted}
              activeClass="bg-red-600/90 text-white shadow-lg shadow-red-900/40"
              inactiveClass="bg-gray-800 hover:bg-gray-700 text-gray-200"
              icon={isMuted ? '🔇' : '🎤'}
              label={isMuted ? 'Unmute' : 'Mute'}
            />
            <ControlButton
              onClick={onToggleCamera}
              active={isCameraOff}
              activeClass="bg-red-600/90 text-white shadow-lg shadow-red-900/40"
              inactiveClass="bg-gray-800 hover:bg-gray-700 text-gray-200"
              icon={isCameraOff ? '📵' : '📷'}
              label={isCameraOff ? 'Show Cam' : 'Camera'}
            />
            <ControlButton
              onClick={onToggleScreen}
              active={isScreenSharing}
              activeClass="bg-indigo-600 text-white shadow-lg shadow-indigo-900/40"
              inactiveClass="bg-gray-800 hover:bg-gray-700 text-gray-200"
              icon="🖥"
              label={isScreenSharing ? 'Stop' : 'Share'}
              title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
            />
          </div>

          {/* Center: timer */}
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-2 bg-gray-800 rounded-2xl px-5 py-2.5 shadow-inner">
              <span className="text-base">⏱</span>
              <div className="flex flex-col items-center leading-none">
                <span className="text-[9px] text-gray-500 font-medium uppercase tracking-widest">Duration</span>
                <span className="text-white font-mono font-bold text-lg tracking-widest">{timerDisplay}</span>
              </div>
            </div>
          </div>

          {/* Right group: panels + leave */}
          <div className="flex items-center gap-2">
            <ControlButton
              onClick={onToggleNotes}
              active={isNotesOpen}
              activeClass="bg-amber-600/90 text-white shadow-lg shadow-amber-900/30"
              inactiveClass="bg-gray-800 hover:bg-gray-700 text-gray-200"
              icon="📝"
              label="Notes"
            />
            <ControlButton
              onClick={onToggleChat}
              active={isChatOpen}
              activeClass="bg-indigo-600 text-white shadow-lg shadow-indigo-900/40"
              inactiveClass="bg-gray-800 hover:bg-gray-700 text-gray-200"
              icon="💬"
              label="Chat"
            />
            <button
              onClick={() => setShowConfirm(true)}
              className="flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-2xl bg-red-600/20 hover:bg-red-600 border border-red-600/50 hover:border-red-600 text-red-400 hover:text-white transition-all duration-200 font-medium text-[11px] hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-red-900/40"
            >
              <span className="text-xl leading-none">🚪</span>
              <span className="leading-none">Leave</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
});

SessionControls.displayName = 'SessionControls';

export default SessionControls;
