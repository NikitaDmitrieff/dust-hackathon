import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import FormDataViewer from '@/components/FormDataViewer';

const FormDashboard = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();

  console.log('FormDashboard component mounted with formId:', formId);

  if (!formId) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Form ID Required</h1>
          <p className="text-muted-foreground mb-4">No form ID provided in the URL.</p>
          <Button onClick={() => navigate('/')}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Forms
          </Button>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Form Data Viewer</h1>
            <p className="text-muted-foreground">View and analyze your form responses</p>
          </div>
        </div>
      </div>

      {/* Form Data Viewer */}
      <div className="container mx-auto px-4 pb-6">
        <FormDataViewer formId={formId} />
      </div>
    </div>
  );
};

export default FormDashboard;