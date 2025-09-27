import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface Question {
  id: string;
  question: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'email' | 'number';
  options?: string[];
  required?: boolean;
}

export interface FormData {
  title: string;
  description: string;
  questions: Question[];
}

interface FormPreviewProps {
  formData: FormData;
}

const FormPreview: React.FC<FormPreviewProps> = ({ formData }) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const renderQuestion = (question: Question) => {
    const value = answers[question.id] || '';

    switch (question.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <Input
            type={question.type}
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Your answer..."
            className="mt-2"
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Your answer..."
            className="mt-2 min-h-[100px]"
          />
        );

      case 'radio':
        return (
          <RadioGroup
            value={value}
            onValueChange={(newValue) => handleAnswerChange(question.id, newValue)}
            className="mt-2"
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`} className="text-sm">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <div className="mt-2 space-y-2">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={Array.isArray(value) && value.includes(option)}
                  onCheckedChange={(checked) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (checked) {
                      handleAnswerChange(question.id, [...currentValues, option]);
                    } else {
                      handleAnswerChange(question.id, currentValues.filter(v => v !== option));
                    }
                  }}
                />
                <Label htmlFor={`${question.id}-${index}`} className="text-sm">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        <Card className="max-w-2xl mx-auto bg-background/90 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader className="space-y-1 text-center bg-gradient-to-br from-card to-card/80">
            <CardTitle className="text-2xl text-foreground">
              {formData.title || 'Form Title'}
            </CardTitle>
            {formData.description && (
              <p className="text-muted-foreground">
                {formData.description}
              </p>
            )}
          </CardHeader>
        
          <CardContent className="space-y-6">
            {formData.questions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No questions yet</h3>
                <p className="text-muted-foreground">
                  Questions will appear here as the assistant creates them
                </p>
              </div>
            ) : (
              formData.questions.map((question, index) => (
                <div
                  key={question.id}
                  className="space-y-2 p-4 rounded-lg border border-border bg-card/50 animate-fade-in"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full min-w-[24px] text-center">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-foreground">
                        {question.question}
                        {question.required && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                      </Label>
                      {renderQuestion(question)}
                    </div>
                  </div>
                </div>
              ))
            )}

            {formData.questions.length > 0 && (
              <div className="pt-4 border-t border-border">
                <Button className="w-full" size="lg">
                  Submit Form
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FormPreview;