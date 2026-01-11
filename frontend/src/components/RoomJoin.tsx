/** Room join form component. */

import { useState, FormEvent } from 'react';

interface RoomJoinProps {
  onJoin: (roomName: string, participantName: string) => void;
  userName?: string;
}

export function RoomJoin({ onJoin, userName }: RoomJoinProps) {
  const [roomName, setRoomName] = useState('');
  const [participantName, setParticipantName] = useState(userName || '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (roomName.trim() && participantName.trim()) {
      onJoin(roomName.trim(), participantName.trim());
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        padding: '40px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ marginBottom: '20px', textAlign: 'center' }}>
          Join Room
        </h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label 
              htmlFor="room-name"
              style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}
            >
              Room Name
            </label>
            <input
              id="room-name"
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label 
              htmlFor="participant-name"
              style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}
            >
              Your Name
            </label>
            <input
              id="participant-name"
              type="text"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              placeholder="Enter your name"
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
}

