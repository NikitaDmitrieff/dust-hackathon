import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Logo Header */}
      <div className="p-6 bg-gray-100">
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
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">404</h1>
          <p className="mb-4 text-xl text-gray-600">Oops! Page not found</p>
          <a href="/" className="text-blue-500 underline hover:text-blue-700">
            Return to Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
