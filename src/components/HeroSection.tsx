import { Button } from "@/components/ui/button";
import { Play, FileText, CheckSquare, Calendar, MessageSquare, Hash, Mail, User, BarChart3, Star, Heart, Zap, Target, Globe, Lock, Clock, Sparkles, Award, Bookmark } from "lucide-react";
import MinimalFormsPreview from "@/components/MinimalFormsPreview";

interface HeroSectionProps {
  onAction: (action: 'create' | 'fill' | 'admin') => void;
  onEditForm: (formId: string) => void;
  onViewDashboard: (formId: string) => void;
  onDeleteForm?: (formId: string) => void;
}

const HeroSection = ({ onAction, onEditForm, onViewDashboard, onDeleteForm }: HeroSectionProps) => {
  return (
    <div className="relative">
      {/* Hero Section with Background */}
      <div className="min-h-[calc(100vh-5rem)] flex flex-col justify-center px-4 relative bg-gradient-to-b from-background via-background/95 to-background/90">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-accent/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/3 left-1/3 w-32 h-32 bg-secondary/10 rounded-full blur-3xl"></div>
        </div>

        {/* Animated Form Icons - Behind Everything */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {/* Spread across the entire hero section */}
          
          {/* Top Row */}
          <div className="absolute top-16 left-[5%]">
            <div className="w-16 h-16 bg-card/60 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-border/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 animate-pulse-glow">
              <FileText className="w-8 h-8 text-primary/70" />
            </div>
          </div>
          
          <div className="absolute top-20 left-[20%]">
            <div className="w-12 h-12 bg-card/50 backdrop-blur-sm rounded-xl flex items-center justify-center border border-border/15 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110">
              <CheckSquare className="w-6 h-6 text-green-400/70" />
            </div>
          </div>
          
          <div className="absolute top-12 left-[35%]">
            <div className="w-10 h-10 bg-card/40 backdrop-blur-sm rounded-lg flex items-center justify-center border border-border/10 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-110">
              <Sparkles className="w-5 h-5 text-violet-400/70" />
            </div>
          </div>
          
          <div className="absolute top-24 right-[35%]">
            <div className="w-14 h-14 bg-card/55 backdrop-blur-sm rounded-xl flex items-center justify-center border border-border/18 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 animate-pulse-glow animation-delay-500">
              <MessageSquare className="w-7 h-7 text-blue-400/70" />
            </div>
          </div>
          
          <div className="absolute top-16 right-[20%]">
            <div className="w-12 h-12 bg-card/50 backdrop-blur-sm rounded-xl flex items-center justify-center border border-border/15 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110">
              <Calendar className="w-6 h-6 text-purple-400/70" />
            </div>
          </div>
          
          <div className="absolute top-20 right-[5%]">
            <div className="w-16 h-16 bg-card/60 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-border/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 animate-pulse-glow animation-delay-300">
              <BarChart3 className="w-8 h-8 text-orange-400/70" />
            </div>
          </div>

          {/* Middle Row */}
          <div className="absolute top-1/2 left-[3%] transform -translate-y-1/2">
            <div className="w-18 h-18 bg-card/65 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-border/25 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 animate-pulse-glow animation-delay-700">
              <Mail className="w-9 h-9 text-red-400/70" />
            </div>
          </div>
          
          <div className="absolute top-1/2 left-[15%] transform -translate-y-1/2">
            <div className="w-10 h-10 bg-card/40 backdrop-blur-sm rounded-lg flex items-center justify-center border border-border/10 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-110">
              <User className="w-5 h-5 text-cyan-400/70" />
            </div>
          </div>
          
          <div className="absolute top-1/2 right-[15%] transform -translate-y-1/2">
            <div className="w-12 h-12 bg-card/50 backdrop-blur-sm rounded-xl flex items-center justify-center border border-border/15 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110">
              <Hash className="w-6 h-6 text-pink-400/70" />
            </div>
          </div>
          
          <div className="absolute top-1/2 right-[3%] transform -translate-y-1/2">
            <div className="w-18 h-18 bg-card/65 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-border/25 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 animate-pulse-glow animation-delay-1000">
              <Globe className="w-9 h-9 text-indigo-400/70" />
            </div>
          </div>

          {/* Bottom Row */}
          <div className="absolute bottom-32 left-[8%]">
            <div className="w-14 h-14 bg-card/55 backdrop-blur-sm rounded-xl flex items-center justify-center border border-border/18 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 animate-pulse-glow animation-delay-200">
              <Clock className="w-7 h-7 text-teal-400/70" />
            </div>
          </div>
          
          <div className="absolute bottom-28 left-[25%]">
            <div className="w-10 h-10 bg-card/40 backdrop-blur-sm rounded-lg flex items-center justify-center border border-border/10 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-110">
              <Heart className="w-5 h-5 text-rose-400/70" />
            </div>
          </div>
          
          <div className="absolute bottom-36 left-[40%]">
            <div className="w-12 h-12 bg-card/50 backdrop-blur-sm rounded-xl flex items-center justify-center border border-border/15 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110">
              <Star className="w-6 h-6 text-yellow-400/70" />
            </div>
          </div>
          
          <div className="absolute bottom-24 right-[40%]">
            <div className="w-16 h-16 bg-card/60 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-border/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 animate-pulse-glow animation-delay-800">
              <Award className="w-8 h-8 text-amber-400/70" />
            </div>
          </div>
          
          <div className="absolute bottom-32 right-[25%]">
            <div className="w-12 h-12 bg-card/50 backdrop-blur-sm rounded-xl flex items-center justify-center border border-border/15 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110">
              <Target className="w-6 h-6 text-emerald-400/70" />
            </div>
          </div>
          
          <div className="absolute bottom-28 right-[8%]">
            <div className="w-14 h-14 bg-card/55 backdrop-blur-sm rounded-xl flex items-center justify-center border border-border/18 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 animate-pulse-glow animation-delay-400">
              <Lock className="w-7 h-7 text-slate-400/70" />
            </div>
          </div>

          {/* Additional Scattered Icons for More Coverage */}
          <div className="absolute top-[30%] left-[12%]">
            <div className="w-8 h-8 bg-card/35 backdrop-blur-sm rounded-lg flex items-center justify-center border border-border/8 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-110">
              <Zap className="w-4 h-4 text-yellow-300/70" />
            </div>
          </div>
          
          <div className="absolute top-[70%] right-[12%]">
            <div className="w-8 h-8 bg-card/35 backdrop-blur-sm rounded-lg flex items-center justify-center border border-border/8 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-110">
              <Bookmark className="w-4 h-4 text-blue-300/70" />
            </div>
          </div>
          
          <div className="absolute top-[25%] right-[25%]">
            <div className="w-10 h-10 bg-card/40 backdrop-blur-sm rounded-lg flex items-center justify-center border border-border/10 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-110">
              <MessageSquare className="w-5 h-5 text-green-300/70" />
            </div>
          </div>
          
          <div className="absolute top-[75%] left-[30%]">
            <div className="w-10 h-10 bg-card/40 backdrop-blur-sm rounded-lg flex items-center justify-center border border-border/10 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-110">
              <Star className="w-5 h-5 text-orange-300/70" />
            </div>
          </div>
        </div>

        {/* Main Hero Content */}
        <div className="text-center space-y-8 flex-shrink-0 relative z-10">
          {/* Logo with Play Button */}
          <div className="flex justify-center">
            <div className="relative w-[300px] h-[300px] group">
              {/* Logo background */}
              <div 
                className="w-full h-full rounded-lg"
                style={{
                  backgroundImage: 'url(/logo.png)',
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                {/* Overlay button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={() => onAction('create')}
                    className="w-16 h-16 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
                  >
                    <Play className="w-6 h-6 text-gray-700" fill="currentColor" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Text */}
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Create your form in seconds
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              AI-powered form builder that understands your needs
            </p>
            <div className="flex items-center justify-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                No coding required
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse animation-delay-300"></div>
                Smart analytics
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse animation-delay-500"></div>
                Instant sharing
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-muted-foreground/50 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Recent Forms Section */}
      <div className="bg-gradient-to-b from-card/30 to-background/95 py-16">
        <MinimalFormsPreview 
          onEditForm={onEditForm}
          onViewDashboard={onViewDashboard}
          onDeleteForm={onDeleteForm}
        />
      </div>
    </div>
  );
};

export default HeroSection;