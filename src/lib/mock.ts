import { type AiChartsResponse } from '@/types/ChartSpec';

export const mockResults: AiChartsResponse = {
  results: [
    {
      spec: {
        title: "Évolution des ventes mensuelles",
        rationale: "Ce graphique en ligne montre la tendance des ventes sur les 6 derniers mois",
        sql: "SELECT mois, SUM(ventes) as total_ventes FROM ventes_mensuelles GROUP BY mois ORDER BY mois",
        chartType: "line",
        x: "mois",
        y: "total_ventes",
        series: null,
        aggregate: "sum",
        limit: 30,
        notes: [
          "Forte croissance observée en mars (+35%)",
          "Légère baisse en avril, probablement saisonnière",
          "Tendance générale positive sur la période"
        ]
      },
      rows: [
        { mois: "2024-01", total_ventes: 45000 },
        { mois: "2024-02", total_ventes: 52000 },
        { mois: "2024-03", total_ventes: 68000 },
        { mois: "2024-04", total_ventes: 61000 },
        { mois: "2024-05", total_ventes: 71000 },
        { mois: "2024-06", total_ventes: 78000 }
      ]
    },
    {
      spec: {
        title: "Répartition des ventes par région",
        rationale: "Graphique en secteurs pour visualiser la contribution de chaque région",
        sql: "SELECT region, SUM(ventes) as total FROM ventes GROUP BY region",
        chartType: "pie",
        x: "region",
        y: "total",
        series: null,
        aggregate: "sum",
        limit: 30,
        notes: [
          "L'Île-de-France représente 40% du chiffre d'affaires",
          "Les régions du Sud-Est montrent un potentiel de croissance",
          "Opportunité d'expansion dans l'Ouest"
        ]
      },
      rows: [
        { region: "Île-de-France", total: 156000 },
        { region: "Auvergne-Rhône-Alpes", total: 89000 },
        { region: "Provence-Alpes-Côte d'Azur", total: 67000 },
        { region: "Nouvelle-Aquitaine", total: 45000 },
        { region: "Occitanie", total: 38000 }
      ]
    },
    {
      spec: {
        title: "Performance par commercial",
        rationale: "Comparaison des performances individuelles avec graphique en barres",
        sql: "SELECT commercial, SUM(ca) as chiffre_affaires FROM ventes_commercial GROUP BY commercial ORDER BY ca DESC",
        chartType: "bar",
        x: "commercial",
        y: "chiffre_affaires",
        series: null,
        aggregate: "sum",
        limit: 10,
        notes: [
          "Marie Dubois dépasse largement les objectifs (+25%)",
          "Formation recommandée pour les 3 derniers du classement",
          "Écart significatif entre le top performer et la moyenne"
        ]
      },
      rows: [
        { commercial: "Marie Dubois", chiffre_affaires: 95000 },
        { commercial: "Jean Martin", chiffre_affaires: 78000 },
        { commercial: "Sophie Laurent", chiffre_affaires: 65000 },
        { commercial: "Pierre Moreau", chiffre_affaires: 58000 },
        { commercial: "Julie Bernard", chiffre_affaires: 52000 },
        { commercial: "Thomas Petit", chiffre_affaires: 41000 }
      ]
    }
  ]
};