import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AppHeader from "@/components/AppHeader";
import HeroSection from "@/components/HeroSection";
import FormBuilder from "@/components/FormBuilder";
import AdminPanel from "@/components/AdminPanel";
import PublicFormView from "@/components/PublicFormView";
import CodeEntry from "@/components/CodeEntry";
import FormsGrid from "@/components/FormsGrid";

type AppView = 'home' | 'create' | 'admin' | 'enter-code' | 'fill';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const handleDeleteForm = (formId: string) => {
    // Form deletion is handled in MinimalFormsPreview component
    // This callback can be used for any additional cleanup if needed
    console.log('Form deleted:', formId);
  };

  // If there's a public form ID, show the public form view regardless of auth
  if (publicFormId) {
    return <PublicFormView formId={publicFormId} />;
  }

  // Authentication is handled at the App level
  // Users will be redirected to /auth if not logged in

  return (
    <div className="min-h-screen bg-gradient-subtle relative">
      {/* Top navbar on all pages */}
      <AppHeader 
        onAction={handleAction}
        onEditForm={handleEditForm}
        onViewDashboard={handleViewDashboard}
      />
      
      <div className="pt-24">
        {currentView === 'home' && (
          <HeroSection 
            onAction={handleAction}
            onEditForm={handleEditForm}
            onViewDashboard={handleViewDashboard}
            onDeleteForm={handleDeleteForm}
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