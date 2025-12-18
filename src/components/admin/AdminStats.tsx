import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, Eye, BookOpen, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SubjectStats {
  id: string;
  name_ar: string;
  attempts_count: number;
}

const AdminStats: React.FC = () => {
  const [totalVisits, setTotalVisits] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [totalDownloads, setTotalDownloads] = useState(0);
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch total visits
      const { data: visitsData } = await supabase
        .from('page_visits')
        .select('visits_count')
        .eq('page_name', 'home_visit')
        .maybeSingle();
      
      setTotalVisits(visitsData?.visits_count || 0);

      // Fetch total attempts
      const { count: attemptsCount } = await supabase
        .from('exam_attempts')
        .select('*', { count: 'exact', head: true });
      
      setTotalAttempts(attemptsCount || 0);

      // Fetch total downloads from all content tables
      const [lawsData, booksData, templatesData] = await Promise.all([
        supabase.from('legal_laws').select('total_downloads'),
        supabase.from('legal_books').select('total_downloads'),
        supabase.from('legal_templates').select('total_downloads'),
      ]);

      const lawsDownloads = (lawsData.data || []).reduce((sum, item) => sum + (item.total_downloads || 0), 0);
      const booksDownloads = (booksData.data || []).reduce((sum, item) => sum + (item.total_downloads || 0), 0);
      const templatesDownloads = (templatesData.data || []).reduce((sum, item) => sum + (item.total_downloads || 0), 0);
      
      setTotalDownloads(lawsDownloads + booksDownloads + templatesDownloads);

      // Fetch attempts per subject
      const { data: subjects } = await supabase
        .from('exam_subjects')
        .select('id, name_ar');

      if (subjects) {
        const statsPromises = subjects.map(async (subject) => {
          const { count } = await supabase
            .from('exam_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('subject_id', subject.id);
          
          return {
            id: subject.id,
            name_ar: subject.name_ar,
            attempts_count: count || 0
          };
        });

        const stats = await Promise.all(statsPromises);
        setSubjectStats(stats.filter(s => s.attempts_count > 0).sort((a, b) => b.attempts_count - a.attempts_count));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="h-5 w-5" />
              إجمالي الزيارات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalVisits.toLocaleString('ar-EG')}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              إجمالي محاولات الاختبار
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalAttempts.toLocaleString('ar-EG')}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5" />
              المواد النشطة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{subjectStats.length.toLocaleString('ar-EG')}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Download className="h-5 w-5" />
              إجمالي التحميلات الفعلية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalDownloads.toLocaleString('ar-EG')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            محاولات الاختبار حسب المادة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subjectStats.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              لا توجد محاولات اختبار بعد
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المادة</TableHead>
                  <TableHead className="text-center">عدد المحاولات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjectStats.map((stat) => (
                  <TableRow key={stat.id}>
                    <TableCell className="font-medium">{stat.name_ar}</TableCell>
                    <TableCell className="text-center">{stat.attempts_count.toLocaleString('ar-EG')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStats;
