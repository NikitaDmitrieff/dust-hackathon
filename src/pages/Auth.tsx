import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const Auth = () => {
  const [email, setEmail] = useState('test@example.com');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in via localStorage
    const storedEmail = localStorage.getItem('user_email');
    if (storedEmail) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('Starting login process...');
      const validatedData = emailSchema.parse({ email });
      setLoading(true);

      console.log('Attempting login with email:', validatedData.email);

      // Store email in localStorage first
      localStorage.setItem('user_email', validatedData.email);
      console.log('Email stored in localStorage');

      try {
        // Set the email in Supabase config for RLS
        await supabase.rpc('set_config', {
          setting_name: 'app.user_email',
          setting_value: validatedData.email
        });
        console.log('Supabase RPC successful');
      } catch (supabaseError) {
        console.error('Supabase RPC error (continuing anyway):', supabaseError);
      }

      // Show success message
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });

      console.log('Login successful, triggering storage event for immediate auth update');
      
      // Trigger storage event to immediately update auth context
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'user_email',
        newValue: validatedData.email,
        oldValue: null,
      }));

      // Navigate to home after a short delay to ensure auth state is updated
      setTimeout(() => {
        console.log('Navigating to home page');
        navigate('/');
      }, 200);

    } catch (error) {
      console.error('Login error:', error);
      localStorage.removeItem('user_email'); // Clean up on error
      
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Error",
          description: "Failed to log in. Please try again.",
          variant: "destructive",
        });
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      {/* Logo Header */}
      <div className="p-6 bg-gradient-subtle">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center hover:opacity-80 transition-opacity"
        >
          <img 
            src="/logo_txt.png" 
            alt="Scribe Form" 
            className="w-auto h-12"
          />
        </button>
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome</CardTitle>
          <CardDescription>
            Enter your email to access the form builder
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Continue'}
            </Button>
          </form>
        </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;