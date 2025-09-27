import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Link } from 'lucide-react';

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

  const handleStartChat = () => {
    const newLog = {
      id: Date.now().toString(),
      message: 'Starting conversation with assistant...',
      timestamp: new Date()
    };
    setActivityLogs(prev => [...prev, newLog]);
  };

  const handleGetFinalLink = () => {
    const newLog = {
      id: Date.now().toString(),
      message: 'Generating final form link...',
      timestamp: new Date()
    };
    setActivityLogs(prev => [...prev, newLog]);
  };

  return (
    <div className="flex h-screen">
      {/* Left Section */}
      <div className="w-1/2 bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Form Builder</h2>
          <p className="text-sm text-muted-foreground mt-1">Create your form with AI assistance</p>
        </div>

        {/* Activity Logs */}
        <div className="flex-1 p-6 overflow-y-auto">
          <h3 className="text-sm font-medium text-foreground mb-4">Activity Log</h3>
          <div className="space-y-2">
            {activityLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-foreground">{log.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="p-6 border-t border-border flex justify-between gap-4">
          <Button 
            onClick={handleStartChat}
            className="flex items-center gap-2"
            variant="default"
          >
            <Mic className="w-4 h-4" />
            Talk to Assistant
          </Button>
          
          <Button 
            onClick={handleGetFinalLink}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Link className="w-4 h-4" />
            Get Final Link
          </Button>
        </div>

        {/* Back Button */}
        {onBack && (
          <div className="p-6 pt-0">
            <Button 
              onClick={onBack}
              variant="ghost"
              size="sm"
            >
              ← Back to Home
            </Button>
          </div>
        )}
      </div>

      {/* Right Section - Placeholder for now */}
      <div className="w-1/2 bg-background flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-muted-foreground">Right Panel</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Awaiting instructions for the right section
          </p>
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;