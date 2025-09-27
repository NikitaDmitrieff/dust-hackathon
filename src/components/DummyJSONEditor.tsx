import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, FileCode, Settings } from 'lucide-react';
import { presets, getPresetByKey } from '@/lib/mock';
import { type AiChartsResponse } from '@/types/ChartSpec';

interface DummyJSONEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: AiChartsResponse) => void;
}

export const DummyJSONEditor: React.FC<DummyJSONEditorProps> = ({
  isOpen,
  onClose,
  onApply
}) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('presets');

  const handlePresetSelect = (presetKey: string) => {
    const presetData = getPresetByKey(presetKey);
    if (presetData) {
      setJsonText(JSON.stringify(presetData, null, 2));
      setActiveTab('json');
      setError('');
    }
  };

  const validateAndApply = () => {
    try {
      const parsed = JSON.parse(jsonText);
      
      // Basic validation
      if (!parsed.results || !Array.isArray(parsed.results)) {
        throw new Error('Le JSON doit contenir un tableau "results"');
      }

      for (const result of parsed.results) {
        if (!result.spec || !result.rows) {
          throw new Error('Chaque résultat doit avoir "spec" et "rows"');
        }
        if (!result.spec.title || !result.spec.chartType) {
          throw new Error('spec.title et spec.chartType sont requis');
        }
      }

      onApply(parsed);
      onClose();
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'JSON invalide');
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileCode className="w-5 h-5" />
            Données factices (aperçu)
          </SheetTitle>
          <SheetDescription>
            Choisissez un preset ou collez votre propre JSON pour prévisualiser vos données
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="presets" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Presets
              </TabsTrigger>
              <TabsTrigger value="json" className="flex items-center gap-2">
                <FileCode className="w-4 h-4" />
                JSON
              </TabsTrigger>
            </TabsList>

            <TabsContent value="presets" className="space-y-4 mt-4">
              <div className="grid gap-3">
                {Object.entries(presets).map(([key, preset]) => (
                  <div key={key} className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePresetSelect(key)}
                      className="w-full justify-start text-left h-auto p-4"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{preset.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {preset.data.results[0].spec.title}
                        </div>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {preset.data.results[0].spec.chartType}
                      </Badge>
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="json" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="json-editor">JSON des résultats</Label>
                <Textarea
                  id="json-editor"
                  placeholder='{"results": [{"spec": {...}, "rows": [...]}]}'
                  value={jsonText}
                  onChange={(e) => {
                    setJsonText(e.target.value);
                    setError('');
                  }}
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 mt-6 pt-4 border-t">
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Annuler
            </Button>
            <Button 
              onClick={validateAndApply} 
              disabled={!jsonText.trim()}
              className="flex-1"
            >
              Appliquer
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};