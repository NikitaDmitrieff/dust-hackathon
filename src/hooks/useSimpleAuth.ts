import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useSimpleAuth() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user email is stored in localStorage
    const storedEmail = localStorage.getItem('user_email');
    if (storedEmail) {
      setUserEmail(storedEmail);
      // Set the database session setting
      supabase.rpc('set_config', { 
        setting_name: 'app.user_email', 
        setting_value: storedEmail 
      });
    }
  }, []);

  const signIn = async (email: string) => {
    try {
      setLoading(true);
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Store the email in localStorage
      localStorage.setItem('user_email', email);
      setUserEmail(email);

      // Set the database session setting for RLS policies
      await supabase.rpc('set_config', { 
        setting_name: 'app.user_email', 
        setting_value: email 
      });

      // Insert or update user in simple_users table
      await supabase
        .from('simple_users')
        .upsert({ 
          email, 
          display_name: email.split('@')[0] 
        }, { 
          onConflict: 'email' 
        });

      return { success: true, error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem('user_email');
    setUserEmail(null);
    // Clear the database session setting
    supabase.rpc('set_config', { 
      setting_name: 'app.user_email', 
      setting_value: '' 
    });
  };

  return {
    userEmail,
    loading,
    signIn,
    signOut,
    isSignedIn: !!userEmail
  };
}