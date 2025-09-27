import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: { email: string } | null;
  session: { user: { email: string } } | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

// Create context with null as default to force provider usage
const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [session, setSession] = useState<{ user: { email: string } } | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('AuthProvider: Component initialized');

  useEffect(() => {
    console.log('AuthProvider: useEffect running');
    
    // Force re-check auth state when component mounts
    const checkStoredEmail = async () => {
      try {
        console.log('AuthProvider: Checking authentication state...');
        const storedEmail = localStorage.getItem('user_email');
        
        if (storedEmail) {
          console.log('AuthProvider: Found stored email:', storedEmail);
          const userObj = { email: storedEmail };
          setUser(userObj);
          setSession({ user: userObj });
          
          // Set user email in Supabase config for RLS
          try {
            await supabase.rpc('set_config', {
              setting_name: 'app.user_email',
              setting_value: storedEmail
            });
            console.log('AuthProvider: Supabase config set successfully');
          } catch (error) {
            console.error('AuthProvider: Error setting Supabase config:', error);
          }
        } else {
          console.log('AuthProvider: No stored email found - user not authenticated');
          setUser(null);
          setSession(null);
        }
      } catch (error) {
        console.error('AuthProvider: Error checking stored email:', error);
        setUser(null);
        setSession(null);
      } finally {
        console.log('AuthProvider: Auth loading complete, setting loading to false');
        setLoading(false);
      }
    };

    checkStoredEmail();

    // Listen for storage changes (e.g., login in another tab or manual storage updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_email') {
        console.log('AuthProvider: Storage change detected for user_email, re-checking auth');
        setLoading(true); // Set loading to true during re-check
        checkStoredEmail();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const signOut = async () => {
    try {
      console.log('AuthProvider: Signing out user');
      localStorage.removeItem('user_email');
      setUser(null);
      setSession(null);
      console.log('AuthProvider: User signed out successfully');
    } catch (error) {
      console.error('AuthProvider: Error during signout:', error);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signOut,
  };

  console.log('AuthProvider: Rendering with value:', { user: user?.email, loading });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};