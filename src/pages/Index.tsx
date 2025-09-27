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
        {currentView === 'home' && <HeroSection onAction={handleAction} />}
      </div>
    </div>
  );
};

export default Index;
