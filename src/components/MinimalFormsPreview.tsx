import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Trash2, BarChart3, Edit3, ExternalLink } from 'lucide-react';
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
  onDeleteForm?: (formId: string) => void;
}

const MinimalFormsPreview = ({ onEditForm, onViewDashboard, onDeleteForm }: MinimalFormsPreviewProps) => {
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
      // Fetch only the 6 most recent forms
      const { data, error } = await supabase
        .from('form')
        .select('form_id, title, description, creation_date')
        .eq('user_id', user?.email)
        .order('creation_date', { ascending: false })
        .limit(6);

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

  const deleteForm = async (formId: string) => {
    if (!confirm("Are you sure you want to delete this form? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('form')
        .delete()
        .eq('form_id', formId)
        .eq('user_id', user?.email);

      if (error) {
        console.error('Error deleting form:', error);
        toast({
          title: "Error",
          description: "Failed to delete form",
          variant: "destructive",
        });
        return;
      }

      // Remove from local state
      setForms(forms.filter(form => form.form_id !== formId));
      
      toast({
        title: "Deleted",
        description: "Form deleted successfully",
      });

      // Call the optional callback
      onDeleteForm?.(formId);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to delete form",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4">        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse bg-card/50 border-border/30">
              <CardContent className="p-3">
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
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forms.map((form) => (
          <Card 
            key={form.form_id} 
            className="group hover:shadow-lg transition-all duration-300 bg-card/50 backdrop-blur-sm border-border/30 hover:border-primary/20"
          >
            <CardContent className="p-3">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                    {form.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {new Date(form.creation_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-1 justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-orange-50 hover:text-orange-600 text-orange-500"
                  onClick={() => copyFormLink(form.form_id)}
                  title="Share form"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                  onClick={() => deleteForm(form.form_id)}
                  title="Delete form"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => onViewDashboard(form.form_id)}
                  title="View dashboard"
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                  onClick={() => onEditForm(form.form_id)}
                  title="Edit form"
                >
                  <Edit3 className="w-4 h-4" />
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
