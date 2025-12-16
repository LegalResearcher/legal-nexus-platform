import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { ArrowRight, Clock, BookOpen, User, Lock, Play } from 'lucide-react';
import { toast } from 'sonner';

interface Subject {
  id: string;
  name_ar: string;
  name_en: string;
  level_id: string;
}

interface Level {
  id: string;
  name_ar: string;
  level_number: number;
}

interface ExamSettings {
  default_duration_minutes: number;
  questions_count: number;
  passing_score: number;
  password: string | null;
  preparer_name: string | null;
  allow_time_override: boolean;
}

const ExamStart: React.FC = () => {
  const navigate = useNavigate();
  const { subjectId } = useParams<{ subjectId: string }>();
  
  const [subject, setSubject] = useState<Subject | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [settings, setSettings] = useState<ExamSettings | null>(null);
  const [questionsCount, setQuestionsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const [studentName, setStudentName] = useState('');
  const [password, setPassword] = useState('');
  const [customDuration, setCustomDuration] = useState(30);
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  useEffect(() => {
    if (subjectId) {
      fetchSubjectDetails();
    }
  }, [subjectId]);

  const fetchSubjectDetails = async () => {
    setIsLoading(true);
    
    // Fetch subject
    const { data: subjectData } = await supabase
      .from('exam_subjects')
      .select('*')
      .eq('id', subjectId)
      .maybeSingle();
    
    if (subjectData) {
      setSubject(subjectData);
      
      // Fetch level
      const { data: levelData } = await supabase
        .from('exam_levels')
        .select('*')
        .eq('id', subjectData.level_id)
        .maybeSingle();
      
      if (levelData) {
        setLevel(levelData);
      }
    }

    // Fetch exam settings
    const { data: settingsData } = await supabase
      .from('exam_settings')
      .select('*')
      .eq('subject_id', subjectId)
      .maybeSingle();
    
    if (settingsData) {
      setSettings(settingsData);
      setCustomDuration(settingsData.default_duration_minutes);
      setShowPasswordInput(!!settingsData.password);
    } else {
      // Default settings
      setSettings({
        default_duration_minutes: 30,
        questions_count: 20,
        passing_score: 60,
        password: null,
        preparer_name: null,
        allow_time_override: true
      });
      setCustomDuration(30);
    }

    // Fetch questions count
    const { count } = await supabase
      .from('exam_questions')
      .select('*', { count: 'exact', head: true })
      .eq('subject_id', subjectId);
    
    setQuestionsCount(count || 0);
    setIsLoading(false);
  };

  const handleStartExam = () => {
    if (!studentName.trim()) {
      toast.error('الرجاء إدخال اسمك');
      return;
    }

    if (settings?.password && password !== settings.password) {
      toast.error('كلمة المرور غير صحيحة');
      return;
    }

    const actualQuestionsCount = Math.min(
      settings?.questions_count || 20,
      questionsCount
    );

    if (actualQuestionsCount === 0) {
      toast.error('لا توجد أسئلة متاحة لهذا الاختبار');
      return;
    }

    // Navigate to exam with state
    navigate(`/exam/${subjectId}/take`, {
      state: {
        studentName: studentName.trim(),
        duration: customDuration,
        questionsCount: actualQuestionsCount,
        passingScore: settings?.passing_score || 60
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const actualQuestionsCount = Math.min(
    settings?.questions_count || 20,
    questionsCount
  );

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="gradient-header text-primary-foreground py-6 px-4 mb-6">
        <div className="container">
          <div className="flex items-center gap-3 mb-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/exam-bank')}
              className="text-primary-foreground hover:bg-white/20"
            >
              <ArrowRight className="h-6 w-6" />
            </Button>
            <BookOpen className="h-8 w-8" />
            <h1 className="text-xl font-bold">بدء الاختبار</h1>
          </div>
          <p className="text-sm opacity-90 mr-12">
            {subject?.name_ar || 'جاري التحميل...'}
          </p>
        </div>
      </div>

      <div className="container px-4 space-y-6">
        {/* Exam Info Card */}
        <Card className="border-2 border-accent/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-accent" />
              معلومات الاختبار
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">المستوى</span>
              <span className="font-semibold">{level?.name_ar}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">المادة</span>
              <span className="font-semibold">{subject?.name_ar}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">عدد الأسئلة</span>
              <span className="font-semibold">{actualQuestionsCount} سؤال</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">درجة النجاح</span>
              <span className="font-semibold text-success">{settings?.passing_score}%</span>
            </div>
            {settings?.preparer_name && (
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">إعداد</span>
                <span className="font-semibold">{settings.preparer_name}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Name */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="studentName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                اسم الطالب
              </Label>
              <Input
                id="studentName"
                placeholder="أدخل اسمك الكامل"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="text-right"
              />
            </div>
          </CardContent>
        </Card>

        {/* Duration Selection */}
        {settings?.allow_time_override && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  مدة الاختبار: <span className="text-primary font-bold">{customDuration} دقيقة</span>
                </Label>
                <Slider
                  value={[customDuration]}
                  onValueChange={(value) => setCustomDuration(value[0])}
                  min={5}
                  max={120}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5 دقائق</span>
                  <span className="text-accent">الافتراضي: {settings?.default_duration_minutes} دقيقة</span>
                  <span>120 دقيقة</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Password Input */}
        {showPasswordInput && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  كلمة مرور الاختبار
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-right"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Start Button */}
        <Button 
          onClick={handleStartExam}
          className="w-full h-14 text-lg gap-3"
          disabled={!studentName.trim() || actualQuestionsCount === 0}
        >
          <Play className="h-6 w-6" />
          ابدأ الاختبار
        </Button>

        {actualQuestionsCount === 0 && (
          <p className="text-center text-destructive text-sm">
            ⚠️ لا توجد أسئلة متاحة لهذا الاختبار حالياً
          </p>
        )}
      </div>
    </div>
  );
};

export default ExamStart;
