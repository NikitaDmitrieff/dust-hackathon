import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mic, Link, Sparkles, Zap } from 'lucide-react';
import FormPreview, { FormData, Question } from './FormPreview';

interface FormBuilderProps {
  onBack?: () => void;
}

interface ActivityLog {
  id: string;
  message: string;
  timestamp: Date;
}

const FormBuilder = ({ onBack }: FormBuilderProps) => {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([
    { id: '1', message: 'Initializing form builder...', timestamp: new Date() },
    { id: '2', message: 'Waiting for user input...', timestamp: new Date() }
  ]);

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const [formData, setFormData] = useState<FormData>({
    title: 'Customer Feedback Survey',
    description: 'Help us improve our services by sharing your valuable feedback. This survey takes approximately 3-5 minutes to complete.',
    questions: [
      {
        id: '1',
        question: 'What is your full name?',
        type: 'text',
        required: true
      },
      {
        id: '2',
        question: 'What is your email address?',
        type: 'email',
        required: true
      },
      {
        id: '3',
        question: 'How did you hear about our service?',
        type: 'radio',
        options: ['Social Media', 'Google Search', 'Friend Referral', 'Advertisement', 'Other'],
        required: true
      },
      {
        id: '4',
        question: 'Which services have you used? (Select all that apply)',
        type: 'checkbox',
        options: ['Web Development', 'Mobile App Development', 'UI/UX Design', 'Consulting', 'Support Services'],
        required: false
      },
      {
        id: '5',
        question: 'How would you rate our overall service quality?',
        type: 'radio',
        options: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'],
        required: true
      },
      {
        id: '6',
        question: 'What is your age?',
        type: 'number',
        required: false
      },
      {
        id: '7',
        question: 'Please share any additional comments, suggestions, or feedback you have for us',
        type: 'textarea',
        required: false
      }
    ]
  });

  const addActivityLog = (message: string) => {
    const newLog = {
      id: Date.now().toString(),
      message,
      timestamp: new Date()
    };
    setActivityLogs(prev => [...prev, newLog]);
  };

  const simulateFormCreation = () => {
    // Simulate assistant creating form
    addActivityLog('Analyzing user requirements...');
    
    setTimeout(() => {
      addActivityLog('Creating form title and description...');
      setFormData(prev => ({
        ...prev,
        title: 'Customer Feedback Survey',
        description: 'Help us improve our services by sharing your feedback'
      }));
    }, 1000);

    setTimeout(() => {
      addActivityLog('Creating question 1: Basic information...');
      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, {
          id: '1',
          question: 'What is your name?',
          type: 'text',
          required: true
        }]
      }));
    }, 2000);

    setTimeout(() => {
      addActivityLog('Creating question 2: Contact details...');
      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, {
          id: '2',
          question: 'What is your email address?',
          type: 'email',
          required: true
        }]
      }));
    }, 3000);

    setTimeout(() => {
      addActivityLog('Creating question 3: Satisfaction rating...');
      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, {
          id: '3',
          question: 'How satisfied are you with our service?',
          type: 'radio',
          options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'],
          required: true
        }]
      }));
    }, 4000);

    setTimeout(() => {
      addActivityLog('Creating question 4: Additional feedback...');
      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, {
          id: '4',
          question: 'Any additional comments or suggestions?',
          type: 'textarea',
          required: false
        }]
      }));
    }, 5000);

    setTimeout(() => {
      addActivityLog('Form creation completed! Ready to generate link.');
    }, 6000);
  };

  const handleStartChat = () => {
    addActivityLog('Starting conversation with assistant...');
    simulateFormCreation();
  };

  const handleGetFinalLink = () => {
    addActivityLog('Generating final form link...');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-purple-50 via-purple-100/50 to-purple-200/30 relative">
      {/* Background noise texture */}
      <div className="absolute inset-0 opacity-20 bg-noise"></div>
      
      <div className="relative z-10 h-full p-4 flex gap-4">
        {/* Left Section - Flying Tile */}
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
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm group">
                    <div className="w-2 h-2 rounded-full bg-primary/60 mt-2 flex-shrink-0 group-hover:bg-primary transition-colors"></div>
                    <div className="flex-1 bg-muted/30 rounded-lg p-3 hover:bg-muted/50 transition-colors">
                      <p className="text-foreground font-medium">{log.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {log.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Buttons */}
          <div className="p-8 border-t border-border/50 bg-gradient-to-r from-card/80 to-card space-y-4">
            <Button 
              onClick={handleStartChat}
              className="w-full h-14 flex items-center justify-center gap-3 bg-gradient-to-r from-primary via-primary-glow to-primary hover:from-primary-glow hover:via-primary hover:to-primary-glow shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 text-primary-foreground font-semibold text-base rounded-xl border-0"
              size="lg"
            >
              <Sparkles className="w-5 h-5" />
              Talk to Assistant
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-pulse"></div>
            </Button>
            
            <Button 
              onClick={handleGetFinalLink}
              className="w-full h-14 flex items-center justify-center gap-3 bg-gradient-to-r from-secondary via-accent to-secondary hover:from-accent hover:via-secondary hover:to-accent shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 text-secondary-foreground font-semibold text-base rounded-xl border border-white/30"
              size="lg"
            >
              <Zap className="w-5 h-5" />
              Get Final Link
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

        {/* Right Section - Flying Tile */}
        <div className="w-1/2 h-[calc(100vh-8rem)] bg-card/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-8">
            <FormPreview formData={formData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;