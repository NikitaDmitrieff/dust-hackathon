import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import AiChartsBento from './AiChartsBento';

const FormDashboard = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();

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
            Retour aux formulaires
          </Button>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Dashboard Analytique</h1>
            <p className="text-muted-foreground">Analysez vos données de formulaire avec l'IA</p>
          </div>
        </div>
      </div>

      {/* AI Charts Interface */}
      <AiChartsBento />
    </div>
  );
};

export default FormDashboard;