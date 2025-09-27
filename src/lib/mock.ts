import { type AiChartsResponse } from '@/types/ChartSpec';

// Preset data as specified
export const presets = {
  'time-series': {
    name: 'Série temporelle',
    data: {
      "results": [{
        "spec": {
          "title": "Commandes par jour (14j)",
          "rationale": "La série temporelle révèle tendance et saisonnalité.",
          "sql": "SELECT day, orders FROM safe_view_orders_14d",
          "chartType": "line" as const,
          "x": "day",
          "y": "orders",
          "series": null,
          "aggregate": null,
          "limit": 14,
          "notes": ["Pic le lundi", "Creux le week-end"]
        },
        "rows": [
          {"day":"2025-09-01","orders":12},
          {"day":"2025-09-02","orders":15},
          {"day":"2025-09-03","orders":9},
          {"day":"2025-09-04","orders":18},
          {"day":"2025-09-05","orders":16},
          {"day":"2025-09-06","orders":7},
          {"day":"2025-09-07","orders":6},
          {"day":"2025-09-08","orders":20},
          {"day":"2025-09-09","orders":19},
          {"day":"2025-09-10","orders":17},
          {"day":"2025-09-11","orders":21},
          {"day":"2025-09-12","orders":20},
          {"day":"2025-09-13","orders":8},
          {"day":"2025-09-14","orders":7}
        ]
      }]
    }
  },
  'top-categories': {
    name: 'Top catégories',
    data: {
      "results": [{
        "spec": {
          "title": "Top catégories (30 derniers jours)",
          "rationale": "Comparaison des volumes par catégorie.",
          "sql": "SELECT category, sum_qty as count FROM safe_view_top_categories_30d",
          "chartType": "bar" as const,
          "x": "category",
          "y": "count",
          "series": null,
          "aggregate": null,
          "limit": 8,
          "notes": ["Catégorie A > 2x Catégorie D"]
        },
        "rows": [
          {"category":"A","count":320},
          {"category":"B","count":280},
          {"category":"C","count":210},
          {"category":"D","count":150},
          {"category":"E","count":120}
        ]
      }]
    }
  },
  'pie': {
    name: 'Répartition',
    data: {
      "results": [{
        "spec": {
          "title": "Répartition par segment client",
          "rationale": "Vision synthétique de la part de chaque segment.",
          "sql": "SELECT segment, share FROM safe_view_segment_share",
          "chartType": "pie" as const,
          "x": "segment",
          "y": "share",
          "series": null,
          "aggregate": null,
          "limit": 6,
          "notes": ["Segment Pro domine"]
        },
        "rows": [
          {"segment": "Pro", "share": 52},
          {"segment": "PME", "share": 28},
          {"segment": "Particulier", "share": 20}
        ]
      }]
    }
  }
};

export const getPresetByKey = (key: string): AiChartsResponse | null => {
  return presets[key as keyof typeof presets]?.data || null;
};

export const mockResults: AiChartsResponse = presets['time-series'].data;