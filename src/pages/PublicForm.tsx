import { useParams } from "react-router-dom";
import PublicFormView from "@/components/PublicFormView";

const PublicForm = () => {
  const { formId } = useParams();

  if (!formId) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="bg-card rounded-lg p-6 shadow-lg max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-foreground mb-4">Invalid Form</h2>
          <p className="text-muted-foreground">No form ID provided.</p>
        </div>
      </div>
    );
  }

  return <PublicFormView formId={formId} />;
};

export default PublicForm;