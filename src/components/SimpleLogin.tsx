import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, LogIn } from 'lucide-react';
import { useSimpleAuth } from '@/hooks/useSimpleAuth';
import { useToast } from '@/hooks/use-toast';

interface SimpleLoginProps {
  onLoginSuccess?: () => void;
}

const SimpleLogin = ({ onLoginSuccess }: SimpleLoginProps) => {
  const [email, setEmail] = useState('');
  const { signIn, loading } = useSimpleAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await signIn(email);
    
    if (result.success) {
      toast({
        title: "Welcome!",
        description: `Signed in as ${email}`,
      });
      onLoginSuccess?.();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to sign in",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Welcome to Scribe Form</CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter your email to access your forms
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full flex items-center gap-2"
            disabled={loading || !email}
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
          
          <div className="text-center text-xs text-muted-foreground">
            Try: test@example.com to see sample forms
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SimpleLogin;