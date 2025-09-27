import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import HeroSection from "@/components/HeroSection";
import FormBuilder from "@/components/FormBuilder";
import AdminPanel from "@/components/AdminPanel";

type AppView = 'home' | 'create' | 'admin';

const Index = () => {
  const [currentView, setCurrentView] = useState<AppView>('home');

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

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <AppHeader currentView={currentView} onAction={handleAction} />
      
      <div className="pt-16">
        {currentView === 'create' && <FormBuilder onBack={handleBack} />}
        {currentView === 'admin' && <AdminPanel onBack={handleBack} />}
        {currentView === 'home' && <HeroSection onAction={handleAction} />}
      </div>
    </div>
  );
};

export default Index;
