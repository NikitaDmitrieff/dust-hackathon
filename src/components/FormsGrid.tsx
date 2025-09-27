import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Edit, BarChart3, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';

interface Form {
  form_id: string;
  title: string;
  description: string | null;
  creation_date: string;
}

interface FormsGridProps {
  onEditForm: (formId: string) => void;
  onViewDashboard: (formId: string) => void;
}

const FormsGrid = ({ onEditForm, onViewDashboard }: FormsGridProps) => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { userEmail } = useSimpleAuth();

  useEffect(() => {
    if (userEmail) {
      fetchUserForms();
    } else {
      setLoading(false);
    }
  }, [userEmail]);

  const fetchUserForms = async () => {
    try {
      console.log('Fetching forms for user:', userEmail);
      
      // Fetch forms where user_id matches the current user's email
      const { data, error } = await supabase
        .from('form')
        .select('form_id, title, description, creation_date')
        .eq('user_id', userEmail)
        .order('creation_date', { ascending: false });

      console.log('Forms query result:', { data, error, userEmail });

      if (error) {
        console.error('Error fetching forms:', error);
        toast({
          title: "Error",
          description: "Failed to fetch your forms",
          variant: "destructive",
        });
        return;
      }

      setForms(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your forms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyFormLink = (formId: string) => {
    const formUrl = `${window.location.origin}/?id=${formId}`;
    navigator.clipboard.writeText(formUrl);
    toast({
      title: "Copied!",
      description: "Form link copied to clipboard",
    });
  };

  if (loading) {
    return (
      <div className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Your Forms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-8 bg-muted rounded"></div>
                    <div className="h-8 bg-muted rounded"></div>
                    <div className="h-8 bg-muted rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <div className="py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-8">Your Forms</h2>
          <div className="bg-card/50 rounded-2xl p-12 border border-border/30">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Forms Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first form to get started collecting responses
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Your Forms</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <Card key={form.form_id} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-card/80 backdrop-blur-sm border border-white/20">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center mb-3">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(form.creation_date).toLocaleDateString()}
                  </div>
                </div>
                <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                  {form.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3rem]">
                  {form.description || 'No description provided'}
                </p>
                
                <div className="space-y-2 pt-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full flex items-center gap-2 bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary"
                    onClick={() => copyFormLink(form.form_id)}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Copy Form Link
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full flex items-center gap-2 hover:bg-accent"
                    onClick={() => onEditForm(form.form_id)}
                  >
                    <Edit className="w-4 h-4" />
                    Edit Form
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full flex items-center gap-2 hover:bg-secondary"
                    onClick={() => onViewDashboard(form.form_id)}
                  >
                    <BarChart3 className="w-4 h-4" />
                    View Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FormsGrid;