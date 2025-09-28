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
          className="flex items-center hover:opacity-80 transition-opacity"
        >
          <img 
            src="/logo_txt.png" 
            alt="Scribe Form" 
            className="w-auto m-0 p-0" // Added m-0 and p-0
            style={{ height: '4rem' }}
          />
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