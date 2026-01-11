/** Main video chat component. */

import { useState } from 'react';
import { useLiveKit } from '../hooks/useLiveKit';
import { VideoGrid } from './VideoGrid';
import { Controls } from './Controls';
import { RoomJoin } from './RoomJoin';

interface VideoChatProps {
  userName?: string;
}

export function VideoChat({ userName }: VideoChatProps) {
  const { room, isConnected, error, connect, disconnect, participants } = useLiveKit();
  const [roomName, setRoomName] = useState<string | null>(null);

  const handleJoin = async (name: string, participantName: string) => {
    try {
      setRoomName(name);
      await connect(name, participantName);
    } catch (err) {
      console.error('Failed to join room:', err);
    }
  };

  const handleLeave = () => {
    disconnect();
    setRoomName(null);
  };

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '20px'
      }}>
        <div style={{
          padding: '40px',
          border: '1px solid #dc3545',
          borderRadius: '8px',
          backgroundColor: '#f8d7da',
          color: '#721c24'
        }}>
          <h2>Error</h2>
          <p>{error.message}</p>
          <button
            onClick={handleLeave}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!roomName || !isConnected) {
    return <RoomJoin onJoin={handleJoin} userName={userName} />;
  }

  const allParticipants = room ? [room.localParticipant, ...participants] : [];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        padding: '10px 20px',
        backgroundColor: '#fff',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0 }}>Room: {roomName}</h2>
        <div style={{ color: '#666' }}>
          {allParticipants.length} participant{allParticipants.length !== 1 ? 's' : ''}
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <VideoGrid room={room} participants={participants} />
      </div>
      <Controls room={room} onLeave={handleLeave} />
    </div>
  );
}

