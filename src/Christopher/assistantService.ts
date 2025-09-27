interface DashboardApiResponse {
  html?: string;
  title?: string;
  description?: string;
  questionCount?: number;
  error?: string;
  details?: string;
}

const ANALYZE_ENDPOINT = '/api/christopher/analyze-dashboard';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const fallbackAnalysisHtml = (formId: string, reason?: string): string => {
  const reasonBlock = reason
    ? `<p class="text-xs text-muted-foreground">${escapeHtml(reason)}</p>`
    : '';

  return `
    <div class="space-y-4">
      <h3 class="text-lg font-semibold">Analyse indisponible pour le formulaire ${escapeHtml(formId)}</h3>
      <div class="rounded-lg border border-dashed border-border/50 p-4 bg-muted/40">
        <p class="text-sm text-muted-foreground">
          Impossible de générer le tableau de bord automatique pour le moment.
          Affichage de données de démonstration à la place.
        </p>
        ${reasonBlock}
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 bg-blue-50 rounded-lg">
          <h4 class="font-medium text-blue-900">Taux de réponse</h4>
          <p class="text-2xl font-bold text-blue-600">87%</p>
        </div>
        <div class="p-4 bg-green-50 rounded-lg">
          <h4 class="font-medium text-green-900">Réponses complètes</h4>
          <p class="text-2xl font-bold text-green-600">156</p>
        </div>
      </div>
      <p class="text-gray-600 text-sm">Analyse de secours générée localement</p>
    </div>
  `;
};

export const analyze_dashboard = async (form_id: string): Promise<string> => {
  console.log('Dashboard analysis requested for form ID:', form_id);

  try {
    const response = await fetch(ANALYZE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ formId: form_id }),
    });

    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const errorBody: DashboardApiResponse = await response.json();
        if (errorBody?.error) {
          message = errorBody.error;
        }
      } catch (error) {
        console.error('Failed to parse dashboard error payload:', error);
      }
      throw new Error(message);
    }

    const data: DashboardApiResponse = await response.json();
    if (!data?.html) {
      throw new Error('Réponse du serveur invalide: champ HTML manquant');
    }

    return data.html;
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('Christopher dashboard analysis failed:', reason);
    return fallbackAnalysisHtml(form_id, reason);
  }
};
