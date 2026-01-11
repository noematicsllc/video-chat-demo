/** Audio/video controls component. */

import { useState, useEffect, useRef } from 'react';
import { Room } from 'livekit-client';
import { 
  applyBackgroundProcessor, 
  getLocalVideoTrack, 
  isBackgroundProcessingSupported,
  type BackgroundMode 
} from '../utils/backgroundProcessor';
import { BACKGROUND_OPTIONS, type BackgroundOption } from '../utils/backgrounds';

interface ControlsProps {
  room: Room | null;
  onLeave: () => void;
}

export function Controls({ room, onLeave }: ControlsProps) {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>('none');
  const [selectedBackground, setSelectedBackground] = useState<BackgroundOption | null>(null);
  const [showBackgroundMenu, setShowBackgroundMenu] = useState(false);
  const [isBackgroundSupported, setIsBackgroundSupported] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsBackgroundSupported(isBackgroundProcessingSupported());
  }, []);

  useEffect(() => {
    if (room) {
      setIsAudioEnabled(room.localParticipant.isMicrophoneEnabled);
      setIsVideoEnabled(room.localParticipant.isCameraEnabled);
    }
  }, [room]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowBackgroundMenu(false);
      }
    };

    if (showBackgroundMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showBackgroundMenu]);

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
            await handleBackgroundModeChange(backgroundMode, selectedBackground);
          }
        }, 100);
      }
      setIsVideoEnabled(!isVideoEnabled);
    } catch (error) {
      console.error('Failed to toggle video:', error);
    }
  };

  const handleBackgroundModeChange = async (mode: BackgroundMode, background?: BackgroundOption | null) => {
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

      const options: { blurRadius?: number; backgroundImageUrl?: string } = {};
      
      if (mode === 'blur') {
        options.blurRadius = 20;
      } else if (mode === 'custom' && background) {
        options.backgroundImageUrl = background.imageUrl;
      }

      await applyBackgroundProcessor(track, mode, options);
      
      setBackgroundMode(mode);
      if (mode === 'custom') {
        setSelectedBackground(background || null);
      } else {
        setSelectedBackground(null);
      }
      setShowBackgroundMenu(false);
    } catch (error) {
      console.error('Failed to change background mode:', error);
    }
  };

  const handleBackgroundSelect = async (background: BackgroundOption) => {
    await handleBackgroundModeChange('custom', background);
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
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowBackgroundMenu(!showBackgroundMenu)}
              style={{
                padding: '10px 20px',
                backgroundColor: backgroundMode === 'custom' ? '#9c27b0' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
              title="Select custom background"
            >
              🖼️ Background {showBackgroundMenu ? '▼' : '▶'}
            </button>
            {showBackgroundMenu && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: '0',
                marginBottom: '5px',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                padding: '10px',
                minWidth: '250px',
                maxHeight: '400px',
                overflowY: 'auto',
                zIndex: 1000
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px'
                }}>
                  {BACKGROUND_OPTIONS.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => handleBackgroundSelect(bg)}
                      style={{
                        border: selectedBackground?.id === bg.id ? '3px solid #9c27b0' : '1px solid #ddd',
                        borderRadius: '4px',
                        padding: '5px',
                        cursor: 'pointer',
                        backgroundColor: 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                      title={bg.name}
                    >
                      <img
                        src={bg.thumbnailUrl}
                        alt={bg.name}
                        style={{
                          width: '100%',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '2px'
                        }}
                      />
                      <span style={{
                        fontSize: '11px',
                        color: '#333',
                        textAlign: 'center'
                      }}>{bg.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
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

