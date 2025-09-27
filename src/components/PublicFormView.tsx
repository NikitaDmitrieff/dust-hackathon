import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
}

const PublicFormView: React.FC<PublicFormViewProps> = ({ formId }) => {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchFormData();
  }, [formId]);

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

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData) return;
    
    setSubmitting(true);
    try {
      // Submit answers to database
      const answersToSubmit = Object.entries(answers).map(([questionId, answer]) => ({
        question_id: questionId,
        answer: typeof answer === 'string' ? answer : JSON.stringify(answer)
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
        description: "Your answers have been submitted successfully.",
      });

      // Clear form
      setAnswers({});
      
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
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{formData.title}</CardTitle>
            {formData.description && (
              <CardDescription>{formData.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.questions.map((question) => renderQuestion(question))}
            
            {formData.questions.length > 0 && (
              <div className="pt-4">
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? 'Submitting...' : 'Submit Form'}
                </Button>
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