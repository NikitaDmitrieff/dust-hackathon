import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarDays, BarChart3, Database, Filter, Sparkles, Play, Loader2, Pin, PinOff, FileCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BentoGrid, BentoResultsGrid } from '@/components/bento/BentoGrid';
import { BentoTile } from '@/components/bento/BentoTile';
import { AiChartCard } from '@/components/charts/AiChartCard';
import { DummyJSONEditor } from '@/components/DummyJSONEditor';
import FormDataViewer from '@/components/FormDataViewer';
import { type AiChartsResponse, type ChartResult } from '@/types/ChartSpec';
import { mockResults, presets, getPresetByKey } from '@/lib/mock';
import { analyze_dashboard } from '@/Christopher/assistantService';

interface HistoryItem {
  query: string;
  isPinned: boolean;
}

interface AiChartsBentoProps {
  formId?: string;
}

const AiChartsBento: React.FC<AiChartsBentoProps> = ({ formId }) => {
  const [question, setQuestion] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ChartResult[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showDataViewer, setShowDataViewer] = useState(false);
  const [analysisHtml, setAnalysisHtml] = useState<string>('');
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const analysisContainerRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  // Debug logging
  console.log('AiChartsBento component mounted with formId:', formId);

  // Load Christopher analysis when formId is available
  useEffect(() => {
    if (formId && results.length === 0 && !isLoading) {
      setIsAnalysisLoading(true);
      analyze_dashboard(formId)
        .then((html) => {
          setAnalysisHtml(html);
        })
        .catch((error) => {
          console.error('Error loading Christopher analysis:', error);
        })
        .finally(() => {
          setIsAnalysisLoading(false);
        });
    }
  }, [formId, results.length, isLoading]);

  // Load state from localStorage and URL params on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Load demo mode from URL
    if (urlParams.get('demo') === '1') {
      setIsDemoMode(true);
    }
    
    // Load question from URL
    const urlQuestion = urlParams.get('q');
    if (urlQuestion) {
      setQuestion(decodeURIComponent(urlQuestion));
    }
    
    // Load preset from URL
    const urlPreset = urlParams.get('preset');
    if (urlPreset && presets[urlPreset as keyof typeof presets]) {
      setSelectedPreset(urlPreset);
      setIsDemoMode(true);
      const presetData = getPresetByKey(urlPreset);
      if (presetData) {
        setResults(presetData.results);
      }
    }
    
    // Load history from localStorage
    const savedHistory = localStorage.getItem('aiCharts.history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        // Handle migration from old string array format
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
          setHistory(parsed.map(query => ({ query, isPinned: false })));
        } else {
          setHistory(parsed);
        }
      } catch (error) {
        console.error('Error loading history:', error);
      }
    }
  }, []);

  // Auto-generate charts when component mounts (if not demo mode)
  useEffect(() => {
    if (!isDemoMode && !isLoading && results.length === 0) {
      autoGenerateCharts();
    }
  }, [isDemoMode]);

  // Execute inline scripts returned by Christopher backend so Plotly charts render
  useEffect(() => {
    if (!analysisHtml) {
      return;
    }
    const container = analysisContainerRef.current;
    if (!container) {
      return;
    }

    const scripts = Array.from(container.querySelectorAll('script'));
    scripts.forEach((script) => {
      const replacement = document.createElement('script');
      // copy attributes like src if provided
      Array.from(script.attributes).forEach((attr) => {
        replacement.setAttribute(attr.name, attr.value);
      });
      replacement.appendChild(document.createTextNode(script.textContent ?? ''));
      script.parentNode?.replaceChild(replacement, script);
    });
  }, [analysisHtml]);

  // Save history to localStorage
  const saveToHistory = (query: string) => {
    const existingItem = history.find(h => h.query === query);
    let newHistory: HistoryItem[];
    
    if (existingItem) {
      // Move existing item to top, keep pin status
      newHistory = [existingItem, ...history.filter(h => h.query !== query)];
    } else {
      // Add new item at top
      newHistory = [{ query, isPinned: false }, ...history];
    }
    
    // Keep pinned items and limit unpinned to make total ≤ 5
    const pinnedItems = newHistory.filter(h => h.isPinned);
    const unpinnedItems = newHistory.filter(h => !h.isPinned);
    const maxUnpinned = Math.max(0, 5 - pinnedItems.length);
    
    newHistory = [...pinnedItems, ...unpinnedItems.slice(0, maxUnpinned)];
    
    setHistory(newHistory);
    localStorage.setItem('aiCharts.history', JSON.stringify(newHistory));
  };

  // Auto-generate charts based on form data
  const autoGenerateCharts = async () => {
    setIsLoading(true);
    
    try {
      // Get form ID from URL
      const pathSegments = window.location.pathname.split('/');
      const formId = pathSegments[pathSegments.length - 1];
      
      if (!formId || formId === 'ai-charts') {
        console.log('No form ID found, skipping auto-generation');
        return;
      }

      console.log('Auto-generating charts for form:', formId);

      // Call the AI Charts API with auto-analysis request
      const response = await fetch('/functions/v1/ai-charts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          formId: formId,
          autoAnalyze: true 
        }),
      });

      if (!response.ok) {
        console.log('API call failed, falling back to demo mode');
        setIsDemoMode(true);
        setResults(mockResults.results);
        toast({
          title: "Demo Mode",
          description: "Showing sample charts while the backend is being set up",
        });
        return;
      }

      const data: AiChartsResponse = await response.json();
      setResults(data.results || []);
      
      toast({
        title: "Analyse automatique terminée !",
        description: `${data.results?.length || 0} visualisation(s) générée(s) automatiquement`,
      });

      // Add to history
      const autoQuery = "Analyse automatique des données du formulaire";
      saveToHistory(autoQuery);
      
    } catch (error) {
      console.error('Error auto-generating charts:', error);
      console.log('Fallback to demo mode due to error');
      setIsDemoMode(true);
      setResults(mockResults.results);
      toast({
        title: "Mode démo activé",
        description: "Affichage des données de démonstration",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle pin status
  const togglePin = (query: string) => {
    const newHistory = history.map(h => 
      h.query === query ? { ...h, isPinned: !h.isPinned } : h
    );
    setHistory(newHistory);
    localStorage.setItem('aiCharts.history', JSON.stringify(newHistory));
  };

  // Update URL with current state
  const updateURL = (params: { demo?: boolean; preset?: string; question?: string }) => {
    const url = new URL(window.location.href);
    
    if (params.demo !== undefined) {
      if (params.demo) {
        url.searchParams.set('demo', '1');
      } else {
        url.searchParams.delete('demo');
      }
    }
    
    if (params.preset) {
      url.searchParams.set('preset', params.preset);
    } else {
      url.searchParams.delete('preset');
    }
    
    if (params.question) {
      url.searchParams.set('q', encodeURIComponent(params.question));
    } else {
      url.searchParams.delete('q');
    }
    
    window.history.pushState({}, '', url.toString());
  };

  const generateChart = async () => {
    if (!question.trim()) {
      toast({
        title: "Question requise",
        description: "Veuillez saisir une question pour générer un graphique",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    saveToHistory(question.trim());
    updateURL({ demo: isDemoMode, question: question.trim() });

    try {
      if (isDemoMode) {
        // Use preset data if selected, otherwise use default mock
        let dataToUse = mockResults;
        if (selectedPreset) {
          const presetData = getPresetByKey(selectedPreset);
          if (presetData) {
            dataToUse = presetData;
          }
        }
        
        // Simulate loading for demo
        await new Promise(resolve => setTimeout(resolve, 1500));
        setResults(dataToUse.results);
        toast({
          title: "Graphiques générés !",
          description: "Données de démonstration affichées",
        });
      } else {
        // Call real API
        const endpoint = (window as any)?.NEXT_PUBLIC_AI_CHARTS_ENDPOINT 
          || (window as any)?.AI_CHARTS_ENDPOINT 
          || '/functions/v1/ai-charts' 
          || '/api/ai-charts';
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question: question.trim() }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.details || `HTTP ${response.status}`);
        }

        const data: AiChartsResponse = await response.json();
        setResults(data.results || []);
        
        toast({
          title: "Graphiques générés !",
          description: `${data.results?.length || 0} visualisation(s) créée(s)`,
        });
      }
    } catch (error) {
      console.error('Error generating charts:', error);
      toast({
        title: "Erreur de génération",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runHistoryQuery = (query: string) => {
    setQuestion(query);
    updateURL({ question: query });
  };

  const handlePresetChange = (presetKey: string) => {
    setSelectedPreset(presetKey);
    updateURL({ preset: presetKey });
    
    const presetData = getPresetByKey(presetKey);
    if (presetData && isDemoMode) {
      setResults(presetData.results);
    }
  };

  const handleDemoModeChange = (checked: boolean) => {
    setIsDemoMode(checked);
    updateURL({ demo: checked });
    
    // Clear preset if switching to real mode
    if (!checked) {
      setSelectedPreset('');
      updateURL({ preset: '' });
    }
  };

  const handleJSONApply = (data: AiChartsResponse) => {
    setResults(data.results);
    toast({
      title: "Données appliquées !",
      description: `${data.results.length} visualisation(s) chargée(s)`,
    });
  };

  const handleDuplicate = (result: ChartResult) => {
    setResults([result, ...results]);
    toast({
      title: "Graphique dupliqué !",
      description: "Le graphique a été ajouté en haut de la liste",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      generateChart();
    }
  };

  const getFormId = () => {
    const pathSegments = window.location.pathname.split('/');
    return pathSegments[pathSegments.length - 1];
  };

  if (showDataViewer) {
    const formId = getFormId();
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
          <div className="container mx-auto p-6 space-y-8">
            <div className="flex items-center gap-4 mb-6">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowDataViewer(false)}
                className="flex items-center gap-2"
              >
                ← Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-foreground">Raw Form Data</h1>
            </div>
            <FormDataViewer formId={formId} />
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto p-6 space-y-8">
          {/* Hero Section - Bento Grid */}
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">
                AI Charts
              </h1>
              <p className="text-xl text-muted-foreground">
                Posez une question, on génère le graphique le plus pertinent.
              </p>
            </div>

            <BentoGrid>
              {/* Tile A: Main Query Input (2x1) */}
              <BentoTile cols={2} rows={1} className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Génération IA</h3>
                    <p className="text-sm text-muted-foreground">
                      Décrivez vos besoins d'analyse
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="question">Votre question</Label>
                    <Input
                      id="question"
                      placeholder="Ex : Ventes par jour (30 derniers jours) ?"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading}
                      className="text-base"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button 
                      onClick={generateChart}
                      disabled={isLoading || !question.trim()}
                      className="flex items-center gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {isLoading ? 'Génération...' : 'Générer avec l\'IA'}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setIsDrawerOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <FileCode className="w-4 h-4" />
                      Coller JSON factice
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="demo-mode"
                        checked={isDemoMode}
                        onCheckedChange={handleDemoModeChange}
                      />
                      <Label htmlFor="demo-mode" className="text-sm">
                        Mode démo (données factices)
                      </Label>
                    </div>

                    {isDemoMode && (
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Présets:</Label>
                        <Select value={selectedPreset} onValueChange={handlePresetChange}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Choisir..." />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(presets).map(([key, preset]) => (
                              <SelectItem key={key} value={key}>
                                {preset.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </BentoTile>

              {/* Tile B: View Answers Raw (1x1) */}
              <BentoTile cols={1} rows={1}>
                <div className="h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <Database className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">View Answers Raw</h3>
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      View raw form responses data organized by questions or users.
                    </p>
                    <Button 
                      onClick={() => setShowDataViewer(true)}
                      variant="outline"
                      className="w-full flex items-center gap-2"
                    >
                      <Database className="w-4 h-4" />
                      View Raw Data
                    </Button>
                  </div>
                </div>
              </BentoTile>

              {/* Tile C: Filters (1x1) */}
              <BentoTile cols={1} rows={1}>
                <div className="h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Filtres</h3>
                    <Badge variant="secondary" className="text-xs">
                      à venir
                    </Badge>
                  </div>

                  <div className="space-y-4 opacity-50">
                    <div>
                      <Label className="text-sm font-medium">Période</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 mt-1 cursor-not-allowed">
                            <CalendarDays className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Sélection de dates
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Fonctionnalité à venir</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-sm font-medium">Tables</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="mt-1 cursor-not-allowed">
                            <span className="text-sm text-muted-foreground">
                              Auto-détection
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Fonctionnalité à venir</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </BentoTile>
          </BentoGrid>
        </div>

        {/* Results Section */}
        {(results.length > 0 || isLoading) && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">
                {results.length > 0 && !isLoading ? 'Analyse Automatique' : 'Génération en cours...'}
              </h2>
              {results.length > 0 && (
                <Badge variant="outline">
                  {results.length} graphique{results.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            {isLoading ? (
              // Loading skeletons
              <BentoResultsGrid>
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 bg-muted rounded mb-4"></div>
                      <div className="flex gap-2">
                        <div className="h-8 bg-muted rounded w-16"></div>
                        <div className="h-8 bg-muted rounded w-16"></div>
                        <div className="h-8 bg-muted rounded w-16"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </BentoResultsGrid>
            ) : (
              // Actual results
              <BentoResultsGrid>
                {results.map((result, index) => (
                  <AiChartCard key={index} result={result} onDuplicate={handleDuplicate} />
                ))}
              </BentoResultsGrid>
            )}
          </div>
        )}

          {/* Empty State or Christopher Analysis */}
          {results.length === 0 && !isLoading && (
            <div className="text-center py-12">
              {isAnalysisLoading ? (
                <div>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Analyse en cours...</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-4">
                    Christopher analyse les données de votre formulaire pour générer 
                    des insights personnalisés.
                  </p>
                </div>
              ) : analysisHtml ? (
                <div 
                  ref={analysisContainerRef}
                  className="text-left max-w-4xl mx-auto"
                  dangerouslySetInnerHTML={{ __html: analysisHtml }}
                />
              ) : (
                <div>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Analyse en cours...</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-4">
                    L'IA analyse automatiquement les données de votre formulaire pour générer 
                    les visualisations les plus pertinentes.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Astuce :</strong> activez le Mode démo pour voir un exemple avec des données factices.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dummy JSON Editor Drawer */}
        <DummyJSONEditor
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onApply={handleJSONApply}
        />
      </div>
    </TooltipProvider>
  );
};

export default AiChartsBento;
