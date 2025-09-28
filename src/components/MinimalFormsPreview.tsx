import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, ExternalLink, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Form {
  form_id: string;
  title: string;
  description: string | null;
  creation_date: string;
}

interface MinimalFormsPreviewProps {
  onEditForm: (formId: string) => void;
  onViewDashboard: (formId: string) => void;
}

const MinimalFormsPreview = ({ onEditForm, onViewDashboard }: MinimalFormsPreviewProps) => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.email) {
      fetchRecentForms();
    } else {
      setLoading(false);
    }
  }, [user?.email]);

  const fetchRecentForms = async () => {
    try {
      // Fetch only the 3 most recent forms
      const { data, error } = await supabase
        .from('form')
        .select('form_id, title, description, creation_date')
        .eq('user_id', user?.email)
        .order('creation_date', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Error fetching recent forms:', error);
        return;
      }

      setForms(data || []);
    } catch (error) {
      console.error('Error:', error);
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
      <div className="w-full max-w-4xl mx-auto px-4">        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse bg-card/50 border-border/30">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-3"></div>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 text-center">
        <div className="bg-card/30 backdrop-blur-sm rounded-2xl p-8 border border-border/20">
          <FileText className="w-12 h-12 text-muted-foreground/60 mx-auto mb-4" />
          <p className="text-muted-foreground">
            No forms created yet. Click the button above to get started!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {forms.map((form) => (
          <Card 
            key={form.form_id} 
            className="group hover:shadow-lg transition-all duration-300 bg-card/50 backdrop-blur-sm border-border/30 hover:border-primary/20"
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                    {form.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {new Date(form.creation_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => copyFormLink(form.form_id)}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Share
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => onEditForm(form.form_id)}
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MinimalFormsPreview;
