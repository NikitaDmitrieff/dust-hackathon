import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSimpleAuth } from "@/contexts/SimpleAuthContext";
import AppHeader from "@/components/AppHeader";
import HeroSection from "@/components/HeroSection";
import FormBuilder from "@/components/FormBuilder";
import AdminPanel from "@/components/AdminPanel";
import LoginCard from "@/components/LoginCard";
import PublicFormView from "@/components/PublicFormView";

type AppView = 'home' | 'create' | 'admin';

const Index = () => {
  const navigate = useNavigate();
  const { userEmail, loading } = useSimpleAuth();
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [publicFormId, setPublicFormId] = useState<string | null>(null);

  useEffect(() => {
    // Check for URL parameters when component mounts
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const questionnaireId = urlParams.get('id');
    
    if (questionnaireId) {
      console.log("This is for questionnaire:", questionnaireId);
      setPublicFormId(questionnaireId);
    }
  }, []);

  const handleAction = (action: 'create' | 'fill' | 'admin' | 'home') => {
    if (action === 'fill') {
      // This would typically open a form ID input or recent forms list
      // For now, we'll show a message about accessing forms via direct links
      return;
    }
    setCurrentView(action === 'home' ? 'home' : action);
  };

  const handleBack = () => {
    setCurrentView('home');
  };

  const handleEditForm = (formId: string) => {
    // For now, just navigate to create page - could be enhanced to load specific form
    setCurrentView('create');
  };

  const handleViewDashboard = (formId: string) => {
    navigate(`/dashboard/${formId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If there's a public form ID, show the public form view regardless of auth
  if (publicFormId) {
    return <PublicFormView formId={publicFormId} />;
  }

  if (!userEmail) {
    return <LoginCard />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <AppHeader currentView={currentView} onAction={handleAction} />
      
      <div className="">
        {currentView === 'create' && (
          <FormBuilder onBack={handleBack} />
        )}
        {currentView === 'admin' && (
          <div className="container mx-auto px-4 py-8">
            <div className="bg-card rounded-lg p-6 shadow-lg max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold text-foreground mb-4">Admin Panel</h2>
              <p className="text-muted-foreground mb-4">
                The admin panel is temporarily disabled while we resolve rate limiting issues with the authentication system.
              </p>
              <button 
                onClick={handleBack}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}
        {currentView === 'home' && (
          <HeroSection 
            onAction={handleAction} 
            onEditForm={handleEditForm}
            onViewDashboard={handleViewDashboard}
          />
        )}
      </div>
    </div>
  );
};

export default Index;