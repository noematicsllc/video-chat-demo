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
      
      // Generate token from backend
      let token: string;
      let finalServerUrl: string;
      try {
        const tokenResponse = await generateToken({
          room_name: roomName,
          participant_name: participantName,
        });
        token = tokenResponse.token;
        finalServerUrl = tokenResponse.url || getLiveKitServerUrl() || '';
      } catch (err: any) {
        const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to generate token';
        throw new Error(`Token generation failed: ${errorMessage}`);
      }

      if (!token) {
        throw new Error('No token received from server');
      }

      if (!finalServerUrl) {
        throw new Error('LiveKit server URL not configured');
      }

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
      await newRoom.connect(finalServerUrl, token);
      
      // Enable camera and microphone (may fail if permissions not granted)
      try {
        await newRoom.localParticipant.setCameraEnabled(true);
        await newRoom.localParticipant.setMicrophoneEnabled(true);
      } catch (err) {
        console.warn('Failed to enable camera/microphone:', err);
        // Continue even if camera/mic can't be enabled
      }

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

