import { useState } from "react";
import HeroSection from "@/components/HeroSection";
import FormBuilder from "@/components/FormBuilder";
import AdminPanel from "@/components/AdminPanel";

type AppView = 'home' | 'create' | 'admin';

const Index = () => {
  const [currentView, setCurrentView] = useState<AppView>('home');

  const handleAction = (action: 'create' | 'fill' | 'admin') => {
    if (action === 'fill') {
      // This would typically open a form ID input or recent forms list
      // For now, we'll show a message about accessing forms via direct links
      return;
    }
    setCurrentView(action);
  };

  const handleBack = () => {
    setCurrentView('home');
  };

  if (currentView === 'create') {
    return <FormBuilder onBack={handleBack} />;
  }

  if (currentView === 'admin') {
    return <AdminPanel onBack={handleBack} />;
  }

  return <HeroSection onAction={handleAction} />;
};

export default Index;
