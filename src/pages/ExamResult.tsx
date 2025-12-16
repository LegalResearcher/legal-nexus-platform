import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Trophy, XCircle, CheckCircle, RotateCcw, Home, Eye, Clock, Target } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
}

interface Answer {
  questionId: string;
  selectedAnswer: number | null;
  isCorrect: boolean;
}

interface ResultState {
  studentName: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  passed: boolean;
  passingScore: number;
  answers: Answer[];
  questions: Question[];
  duration: number;
}

const ExamResult: React.FC = () => {
  const navigate = useNavigate();
  const { subjectId } = useParams<{ subjectId: string }>();
  const location = useLocation();
  const result = location.state as ResultState;
  
  const [showReview, setShowReview] = useState(false);

  if (!result) {
    navigate('/exam-bank');
    return null;
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} دقيقة و ${secs} ثانية`;
  };

  const getQuestionWithAnswer = (questionId: string) => {
    const question = result.questions.find(q => q.id === questionId);
    const answer = result.answers.find(a => a.questionId === questionId);
    return { question, answer };
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Result Header */}
      <div className={`py-8 px-4 ${result.passed ? 'bg-success' : 'bg-destructive'} text-white`}>
        <div className="container text-center">
          {result.passed ? (
            <Trophy className="h-16 w-16 mx-auto mb-4 animate-bounce" />
          ) : (
            <XCircle className="h-16 w-16 mx-auto mb-4" />
          )}
          <h1 className="text-2xl font-bold mb-2">
            {result.passed ? 'مبروك! لقد نجحت' : 'للأسف، لم تنجح'}
          </h1>
          <p className="text-lg opacity-90">{result.studentName}</p>
        </div>
      </div>

      <div className="container px-4 -mt-6">
        {/* Score Card */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-foreground mb-2">
                {result.score}%
              </div>
              <Progress 
                value={result.score} 
                className={`h-3 ${result.passed ? '[&>div]:bg-success' : '[&>div]:bg-destructive'}`}
              />
              <p className="text-sm text-muted-foreground mt-2">
                درجة النجاح: {result.passingScore}%
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <CheckCircle className="h-6 w-6 text-success mx-auto mb-2" />
                <div className="text-2xl font-bold text-success">{result.correctCount}</div>
                <div className="text-xs text-muted-foreground">إجابات صحيحة</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <XCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
                <div className="text-2xl font-bold text-destructive">
                  {result.totalQuestions - result.correctCount}
                </div>
                <div className="text-xs text-muted-foreground">إجابات خاطئة</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-4 w-4" />
                <span className="text-sm">{result.totalQuestions} سؤال</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{formatDuration(result.duration)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button
            variant="outline"
            onClick={() => setShowReview(!showReview)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            {showReview ? 'إخفاء المراجعة' : 'مراجعة الإجابات'}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/exam/${subjectId}/start`)}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            إعادة الاختبار
          </Button>
        </div>

        <Button
          onClick={() => navigate('/exam-bank')}
          className="w-full mb-6 gap-2"
        >
          <Home className="h-4 w-4" />
          العودة لبنك الاختبارات
        </Button>

        {/* Review Section */}
        {showReview && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">مراجعة الإجابات</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-2">
                {result.answers.map((answer, index) => {
                  const { question } = getQuestionWithAnswer(answer.questionId);
                  if (!question) return null;

                  return (
                    <AccordionItem 
                      key={answer.questionId} 
                      value={answer.questionId}
                      className={`border rounded-lg px-4 ${
                        answer.isCorrect 
                          ? 'border-success/30 bg-success/5' 
                          : 'border-destructive/30 bg-destructive/5'
                      }`}
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 text-right">
                          {answer.isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-success shrink-0" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive shrink-0" />
                          )}
                          <span className="text-sm font-medium">
                            السؤال {index + 1}: {question.question_text.substring(0, 50)}...
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                          <p className="font-medium">{question.question_text}</p>
                          
                          <div className="space-y-2">
                            {question.options.map((option, optIndex) => (
                              <div
                                key={optIndex}
                                className={`p-3 rounded-lg text-sm ${
                                  optIndex === question.correct_answer
                                    ? 'bg-success/20 border border-success'
                                    : optIndex === answer.selectedAnswer && !answer.isCorrect
                                      ? 'bg-destructive/20 border border-destructive'
                                      : 'bg-muted'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {String.fromCharCode(1571 + optIndex)}
                                  </span>
                                  <span>{option}</span>
                                  {optIndex === question.correct_answer && (
                                    <Badge variant="default" className="mr-auto bg-success">
                                      الإجابة الصحيحة
                                    </Badge>
                                  )}
                                  {optIndex === answer.selectedAnswer && optIndex !== question.correct_answer && (
                                    <Badge variant="destructive" className="mr-auto">
                                      إجابتك
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {!answer.isCorrect && question.explanation && (
                            <div className="p-3 bg-accent/20 rounded-lg border border-accent">
                              <p className="text-sm font-medium text-accent-foreground mb-1">
                                💡 ملاحظة إرشادية:
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {question.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ExamResult;
