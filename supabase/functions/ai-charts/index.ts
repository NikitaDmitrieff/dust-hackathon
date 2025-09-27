import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question } = await req.json();

    if (!question) {
      throw new Error('Question is required');
    }

    const systemPrompt = `Tu es un expert en analyse de données. Génère des spécifications de graphiques basées sur les questions des utilisateurs.

Réponds UNIQUEMENT avec un JSON valide dans ce format exact:
{
  "results": [
    {
      "spec": {
        "title": "Titre du graphique",
        "rationale": "Explication de pourquoi ce graphique répond à la question",
        "sql": "SELECT * FROM table_name",
        "chartType": "line|bar|stacked_bar|area|scatter|pie|table",
        "x": "nom_colonne_x",
        "y": "nom_colonne_y", 
        "series": "nom_colonne_series ou null",
        "aggregate": "sum|avg|count|min|max|null",
        "limit": 30,
        "notes": ["Insight 1", "Insight 2"]
      },
      "rows": [
        {"date": "2024-01-01", "ventes": 1200, "region": "Nord"},
        {"date": "2024-01-02", "ventes": 1350, "region": "Nord"}
      ]
    }
  ]
}

Règles importantes:
- Toujours générer des données réalistes qui correspondent à la question
- Utilise des noms de colonnes en français 
- Les dates doivent être au format ISO
- Limite à 30 lignes maximum
- Ajoute 2-3 insights pertinents dans notes`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    try {
      // Parse the JSON response from GPT
      const jsonResponse = JSON.parse(generatedText);
      
      return new Response(JSON.stringify(jsonResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse GPT response:', generatedText);
      
      // Fallback with mock data if parsing fails
      const fallbackResponse = {
        results: [
          {
            spec: {
              title: "Analyse générée",
              rationale: "Graphique généré en réponse à votre question",
              sql: "SELECT * FROM data",
              chartType: "bar",
              x: "periode",
              y: "valeur",
              series: null,
              aggregate: "sum",
              limit: 30,
              notes: ["Données générées automatiquement", "Analyse basée sur votre question"]
            },
            rows: [
              {"periode": "Jan", "valeur": 120},
              {"periode": "Feb", "valeur": 150},
              {"periode": "Mar", "valeur": 180},
              {"periode": "Apr", "valeur": 200}
            ]
          }
        ]
      };
      
      return new Response(JSON.stringify(fallbackResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in ai-charts function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Erreur lors de la génération du graphique'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});