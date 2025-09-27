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
      const { data, error } = await supabase.rpc('set_config', {
        setting_name: 'app.user_email',
        setting_value: email
      });
      
      if (error) {
        console.error('Error setting database user email:', error);
        throw error;
      }
      
      console.log('Database session set for:', email);
    } catch (error) {
      console.error('Error setting database user email:', error);
      throw error;
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

      if (insertError) {
        console.log('User upsert info:', insertError); // This might not be an error, just info
      }

      // Store email locally and in app state
      const normalizedEmail = email.toLowerCase().trim();
      localStorage.setItem('userEmail', normalizedEmail);
      setUserEmail(normalizedEmail);
      
      // Set the email in the database connection for RLS - this is critical!
      await setDatabaseUserEmail(normalizedEmail);
      
      console.log('Successfully logged in as:', normalizedEmail);
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
    // Clear the database session
    setDatabaseUserEmail('').catch(console.error);
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