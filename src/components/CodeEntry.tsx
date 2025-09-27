import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CodeEntryProps {
  onFormFound: (formId: string) => void;
  onBack?: () => void;
}

const CodeEntry = ({ onFormFound, onBack }: CodeEntryProps) => {
  const [code, setCode] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      toast({
        title: "Error",
        description: "Please enter a form code",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);
    
    try {
      // Check if the form exists
      const { data, error } = await supabase
        .from('form')
        .select('form_id, title, description')
        .eq('form_id', code.trim())
        .maybeSingle();

      if (error) {
        console.error('Error checking form:', error);
        toast({
          title: "Error",
          description: "Failed to check form code",
          variant: "destructive",
        });
        return;
      }

      if (!data) {
        toast({
          title: "Invalid Code",
          description: "No form found with this code",
          variant: "destructive",
        });
        return;
      }

      // Form found, navigate to it
      onFormFound(data.form_id);
      
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border border-white/20">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Enter Form Code</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter the code you received to access the form
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-medium text-foreground">
                Form Code
              </Label>
              <Input
                id="code"
                type="text"
                placeholder="Enter your form code..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full"
                disabled={isChecking}
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary transition-all duration-300"
              disabled={isChecking}
            >
              {isChecking ? (
                "Checking..."
              ) : (
                <>
                  Access Form
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
          
          {onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              className="w-full"
            >
              ← Back
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CodeEntry;