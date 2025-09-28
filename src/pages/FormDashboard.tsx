import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AiChartsBento from './AiChartsBento';

const FormDashboard = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();

  console.log('FormDashboard component mounted with formId:', formId);

  const handleAction = (action: 'create' | 'admin' | 'home' | 'enter-code') => {
    switch (action) {
      case 'home':
        navigate('/');
        break;
      case 'create':
        navigate('/');
        break;
      case 'admin':
        navigate('/');
        break;
      case 'enter-code':
        navigate('/');
        break;
    }
  };

  const handleEditForm = (formId: string) => {
    navigate('/');
  };

  const handleViewDashboard = (formId: string) => {
    navigate(`/dashboard/${formId}`);
  };

  return (
    <>
      <AppHeader 
        onAction={handleAction}
        onEditForm={handleEditForm}
        onViewDashboard={handleViewDashboard}
      />
      
      <div className="min-h-screen pt-32 bg-gradient-to-br from-purple-50 via-purple-100/50 to-purple-200/30 relative">
        {/* Background noise texture */}
        <div className="absolute inset-0 opacity-20 bg-noise"></div>
        
        <div className="relative z-10">
          <div className="container mx-auto px-6 py-8">
            {/* Integrated Title with Content */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-7 h-7 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
              </div>
              <p className="text-muted-foreground ml-10">Analyze your form data with AI-powered insights</p>
            </div>

            {/* AI Charts Interface */}
            <AiChartsBento formId={formId} />
          </div>
        </div>
      </div>
    </>
  );
};

export default FormDashboard;