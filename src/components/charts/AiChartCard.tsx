import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Copy, Download, Image, ChevronDown, ChevronUp, Code2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type ChartResult } from '@/types/ChartSpec';
import { toVegaLite } from '@/lib/toVegaLite';
import { exportCSV, exportPNG } from '@/lib/download';

// Simple Vega-Lite renderer using embed
declare global {
  interface Window {
    vegaEmbed: any;
  }
}

interface AiChartCardProps {
  result: ChartResult;
}

export const AiChartCard: React.FC<AiChartCardProps> = ({ result }) => {
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [vegaView, setVegaView] = useState<any>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const vegaSpec = toVegaLite(result);

  useEffect(() => {
    // Load Vega-Lite embed script
    if (!window.vegaEmbed && !document.querySelector('script[src*="vega-embed"]')) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/vega-embed@6';
      script.onload = () => renderChart();
      document.head.appendChild(script);
    } else if (window.vegaEmbed) {
      renderChart();
    }
  }, []);

  const renderChart = async () => {
    if (chartRef.current && window.vegaEmbed && !vegaSpec.isTable) {
      try {
        const { view } = await window.vegaEmbed(chartRef.current, vegaSpec, {
          theme: 'light',
          renderer: 'svg',
          actions: false
        });
        setVegaView(view);
      } catch (error) {
        console.error('Error rendering chart:', error);
      }
    }
  };

  const copySQL = () => {
    navigator.clipboard.writeText(result.spec.sql);
    toast({
      title: "SQL copié !",
      description: "La requête SQL a été copiée dans le presse-papiers",
    });
  };

  const handleExportPNG = async () => {
    if (!vegaView) {
      toast({
        title: "Erreur",
        description: "Le graphique n'est pas encore chargé",
        variant: "destructive",
      });
      return;
    }

    try {
      await exportPNG(vegaView, result.spec.title);
      toast({
        title: "Image exportée !",
        description: "Le graphique a été téléchargé en PNG",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter l'image",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = () => {
    exportCSV(result.rows, result.spec.title);
    toast({
      title: "CSV exporté !",
      description: "Les données ont été téléchargées en CSV",
    });
  };

  const renderTable = () => {
    if (result.rows.length === 0) return <p className="text-muted-foreground">Aucune donnée</p>;

    const headers = Object.keys(result.rows[0]);
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              {headers.map(header => (
                <th key={header} className="text-left p-2 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, index) => (
              <tr key={index} className="border-b border-border/30">
                {headers.map(header => (
                  <td key={header} className="p-2">
                    {row[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col bg-gradient-to-br from-card to-card/80 border-border/50 shadow-lg hover:shadow-xl transition-all duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold leading-tight">
              {result.spec.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {result.spec.rationale}
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            Propulsé par LLM
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Chart Area */}
        <div className="flex-1 min-h-[200px] mb-4">
          {vegaSpec.isTable ? (
            renderTable()
          ) : (
            <div 
              ref={chartRef} 
              className="w-full h-full flex items-center justify-center"
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={copySQL}
            className="flex items-center gap-2"
          >
            <Code2 className="w-4 h-4" />
            SQL
          </Button>
          
          {!vegaSpec.isTable && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPNG}
              className="flex items-center gap-2"
            >
              <Image className="w-4 h-4" />
              PNG
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            CSV
          </Button>
        </div>

        {/* Notes & Insights */}
        {result.spec.notes && result.spec.notes.length > 0 && (
          <Collapsible open={isNotesOpen} onOpenChange={setIsNotesOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between p-0 h-auto"
              >
                <span className="text-sm font-medium">Notes & insights</span>
                {isNotesOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <ul className="space-y-2">
                {result.spec.notes.map((note, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    {note}
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
};