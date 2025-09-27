import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: { email: string } | null;
  session: { user: { email: string } } | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [session, setSession] = useState<{ user: { email: string } } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored email
    const checkStoredEmail = async () => {
      const storedEmail = localStorage.getItem('user_email');
      if (storedEmail) {
        const userObj = { email: storedEmail };
        setUser(userObj);
        setSession({ user: userObj });
        
        // Set user email in Supabase config for RLS
        await supabase.rpc('set_config', {
          setting_name: 'app.user_email',
          setting_value: storedEmail
        });
      }
      setLoading(false);
    };

    checkStoredEmail();
  }, []);

  const signOut = async () => {
    localStorage.removeItem('user_email');
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};