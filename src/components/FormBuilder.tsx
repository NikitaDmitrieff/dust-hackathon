import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FormField {
  id: string;
  type: 'text' | 'email' | 'textarea' | 'select';
  label: string;
  required: boolean;
  options?: string[];
}

interface FormBuilderProps {
  onBack: () => void;
}

const FormBuilder = ({ onBack }: FormBuilderProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const { toast } = useToast();

  const addField = (type: FormField['type']) => {
    if (!newFieldLabel.trim()) {
      toast({
        title: "Error",
        description: "Please enter a field label",
        variant: "destructive",
      });
      return;
    }

    const newField: FormField = {
      id: crypto.randomUUID(),
      type,
      label: newFieldLabel,
      required: false,
    };

    setFields([...fields, newField]);
    setNewFieldLabel("");
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const createForm = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a form title",
        variant: "destructive",
      });
      return;
    }

    if (fields.length === 0) {
      toast({
        title: "Error", 
        description: "Please add at least one field",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to create forms",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('forms')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          fields: fields,
          is_published: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Form "${title}" created successfully`,
      });

      // Show the shareable link
      const shareUrl = `${window.location.origin}/form/${data.id}`;
      navigator.clipboard.writeText(shareUrl);
      
      toast({
        title: "Link Copied!",
        description: "Form link copied to clipboard",
      });

      onBack();
    } catch (error) {
      console.error('Error creating form:', error);
      toast({
        title: "Error",
        description: "Failed to create form",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <h1 className="text-3xl font-bold font-display">Create Form</h1>
          <div></div>
        </div>

        {/* Form Builder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Builder Panel */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Form Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Form Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter form title..."
                  className="font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Add Fields</h3>
                
                <div className="space-y-2">
                  <Input
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    placeholder="Field label..."
                  />
                  
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" onClick={() => addField('text')}>
                      + Text
                    </Button>
                    <Button size="sm" onClick={() => addField('email')}>
                      + Email
                    </Button>
                    <Button size="sm" onClick={() => addField('textarea')}>
                      + Long Text
                    </Button>
                  </div>
                </div>
              </div>

              <Button 
                variant="hero" 
                size="lg" 
                onClick={createForm}
                disabled={isCreating}
                className="w-full"
              >
                {isCreating ? "Creating..." : "Create Form"}
              </Button>
            </CardContent>
          </Card>

          {/* Preview Panel */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {title && (
                <div>
                  <h2 className="text-xl font-bold text-foreground">{title}</h2>
                  {description && (
                    <p className="text-muted-foreground mt-1">{description}</p>
                  )}
                </div>
              )}

              <div className="space-y-4">
                {fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">
                        {field.label}
                      </label>
                      <Button
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeField(field.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        ×
                      </Button>
                    </div>
                    
                    {field.type === 'textarea' ? (
                      <Textarea placeholder="Response..." disabled />
                    ) : (
                      <Input 
                        type={field.type} 
                        placeholder="Response..." 
                        disabled 
                      />
                    )}
                    
                    <Badge variant="secondary" className="text-xs">
                      {field.type}
                    </Badge>
                  </div>
                ))}
                
                {fields.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    Add fields to see preview
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;