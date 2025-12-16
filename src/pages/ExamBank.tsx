import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BookOpen, GraduationCap } from 'lucide-react';

interface Level {
  id: string;
  level_number: number;
  name_ar: string;
  name_en: string;
}

interface Subject {
  id: string;
  name_ar: string;
  name_en: string;
  level_id: string;
}

const ExamBank: React.FC = () => {
  const navigate = useNavigate();
  const [levels, setLevels] = useState<Level[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLevels();
  }, []);

  useEffect(() => {
    if (selectedLevel) {
      fetchSubjects(selectedLevel.id);
    }
  }, [selectedLevel]);

  const fetchLevels = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('exam_levels')
      .select('*')
      .order('level_number');
    
    if (!error && data) {
      setLevels(data);
    }
    setIsLoading(false);
  };

  const fetchSubjects = async (levelId: string) => {
    const { data, error } = await supabase
      .from('exam_subjects')
      .select('*')
      .eq('level_id', levelId)
      .order('name_ar');
    
    if (!error && data) {
      setSubjects(data);
    }
  };

  const handleBackToLevels = () => {
    setSelectedLevel(null);
    setSubjects([]);
  };

  const handleStartExam = (subject: Subject) => {
    // For now, show a toast - later will navigate to exam page
    console.log('Starting exam for:', subject.name_ar);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="gradient-header text-primary-foreground py-6 px-4 mb-6">
        <div className="container">
          <div className="flex items-center gap-3 mb-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => selectedLevel ? handleBackToLevels() : navigate('/')}
              className="text-primary-foreground hover:bg-white/20"
            >
              <ArrowRight className="h-6 w-6" />
            </Button>
            <GraduationCap className="h-8 w-8" />
            <h1 className="text-xl font-bold">بنك اختبارات الشريعة والقانون</h1>
          </div>
          <p className="text-sm opacity-90 mr-12">
            {selectedLevel ? selectedLevel.name_ar : 'اختر المستوى للبدء'}
          </p>
        </div>
      </div>

      <div className="container px-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : !selectedLevel ? (
          /* Levels Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {levels.map((level, index) => (
              <Card 
                key={level.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-2 border-transparent hover:border-accent animate-fade-in-scale"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => setSelectedLevel(level)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <span className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {level.level_number}
                    </span>
                    <span>{level.name_ar}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full gap-2">
                    <BookOpen className="h-4 w-4" />
                    ادخل للاختبارات
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Subjects List */
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                مواد {selectedLevel.name_ar}
              </h2>
              <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {subjects.length} مادة
              </span>
            </div>
            
            {subjects.map((subject, index) => (
              <Card 
                key={subject.id}
                className="animate-fade-in-scale"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-accent/20 text-accent-foreground flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="font-medium text-foreground">{subject.name_ar}</span>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleStartExam(subject)}
                    className="gap-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    ابدأ الاختبار
                  </Button>
                </CardContent>
              </Card>
            ))}

            {subjects.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد مواد متاحة لهذا المستوى</p>
              </div>
            )}
          </div>
        )}

        {/* Info Notice */}
        <Card className="mt-6 bg-warning-bg border-warning">
          <CardContent className="py-4">
            <p className="text-sm text-center text-foreground">
              📌 يحتوي بنك الاختبارات على أكثر من 350 اختبار محدث من نماذج الامتحانات الجامعية السابقة
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExamBank;
