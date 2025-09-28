import { useParams } from "react-router-dom";
import PublicFormView from "@/components/PublicFormView";

const PublicForm = () => {
  const { formId } = useParams();

  if (!formId) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex flex-col">
        {/* Logo Header */}
        <div className="p-6 bg-gradient-subtle">
          <button 
            onClick={() => window.location.href = '/'}
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <img 
              src="/logo_txt.png" 
              alt="Scribe Form" 
              className="w-auto h-12"
            />
          </button>
        </div>

        {/* Main Content - Centered */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg p-6 shadow-lg max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-foreground mb-4">Invalid Form</h2>
            <p className="text-muted-foreground">No form ID provided.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      {/* Logo Header */}
      <div className="p-6 bg-gradient-subtle">
        <button 
          onClick={() => window.location.href = '/'}
          className="flex items-center hover:opacity-80 transition-opacity"
        >
          <img 
            src="/logo_txt.png" 
            alt="Scribe Form" 
            className="w-auto h-12"
          />
        </button>
      </div>
      
      {/* Main Content */}
      <div className="flex-1">
        <PublicFormView formId={formId} />
      </div>
    </div>
  );
};

export default PublicForm;