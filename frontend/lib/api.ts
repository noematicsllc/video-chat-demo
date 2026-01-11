/** API client for Next.js API routes. */

import axios, { AxiosError } from 'axios';
import { getToken } from './auth';

const apiClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Extract error message from response
    if (error.response) {
      const message =
        (error.response.data as any)?.detail ||
        (error.response.data as any)?.message ||
        error.message;
      error.message = message as string;
    }
    return Promise.reject(error);
  }
);

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

export interface ChatTokenResponse {
  token: string;
  ws_url: string;
}

/**
 * Generate a LiveKit access token from the Next.js API route.
 */
export async function generateToken(
  request: TokenRequest
): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>('/api/tokens', request);
  return response.data;
}

/**
 * Generate a chat server JWT token from the Next.js API route.
 */
export async function generateChatToken(): Promise<ChatTokenResponse> {
  const response = await apiClient.get<ChatTokenResponse>('/api/chat/token');
  return response.data;
}

