/** Audio/video controls component. */

import { useState, useEffect } from 'react';
import { Room } from 'livekit-client';
import { 
  applyBackgroundProcessor, 
  getLocalVideoTrack, 
  isBackgroundProcessingSupported,
  type BackgroundMode 
} from '../utils/backgroundProcessor';

interface ControlsProps {
  room: Room | null;
  onLeave: () => void;
}

export function Controls({ room, onLeave }: ControlsProps) {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>('none');
  const [isBackgroundSupported, setIsBackgroundSupported] = useState(false);

  useEffect(() => {
    setIsBackgroundSupported(isBackgroundProcessingSupported());
  }, []);

  useEffect(() => {
    if (room) {
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
        // Wait a bit for the track to be ready, then re-apply background processor
        setTimeout(async () => {
          if (backgroundMode !== 'none') {
            await handleBackgroundModeChange(backgroundMode);
          }
        }, 100);
      }
      setIsVideoEnabled(!isVideoEnabled);
    } catch (error) {
      console.error('Failed to toggle video:', error);
    }
  };

  const handleBackgroundModeChange = async (mode: BackgroundMode) => {
    if (!room || !isVideoEnabled) return;
    
    try {
      // Try to get the track, with a small delay to ensure it's ready
      let track = getLocalVideoTrack(room);
      if (!track) {
        // Wait a bit and try again
        await new Promise(resolve => setTimeout(resolve, 200));
        track = getLocalVideoTrack(room);
      }
      
      if (!track) {
        console.warn('No local video track available');
        return;
      }

      await applyBackgroundProcessor(track, mode, {
        blurRadius: 20,
        // For custom backgrounds, you can add a default image URL here
        // backgroundImageUrl: '/path/to/default-background.jpg'
      });
      
      setBackgroundMode(mode);
    } catch (error) {
      console.error('Failed to change background mode:', error);
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
      {isBackgroundSupported && isVideoEnabled && (
        <>
          <button
            onClick={() => handleBackgroundModeChange('blur')}
            style={{
              padding: '10px 20px',
              backgroundColor: backgroundMode === 'blur' ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
            title="Blur background"
          >
            🔲 Blur
          </button>
          <button
            onClick={() => handleBackgroundModeChange('none')}
            style={{
              padding: '10px 20px',
              backgroundColor: backgroundMode === 'none' ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
            title="Remove background effect"
          >
            🎥 Normal
          </button>
        </>
      )}
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

