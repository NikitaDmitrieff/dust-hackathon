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
    // We no longer auto-trigger anonymous sign-in on mount to avoid rate limits.
    // We'll only attempt sign-in explicitly when the user performs an action.
    if (retryCount >= 3 || (authError && authError.includes('rate limit'))) {
      setIsInFallbackMode(true);
    }
  }, [retryCount, authError]);

  // Non-blocking: render children and show lightweight status indicators
  return (
    <>
      {loading && (
        <div className="fixed top-3 right-3 z-50 flex items-center gap-2 rounded-full bg-card px-3 py-2 shadow-md">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground">Preparing your workspace…</span>
        </div>
      )}

      {authError && !user && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full bg-destructive/10 px-4 py-2 shadow-md">
          <span className="text-xs text-destructive">High traffic detected. Retrying sign-in…</span>
          <Button size="sm" variant="outline" onClick={() => signInAnonymously()}>
            Retry now
          </Button>
        </div>
      )}

      {children}
    </>
  );
};

export default AuthWrapper;