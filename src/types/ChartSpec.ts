export interface ChartSpec {
  title: string;
  rationale: string;
  sql: string;
  chartType: 'line' | 'bar' | 'stacked_bar' | 'area' | 'scatter' | 'pie' | 'table';
  x: string;
  y: string;
  series: string | null;
  aggregate: 'sum' | 'avg' | 'count' | 'min' | 'max' | null;
  limit: number;
  notes: string[];
}

export interface ChartResult {
  spec: ChartSpec;
  rows: Record<string, any>[];
}

export interface AiChartsResponse {
  results: ChartResult[];
}