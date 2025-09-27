import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Calendar, BarChart3, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  form_id: string;
  title: string;
  description: string | null;
  creation_date: string;
}

interface Question {
  question_id: string;
  question: string;
  type_answer: string;
}

interface Answer {
  answer_id: string;
  answer: string;
  question_id: string;
  question: Question;
}

const FormDashboard = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (formId) {
      fetchFormData();
      fetchQuestions();
      fetchAnswers();
    }
  }, [formId]);

  const fetchFormData = async () => {
    try {
      const { data, error } = await supabase
        .from('form')
        .select('form_id, title, description, creation_date')
        .eq('form_id', formId)
        .single();

      if (error) {
        console.error('Error fetching form:', error);
        toast({
          title: "Error",
          description: "Failed to fetch form data",
          variant: "destructive",
        });
        return;
      }

      setFormData(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('question')
        .select('question_id, question, type_answer')
        .eq('form_id', formId);

      if (error) {
        console.error('Error fetching questions:', error);
        return;
      }

      setQuestions(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchAnswers = async () => {
    try {
      const { data, error } = await supabase
        .from('answer')
        .select(`
          answer_id,
          answer,
          question_id,
          question:question_id (
            question_id,
            question,
            type_answer
          )
        `)
        .eq('question.form_id', formId);

      if (error) {
        console.error('Error fetching answers:', error);
        return;
      }

      setAnswers(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupAnswersByQuestion = () => {
    const grouped: { [key: string]: Answer[] } = {};
    answers.forEach(answer => {
      if (!grouped[answer.question_id]) {
        grouped[answer.question_id] = [];
      }
      grouped[answer.question_id].push(answer);
    });
    return grouped;
  };

  const getUniqueRespondents = () => {
    // Since we don't have session tracking, we'll estimate based on complete answer sets
    const groupedAnswers = groupAnswersByQuestion();
    const questionCount = questions.length;
    if (questionCount === 0) return 0;
    
    // Simple estimation: total answers divided by question count
    return Math.ceil(answers.length / questionCount);
  };

  const exportAnswers = () => {
    const groupedAnswers = groupAnswersByQuestion();
    let csvContent = "Question,Answer\n";
    
    questions.forEach(question => {
      const questionAnswers = groupedAnswers[question.question_id] || [];
      questionAnswers.forEach(answer => {
        csvContent += `"${question.question}","${answer.answer}"\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData?.title || 'form'}_responses.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Exported!",
      description: "Form responses exported as CSV",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Form Not Found</h2>
          <p className="text-muted-foreground mb-4">The form you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </Card>
      </div>
    );
  }

  const groupedAnswers = groupAnswersByQuestion();
  const respondentCount = getUniqueRespondents();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">{formData.title}</h1>
            <p className="text-muted-foreground">{formData.description}</p>
          </div>

          <Button 
            onClick={exportAnswers}
            className="flex items-center gap-2"
            disabled={answers.length === 0}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{answers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estimated Respondents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{respondentCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Created</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date(formData.creation_date).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Questions and Answers */}
        <div className="space-y-6">
          {questions.length === 0 ? (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">No Questions Yet</h3>
              <p className="text-muted-foreground">This form doesn't have any questions configured.</p>
            </Card>
          ) : (
            questions.map((question) => {
              const questionAnswers = groupedAnswers[question.question_id] || [];
              
              return (
                <Card key={question.question_id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{question.question}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">{question.type_answer}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {questionAnswers.length} responses
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {questionAnswers.length === 0 ? (
                      <p className="text-muted-foreground italic">No responses yet</p>
                    ) : (
                      <div className="space-y-2">
                        {questionAnswers.slice(0, 5).map((answer, index) => (
                          <div key={answer.answer_id} className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-sm">{answer.answer}</p>
                          </div>
                        ))}
                        {questionAnswers.length > 5 && (
                          <p className="text-sm text-muted-foreground">
                            ... and {questionAnswers.length - 5} more responses
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default FormDashboard;