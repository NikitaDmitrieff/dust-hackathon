import React from 'react';

interface FormBuilderProps {
  onBack?: () => void;
}

const FormBuilder = ({ onBack }: FormBuilderProps) => {
  return (
    <div className="bg-card rounded-lg p-6 shadow-lg">
      <h2 className="text-xl font-semibold text-foreground mb-4">Form Builder</h2>
      <p className="text-muted-foreground">
        Form builder is temporarily disabled while fixing rate limiting issues.
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

export default FormBuilder;