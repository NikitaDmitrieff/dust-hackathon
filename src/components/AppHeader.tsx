import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface AppHeaderProps {
  currentView: string;
  onAction: (action: 'create' | 'admin' | 'home') => void;
}

const AppHeader = ({ currentView, onAction }: AppHeaderProps) => {
  const { user, signOut, isAnonymous } = useAuth();

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border/10 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <button 
          onClick={() => onAction('home')}
          className="text-xl font-bold font-display text-foreground hover:text-primary transition-colors"
        >
          Scribe <span className="text-primary">Form</span>
        </button>

        {/* Navigation */}
        <div className="flex items-center gap-4">
          {currentView === 'home' ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => onAction('create')}>
                Create
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onAction('admin')}>
                Admin
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => onAction('home')}>
              ← Back
            </Button>
          )}

          {/* User Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isAnonymous ? (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                Anonymous Session
              </span>
            ) : (
              <span>{user?.email}</span>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-xs h-6 px-2"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;