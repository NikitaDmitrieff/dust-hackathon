import FloatingNav from "@/components/FloatingNav";

interface AppHeaderProps {
  onAction: (action: 'create' | 'admin' | 'home' | 'enter-code') => void;
  onEditForm: (formId: string) => void;
  onViewDashboard: (formId: string) => void;
}

const AppHeader = ({ onAction, onEditForm, onViewDashboard }: AppHeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/10 shadow-sm">
      <div className="p-6 flex items-center justify-between">
        {/* Logo */}
        <button 
          onClick={() => onAction('home')}
          className="text-2xl font-bold font-display text-foreground hover:text-primary transition-colors"
        >
          Scribe <span className="text-primary">Form</span>
        </button>

        {/* Navigation Bubble */}
        <FloatingNav 
          onAction={onAction}
          onEditForm={onEditForm}
          onViewDashboard={onViewDashboard}
        />
      </div>
    </header>
  );
};

export default AppHeader;