import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Form {
  id: string;
  title: string;
  description: string;
  is_published: boolean;
  created_at: string;
  _count?: { responses: number };
}

interface Response {
  id: string;
  response_data: any;
  submitted_at: string;
  forms: { title: string; user_id: string };
}

interface AdminPanelProps {
  onBack: () => void;
}

const AdminPanel = ({ onBack }: AdminPanelProps) => {
  const [forms, setForms] = useState<Form[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to access admin panel",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setForms(data || []);
    } catch (error) {
      console.error('Error loading forms:', error);
      toast({
        title: "Error",
        description: "Failed to load forms",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadResponses = async (formId: string) => {
    try {
      const { data, error } = await supabase
        .from('form_responses')
        .select(`
          *,
          forms!inner(title, user_id)
        `)
        .eq('form_id', formId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      setResponses(data || []);
      setSelectedFormId(formId);
    } catch (error) {
      console.error('Error loading responses:', error);
      toast({
        title: "Error",
        description: "Failed to load responses",
        variant: "destructive",
      });
    }
  };

  const copyFormLink = (formId: string) => {
    const url = `${window.location.origin}/form/${formId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied!",
      description: "Form link copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="max-w-6xl mx-auto space-y-8">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Forms List */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Your Forms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {forms.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No forms created yet
                </p>
              ) : (
                forms.map((form) => (
                  <div
                    key={form.id}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => loadResponses(form.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <h3 className="font-semibold text-foreground">
                          {form.title}
                        </h3>
                        {form.description && (
                          <p className="text-sm text-muted-foreground">
                            {form.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(form.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Badge 
                          variant={form.is_published ? "default" : "secondary"}
                        >
                          {form.is_published ? "Published" : "Draft"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyFormLink(form.id);
                          }}
                        >
                          Copy Link
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Responses */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>
                {selectedFormId ? "Form Responses" : "Select a Form"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedFormId ? (
                <p className="text-muted-foreground text-center py-8">
                  Click on a form to view its responses
                </p>
              ) : responses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No responses yet
                </p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {responses.map((response) => (
                    <div
                      key={response.id}
                      className="p-4 border rounded-lg bg-background/50"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            {new Date(response.submitted_at).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          {Object.entries(response.response_data).map(([fieldId, value]) => (
                            <div key={fieldId} className="space-y-1">
                              <p className="text-sm font-medium text-foreground">
                                Field {fieldId}:
                              </p>
                              <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                                {String(value)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Summary */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-primary">
                  {forms.length}
                </div>
                <p className="text-sm text-muted-foreground">Total Forms</p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-primary">
                  {forms.filter(f => f.is_published).length}
                </div>
                <p className="text-sm text-muted-foreground">Published Forms</p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-primary">
                  {responses.length}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedFormId ? "Responses for Selected Form" : "Total Responses"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;