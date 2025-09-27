import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSimpleAuth } from "@/contexts/SimpleAuthContext";
import AppHeader from "@/components/AppHeader";
import HeroSection from "@/components/HeroSection";
import FormBuilder from "@/components/FormBuilder";
import AdminPanel from "@/components/AdminPanel";
import LoginCard from "@/components/LoginCard";
import PublicFormView from "@/components/PublicFormView";
import CodeEntry from "@/components/CodeEntry";
import FormsGrid from "@/components/FormsGrid";

type AppView = 'home' | 'create' | 'admin' | 'enter-code' | 'fill';

const Index = () => {
  const navigate = useNavigate();
  const { userEmail, loading } = useSimpleAuth();
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [publicFormId, setPublicFormId] = useState<string | null>(null);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);

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

  const handleAction = (action: 'create' | 'fill' | 'admin' | 'home' | 'enter-code') => {
    setCurrentView(action);
    if (action === 'home') {
      setEditingFormId(null);
      setPublicFormId(null);
    }
  };

  const handleBack = () => {
    setCurrentView('home');
  };

  const handleEditForm = (formId: string) => {
    setEditingFormId(formId);
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
        {currentView === 'home' && (
          <HeroSection 
            onAction={handleAction} 
            onEditForm={handleEditForm}
            onViewDashboard={handleViewDashboard}
          />
        )}
        {currentView === 'create' && <FormBuilder onBack={handleBack} editingFormId={editingFormId} />}
        {currentView === 'enter-code' && (
          <CodeEntry 
            onFormFound={(formId) => {
              setPublicFormId(formId);
              setCurrentView('fill');
            }}
            onBack={handleBack}
          />
        )}
        {currentView === 'fill' && publicFormId && (
          <PublicFormView 
            formId={publicFormId} 
            onReturnToMenu={() => {
              setCurrentView('home');
              setPublicFormId(null);
            }}
          />
        )}
        {currentView === 'admin' && (
          <div className="py-16">
            <AdminPanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;