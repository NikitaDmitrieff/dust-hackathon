import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, MoveUp, MoveDown, Copy, Link, Check, Sparkles, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Question {
  id: string;
  question: string;
  type: string;
  options?: string[];
  required: boolean;
}

interface FormBuilderProps {
  onBack?: () => void;
  editingFormId?: string | null;
}

const FormBuilder = ({ onBack, editingFormId }: FormBuilderProps) => {
  const { userEmail } = useSimpleAuth();
  const { toast } = useToast();
  
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [publishedFormId, setPublishedFormId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Load form data when editing
  useEffect(() => {
    if (editingFormId) {
      loadFormData(editingFormId);
    } else {
      // Reset form when creating new
      setFormTitle('');
      setFormDescription('');
      setQuestions([]);
    }
  }, [editingFormId]);

  const loadFormData = async (formId: string) => {
    try {
      // Load form details
      const { data: formData, error: formError } = await supabase
        .from('form')
        .select('title, description')
        .eq('form_id', formId)
        .single();

      if (formError) {
        console.error('Error loading form:', formError);
        toast({
          title: "Error",
          description: "Failed to load form data",
          variant: "destructive",
        });
        return;
      }

      setFormTitle(formData.title);
      setFormDescription(formData.description || '');

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('question')
        .select('question_id, question, type_answer')
        .eq('form_id', formId)
        .order('question_id');

      if (questionsError) {
        console.error('Error loading questions:', questionsError);
        toast({
          title: "Error",
          description: "Failed to load questions",
          variant: "destructive",
        });
        return;
      }

      const loadedQuestions: Question[] = questionsData.map(q => ({
        id: q.question_id,
        question: q.question,
        type: q.type_answer,
        required: false // Default value since it's not stored in DB yet
      }));

      setQuestions(loadedQuestions);
    } catch (error) {
      console.error('Error loading form data:', error);
      toast({
        title: "Error",
        description: "Failed to load form data",
        variant: "destructive",
      });
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question: '',
      type: 'text',
      required: false
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, ...updates } : q
    ));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const moveQuestion = (id: string, direction: 'up' | 'down') => {
    const index = questions.findIndex(q => q.id === id);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;
    
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    setQuestions(newQuestions);
  };

  const handleQuestionTypeChange = (id: string, type: string) => {
    const updates: Partial<Question> = { type };
    
    // Reset options for non-choice types
    if (!['radio', 'checkbox', 'select'].includes(type)) {
      updates.options = undefined;
    } else if (!questions.find(q => q.id === id)?.options) {
      // Add default options for choice types
      updates.options = ['Option 1', 'Option 2'];
    }
    
    updateQuestion(id, updates);
  };

  const updateQuestionOptions = (id: string, options: string[]) => {
    updateQuestion(id, { options });
  };

  const saveForm = async () => {
    if (!formTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a form title.",
        variant: "destructive",
      });
      return;
    }

    if (questions.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one question.",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    try {
      if (editingFormId) {
        // Update existing form
        console.log('Updating form with data:', { 
          title: formTitle.trim(), 
          description: formDescription.trim() || null,
          form_id: editingFormId
        });
        
        // Update form
        const { error: formError } = await supabase
          .from('form')
          .update({
            title: formTitle.trim(),
            description: formDescription.trim() || null,
          })
          .eq('form_id', editingFormId);

        if (formError) {
          console.error('Error updating form:', formError);
          throw new Error(`Failed to update form: ${formError.message}`);
        }

        // Delete existing questions
        const { error: deleteError } = await supabase
          .from('question')
          .delete()
          .eq('form_id', editingFormId);

        if (deleteError) {
          console.error('Error deleting old questions:', deleteError);
          throw new Error(`Failed to delete old questions: ${deleteError.message}`);
        }

        // Insert new questions
        const questionsToInsert = questions.map(q => ({
          form_id: editingFormId,
          question: q.question.trim(),
          type_answer: q.type
        }));

        if (questionsToInsert.length > 0) {
          const { error: questionsError } = await supabase
            .from('question')
            .insert(questionsToInsert);

          if (questionsError) {
            console.error('Error creating questions:', questionsError);
            throw new Error(`Failed to create questions: ${questionsError.message}`);
          }
        }

        setPublishedFormId(editingFormId);
      } else {
        // Create new form
        console.log('Creating form with data:', { 
          title: formTitle.trim(), 
          description: formDescription.trim() || null,
          user_id: userEmail || 'anonymous'
        });
        
        // Create form
        const { data: formData, error: formError } = await supabase
          .from('form')
          .insert({
            title: formTitle.trim(),
            description: formDescription.trim() || null,
            user_id: userEmail || 'anonymous'
          })
          .select('form_id')
          .single();

        if (formError) {
          console.error('Error creating form:', formError);
          throw new Error(`Failed to create form: ${formError.message}`);
        }

        console.log('Form created successfully:', formData);

        // Create questions
        const questionsToInsert = questions.map(q => ({
          form_id: formData.form_id,
          question: q.question.trim(),
          type_answer: q.type
        }));

        console.log('Creating questions:', questionsToInsert);

        const { error: questionsError } = await supabase
          .from('question')
          .insert(questionsToInsert);

        if (questionsError) {
          console.error('Error creating questions:', questionsError);
          throw new Error(`Failed to create questions: ${questionsError.message}`);
        }

        setPublishedFormId(formData.form_id);
      }
      setIsLinkDialogOpen(true);
      
      setIsLinkDialogOpen(true);
      
      toast({
        title: "Success!",
        description: `Form ${editingFormId ? 'updated' : 'published'} successfully!`,
      });

    } catch (error) {
      console.error('Error publishing form:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to publish form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const copyFormLink = async () => {
    if (!publishedFormId) return;
    
    try {
      const formUrl = `${window.location.origin}/?id=${publishedFormId}`;
      await navigator.clipboard.writeText(formUrl);
      setIsCopied(true);
      toast({
        title: "Copied!",
        description: "Form link copied to clipboard",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const questionTypes = [
    { value: 'text', label: 'Short Text' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'number', label: 'Number' },
    { value: 'email', label: 'Email' },
    { value: 'radio', label: 'Multiple Choice' },
    { value: 'checkbox', label: 'Checkboxes' },
    { value: 'select', label: 'Dropdown' }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-purple-50 via-purple-100/50 to-purple-200/30 relative">
      {/* Background noise texture */}
      <div className="absolute inset-0 opacity-20 bg-noise"></div>
      
      <div className="relative z-10 h-full p-4 flex gap-4">
        {/* Left Section - AI Assistant (Original) */}
        <div className="w-1/2 h-[calc(100vh-8rem)] bg-card/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 flex flex-col overflow-hidden">
          {/* Header with Form Inputs */}
          <div className="p-8 border-b border-border/50 bg-gradient-to-r from-card to-card/80 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="formTitle" className="text-sm font-medium text-foreground">
                Form Name
              </Label>
              <Input
                id="formTitle"
                placeholder="Enter your form name..."
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="bg-background/50 border-border/30 focus:border-primary/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="formDescription" className="text-sm font-medium text-foreground">
                Form Description
              </Label>
              <Textarea
                id="formDescription"
                placeholder="Describe what your form is for..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="bg-background/50 border-border/30 focus:border-primary/50 min-h-[80px] resize-none"
              />
            </div>
          </div>

          {/* Activity Logs - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                Activity Log
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm group">
                  <div className="w-2 h-2 rounded-full bg-primary/60 mt-2 flex-shrink-0 group-hover:bg-primary transition-colors"></div>
                  <div className="flex-1 bg-muted/30 rounded-lg p-3 hover:bg-muted/50 transition-colors">
                    <p className="text-foreground font-medium">Form builder initialized...</p>
                    <p className="text-xs text-muted-foreground mt-1">Ready to create your form</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm group">
                  <div className="w-2 h-2 rounded-full bg-primary/60 mt-2 flex-shrink-0 group-hover:bg-primary transition-colors"></div>
                  <div className="flex-1 bg-muted/30 rounded-lg p-3 hover:bg-muted/50 transition-colors">
                    <p className="text-foreground font-medium">Add questions on the right panel</p>
                    <p className="text-xs text-muted-foreground mt-1">Use the question editor to build your form</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Buttons */}
          <div className="p-8 border-t border-border/50 bg-gradient-to-r from-card/80 to-card space-y-4">
            <Button 
              onClick={() => {
                toast({
                  title: "AI Assistant",
                  description: "AI form building coming soon! For now, use the question editor on the right.",
                });
              }}
              className="w-full h-14 flex items-center justify-center gap-3 bg-gradient-to-r from-primary via-primary-glow to-primary hover:from-primary-glow hover:via-primary hover:to-primary-glow shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 text-primary-foreground font-semibold text-base rounded-xl border-0"
              size="lg"
            >
              <Sparkles className="w-5 h-5" />
              Talk to Assistant
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-pulse"></div>
            </Button>
            
            <Button 
              onClick={saveForm}
              disabled={isPublishing || !formTitle.trim() || questions.length === 0}
              className="w-full h-14 flex items-center justify-center gap-3 bg-gradient-to-r from-secondary via-accent to-secondary hover:from-accent hover:via-secondary hover:to-accent shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 text-secondary-foreground font-semibold text-base rounded-xl border border-white/30"
              size="lg"
            >
              <Zap className="w-5 h-5" />
              {isPublishing ? 'Publishing...' : 'Publish and Get Code'}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 animate-pulse opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            </Button>
          </div>

          {/* Back Button */}
          {onBack && (
            <div className="p-6 pt-0">
              <Button 
                onClick={onBack}
                variant="ghost"
                size="sm"
                className="hover:bg-muted/50"
              >
                ← Back to Home
              </Button>
            </div>
          )}
        </div>

        {/* Right Section - Question Editor */}
        <div className="w-1/2 h-[calc(100vh-8rem)] bg-card/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-8 border-b">
            <h3 className="text-lg font-semibold text-foreground">Question Editor</h3>
            <p className="text-sm text-muted-foreground">Add and customize your form questions</p>
          </div>
          
          <ScrollArea className="h-[calc(100%-8rem)]">
            <div className="p-6 space-y-4">
              {questions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No questions yet</p>
                  <Button onClick={addQuestion} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Question
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <Card key={question.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            Question {index + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveQuestion(question.id, 'up')}
                              disabled={index === 0}
                            >
                              <MoveUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveQuestion(question.id, 'down')}
                              disabled={index === questions.length - 1}
                            >
                              <MoveDown className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteQuestion(question.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Input
                            value={question.question}
                            onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                            placeholder="Enter your question..."
                          />
                          
                          <div className="flex items-center gap-2">
                            <Select
                              value={question.type}
                              onValueChange={(value) => handleQuestionTypeChange(question.id, value)}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {questionTypes.map(type => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={question.required}
                                onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                              />
                              Required
                            </label>
                          </div>

                          {['radio', 'checkbox', 'select'].includes(question.type) && (
                            <div className="space-y-2">
                              <Label className="text-xs">Options:</Label>
                              {question.options?.map((option, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-2">
                                  <Input
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...(question.options || [])];
                                      newOptions[optIndex] = e.target.value;
                                      updateQuestionOptions(question.id, newOptions);
                                    }}
                                    placeholder={`Option ${optIndex + 1}`}
                                    className="text-sm"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const newOptions = question.options?.filter((_, i) => i !== optIndex) || [];
                                      updateQuestionOptions(question.id, newOptions);
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newOptions = [...(question.options || []), ''];
                                  updateQuestionOptions(question.id, newOptions);
                                }}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add Option
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {/* Add Question Button - Below last question */}
                  <div className="pt-4">
                    <Button onClick={addQuestion} variant="outline" className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Published Form Link Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link className="w-5 h-5 text-primary" />
              Your Form Code is Ready!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Form Code:</p>
              <div className="flex items-center space-x-2">
                <div className="flex-1 p-3 bg-muted rounded-lg border">
                  <code className="text-lg font-mono text-foreground break-all">
                    {publishedFormId || ''}
                  </code>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    if (publishedFormId) {
                      navigator.clipboard.writeText(publishedFormId);
                      setIsCopied(true);
                      toast({
                        title: "Copied!",
                        description: "Form code copied to clipboard",
                      });
                      setTimeout(() => setIsCopied(false), 2000);
                    }
                  }}
                  className="flex items-center gap-2 px-3"
                >
                  {isCopied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {isCopied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Form Link:</p>
              <div className="flex items-center space-x-2">
                <div className="flex-1 p-3 bg-muted rounded-lg border">
                  <code className="text-sm text-foreground break-all">
                    {publishedFormId ? `${window.location.origin}/?id=${publishedFormId}` : ''}
                  </code>
                </div>
                <Button
                  size="sm"
                  onClick={copyFormLink}
                  className="flex items-center gap-2 px-3"
                >
                  <Copy className="w-4 h-4" />
                  Copy Link
                </Button>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Share the code or link to collect responses for your form.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormBuilder;