import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Calendar, BarChart3, Download, TrendingUp, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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
}

const FormDashboard = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userEmail } = useSimpleAuth();
  
  const [formData, setFormData] = useState<FormData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (formId && userEmail) {
      fetchFormData();
      fetchQuestions();
      fetchAnswers();
    }
  }, [formId, userEmail]);

  const fetchFormData = async () => {
    try {
      const { data, error } = await supabase
        .from('form')
        .select('form_id, title, description, creation_date')
        .eq('form_id', formId)
        .eq('user_id', userEmail)
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
      // First get all questions for this form
      const questionsForForm = questions.length > 0 ? questions : await getQuestionsForForm();
      
      if (questionsForForm.length === 0) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('answer')
        .select('answer_id, answer, question_id')
        .in('question_id', questionsForForm.map(q => q.question_id));

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

  const getQuestionsForForm = async () => {
    const { data } = await supabase
      .from('question')
      .select('question_id, question, type_answer')
      .eq('form_id', formId);
    return data || [];
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

  const getAnalyticsData = () => {
    const groupedAnswers = groupAnswersByQuestion();
    const analytics = [];

    questions.forEach(question => {
      const questionAnswers = groupedAnswers[question.question_id] || [];
      
      if (question.type_answer === 'radio' || question.type_answer === 'checkbox') {
        // Count frequency of each answer
        const frequency: { [key: string]: number } = {};
        questionAnswers.forEach(answer => {
          const value = answer.answer;
          frequency[value] = (frequency[value] || 0) + 1;
        });

        analytics.push({
          question: question.question,
          type: question.type_answer,
          data: Object.entries(frequency).map(([name, value]) => ({ name, value })),
          total: questionAnswers.length
        });
      } else if (question.type_answer === 'number') {
        // Calculate average for number questions
        const numbers = questionAnswers.map(a => parseFloat(a.answer)).filter(n => !isNaN(n));
        const average = numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
        
        analytics.push({
          question: question.question,
          type: question.type_answer,
          data: [{ name: 'Average', value: Math.round(average * 10) / 10 }],
          total: questionAnswers.length,
          average: Math.round(average * 10) / 10
        });
      }
    });

    return analytics;
  };

  const getInsightComments = () => {
    const analytics = getAnalyticsData();
    const comments = [];

    analytics.forEach(analytic => {
      if (analytic.type === 'radio' && analytic.question.includes('rate')) {
        const excellent = analytic.data.find(d => d.name === 'Excellent')?.value || 0;
        const good = analytic.data.find(d => d.name === 'Good')?.value || 0;
        const total = analytic.total;
        const satisfaction = ((excellent + good) / total) * 100;
        
        if (satisfaction >= 80) {
          comments.push({
            type: 'positive',
            text: `Strong customer satisfaction with ${satisfaction.toFixed(1)}% positive ratings`,
            icon: '🎉'
          });
        } else if (satisfaction >= 60) {
          comments.push({
            type: 'neutral',
            text: `Moderate satisfaction levels at ${satisfaction.toFixed(1)}% - room for improvement`,
            icon: '⚠️'
          });
        } else {
          comments.push({
            type: 'negative',
            text: `Low satisfaction at ${satisfaction.toFixed(1)}% - urgent attention needed`,
            icon: '🚨'
          });
        }
      }

      if (analytic.type === 'number' && analytic.average) {
        if (analytic.average >= 8) {
          comments.push({
            type: 'positive',
            text: `Excellent average rating of ${analytic.average}/10 - customers love the product`,
            icon: '⭐'
          });
        } else if (analytic.average >= 6) {
          comments.push({
            type: 'neutral',
            text: `Decent average rating of ${analytic.average}/10 - focus on key improvements`,
            icon: '📈'
          });
        } else {
          comments.push({
            type: 'negative',
            text: `Low average rating of ${analytic.average}/10 - major improvements needed`,
            icon: '⚡'
          });
        }
      }

      if (analytic.type === 'radio' && analytic.question.includes('hear')) {
        const topSource = analytic.data.reduce((prev, current) => 
          (prev.value > current.value) ? prev : current
        );
        comments.push({
          type: 'insight',
          text: `"${topSource.name}" is the top acquisition channel with ${topSource.value} referrals`,
          icon: '📊'
        });
      }
    });

    return comments;
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

  const getUniqueRespondents = () => {
    const groupedAnswers = groupAnswersByQuestion();
    const questionCount = questions.length;
    if (questionCount === 0) return 0;
    
    return Math.ceil(answers.length / questionCount);
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

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

  const analyticsData = getAnalyticsData();
  const insightComments = getInsightComments();
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

        {/* AI Insights */}
        {insightComments.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                AI Insights & Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insightComments.map((comment, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg border-l-4 ${
                      comment.type === 'positive' ? 'bg-green-50 border-green-400 text-green-800' :
                      comment.type === 'negative' ? 'bg-red-50 border-red-400 text-red-800' :
                      comment.type === 'neutral' ? 'bg-yellow-50 border-yellow-400 text-yellow-800' :
                      'bg-blue-50 border-blue-400 text-blue-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{comment.icon}</span>
                      <p className="font-medium">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {analyticsData.map((analytic, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{analytic.question}</CardTitle>
                <Badge variant="secondary">{analytic.type}</Badge>
              </CardHeader>
              <CardContent>
                {analytic.type === 'number' ? (
                  <div className="text-center py-8">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {analytic.average}/10
                    </div>
                    <p className="text-muted-foreground">Average Rating</p>
                  </div>
                ) : (
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={analytic.data}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analytic.data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="mt-4 text-sm text-muted-foreground">
                  {analytic.total} responses collected
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Responses */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Detailed Responses
          </h2>
          {questions.length === 0 ? (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">No Questions Yet</h3>
              <p className="text-muted-foreground">This form doesn't have any questions configured.</p>
            </Card>
          ) : (
            questions.map((question) => {
              const questionAnswers = groupAnswersByQuestion()[question.question_id] || [];
              
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