import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Clock, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
}

interface ExamState {
  studentName: string;
  duration: number;
  questionsCount: number;
  passingScore: number;
  modelYear: number;
}

interface Answer {
  questionId: string;
  selectedAnswer: number | null;
  isCorrect: boolean;
}

const ExamTaking: React.FC = () => {
  const navigate = useNavigate();
  const { subjectId } = useParams<{ subjectId: string }>();
  const location = useLocation();
  const examState = location.state as ExamState;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!examState) {
      navigate('/exam-bank');
      return;
    }
    
    setTimeLeft(examState.duration * 60);
    fetchQuestions();
  }, [subjectId, examState]);

  useEffect(() => {
    if (timeLeft <= 0 && questions.length > 0) {
      handleSubmitExam();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, questions.length]);

  const fetchQuestions = async () => {
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('model_year', examState.modelYear);
    
    if (error || !data) {
      toast.error('حدث خطأ في تحميل الأسئلة');
      navigate('/exam-bank');
      return;
    }

    // Shuffle and take required number of questions
    const shuffled = data.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, examState.questionsCount);
    
    // Parse options from JSONB
    const parsedQuestions: Question[] = selected.map(q => ({
      id: q.id,
      question_text: q.question_text,
      options: Array.isArray(q.options) ? q.options as string[] : [],
      correct_answer: q.correct_answer,
      explanation: q.explanation
    }));

    setQuestions(parsedQuestions);
    setAnswers(parsedQuestions.map(q => ({
      questionId: q.id,
      selectedAnswer: null,
      isCorrect: false
    })));
    setIsLoading(false);
  };

  const handleSelectAnswer = (answerIndex: number) => {
    const currentQuestion = questions[currentIndex];
    const newAnswers = [...answers];
    newAnswers[currentIndex] = {
      questionId: currentQuestion.id,
      selectedAnswer: answerIndex,
      isCorrect: answerIndex === currentQuestion.correct_answer
    };
    setAnswers(newAnswers);
  };

  const handleSubmitExam = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const correctCount = answers.filter(a => a.isCorrect).length;
    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= examState.passingScore;

    // Save attempt to database
    const attemptData = {
      subject_id: subjectId,
      student_name: examState.studentName,
      score,
      total_questions: questions.length,
      passed,
      duration_seconds: (examState.duration * 60) - timeLeft,
      answers: answers.map(a => ({
        questionId: a.questionId,
        selectedAnswer: a.selectedAnswer,
        isCorrect: a.isCorrect
      })) as unknown as Json
    };

    await supabase.from('exam_attempts').insert(attemptData);

    // Navigate to results
    navigate(`/exam/${subjectId}/result`, {
      state: {
        studentName: examState.studentName,
        score,
        totalQuestions: questions.length,
        correctCount,
        passed,
        passingScore: examState.passingScore,
        answers,
        questions,
        duration: (examState.duration * 60) - timeLeft
      }
    });
  }, [answers, examState, isSubmitting, navigate, questions, subjectId, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading || !examState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentIndex];
  const answeredCount = answers.filter(a => a.selectedAnswer !== null).length;
  const progress = (answeredCount / questions.length) * 100;
  const isTimeWarning = timeLeft < 60;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Timer Header */}
      <div className={`sticky top-0 z-50 py-4 px-4 ${isTimeWarning ? 'bg-destructive' : 'gradient-header'} text-primary-foreground`}>
        <div className="container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className={`h-5 w-5 ${isTimeWarning ? 'animate-pulse' : ''}`} />
              <span className="font-bold text-lg">{formatTime(timeLeft)}</span>
            </div>
            <span className="text-sm opacity-90">{examState.studentName}</span>
          </div>
          <Progress value={progress} className="mt-2 h-2" />
          <div className="flex justify-between text-xs mt-1 opacity-75">
            <span>السؤال {currentIndex + 1} من {questions.length}</span>
            <span>{answeredCount} إجابة من {questions.length}</span>
          </div>
        </div>
      </div>

      <div className="container px-4 py-6">
        {/* Question Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                {currentIndex + 1}
              </span>
              <p className="text-lg font-medium leading-relaxed">{currentQuestion.question_text}</p>
            </div>
          </CardContent>
        </Card>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <Card
              key={index}
              className={`cursor-pointer transition-all duration-200 ${
                currentAnswer?.selectedAnswer === index
                  ? 'border-2 border-primary bg-primary/10'
                  : 'hover:border-accent hover:bg-accent/5'
              }`}
              onClick={() => handleSelectAnswer(index)}
            >
              <CardContent className="flex items-center gap-3 py-4">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm shrink-0 ${
                  currentAnswer?.selectedAnswer === index
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {String.fromCharCode(1571 + index)}
                </span>
                <span className="text-foreground">{option}</span>
                {currentAnswer?.selectedAnswer === index && (
                  <CheckCircle className="h-5 w-5 text-primary mr-auto" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Question Navigator */}
        <div className="flex flex-wrap gap-2 mt-6 justify-center">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                index === currentIndex
                  ? 'bg-primary text-primary-foreground'
                  : answers[index]?.selectedAnswer !== null
                    ? 'bg-success text-white'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
        <div className="container flex gap-3">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="flex-1"
          >
            <ChevronRight className="h-4 w-4 ml-1" />
            السابق
          </Button>

          {currentIndex === questions.length - 1 ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="flex-1 bg-success hover:bg-success/90">
                  <CheckCircle className="h-4 w-4 ml-1" />
                  إنهاء الاختبار
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>تأكيد إنهاء الاختبار</AlertDialogTitle>
                  <AlertDialogDescription>
                    هل أنت متأكد من إنهاء الاختبار؟
                    <br />
                    لقد أجبت على {answeredCount} من {questions.length} سؤال.
                    {answeredCount < questions.length && (
                      <span className="text-destructive block mt-2">
                        <AlertTriangle className="h-4 w-4 inline ml-1" />
                        لديك {questions.length - answeredCount} أسئلة بدون إجابة
                      </span>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>متابعة الاختبار</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSubmitExam}>
                    إنهاء وعرض النتيجة
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
              className="flex-1"
            >
              التالي
              <ChevronLeft className="h-4 w-4 mr-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamTaking;
