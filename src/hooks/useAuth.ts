import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // User signed in, profile should be created by trigger
          console.log('User signed in:', session.user.id);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInAnonymously = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      
      const { data, error } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            display_name: 'Anonymous User',
            is_anonymous: true
          }
        }
      });
      
      if (error) {
        // Handle rate limiting specifically
        if (error.message?.includes('rate limit') || error.status === 429) {
          setAuthError('Rate limited. Please wait a moment and try again.');
          setRetryCount(prev => prev + 1);
        } else {
          setAuthError(error.message || 'Authentication failed');
        }
        throw error;
      }
      
      setRetryCount(0);
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      return { user: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const upgradeToEmailAccount = async (email: string, password: string) => {
    try {
      if (!user) throw new Error('No user session');
      
      const { data, error } = await supabase.auth.updateUser({
        email,
        password,
        data: {
          is_anonymous: false
        }
      });
      
      if (error) throw error;
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Error upgrading account:', error);
      return { user: null, error };
    }
  };

  return {
    user,
    session,
    loading,
    authError,
    retryCount,
    signInAnonymously,
    signOut,
    upgradeToEmailAccount,
    isAnonymous: user?.is_anonymous !== false
  };
}