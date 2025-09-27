import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User } from "lucide-react";

interface AppHeaderProps {
  currentView: string;
  onAction: (action: 'create' | 'admin' | 'home' | 'enter-code') => void;
}

const AppHeader = ({ currentView, onAction }: AppHeaderProps) => {
  const { user, signOut } = useAuth();

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
                Create Form
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onAction('enter-code')}>
                Enter URL
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onAction('admin')}>
                Admin Panel
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => onAction('home')}>
              ← Back
            </Button>
          )}

          {/* User Info */}
          {user && (
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-xs h-8 px-2 flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;