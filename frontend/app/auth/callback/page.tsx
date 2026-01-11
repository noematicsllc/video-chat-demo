/** OAuth callback handler for Zitadel authentication. */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Check for error in URL
      const errorParam = searchParams.get('error');
      if (errorParam) {
        setError(`Authentication error: ${errorParam}`);
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      // Get authorization code from URL
      const code = searchParams.get('code');
      if (!code) {
        setError('No authorization code received');
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      try {
        // Exchange code for token via API route
        const redirectUri = `${window.location.origin}/auth/callback`;
        const response = await fetch('/api/auth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            redirectUri,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Token exchange failed');
        }

        const data = await response.json();
        
        if (!data.token) {
          throw new Error('No token received from server');
        }

        // Store token and redirect
        setAuthToken(data.token);
        router.push('/');
      } catch (err) {
        console.error('Callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setTimeout(() => router.push('/'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, router, setAuthToken]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            Authentication Error
          </h1>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground mt-4">
            Redirecting to home page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}

