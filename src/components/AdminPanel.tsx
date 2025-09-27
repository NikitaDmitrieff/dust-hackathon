import React from 'react';

interface AdminPanelProps {
  onBack?: () => void;
}

const AdminPanel = ({ onBack }: AdminPanelProps) => {
  return (
    <div className="bg-card rounded-lg p-6 shadow-lg">
      <h2 className="text-xl font-semibold text-foreground mb-4">Admin Panel</h2>
      <p className="text-muted-foreground">
        Admin panel is temporarily disabled while fixing rate limiting issues.
      </p>
      {onBack && (
        <button 
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Back
        </button>
      )}
    </div>
  );
};

export default AdminPanel;