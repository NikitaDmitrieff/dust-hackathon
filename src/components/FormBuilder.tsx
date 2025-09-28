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
import { Plus, Trash2, MoveUp, MoveDown, Copy, Link, Check, Sparkles, Zap, PhoneOff, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import VoiceAssistant from './VoiceAssistant';

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
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [publishedFormId, setPublishedFormId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [voiceConnectionState, setVoiceConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

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

      const loadedQuestions: Question[] = questionsData.map(q => {
        // Parse question text and options for radio/checkbox types
        let questionText = q.question;
        let options: string[] | undefined = undefined;
        
        if (q.question.includes('|OPTIONS:')) {
          const [text, optionsString] = q.question.split('|OPTIONS:');
          questionText = text;
          options = optionsString.split('||').filter(opt => opt.trim() !== '');
        } else if (['radio', 'checkbox', 'select'].includes(q.type_answer)) {
          options = ['Option 1', 'Option 2'];
        }
        
        return {
          id: q.question_id,
          question: questionText,
          type: q.type_answer,
          options,
          required: false // Default value since it's not stored in DB yet
        };
      });

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

  const handleAIAssistant = () => {
    console.log('\n🎙️ FORMBUILDER: OPENING VOICE ASSISTANT');
    console.log('   Current form state:');
    console.log('     Title:', formTitle);
    console.log('     Description:', formDescription);
    console.log('     Questions:', questions.length);
    console.log('     Editing form ID:', editingFormId);
    setShowVoiceAssistant(true);
  };

  const endCallAndGenerateForm = async () => {
    console.log('\n🚀 FORMBUILDER: END CALL AND GENERATE FORM BUTTON CLICKED');
    console.log('   Current session ID:', currentSessionId);
    console.log('   Timestamp:', new Date().toISOString());
    
    // Add a delay to ensure disconnection, conversation saving, and analysis are processed
    console.log('   ⏳ WAITING 2 SECONDS FOR CONVERSATION PROCESSING...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('   ✅ CONVERSATION PROCESSING WAIT COMPLETED');
    
    try {
      console.log('   📋 FORM CREATION MODE - GENERATING FORM');
      // Generate form from conversation
      console.log('   🌐 CALLING API: /api/generate-form');
      const response = await fetch('http://localhost:3001/api/generate-form');
      console.log('   📨 API RESPONSE STATUS:', response.status);
      
      if (response.ok) {
        const formData = await response.json();
        console.log('   ✅ FORM GENERATED:', formData);
        handleFormGenerated(formData);
        console.log('   🚪 HIDING VOICE ASSISTANT');
        setShowVoiceAssistant(false);
      } else {
        const errorText = await response.text();
        console.log('   ❌ API ERROR:', errorText);
        toast({
          title: "Error",
          description: "Failed to generate form. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ FORMBUILDER ERROR GENERATING:', error);
      toast({
        title: "Error",
        description: "Error generating form. Please check the connection.",
        variant: "destructive",
      });
    }
  };

  const stopSession = () => {
    console.log('🛑 FORMBUILDER: STOP SESSION');
    setVoiceConnectionState('disconnected');
    setCurrentSessionId(null);
    setShowVoiceAssistant(false);
    toast({
      title: "Session Stopped",
      description: "Voice session has been terminated.",
    });
  };

  const handleFormGenerated = (formData: any) => {
    console.log('\n🎉 FORMBUILDER: FORM DATA RECEIVED FROM ASSISTANT');
    console.log('   Raw form data:', formData);
    console.log('   Timestamp:', new Date().toISOString());
    
    // Update the form with generated data
    if (formData.title || formData.form_title) {
      const title = formData.title || formData.form_title;
      console.log('   🏷️ Setting form title:', title);
      setFormTitle(title);
    }
    if (formData.description || formData.form_description) {
      const description = formData.description || formData.form_description;
      console.log('   📝 Setting form description:', description);
      setFormDescription(description);
    }
    if (formData.questions && Array.isArray(formData.questions)) {
      console.log('   ❓ Processing', formData.questions.length, 'questions');
      const formattedQuestions = formData.questions.map((q: any, index: number) => {
        const formatted = {
          id: `q_${Date.now()}_${index}`,
          question: q.question || q.text || '',
          type: q.type || 'text',
          options: q.options || [],
          required: q.required !== false
        };
        console.log(`     Question ${index + 1}:`, formatted);
        return formatted;
      });
      setQuestions(formattedQuestions);
      console.log('   ✅ All questions set successfully');
    }
    
    console.log('   ✅ FORM DATA PROCESSING COMPLETE');
    
    toast({
      title: "Success!",
      description: "Form generated successfully by the assistant.",
    });
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

        // Insert new questions with question text encoding options for radio/checkbox
        const questionsToInsert = questions.map((q, index) => {
          let questionText = q.question.trim();
          // Encode options in question text for radio/checkbox types
          if (['radio', 'checkbox', 'select'].includes(q.type) && q.options) {
            questionText = `${q.question.trim()}|OPTIONS:${q.options.join('||')}`;
          }
          return {
            form_id: editingFormId,
            question: questionText,
            type_answer: q.type
          };
        });

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
          user_id: user?.email || 'anonymous'
        });
        
        // Create form
        const { data: formData, error: formError } = await supabase
          .from('form')
          .insert({
            title: formTitle.trim(),
            description: formDescription.trim() || null,
            user_id: user?.email || 'anonymous'
          })
          .select('form_id')
          .single();

        if (formError) {
          console.error('Error creating form:', formError);
          throw new Error(`Failed to create form: ${formError.message}`);
        }

        console.log('Form created successfully:', formData);

        // Create questions with question text encoding options for radio/checkbox
        const questionsToInsert = questions.map((q, index) => {
          let questionText = q.question.trim();
          // Encode options in question text for radio/checkbox types
          if (['radio', 'checkbox', 'select'].includes(q.type) && q.options) {
            questionText = `${q.question.trim()}|OPTIONS:${q.options.join('||')}`;
          }
          return {
            form_id: formData.form_id,
            question: questionText,
            type_answer: q.type
          };
        });

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
      
      <div className="relative z-10 h-full px-16 py-4 flex justify-center gap-10">
        {/* Left Section - AI Assistant (Original) */}
        <div className="w-2/5 h-[calc(100vh-12rem)] bg-card/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 flex flex-col overflow-hidden">
          {/* Header with Form Inputs */}
          <div className="p-6 border-b border-border/50 bg-gradient-to-r from-card to-card/80 space-y-4">
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

          {/* Voice Assistant or Instructions */}
          <div className="flex-1 overflow-y-auto">
<<<<<<< HEAD
            {showVoiceAssistant ? (
              <div className="p-6 h-full">
                <VoiceAssistant
                  formId={editingFormId || publishedFormId || 'new-form'}
                  onFormGenerated={handleFormGenerated}
                  onClose={() => setShowVoiceAssistant(false)}
                  onEndCall={endCallAndGenerateForm}
                  onStopSession={stopSession}
                  isInline={true}
                />
=======
            <div className="p-4">
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
>>>>>>> origin/main-armand
              </div>
              ) : (
                <div className="p-6 h-full flex items-center justify-center">
                  <Card className="w-full max-w-md mx-auto bg-card/50 backdrop-blur-sm border border-border/30 shadow-lg">
                    <CardHeader className="text-center pb-4">
                      <CardTitle className="flex items-center justify-center gap-2 text-lg">
                        <Sparkles className="w-5 h-5 text-primary" />
                        AI Form Assistant
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                      <div className="bg-muted/50 rounded-lg p-4 border border-border/20">
                        <p className="text-foreground font-medium mb-2">Ready to help you create forms</p>
                        <p className="text-muted-foreground text-sm">
                          Describe what kind of form you want to create and I'll help you build it with intelligent questions and formatting.
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Click "Talk to Assistant" below to get started
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
          </div>

          {/* Bottom Buttons */}
<<<<<<< HEAD
          <div className="p-8 border-t border-border/50 bg-gradient-to-r from-card/80 to-card space-y-4">
            {!showVoiceAssistant ? (
              <Button 
                onClick={handleAIAssistant}
                className="w-full h-14 flex items-center justify-center gap-3 bg-gradient-to-r from-primary via-primary-glow to-primary hover:from-primary-glow hover:via-primary hover:to-primary-glow shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 text-primary-foreground font-semibold text-base rounded-xl border-0"
                size="lg"
              >
                <Sparkles className="w-5 h-5" />
                Talk to Assistant
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-pulse"></div>
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={endCallAndGenerateForm}
                  className="h-14 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-xl hover:shadow-2xl transition-all duration-300 text-white font-semibold text-sm rounded-xl border-0"
                  size="lg"
                >
                  <PhoneOff className="w-4 h-4" />
                  End & Generate
                </Button>
                <Button 
                  onClick={stopSession}
                  className="h-14 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-xl hover:shadow-2xl transition-all duration-300 text-white font-semibold text-sm rounded-xl border-0"
                  size="lg"
                >
                  <Square className="w-4 h-4" />
                  Stop Session
                </Button>
              </div>
            )}
=======
          <div className="p-6 border-t border-border/50 bg-gradient-to-r from-card/80 to-card space-y-3">
            <Button 
              onClick={handleAIAssistant}
              className="w-full h-14 flex items-center justify-center gap-3 bg-gradient-to-r from-primary via-primary-glow to-primary hover:from-primary-glow hover:via-primary hover:to-primary-glow shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 text-primary-foreground font-semibold text-base rounded-xl border-0"
              size="lg"
            >
              <Sparkles className="w-5 h-5" />
              Talk to Assistant
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-pulse"></div>
            </Button>
>>>>>>> origin/main-armand
            
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
        </div>
 
        {/* Right Section - Question Editor */}
        <div className="w-2/5 h-[calc(100vh-12rem)] bg-card/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-foreground">Question Editor</h3>
            <p className="text-sm text-muted-foreground">Add and customize your form questions</p>
          </div>
          
          <ScrollArea className="h-[calc(100%-6rem)]">
            <div className="p-4 space-y-3">
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
              Your Form is Ready!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Your form has been published successfully. Share the link below to start collecting responses.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="flex-1 p-4 bg-muted rounded-lg border">
                  <code className="text-sm text-foreground break-all">
                    {publishedFormId ? `${window.location.origin}/?id=${publishedFormId}` : ''}
                  </code>
                </div>
                <Button
                  size="lg"
                  onClick={copyFormLink}
                  className="flex items-center gap-2 px-6 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Copy className="w-4 h-4" />
                  Copy Link
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormBuilder;