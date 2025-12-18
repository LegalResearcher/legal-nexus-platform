import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BookOpen, Plus, Edit, Trash2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  userRole: 'admin' | 'editor';
}

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
  subject_id: string;
  model_year: number | null;
}

const MODEL_YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

interface Subject {
  id: string;
  name_ar: string;
  level_id: string;
}

interface Level {
  id: string;
  name_ar: string;
}

const AdminQuestions: React.FC<Props> = ({ userRole }) => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form state
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [questionYear, setQuestionYear] = useState<number>(2024);

  useEffect(() => {
    fetchLevels();
  }, []);

  useEffect(() => {
    if (selectedLevel) {
      fetchSubjects(selectedLevel);
    }
  }, [selectedLevel]);

  useEffect(() => {
    if (selectedSubject) {
      fetchQuestions(selectedSubject);
    }
  }, [selectedSubject]);

  const fetchLevels = async () => {
    const { data } = await supabase
      .from('exam_levels')
      .select('id, name_ar')
      .order('level_number');
    setLevels(data || []);
    setIsLoading(false);
  };

  const fetchSubjects = async (levelId: string) => {
    const { data } = await supabase
      .from('exam_subjects')
      .select('id, name_ar, level_id')
      .eq('level_id', levelId);
    setSubjects(data || []);
    setSelectedSubject('');
    setQuestions([]);
  };

  const fetchQuestions = async (subjectId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('خطأ في جلب الأسئلة');
      return;
    }
    
    setQuestions((data || []).map(q => ({
      ...q,
      options: Array.isArray(q.options) ? q.options as string[] : []
    })));
    setIsLoading(false);
  };

  const resetForm = () => {
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectAnswer(0);
    setExplanation('');
    setQuestionYear(2024);
    setEditingQuestion(null);
  };

  const openEditDialog = (question: Question) => {
    setEditingQuestion(question);
    setQuestionText(question.question_text);
    setOptions([...question.options]);
    setCorrectAnswer(question.correct_answer);
    setExplanation(question.explanation || '');
    setQuestionYear(question.model_year || 2024);
    setIsDialogOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!questionText.trim()) {
      toast.error('يرجى إدخال نص السؤال');
      return;
    }

    const filledOptions = options.filter(o => o.trim());
    if (filledOptions.length < 2) {
      toast.error('يرجى إدخال خيارين على الأقل');
      return;
    }

    if (!selectedSubject) {
      toast.error('يرجى اختيار المادة أولاً');
      return;
    }

    const questionData = {
      question_text: questionText.trim(),
      options: filledOptions,
      correct_answer: correctAnswer,
      explanation: explanation.trim() || null,
      subject_id: selectedSubject,
      model_year: questionYear
    };

    if (editingQuestion) {
      const { error } = await supabase
        .from('exam_questions')
        .update(questionData)
        .eq('id', editingQuestion.id);

      if (error) {
        toast.error('خطأ في تحديث السؤال');
        return;
      }
      toast.success('تم تحديث السؤال بنجاح');
    } else {
      const { error } = await supabase
        .from('exam_questions')
        .insert(questionData);

      if (error) {
        toast.error('خطأ في إضافة السؤال');
        return;
      }
      toast.success('تم إضافة السؤال بنجاح');
    }

    setIsDialogOpen(false);
    resetForm();
    fetchQuestions(selectedSubject);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (userRole === 'admin') {
      // Admin can delete directly
      const { error } = await supabase
        .from('exam_questions')
        .delete()
        .eq('id', questionId);

      if (error) {
        toast.error('خطأ في حذف السؤال');
        return;
      }
      toast.success('تم حذف السؤال');
    } else {
      // Editor: request deletion
      const { data: session } = await supabase.auth.getSession();
      const { error } = await supabase
        .from('pending_question_deletions')
        .insert({
          question_id: questionId,
          requested_by: session.session?.user.id,
          reason: 'طلب حذف من المحرر'
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('تم طلب حذف هذا السؤال مسبقاً');
        } else {
          toast.error('خطأ في طلب الحذف');
        }
        return;
      }
      toast.success('تم إرسال طلب الحذف للمسؤول');
    }
    
    fetchQuestions(selectedSubject);
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question_text.includes(searchQuery);
    const matchesYear = selectedYear === 'all' || !selectedYear || q.model_year === parseInt(selectedYear);
    return matchesSearch && matchesYear;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            إدارة الأسئلة
          </div>
          {selectedSubject && (
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة سؤال
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>نص السؤال</Label>
                    <Textarea
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="أدخل نص السؤال..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>الخيارات</Label>
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...options];
                            newOptions[index] = e.target.value;
                            setOptions(newOptions);
                          }}
                          placeholder={`الخيار ${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant={correctAnswer === index ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCorrectAnswer(index)}
                        >
                          {correctAnswer === index ? 'صحيح' : 'اختر'}
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label>نموذج الاختبار (السنة)</Label>
                    <Select value={questionYear.toString()} onValueChange={(v) => setQuestionYear(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر السنة" />
                      </SelectTrigger>
                      <SelectContent>
                        {MODEL_YEARS.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>الملاحظة الإرشادية (اختياري)</Label>
                    <Textarea
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      placeholder="شرح للإجابة الصحيحة..."
                      rows={2}
                    />
                  </div>

                  <Button onClick={handleSaveQuestion} className="w-full">
                    {editingQuestion ? 'تحديث السؤال' : 'إضافة السؤال'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger>
              <SelectValue placeholder="اختر المستوى" />
            </SelectTrigger>
            <SelectContent>
              {levels.map((level) => (
                <SelectItem key={level.id} value={level.id}>
                  {level.name_ar}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={selectedSubject} 
            onValueChange={setSelectedSubject}
            disabled={!selectedLevel}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر المادة" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name_ar}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={selectedYear} 
            onValueChange={setSelectedYear}
          >
            <SelectTrigger>
              <SelectValue placeholder="نموذج الاختبار" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع السنوات</SelectItem>
              {MODEL_YEARS.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث في الأسئلة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        {!selectedSubject ? (
          <p className="text-muted-foreground text-center py-8">
            اختر المستوى والمادة لعرض الأسئلة
          </p>
        ) : isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            لا توجد أسئلة في هذه المادة
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right w-16">#</TableHead>
                <TableHead className="text-right">السؤال</TableHead>
                <TableHead className="text-center w-32">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuestions.map((question, index) => (
                <TableRow key={question.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {question.question_text}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(question)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteQuestion(question.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminQuestions;
