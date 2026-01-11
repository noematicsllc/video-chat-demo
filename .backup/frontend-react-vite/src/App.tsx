/** Main application component. */

import { useState, useEffect } from 'react';
import { OptionsPage } from './components/OptionsPage';
import { VideoChat } from './components/VideoChat';
import { useAuth } from './hooks/useAuth';
import { isServerUrlConfigured } from './utils/config';

function App() {
  const { user, isAuthenticated, loading, login } = useAuth();
  const [serverConfigured, setServerConfigured] = useState(false);

  useEffect(() => {
    setServerConfigured(isServerUrlConfigured());
  }, []);

  const handleServerConfigured = () => {
    setServerConfigured(true);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        Loading...
      </div>
    );
  }

  // Show options page if server not configured
  if (!serverConfigured) {
    return <OptionsPage onConfigured={handleServerConfigured} />;
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
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
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h1 style={{ marginBottom: '20px' }}>Video Chat</h1>
          <p style={{ marginBottom: '30px', color: '#666' }}>
            Please log in to continue
          </p>
          <button
            onClick={login}
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
            Login with Zitadel
          </button>
        </div>
      </div>
    );
  }

  // Show video chat
  return (
    <VideoChat
      userName={user?.name || user?.preferred_username || undefined}
    />
  );
}

export default App;

