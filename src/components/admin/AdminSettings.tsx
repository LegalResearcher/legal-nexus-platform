import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, Save, Clock, Hash, Trophy, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  userRole: 'admin' | 'editor';
}

interface Level {
  id: string;
  name_ar: string;
}

interface Subject {
  id: string;
  name_ar: string;
}

interface ExamSettings {
  id: string;
  subject_id: string;
  default_duration_minutes: number;
  questions_count: number;
  passing_score: number;
  preparer_name: string | null;
  allow_time_override: boolean;
  password: string | null;
}

const AdminSettings: React.FC<Props> = ({ userRole }) => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [settings, setSettings] = useState<ExamSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [duration, setDuration] = useState(30);
  const [questionsCount, setQuestionsCount] = useState(20);
  const [passingScore, setPassingScore] = useState(60);
  const [preparerName, setPreparerName] = useState('');
  const [allowTimeOverride, setAllowTimeOverride] = useState(true);
  const [password, setPassword] = useState('');

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
      fetchSettings(selectedSubject);
    }
  }, [selectedSubject]);

  const fetchLevels = async () => {
    const { data } = await supabase
      .from('exam_levels')
      .select('id, name_ar')
      .order('level_number');
    setLevels(data || []);
  };

  const fetchSubjects = async (levelId: string) => {
    const { data } = await supabase
      .from('exam_subjects')
      .select('id, name_ar')
      .eq('level_id', levelId);
    setSubjects(data || []);
    setSelectedSubject('');
    setSettings(null);
  };

  const fetchSettings = async (subjectId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('exam_settings')
      .select('*')
      .eq('subject_id', subjectId)
      .maybeSingle();

    if (data) {
      setSettings(data);
      setDuration(data.default_duration_minutes);
      setQuestionsCount(data.questions_count);
      setPassingScore(data.passing_score);
      setPreparerName(data.preparer_name || '');
      setAllowTimeOverride(data.allow_time_override);
      setPassword(data.password || '');
    } else {
      // Reset to defaults
      setSettings(null);
      setDuration(30);
      setQuestionsCount(20);
      setPassingScore(60);
      setPreparerName('');
      setAllowTimeOverride(true);
      setPassword('');
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (userRole !== 'admin') {
      toast.error('ليس لديك صلاحية تعديل الإعدادات');
      return;
    }

    if (!selectedSubject) {
      toast.error('يرجى اختيار المادة أولاً');
      return;
    }

    setIsSaving(true);

    const settingsData = {
      subject_id: selectedSubject,
      default_duration_minutes: duration,
      questions_count: questionsCount,
      passing_score: passingScore,
      preparer_name: preparerName.trim() || null,
      allow_time_override: allowTimeOverride,
      password: password.trim() || null
    };

    if (settings) {
      const { error } = await supabase
        .from('exam_settings')
        .update(settingsData)
        .eq('id', settings.id);

      if (error) {
        toast.error('خطأ في حفظ الإعدادات');
        setIsSaving(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from('exam_settings')
        .insert(settingsData);

      if (error) {
        toast.error('خطأ في إنشاء الإعدادات');
        setIsSaving(false);
        return;
      }
    }

    toast.success('تم حفظ الإعدادات بنجاح');
    setIsSaving(false);
    fetchSettings(selectedSubject);
  };

  const isAdmin = userRole === 'admin';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          إعدادات الاختبارات
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isAdmin && (
          <div className="bg-muted/50 p-4 rounded-lg text-center">
            <p className="text-muted-foreground">
              يمكنك فقط عرض الإعدادات. للتعديل، يرجى التواصل مع المسؤول.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        {!selectedSubject ? (
          <p className="text-muted-foreground text-center py-8">
            اختر المستوى والمادة لعرض إعدادات الاختبار
          </p>
        ) : isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                مدة الاختبار (دقيقة)
              </Label>
              <Input
                type="number"
                min={1}
                max={180}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                disabled={!isAdmin}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                عدد الأسئلة
              </Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={questionsCount}
                onChange={(e) => setQuestionsCount(parseInt(e.target.value) || 20)}
                disabled={!isAdmin}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                درجة النجاح (%)
              </Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(parseInt(e.target.value) || 60)}
                disabled={!isAdmin}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                اسم مُعد الأسئلة (اختياري)
              </Label>
              <Input
                value={preparerName}
                onChange={(e) => setPreparerName(e.target.value)}
                placeholder="اسم المُعد"
                disabled={!isAdmin}
              />
            </div>

            <div className="space-y-2">
              <Label>كلمة مرور الاختبار (اختياري)</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="اتركها فارغة للوصول المفتوح"
                disabled={!isAdmin}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label className="flex-1">السماح بتخصيص الوقت للطالب</Label>
              <Switch
                checked={allowTimeOverride}
                onCheckedChange={setAllowTimeOverride}
                disabled={!isAdmin}
              />
            </div>
          </div>
        )}

        {selectedSubject && isAdmin && (
          <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminSettings;
