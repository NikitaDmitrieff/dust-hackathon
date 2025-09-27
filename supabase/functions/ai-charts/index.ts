import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle automatic form analysis
async function handleAutoAnalysis(formId: string) {
  try {
    console.log('Starting auto-analysis for form:', formId);
    
    // Fetch form details
    const { data: form, error: formError } = await supabase
      .from('form')
      .select('title, description')
      .eq('form_id', formId)
      .single();
    
    if (formError) {
      console.error('Error fetching form:', formError);
      throw new Error(`Form not found: ${formError.message}`);
    }
    
    // Fetch questions for this form
    const { data: questions, error: questionsError } = await supabase
      .from('question')
      .select('question_id, question, type_answer')
      .eq('form_id', formId);
    
    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      throw new Error(`Questions not found: ${questionsError.message}`);
    }
    
    // Fetch answers for all questions
    const questionIds = questions.map(q => q.question_id);
    const { data: answers, error: answersError } = await supabase
      .from('answer')
      .select('question_id, answer')
      .in('question_id', questionIds);
    
    if (answersError) {
      console.error('Error fetching answers:', answersError);
      throw new Error(`Answers not found: ${answersError.message}`);
    }
    
    console.log(`Found ${questions.length} questions and ${answers.length} answers`);
    
    // Group answers by question
    const questionData = questions.map(question => {
      const questionAnswers = answers.filter(a => a.question_id === question.question_id);
      return {
        question: question.question,
        type: question.type_answer,
        answers: questionAnswers.map(a => a.answer),
        answerCount: questionAnswers.length
      };
    });
    
    // Create analysis prompt
    const analysisPrompt = `Analyse automatique du formulaire "${form.title}"
    
Description: ${form.description || 'Aucune description'}

Questions et réponses collectées:
${questionData.map((q, i) => `
${i + 1}. Question: "${q.question}" (Type: ${q.type})
   Nombre de réponses: ${q.answerCount}
   Échantillon de réponses: ${q.answers.slice(0, 10).join(', ')}
`).join('')}

Génère automatiquement 2-4 graphiques d'analyse les plus pertinents pour ce formulaire.
Concentre-toi sur:
- Distribution des réponses pour les questions à choix multiple
- Tendances temporelles si applicable
- Comparaisons entre catégories
- Corrélations intéressantes

Utilise les vraies données des réponses pour créer les graphiques.`;

    console.log('Sending analysis prompt to OpenAI...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: getSystemPrompt() },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.7,
        max_tokens: 3000,
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
      const jsonResponse = JSON.parse(generatedText);
      return new Response(JSON.stringify(jsonResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse GPT response:', generatedText);
      throw new Error('Failed to parse AI response');
    }
    
  } catch (error) {
    console.error('Error in auto-analysis:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Erreur lors de l\'analyse automatique'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

function getSystemPrompt() {
  return `Tu es un expert en analyse de données. Génère des spécifications de graphiques basées sur les questions des utilisateurs.

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
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, formId, autoAnalyze } = await req.json();

    // Handle automatic form analysis
    if (autoAnalyze && formId) {
      return await handleAutoAnalysis(formId);
    }

    if (!question) {
      throw new Error('Question is required');
    }

    const systemPrompt = getSystemPrompt();

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