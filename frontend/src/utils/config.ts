/** Frontend configuration and utilities. */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export const config = {
  backendUrl: BACKEND_URL,
  zitadelIssuerUrl: import.meta.env.VITE_ZITADEL_ISSUER_URL || '',
  zitadelClientId: import.meta.env.VITE_ZITADEL_CLIENT_ID || '',
};

export const getLiveKitServerUrl = (): string | null => {
  return localStorage.getItem('livekit_server_url');
};

export const setLiveKitServerUrl = (url: string): void => {
  localStorage.setItem('livekit_server_url', url);
};

export const isServerUrlConfigured = (): boolean => {
  return getLiveKitServerUrl() !== null;
};

