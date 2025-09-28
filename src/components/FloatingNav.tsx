import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User, Plus, FileText, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface FloatingNavProps {
  onAction: (action: 'create' | 'admin' | 'home' | 'enter-code') => void;
  onEditForm: (formId: string) => void;
  onViewDashboard: (formId: string) => void;
}

const FloatingNav = ({ onAction, onEditForm, onViewDashboard }: FloatingNavProps) => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="bg-background/95 backdrop-blur-sm border border-border/20 rounded-full shadow-lg p-2 flex items-center gap-2">
      {/* Create Form Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onAction('create')}
        className="hover:bg-primary/10 rounded-full px-3"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create Form
      </Button>

      {/* Previous Forms Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onAction('admin')}
        className="hover:bg-primary/10 rounded-full px-3"
      >
        <FileText className="w-4 h-4 mr-2" />
        Previous Forms
      </Button>

      {/* Admin Panel Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onAction('admin')}
        className="hover:bg-primary/10 rounded-full px-3"
      >
        <Settings className="w-4 h-4 mr-2" />
        Admin Panel
      </Button>

      {/* User Account Dropdown */}
      {user && (
        <>
          <div className="w-px h-6 bg-border/30 mx-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-primary/10 rounded-full px-3"
              >
                <User className="w-4 h-4 mr-2" />
                {user.email.split('@')[0]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                Signed in as: {user.email}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
};

export default FloatingNav;
