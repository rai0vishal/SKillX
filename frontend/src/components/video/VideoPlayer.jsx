import React, { useEffect, useRef, memo } from 'react';

const VideoPlayer = memo(({ localStream, remoteStream, connectionStatus, remoteUserEmail, isMuted, isCameraOff, userEmail }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const statusColors = {
    connecting: 'bg-yellow-500 animate-pulse',
    connected: 'bg-emerald-500',
    disconnected: 'bg-red-500',
    waiting: 'bg-blue-500 animate-pulse',
  };

  const statusLabels = {
    connecting: 'Connecting…',
    connected: 'Connected',
    disconnected: 'Disconnected',
    waiting: 'Waiting for participant',
  };

  const remoteInitial = remoteUserEmail ? remoteUserEmail.charAt(0).toUpperCase() : '?';
  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : 'Y';

  return (
    <div className="relative w-full h-full">
      {/* ── Main area: remote participant ── */}
      <div className="relative w-full h-full bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          /* Waiting / empty state */
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="relative mb-6">
              {/* Outer pulse ring */}
              <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping scale-125" />
              <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-pulse scale-150" />
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-700 to-purple-800 flex items-center justify-center text-4xl font-bold text-white relative z-10 shadow-lg shadow-indigo-900/50">
                {remoteInitial}
              </div>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">
              {connectionStatus === 'waiting' ? 'Waiting for participant…' : remoteUserEmail || 'Connecting…'}
            </h3>
            {connectionStatus === 'waiting' && (
              <div className="flex flex-col items-center gap-2 text-gray-400 text-sm max-w-xs text-center">
                <p className="flex items-center gap-2"><span className="text-green-400">✓</span> Session created successfully</p>
                <p className="flex items-center gap-2"><span className="text-green-400">✓</span> Invitation sent</p>
                <p className="flex items-center gap-2 text-indigo-400 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse inline-block" />
                  Waiting for other participant to join
                </p>
              </div>
            )}
          </div>
        )}

        {/* Connection status badge — top left */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 shadow">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[connectionStatus] || 'bg-gray-400'}`} />
          <span className="text-white text-xs font-medium">{statusLabels[connectionStatus] || connectionStatus}</span>
        </div>

        {/* Remote user name — bottom left */}
        {remoteUserEmail && remoteStream && (
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow">
            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
              {remoteInitial}
            </div>
            <span className="text-white text-sm font-medium">{remoteUserEmail.split('@')[0]}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
        )}
      </div>

      {/* ── Floating PiP: self-cam ── */}
      <div className="absolute top-4 right-4 w-44 aspect-video bg-gray-800 rounded-xl overflow-hidden shadow-xl border-2 border-gray-700 hover:border-indigo-500 transition-colors z-10 flex-shrink-0">
        {localStream && !isCameraOff ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-800">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-base mb-1">
              {userInitial}
            </div>
            <p className="text-[10px] text-gray-500">{isCameraOff ? 'Camera off' : 'No camera'}</p>
          </div>
        )}

        {/* You label */}
        <div className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5">
          <span className="text-white text-[10px] font-medium">You</span>
        </div>

        {/* Muted indicator */}
        {isMuted && (
          <div className="absolute top-1.5 right-1.5 bg-red-500 rounded-full p-1">
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14zM10 3a3 3 0 00-3 3v4a3 3 0 006 0V6a3 3 0 00-3-3z" clipRule="evenodd" />
              <path d="M7 10a3 3 0 005.916.67L7.07 5.065A3.001 3.001 0 007 6v4z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
