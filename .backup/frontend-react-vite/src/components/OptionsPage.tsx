/** Minimal options page for LiveKit server configuration. */

import { useState, FormEvent } from 'react';
import { setLiveKitServerUrl } from '../utils/config';

interface OptionsPageProps {
  onConfigured: () => void;
}

export function OptionsPage({ onConfigured }: OptionsPageProps) {
  const [serverUrl, setServerUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic URL validation
    if (!serverUrl.trim()) {
      setError('Server URL is required');
      return;
    }

    try {
      // Validate URL format
      const url = new URL(serverUrl);
      if (url.protocol !== 'wss:' && url.protocol !== 'ws:') {
        setError('URL must use ws:// or wss:// protocol');
        return;
      }
    } catch (err) {
      setError('Invalid URL format');
      return;
    }

    // Save to localStorage
    setLiveKitServerUrl(serverUrl.trim());
    onConfigured();
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
        maxWidth: '500px',
        width: '100%',
        padding: '40px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ marginBottom: '20px', textAlign: 'center' }}>
          Configure LiveKit Server
        </h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label 
              htmlFor="server-url" 
              style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}
            >
              LiveKit Server URL
            </label>
            <input
              id="server-url"
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="wss://your-livekit-server.com"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
            {error && (
              <div style={{ color: 'red', marginTop: '8px', fontSize: '14px' }}>
                {error}
              </div>
            )}
          </div>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Save Configuration
          </button>
        </form>
      </div>
    </div>
  );
}

