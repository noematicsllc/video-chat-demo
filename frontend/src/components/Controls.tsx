/** Audio/video controls component. */

import { useState, useEffect } from 'react';
import { Room, LocalParticipant } from 'livekit-client';

interface ControlsProps {
  room: Room | null;
  onLeave: () => void;
}

export function Controls({ room, onLeave }: ControlsProps) {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);

  useEffect(() => {
    if (room) {
      setLocalParticipant(room.localParticipant);
      setIsAudioEnabled(room.localParticipant.isMicrophoneEnabled);
      setIsVideoEnabled(room.localParticipant.isCameraEnabled);
    }
  }, [room]);

  const toggleAudio = async () => {
    if (!room) return;
    
    try {
      if (isAudioEnabled) {
        await room.localParticipant.setMicrophoneEnabled(false);
      } else {
        await room.localParticipant.setMicrophoneEnabled(true);
      }
      setIsAudioEnabled(!isAudioEnabled);
    } catch (error) {
      console.error('Failed to toggle audio:', error);
    }
  };

  const toggleVideo = async () => {
    if (!room) return;
    
    try {
      if (isVideoEnabled) {
        await room.localParticipant.setCameraEnabled(false);
      } else {
        await room.localParticipant.setCameraEnabled(true);
      }
      setIsVideoEnabled(!isVideoEnabled);
    } catch (error) {
      console.error('Failed to toggle video:', error);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: '10px',
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderTop: '1px solid #ddd'
    }}>
      <button
        onClick={toggleAudio}
        style={{
          padding: '10px 20px',
          backgroundColor: isAudioEnabled ? '#28a745' : '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        {isAudioEnabled ? '🔊 Mute' : '🔇 Unmute'}
      </button>
      <button
        onClick={toggleVideo}
        style={{
          padding: '10px 20px',
          backgroundColor: isVideoEnabled ? '#28a745' : '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        {isVideoEnabled ? '📹 Video On' : '📹 Video Off'}
      </button>
      <button
        onClick={onLeave}
        style={{
          padding: '10px 20px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Leave Room
      </button>
    </div>
  );
}

