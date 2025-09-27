import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, BarChart3, History, Filter, Sparkles, Play, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BentoGrid, BentoResultsGrid } from '@/components/bento/BentoGrid';
import { BentoTile } from '@/components/bento/BentoTile';
import { AiChartCard } from '@/components/charts/AiChartCard';
import { type AiChartsResponse, type ChartResult } from '@/types/ChartSpec';
import { mockResults } from '@/lib/mock';

const AiChartsBento: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ChartResult[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const { toast } = useToast();

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('aiCharts.history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading history:', error);
      }
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = (query: string) => {
    const newHistory = [query, ...history.filter(h => h !== query)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('aiCharts.history', JSON.stringify(newHistory));
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

    try {
      if (isDemoMode) {
        // Simulate loading for demo
        await new Promise(resolve => setTimeout(resolve, 1500));
        setResults(mockResults.results);
        toast({
          title: "Graphiques générés !",
          description: "Données de démonstration affichées",
        });
      } else {
        // Call real API
        const response = await fetch('/functions/v1/ai-charts', {
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
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      generateChart();
    }
  };

  return (
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
                    placeholder="ex: Montre-moi l'évolution des ventes par mois"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    className="text-base"
                  />
                </div>

                <div className="flex items-center justify-between">
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
                    {isLoading ? 'Génération...' : 'Générer le graphique'}
                  </Button>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="demo-mode"
                      checked={isDemoMode}
                      onCheckedChange={setIsDemoMode}
                    />
                    <Label htmlFor="demo-mode" className="text-sm">
                      Mode démo (mock)
                    </Label>
                  </div>
                </div>
              </div>
            </BentoTile>

            {/* Tile B: History (1x1) */}
            <BentoTile cols={1} rows={1}>
              <div className="h-full flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Historique</h3>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Aucune recherche récente
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {history.map((query, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => runHistoryQuery(query)}
                            className="flex-1 justify-start text-left h-auto p-2 text-xs"
                            disabled={isLoading}
                          >
                            <div className="truncate">{query}</div>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setQuestion(query);
                              generateChart();
                            }}
                            disabled={isLoading}
                            className="p-1"
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
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
                    <div className="flex items-center gap-2 mt-1">
                      <CalendarDays className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Sélection de dates
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium">Tables</Label>
                    <div className="mt-1">
                      <span className="text-sm text-muted-foreground">
                        Auto-détection
                      </span>
                    </div>
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
              <h2 className="text-2xl font-bold">Résultats</h2>
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
                  <AiChartCard key={index} result={result} />
                ))}
              </BentoResultsGrid>
            )}
          </div>
        )}

        {/* Empty State */}
        {results.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Prêt à analyser vos données</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Posez une question sur vos données et notre IA générera automatiquement 
              les visualisations les plus pertinentes pour vous aider à prendre des décisions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiChartsBento;