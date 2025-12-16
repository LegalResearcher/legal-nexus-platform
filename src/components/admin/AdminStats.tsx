import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Users, BookOpen, CheckCircle } from 'lucide-react';

const AdminStats: React.FC = () => {
  const [stats, setStats] = useState({
    totalVisits: 0,
    totalAttempts: 0,
    totalQuestions: 0,
    totalSubjects: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [visits, attempts, questions, subjects] = await Promise.all([
      supabase.from('page_visits').select('visits_count').eq('page_name', 'الرئيسية').maybeSingle(),
      supabase.from('exam_attempts').select('*', { count: 'exact', head: true }),
      supabase.from('exam_questions').select('*', { count: 'exact', head: true }),
      supabase.from('exam_subjects').select('*', { count: 'exact', head: true })
    ]);

    setStats({
      totalVisits: visits.data?.visits_count || 0,
      totalAttempts: attempts.count || 0,
      totalQuestions: questions.count || 0,
      totalSubjects: subjects.count || 0
    });
  };

  const statCards = [
    { title: 'إجمالي الزيارات', value: stats.totalVisits, icon: Eye, color: 'text-blue-500' },
    { title: 'إجمالي الاختبارات', value: stats.totalAttempts, icon: CheckCircle, color: 'text-green-500' },
    { title: 'عدد الأسئلة', value: stats.totalQuestions, icon: BookOpen, color: 'text-purple-500' },
    { title: 'عدد المواد', value: stats.totalSubjects, icon: Users, color: 'text-orange-500' }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminStats;
