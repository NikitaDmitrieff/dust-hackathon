import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SimpleAuthContextType {
  userEmail: string | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

export const SimpleAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored email on app start
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      setUserEmail(storedEmail);
      // Set the email in the database connection for RLS
      setDatabaseUserEmail(storedEmail);
    }
    setLoading(false);
  }, []);

  const setDatabaseUserEmail = async (email: string) => {
    try {
      // Set the user email in the database session for RLS policies
      await supabase.rpc('set_config', {
        setting_name: 'app.user_email',
        setting_value: email
      });
    } catch (error) {
      console.error('Error setting database user email:', error);
    }
  };

  const login = async (email: string) => {
    setLoading(true);
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Create user if doesn't exist
      const { error: insertError } = await supabase
        .from('simple_users')
        .upsert({ 
          email: email.toLowerCase().trim(),
          display_name: email.split('@')[0] 
        }, {
          onConflict: 'email'
        });

      // Store email locally and in app state
      localStorage.setItem('userEmail', email.toLowerCase().trim());
      setUserEmail(email.toLowerCase().trim());
      
      // Set the email in the database connection for RLS
      await setDatabaseUserEmail(email.toLowerCase().trim());
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('userEmail');
    setUserEmail(null);
  };

  return (
    <SimpleAuthContext.Provider value={{ userEmail, loading, login, logout }}>
      {children}
    </SimpleAuthContext.Provider>
  );
};

export const useSimpleAuth = () => {
  const context = useContext(SimpleAuthContext);
  if (context === undefined) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider');
  }
  return context;
};