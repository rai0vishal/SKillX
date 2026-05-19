import React from 'react';

const SessionControls = ({
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
  const ControlButton = ({ onClick, active, activeClass, inactiveClass, icon, label, danger }) => (
    <button
      onClick={onClick}
      title={label}
      className={`
        flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-xs
        ${danger
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : active
            ? activeClass || 'bg-gray-700 text-white'
            : inactiveClass || 'bg-gray-800 hover:bg-gray-700 text-gray-300'
        }
      `}
    >
      <span className="text-xl leading-none">{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex items-center justify-between w-full bg-gray-900 border-t border-gray-700 px-4 py-3 gap-2 flex-wrap">
      {/* Left group: core AV controls */}
      <div className="flex items-center gap-2">
        <ControlButton
          onClick={onToggleMic}
          active={isMuted}
          activeClass="bg-red-600 text-white"
          inactiveClass="bg-gray-700 hover:bg-gray-600 text-white"
          icon={isMuted ? '🔇' : '🎤'}
          label={isMuted ? 'Unmute' : 'Mute'}
        />
        <ControlButton
          onClick={onToggleCamera}
          active={isCameraOff}
          activeClass="bg-red-600 text-white"
          inactiveClass="bg-gray-700 hover:bg-gray-600 text-white"
          icon={isCameraOff ? '📵' : '📷'}
          label={isCameraOff ? 'Show Cam' : 'Hide Cam'}
        />
        <ControlButton
          onClick={onToggleScreen}
          active={isScreenSharing}
          activeClass="bg-indigo-600 text-white"
          inactiveClass="bg-gray-700 hover:bg-gray-600 text-white"
          icon="🖥"
          label={isScreenSharing ? 'Stop Share' : 'Share Screen'}
        />
      </div>

      {/* Center: timer */}
      <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-4 py-2.5">
        <span className="text-lg">⏱</span>
        <span className="text-white font-mono font-bold text-base tracking-widest">{timerDisplay}</span>
      </div>

      {/* Right group: panels + leave */}
      <div className="flex items-center gap-2">
        <ControlButton
          onClick={onToggleChat}
          active={isChatOpen}
          activeClass="bg-indigo-600 text-white"
          inactiveClass="bg-gray-700 hover:bg-gray-600 text-white"
          icon="💬"
          label="Chat"
        />
        <ControlButton
          onClick={onToggleNotes}
          active={isNotesOpen}
          activeClass="bg-indigo-600 text-white"
          inactiveClass="bg-gray-700 hover:bg-gray-600 text-white"
          icon="📝"
          label="Notes"
        />
        <ControlButton
          onClick={onLeave}
          danger
          icon="🚪"
          label="Leave"
        />
      </div>
    </div>
  );
};

export default SessionControls;
