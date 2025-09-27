import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FormField {
  id: string;
  type: 'text' | 'email' | 'textarea' | 'select';
  label: string;
  required: boolean;
  options?: string[];
}

interface Form {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
}

const PublicForm = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadForm = async () => {
      if (!formId) return;

      try {
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .eq('id', formId)
          .eq('is_published', true)
          .single();

        if (error) throw error;

        setForm({
          id: data.id,
          title: data.title,
          description: data.description || '',
          fields: (data.fields as any) || [],
        });
      } catch (error) {
        console.error('Error loading form:', error);
        toast({
          title: "Error",
          description: "Form not found or is not published",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadForm();
  }, [formId, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form) return;

    // Validate required fields
    const missingFields = form.fields
      .filter(field => field.required && !responses[field.id]?.trim())
      .map(field => field.label);

    if (missingFields.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('form_responses')
        .insert([{
          form_id: form.id,
          response_data: responses,
          client_ip: null, // Could be added with server-side logging
          user_agent: navigator.userAgent,
        }]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your response has been submitted",
      });

      // Clear form
      setResponses({});
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Failed to submit response",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading form...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-8">
            <h1 className="text-xl font-bold text-foreground mb-2">Form Not Found</h1>
            <p className="text-muted-foreground mb-4">
              This form may have been removed or is not published.
            </p>
            <Button onClick={() => navigate('/')}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold font-display text-foreground">
            {form.title}
          </h1>
          {form.description && (
            <p className="text-muted-foreground">
              {form.description}
            </p>
          )}
        </div>

        {/* Form */}
        <Card className="shadow-elegant">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {form.fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </label>
                  
                  {field.type === 'textarea' ? (
                    <Textarea
                      value={responses[field.id] || ''}
                      onChange={(e) => setResponses({
                        ...responses,
                        [field.id]: e.target.value
                      })}
                      placeholder="Enter your response..."
                      rows={4}
                      required={field.required}
                    />
                  ) : (
                    <Input
                      type={field.type}
                      value={responses[field.id] || ''}
                      onChange={(e) => setResponses({
                        ...responses,
                        [field.id]: e.target.value
                      })}
                      placeholder="Enter your response..."
                      required={field.required}
                    />
                  )}
                </div>
              ))}

              <div className="pt-4">
                <Button 
                  type="submit" 
                  variant="hero" 
                  size="lg" 
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Submitting..." : "Submit Response"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Powered by <span className="font-semibold text-primary">Scribe Form</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicForm;