import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileText, Users, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface AdminPanelProps {
  onBack?: () => void;
}

interface Form {
  form_id: string;
  title: string;
  description: string;
  creation_date: string;
}

interface Question {
  question_id: string;
  question: string;
  type_answer: string;
}

interface Answer {
  question_id: string;
  answer: string;
}

const AdminPanel = ({ onBack }: AdminPanelProps) => {
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'questions' | 'users'>('questions');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.email) {
      fetchForms();
    }
  }, [user?.email]);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('form')
        .select('form_id, title, description, creation_date')
        .eq('user_id', user?.email)
        .order('creation_date', { ascending: false });

      if (error) throw error;
      setForms(data || []);
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast({
        title: "Error",
        description: "Failed to load forms.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFormData = async (form: Form) => {
    setLoading(true);
    try {
      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('question')
        .select('question_id, question, type_answer')
        .eq('form_id', form.form_id)
        .order('question_id');

      if (questionsError) throw questionsError;

      // Fetch answers
      const questionIds = questionsData?.map(q => q.question_id) || [];
      const { data: answersData, error: answersError } = await supabase
        .from('answer')
        .select('question_id, answer')
        .in('question_id', questionIds);

      if (answersError) throw answersError;

      setQuestions(questionsData || []);
      setAnswers(answersData || []);
      setSelectedForm(form);
    } catch (error) {
      console.error('Error fetching form data:', error);
      toast({
        title: "Error",
        description: "Failed to load form data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const parseAnswers = () => {
    const parsedAnswers: { [key: string]: { userName: string; response: any; questionId: string } } = {};
    
    answers.forEach(answer => {
      try {
        const parsed = JSON.parse(answer.answer);
        const key = `${answer.question_id}_${parsed.userName}`;
        parsedAnswers[key] = {
          userName: parsed.userName,
          response: parsed.response,
          questionId: answer.question_id
        };
      } catch {
        // Handle non-JSON answers
        const key = `${answer.question_id}_unknown`;
        parsedAnswers[key] = {
          userName: 'Unknown',
          response: answer.answer,
          questionId: answer.question_id
        };
      }
    });

    return parsedAnswers;
  };

  const getAnswersByQuestion = () => {
    const parsedAnswers = parseAnswers();
    const result: { [questionId: string]: Array<{ userName: string; response: any }> } = {};

    Object.values(parsedAnswers).forEach(answer => {
      if (!result[answer.questionId]) {
        result[answer.questionId] = [];
      }
      result[answer.questionId].push({
        userName: answer.userName,
        response: answer.response
      });
    });

    return result;
  };

  const getAnswersByUser = () => {
    const parsedAnswers = parseAnswers();
    const result: { [userName: string]: Array<{ question: string; response: any; questionId: string }> } = {};

    Object.values(parsedAnswers).forEach(answer => {
      if (!result[answer.userName]) {
        result[answer.userName] = [];
      }
      const question = questions.find(q => q.question_id === answer.questionId);
      result[answer.userName].push({
        question: question?.question || 'Unknown Question',
        response: answer.response,
        questionId: answer.questionId
      });
    });

    return result;
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (selectedForm) {
    const answersByQuestion = getAnswersByQuestion();
    const answersByUser = getAnswersByUser();

    return (
      <div className="bg-card rounded-lg p-6 shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <Button onClick={() => setSelectedForm(null)} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Forms
          </Button>
          <div>
            <h2 className="text-xl font-semibold text-foreground">{selectedForm.title}</h2>
            <p className="text-sm text-muted-foreground">{selectedForm.description}</p>
          </div>
        </div>

        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'questions' | 'users')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="questions">By Questions</TabsTrigger>
            <TabsTrigger value="users">By Users</TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-4">
            {questions.map(question => (
              <Card key={question.question_id}>
                <CardHeader>
                  <CardTitle className="text-base">{question.question}</CardTitle>
                  <CardDescription>Type: {question.type_answer}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {answersByQuestion[question.question_id]?.map((answer, index) => (
                      <div key={index} className="p-3 bg-muted rounded-md">
                        <div className="font-medium text-sm text-foreground mb-1">
                          {answer.userName}
                        </div>
                        <div className="text-sm">{answer.response}</div>
                      </div>
                    )) || (
                      <p className="text-muted-foreground text-sm">No answers yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            {Object.entries(answersByUser).map(([userName, userAnswers]) => (
              <Card key={userName}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {userName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userAnswers.map((answer, index) => (
                      <div key={index} className="border-l-2 border-primary pl-3">
                        <div className="font-medium text-sm text-foreground mb-1">
                          {answer.question}
                        </div>
                        <div className="text-sm text-muted-foreground">{answer.response}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            {Object.keys(answersByUser).length === 0 && (
              <p className="text-muted-foreground text-center py-8">No user responses yet</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Admin Panel</h2>
        {onBack && (
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Your Forms
        </h3>
        
        {forms.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No forms created yet. Create your first form to see responses here.
          </p>
        ) : (
          <div className="grid gap-4">
            {forms.map(form => (
              <Card key={form.form_id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => fetchFormData(form)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{form.title}</CardTitle>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                  {form.description && (
                    <CardDescription>{form.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(form.creation_date).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;