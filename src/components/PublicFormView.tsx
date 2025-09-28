import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Send, Edit, User, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { talk_to_assistant_answer } from '@/Victor/assistantService';
import VoiceAssistant from './VoiceAssistant';

interface Question {
  question_id: string;
  question: string;
  type_answer: string;
}

interface FormData {
  form_id: string;
  title: string;
  description: string;
  questions: Question[];
}

interface PublicFormViewProps {
  formId: string;
  onReturnToMenu?: () => void;
}

const PublicFormView: React.FC<PublicFormViewProps> = ({ formId, onReturnToMenu }) => {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userName, setUserName] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFormData();
  }, [formId]);

  // Listen for voice assistant events
  useEffect(() => {
    const handleVoiceAssistantEvent = (event: CustomEvent) => {
      if (event.detail.mode === 'form_completion' && formData) {
        setShowVoiceAssistant(true);
      }
    };

    window.addEventListener('OPEN_VOICE_ASSISTANT', handleVoiceAssistantEvent as EventListener);

    return () => {
      window.removeEventListener('OPEN_VOICE_ASSISTANT', handleVoiceAssistantEvent as EventListener);
    };
  }, [formData]);

  // Check for existing answers when userName changes
  useEffect(() => {
    if (userName.trim() && formData) {
      checkExistingAnswers();
    }
  }, [userName, formData]);

  const fetchFormData = async () => {
    try {
      console.log('Fetching form data for ID:', formId);
      
      // Fetch form details
      const { data: formInfo, error: formError } = await supabase
        .from('form')
        .select('form_id, title, description')
        .eq('form_id', formId)
        .single();

      if (formError) {
        console.error('Error fetching form:', formError);
        toast({
          title: "Error",
          description: "Form not found.",
          variant: "destructive",
        });
        return;
      }

      // Fetch questions for this form
      const { data: questions, error: questionsError } = await supabase
        .from('question')
        .select('question_id, question, type_answer')
        .eq('form_id', formId)
        .order('question_id');

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        toast({
          title: "Error",
          description: "Failed to load form questions.",
          variant: "destructive",
        });
        return;
      }

      setFormData({
        ...formInfo,
        questions: questions || []
      });

    } catch (error) {
      console.error('Error fetching form data:', error);
      toast({
        title: "Error",
        description: "Failed to load form.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkExistingAnswers = async () => {
    if (!formData || !userName.trim()) return;

    try {
      // Check if user has already submitted answers for this form
      const { data: existingAnswers, error } = await supabase
        .from('answer')
        .select('question_id, answer')
        .in('question_id', formData.questions.map(q => q.question_id))
        .ilike('answer', `%"userName":"${userName.trim()}"%`);

      if (error) {
        console.error('Error checking existing answers:', error);
        return;
      }

      if (existingAnswers && existingAnswers.length > 0) {
        // User has previous answers, load them
        const previousAnswers: Record<string, any> = {};
        existingAnswers.forEach(answer => {
          try {
            const parsedAnswer = JSON.parse(answer.answer);
            if (parsedAnswer.userName === userName.trim()) {
              previousAnswers[answer.question_id] = parsedAnswer.response;
            }
          } catch {
            // If answer is not JSON, treat as direct answer
            previousAnswers[answer.question_id] = answer.answer;
          }
        });

        if (Object.keys(previousAnswers).length > 0) {
          setAnswers(previousAnswers);
          setIsEditMode(true);
          toast({
            title: "Previous answers found",
            description: "Your previous answers have been loaded. You can modify them.",
          });
        }
      }
    } catch (error) {
      console.error('Error checking existing answers:', error);
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleAssistantFill = async () => {
    if (!formData) return;
    
    // Show voice assistant directly instead of using the old service
    setShowVoiceAssistant(true);
  };

  const handleVoiceAnswersGenerated = (generatedAnswers: Record<string, any>) => {
    // Fill the form with voice assistant answers
    setAnswers(prev => ({
      ...prev,
      ...generatedAnswers
    }));
    
    toast({
      title: "Success!",
      description: "Form filled by voice assistant.",
    });
    
    setShowVoiceAssistant(false);
  };

  const handleSubmit = async () => {
    if (!formData) {
      toast({
        title: "Error",
        description: "Unable to submit form.",
        variant: "destructive",
      });
      return;
    }

    // Generate random user ID if no name provided
    const userIdentifier = userName.trim() || `user_${Math.floor(Math.random() * 10000)}`;
    
    setSubmitting(true);
    try {
      // First, delete existing answers for this user if in edit mode
      if (isEditMode) {
        for (const question of formData.questions) {
          await supabase
            .from('answer')
            .delete()
            .eq('question_id', question.question_id)
            .ilike('answer', `%"userName":"${userIdentifier}"%`);
        }
      }

      // Submit new answers with userName
      const answersToSubmit = Object.entries(answers).map(([questionId, response]) => ({
        question_id: questionId,
        answer: JSON.stringify({
          userName: userIdentifier,
          response: response
        })
      }));

      const { error } = await supabase
        .from('answer')
        .insert(answersToSubmit);

      if (error) {
        console.error('Error submitting answers:', error);
        toast({
          title: "Error",
          description: "Failed to submit your answers. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success!",
        description: isEditMode ? "Your answers have been updated successfully." : "Your answers have been submitted successfully.",
      });

      setHasSubmitted(true);
      setIsEditMode(false);
      
      // Navigate back to main page after 2 seconds
      setTimeout(() => {
        handleReturnToMenu();
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Failed to submit form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnToMenu = () => {
    // Clear authentication state to force user to login screen
    localStorage.removeItem('user_email');
    
    // Trigger storage event to update auth context immediately
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'user_email',
      newValue: null,
      oldValue: localStorage.getItem('user_email'),
    }));
    
    if (onReturnToMenu) {
      onReturnToMenu();
    } else {
      // Navigate to auth page after clearing auth state
      navigate('/auth');
    }
  };

  const renderQuestion = (question: Question) => {
    const { question_id, question: questionText, type_answer } = question;

    switch (type_answer.toLowerCase()) {
      case 'text':
        return (
          <div key={question_id} className="space-y-2">
            <Label htmlFor={question_id}>{questionText}</Label>
            <Input
              id={question_id}
              value={answers[question_id] || ''}
              onChange={(e) => handleAnswerChange(question_id, e.target.value)}
              placeholder="Your answer..."
            />
          </div>
        );

      case 'textarea':
      case 'long_text':
        return (
          <div key={question_id} className="space-y-2">
            <Label htmlFor={question_id}>{questionText}</Label>
            <Textarea
              id={question_id}
              value={answers[question_id] || ''}
              onChange={(e) => handleAnswerChange(question_id, e.target.value)}
              placeholder="Your answer..."
              rows={4}
            />
          </div>
        );

      case 'number':
        return (
          <div key={question_id} className="space-y-2">
            <Label htmlFor={question_id}>{questionText}</Label>
            <Input
              id={question_id}
              type="number"
              value={answers[question_id] || ''}
              onChange={(e) => handleAnswerChange(question_id, e.target.value)}
              placeholder="Enter a number..."
            />
          </div>
        );

      case 'radio':
      case 'choice':
        return (
          <div key={question_id} className="space-y-3">
            <Label>{questionText}</Label>
            <RadioGroup
              value={answers[question_id] || ''}
              onValueChange={(value) => handleAnswerChange(question_id, value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id={`${question_id}_yes`} />
                <Label htmlFor={`${question_id}_yes`}>Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id={`${question_id}_no`} />
                <Label htmlFor={`${question_id}_no`}>No</Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 'checkbox':
        return (
          <div key={question_id} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={question_id}
                checked={answers[question_id] || false}
                onCheckedChange={(checked) => handleAnswerChange(question_id, checked)}
              />
              <Label htmlFor={question_id}>{questionText}</Label>
            </div>
          </div>
        );

      default:
        return (
          <div key={question_id} className="space-y-2">
            <Label htmlFor={question_id}>{questionText}</Label>
            <Input
              id={question_id}
              value={answers[question_id] || ''}
              onChange={(e) => handleAnswerChange(question_id, e.target.value)}
              placeholder="Your answer..."
            />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading form...</p>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Form Not Found</CardTitle>
            <CardDescription>
              The requested form could not be found or is no longer available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleReturnToMenu} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show Voice Assistant overlay
  if (showVoiceAssistant) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <VoiceAssistant
          formId={formId}
          onAnswersGenerated={handleVoiceAnswersGenerated}
          onClose={() => setShowVoiceAssistant(false)}
          mode="form_completion"
          questions={formData?.questions || []}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Go to Login Button */}
        <div className="mb-6">
          <Button onClick={handleReturnToMenu} variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Go to Login
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{formData.title}</CardTitle>
            {formData.description && (
              <CardDescription>{formData.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name Input */}
            <div className="space-y-2 border-b pb-4">
              <Label htmlFor="userName" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Your Name (optional)
              </Label>
              <Input
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name..."
                className="max-w-md"
              />
              {userName.trim() && (
                <p className="text-xs text-muted-foreground">
                  💡 You can modify your previous answers using your name as the key
                </p>
              )}
              {isEditMode && (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <Edit className="w-4 h-4" />
                  Editing mode: Your previous answers have been loaded
                </div>
              )}
            </div>

            {/* Questions */}
            {formData.questions.map((question) => renderQuestion(question))}
            
            {formData.questions.length > 0 && (
              <div className="pt-4 space-y-3">
                <Button 
                  onClick={handleAssistantFill}
                  variant="outline"
                  className="w-full flex items-center gap-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5"
                >
                  <Sparkles className="w-4 h-4" />
                  Talk to Assistant
                </Button>
                
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting}
                  className="w-full flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Submitting...' : isEditMode ? 'Update Answers' : 'Submit Form'}
                </Button>
                
                {hasSubmitted && (
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-green-700 font-medium">
                      ✅ Thank you! Your answers have been {isEditMode ? 'updated' : 'submitted'} successfully.
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      You can return anytime with your name to modify your answers.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {formData.questions.length === 0 && (
              <p className="text-muted-foreground text-center py-8">
                This form has no questions yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicFormView;