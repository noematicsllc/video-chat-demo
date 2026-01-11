/** Custom hook for LiveKit connection. */

import { Room, RoomEvent, RemoteParticipant } from 'livekit-client';
import { useEffect, useState, useCallback } from 'react';
import { generateToken } from '../services/api';
import { getLiveKitServerUrl } from '../utils/config';

interface UseLiveKitReturn {
  room: Room | null;
  isConnected: boolean;
  error: Error | null;
  connect: (roomName: string, participantName?: string) => Promise<void>;
  disconnect: () => void;
  participants: RemoteParticipant[];
}

export function useLiveKit(): UseLiveKitReturn {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);

  const connect = useCallback(async (roomName: string, participantName?: string) => {
    try {
      setError(null);
      
      // Get LiveKit server URL
      const serverUrl = getLiveKitServerUrl();
      if (!serverUrl) {
        throw new Error('LiveKit server URL not configured');
      }

      // Generate token from backend
      const { token, url } = await generateToken({
        room_name: roomName,
        participant_name: participantName,
      });

      // Create room instance
      const newRoom = new Room();
      
      // Set up event listeners
      newRoom.on(RoomEvent.Connected, () => {
        setIsConnected(true);
        setParticipants(Array.from(newRoom.remoteParticipants.values()));
      });

      newRoom.on(RoomEvent.Disconnected, () => {
        setIsConnected(false);
        setParticipants([]);
      });

      newRoom.on(RoomEvent.ParticipantConnected, () => {
        setParticipants(Array.from(newRoom.remoteParticipants.values()));
      });

      newRoom.on(RoomEvent.ParticipantDisconnected, () => {
        setParticipants(Array.from(newRoom.remoteParticipants.values()));
      });

      // Connect to room
      await newRoom.connect(url || serverUrl, token);
      
      // Enable camera and microphone
      await newRoom.localParticipant.enableCameraAndMicrophone();

      setRoom(newRoom);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsConnected(false);
      throw error;
    }
  }, []);

  const disconnect = useCallback(() => {
    if (room) {
      room.disconnect();
      setRoom(null);
      setIsConnected(false);
      setParticipants([]);
    }
  }, [room]);

  useEffect(() => {
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [room]);

  return {
    room,
    isConnected,
    error,
    connect,
    disconnect,
    participants,
  };
}

