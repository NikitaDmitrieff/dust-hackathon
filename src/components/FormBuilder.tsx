import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, MoveUp, MoveDown, Copy, Link, Check } from 'lucide-react';
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
}

const FormBuilder = ({ onBack }: FormBuilderProps) => {
  const { userEmail } = useSimpleAuth();
  const { toast } = useToast();
  
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [publishedFormId, setPublishedFormId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

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

  const publishForm = async () => {
    if (!userEmail) {
      toast({
        title: "Error",
        description: "You must be logged in to publish a form.",
        variant: "destructive",
      });
      return;
    }

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
      // Create form
      const { data: formData, error: formError } = await supabase
        .from('form')
        .insert({
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          user_id: userEmail
        })
        .select('form_id')
        .single();

      if (formError) {
        console.error('Error creating form:', formError);
        throw new Error('Failed to create form');
      }

      // Create questions
      const questionsToInsert = questions.map(q => ({
        form_id: formData.form_id,
        question: q.question.trim(),
        type_answer: q.type
      }));

      const { error: questionsError } = await supabase
        .from('question')
        .insert(questionsToInsert);

      if (questionsError) {
        console.error('Error creating questions:', questionsError);
        throw new Error('Failed to create questions');
      }

      setPublishedFormId(formData.form_id);
      setIsLinkDialogOpen(true);
      
      toast({
        title: "Success!",
        description: "Your form has been published successfully.",
      });

    } catch (error) {
      console.error('Error publishing form:', error);
      toast({
        title: "Error",
        description: "Failed to publish form. Please try again.",
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
    <div className="min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-subtle relative">
      <div className="relative z-10 h-full p-4 flex gap-4">
        
        {/* Left Panel - Form Builder */}
        <div className="w-1/2 h-[calc(100vh-8rem)] bg-card rounded-2xl shadow-lg border flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b bg-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Create Form</h2>
              {onBack && (
                <Button variant="ghost" onClick={onBack} size="sm">
                  ← Back
                </Button>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="title">Form Title</Label>
                <Input
                  id="title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Enter form title..."
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Enter form description..."
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Questions</h3>
                  <Button onClick={addQuestion} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                </div>

                {questions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No questions yet. Click "Add Question" to get started.</p>
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
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Publish Button */}
          <div className="p-6 border-t">
            <Button 
              onClick={publishForm}
              disabled={isPublishing || !formTitle.trim() || questions.length === 0}
              className="w-full"
              size="lg"
            >
              {isPublishing ? 'Publishing...' : 'Publish and Get Final Link'}
            </Button>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="w-1/2 h-[calc(100vh-8rem)] bg-card rounded-2xl shadow-lg border overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Form Preview</h3>
          </div>
          
          <ScrollArea className="h-[calc(100%-5rem)]">
            <div className="p-6">
              <Card>
                <CardHeader>
                  <CardTitle>{formTitle || 'Form Title'}</CardTitle>
                  {formDescription && (
                    <CardDescription>{formDescription}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {questions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Add questions to see preview
                    </p>
                  ) : (
                    questions.map((question, index) => (
                      <div key={question.id} className="space-y-2">
                        <Label className="text-sm font-medium">
                          {index + 1}. {question.question || 'Question text'}
                          {question.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        
                        {question.type === 'text' && (
                          <Input placeholder="Text input" disabled />
                        )}
                        
                        {question.type === 'textarea' && (
                          <Textarea placeholder="Long text input" disabled rows={3} />
                        )}
                        
                        {question.type === 'number' && (
                          <Input type="number" placeholder="Number input" disabled />
                        )}
                        
                        {question.type === 'email' && (
                          <Input type="email" placeholder="Email input" disabled />
                        )}
                        
                        {question.type === 'radio' && (
                          <div className="space-y-2">
                            {question.options?.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <input type="radio" disabled />
                                <span className="text-sm">{option || `Option ${optIndex + 1}`}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {question.type === 'checkbox' && (
                          <div className="space-y-2">
                            {question.options?.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <input type="checkbox" disabled />
                                <span className="text-sm">{option || `Option ${optIndex + 1}`}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {question.type === 'select' && (
                          <Select disabled>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose an option" />
                            </SelectTrigger>
                          </Select>
                        )}
                      </div>
                    ))
                  )}
                  
                  {questions.length > 0 && (
                    <Button disabled className="w-full">
                      Submit Form
                    </Button>
                  )}
                </CardContent>
              </Card>
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
              Your Form is Published!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
                {isCopied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {isCopied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Share this link to collect responses for your form. You can view the form dashboard from your forms list.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormBuilder;