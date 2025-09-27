import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onAction: (action: 'create' | 'fill' | 'admin') => void;
}

const HeroSection = ({ onAction }: HeroSectionProps) => {
  return (
    <div className="py-16 flex flex-col items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Hero Text */}
        <div className="space-y-6">
          <h1 className="text-6xl md:text-7xl font-bold font-display tracking-tight text-foreground">
            Scribe
            <span className="text-primary"> Form</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Create intelligent forms with AI assistance. Collect responses seamlessly. 
            Analyze insights effortlessly.
          </p>
        </div>

        {/* Two Main Action Buttons */}
        <div className="flex flex-col md:flex-row gap-6 justify-center items-center pt-8">
          <Button 
            variant="hero" 
            size="xl"
            onClick={() => onAction('create')}
            className="w-full md:w-auto min-w-[200px]"
          >
            Create Forms
          </Button>
          
          <Button 
            variant="minimal" 
            size="xl"
            onClick={() => onAction('admin')}
            className="w-full md:w-auto min-w-[200px]"
          >
            Admin Panel
          </Button>
        </div>

        {/* Helper Text */}
        <div className="pt-4">
          <p className="text-sm text-muted-foreground">
            Share your forms with a simple link • No accounts needed for respondents
          </p>
        </div>

        {/* Subtle Feature Points */}
        <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-2">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <div className="w-6 h-6 bg-primary rounded-sm"></div>
            </div>
            <h3 className="font-semibold text-foreground">AI-Powered</h3>
            <p className="text-sm text-muted-foreground">
              Intelligent form generation and optimization
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <div className="w-6 h-6 bg-primary rounded-sm"></div>
            </div>
            <h3 className="font-semibold text-foreground">Seamless</h3>
            <p className="text-sm text-muted-foreground">
              Effortless form sharing and response collection
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <div className="w-6 h-6 bg-primary rounded-sm"></div>
            </div>
            <h3 className="font-semibold text-foreground">Insightful</h3>
            <p className="text-sm text-muted-foreground">
              Powerful analytics and response management
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;