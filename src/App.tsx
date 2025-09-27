import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthWrapper from "@/components/AuthWrapper";
import Index from "./pages/Index";
import FormDashboard from "./pages/FormDashboard";
import PublicForm from "./pages/PublicForm";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Form Creator Routes - Protected with Auth */}
          <Route path="/" element={
            <AuthWrapper>
              <Index />
            </AuthWrapper>
          } />
          
          {/* Form Dashboard Route - Protected */}
          <Route path="/dashboard/:formId" element={
            <AuthWrapper>
              <FormDashboard />
            </AuthWrapper>
          } />
          
          {/* Public Client Routes - No Auth Required */}
          <Route path="/form/:formId" element={<PublicForm />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
