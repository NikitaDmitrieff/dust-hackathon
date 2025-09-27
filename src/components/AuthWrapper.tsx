import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const { user, loading, authError, retryCount, signInAnonymously } = useAuth();
  const [hasAttemptedAuth, setHasAttemptedAuth] = useState(false);
  const [isInFallbackMode, setIsInFallbackMode] = useState(false);

  useEffect(() => {
    // Only attempt auth once, and stop after too many retries or auth errors
    if (!user && !loading && !hasAttemptedAuth && retryCount < 3 && !authError) {
      setHasAttemptedAuth(true);
      signInAnonymously();
    }
    
    // Enter fallback mode if too many retries or there's a rate limit error
    if (retryCount >= 3 || (authError && authError.includes('rate limit'))) {
      setIsInFallbackMode(true);
    }
  }, [user, loading, hasAttemptedAuth, retryCount, authError, signInAnonymously]);

  // Show loading while auth is being established
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  // Show error state or fallback mode
  if (authError && !user && (retryCount >= 1 || isInFallbackMode)) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Connection Issue</h2>
          <p className="text-muted-foreground">
            We're experiencing high traffic. You can continue using the app in limited mode.
          </p>
          <Button 
            onClick={() => {
              setHasAttemptedAuth(false);
              setIsInFallbackMode(false);
              // Note: We can't directly reset retryCount from here since it's in the auth hook
              window.location.reload();
            }}
            variant="outline"
          >
            Try Again
          </Button>
          <Button 
            onClick={() => setIsInFallbackMode(true)}
            className="ml-2"
          >
            Continue in Limited Mode
          </Button>
        </div>
      </div>
    );
  }

  // If we're in fallback mode or have a successful user session, render children
  if (user || isInFallbackMode) {
    return <>{children}</>;
  }

  // Fallback loading state
  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-muted-foreground">Initializing...</p>
      </div>
    </div>
  );
};

export default AuthWrapper;