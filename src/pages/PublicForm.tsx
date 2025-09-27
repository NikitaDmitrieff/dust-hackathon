import { useParams } from "react-router-dom";

const PublicForm = () => {
  const { formId } = useParams();

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
      <div className="bg-card rounded-lg p-6 shadow-lg max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold text-foreground mb-4">Public Form</h2>
        <p className="text-muted-foreground mb-4">
          Public forms are temporarily disabled while we resolve rate limiting issues with the authentication system.
        </p>
        <p className="text-sm text-muted-foreground">
          Form ID: {formId}
        </p>
      </div>
    </div>
  );
};

export default PublicForm;