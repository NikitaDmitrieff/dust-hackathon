import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ExternalLink, Edit, BarChart3, FileText, Trash2 } from 'lucide-react';
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
  const [deleteFormId, setDeleteFormId] = useState<string | null>(null);
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
      
      // Ensure RLS is properly set before querying
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for RLS to be set
      
      // Fetch forms where user_id matches the current user's email
      const { data, error } = await supabase
        .from('form')
        .select('form_id, title, description, creation_date')
        .eq('user_id', userEmail)
        .order('creation_date', { ascending: false });

      console.log('Forms query result:', { data, error, userEmail });

      if (error) {
        console.error('Error fetching forms:', error);
        
        // Retry once if we get an error
        console.log('Retrying form fetch...');
        const { data: retryData, error: retryError } = await supabase
          .from('form')
          .select('form_id, title, description, creation_date')
          .eq('user_id', userEmail)
          .order('creation_date', { ascending: false });
          
        if (retryError) {
          console.error('Retry failed:', retryError);
          toast({
            title: "Error",
            description: "Failed to fetch your forms. Please try refreshing the page.",
            variant: "destructive",
          });
          return;
        }
        
        console.log('Retry successful:', retryData);
        setForms(retryData || []);
        return;
      }

      setForms(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your forms. Please try refreshing the page.",
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

  const deleteForm = async (formId: string) => {
    try {
      // First delete all questions for this form
      const { error: questionsError } = await supabase
        .from('question')
        .delete()
        .eq('form_id', formId);

      if (questionsError) {
        console.error('Error deleting questions:', questionsError);
        toast({
          title: "Error",
          description: "Failed to delete form questions",
          variant: "destructive",
        });
        return;
      }

      // Then delete all answers for this form
      const { error: answersError } = await supabase
        .from('answer')
        .delete()
        .in('question_id', 
          (await supabase.from('question').select('question_id').eq('form_id', formId)).data?.map(q => q.question_id) || []
        );

      // Delete the form itself
      const { error: formError } = await supabase
        .from('form')
        .delete()
        .eq('form_id', formId);

      if (formError) {
        console.error('Error deleting form:', formError);
        toast({
          title: "Error",
          description: "Failed to delete form",
          variant: "destructive",
        });
        return;
      }

      // Refresh the forms list
      await fetchUserForms();
      
      toast({
        title: "Success",
        description: "Form deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting form:', error);
      toast({
        title: "Error",
        description: "Failed to delete form",
        variant: "destructive",
      });
    } finally {
      setDeleteFormId(null);
    }
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
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full flex items-center gap-2 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setDeleteFormId(form.form_id)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Form
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <AlertDialog open={!!deleteFormId} onOpenChange={() => setDeleteFormId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the form and all its responses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteFormId && deleteForm(deleteFormId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FormsGrid;