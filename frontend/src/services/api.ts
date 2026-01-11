/** API client for backend communication. */

import axios from 'axios';
import { config } from '../utils/config';

const apiClient = axios.create({
  baseURL: config.backendUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface TokenRequest {
  room_name: string;
  participant_name?: string;
}

export interface TokenResponse {
  token: string;
  url: string;
}

export interface RoomInfo {
  name: string;
  num_participants: number;
}

export interface RoomListResponse {
  rooms: RoomInfo[];
}

/**
 * Generate a LiveKit access token.
 */
export async function generateToken(request: TokenRequest): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>('/api/tokens', request);
  return response.data;
}

/**
 * List available rooms.
 */
export async function listRooms(): Promise<RoomListResponse> {
  const response = await apiClient.get<RoomListResponse>('/api/rooms');
  return response.data;
}

/**
 * Get information about a specific room.
 */
export async function getRoom(roomName: string): Promise<RoomInfo> {
  const response = await apiClient.get<RoomInfo>(`/api/rooms/${roomName}`);
  return response.data;
}

