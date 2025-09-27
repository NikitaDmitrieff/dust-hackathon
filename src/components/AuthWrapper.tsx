import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const { user, loading, signInAnonymously } = useAuth();

  useEffect(() => {
    // If no user and not loading, automatically sign in anonymously
    if (!user && !loading) {
      signInAnonymously();
    }
  }, [user, loading, signInAnonymously]);

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

  return <>{children}</>;
};

export default AuthWrapper;