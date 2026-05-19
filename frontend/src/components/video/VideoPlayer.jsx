import React, { useEffect, useRef } from 'react';

const VideoPlayer = ({ localStream, remoteStream, connectionStatus, remoteUserEmail, isMuted, isCameraOff }) => {
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
    connecting: 'bg-yellow-500',
    connected: 'bg-green-500',
    disconnected: 'bg-red-500',
    waiting: 'bg-blue-500',
  };

  const statusLabels = {
    connecting: 'Connecting…',
    connected: 'Connected',
    disconnected: 'Disconnected',
    waiting: 'Waiting for participant…',
  };

  return (
    <div className="relative w-full h-full flex flex-col md:flex-row gap-3">
      {/* Remote Video (main / large) */}
      <div className="relative flex-1 bg-gray-900 rounded-2xl overflow-hidden min-h-64">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-3xl mb-4">
              {remoteUserEmail ? remoteUserEmail.charAt(0).toUpperCase() : '?'}
            </div>
            <p className="text-sm font-medium">{remoteUserEmail || 'Waiting for participant…'}</p>
          </div>
        )}

        {/* Connection status badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
          <span className={`w-2 h-2 rounded-full ${statusColors[connectionStatus] || 'bg-gray-400'} ${connectionStatus === 'connecting' ? 'animate-pulse' : ''}`} />
          <span className="text-white text-xs font-medium">{statusLabels[connectionStatus] || connectionStatus}</span>
        </div>

        {/* Remote user label */}
        {remoteUserEmail && (
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1">
            <span className="text-white text-xs font-medium">{remoteUserEmail}</span>
          </div>
        )}
      </div>

      {/* Local Video (picture-in-picture / small) */}
      <div className="relative w-full md:w-56 h-40 md:h-auto bg-gray-800 rounded-2xl overflow-hidden flex-shrink-0">
        {localStream && !isCameraOff ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xl mb-2">
              👤
            </div>
            <p className="text-xs text-gray-400">{isCameraOff ? 'Camera off' : 'No camera'}</p>
          </div>
        )}

        {/* You label */}
        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded-md px-2 py-0.5">
          <span className="text-white text-xs">You</span>
        </div>

        {/* Muted indicator */}
        {isMuted && (
          <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14zM10 3a3 3 0 00-3 3v4a3 3 0 006 0V6a3 3 0 00-3-3z" clipRule="evenodd" />
              <path d="M7 10a3 3 0 005.916.67L7.07 5.065A3.001 3.001 0 007 6v4z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
