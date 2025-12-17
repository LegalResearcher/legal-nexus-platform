import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, Check, X, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PendingDeletion {
  id: string;
  question_id: string;
  reason: string | null;
  created_at: string;
  question_text: string;
  subject_name: string;
  requester_name: string | null;
}

const AdminPendingDeletions: React.FC = () => {
  const [pendingDeletions, setPendingDeletions] = useState<PendingDeletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPendingDeletions();
  }, []);

  const fetchPendingDeletions = async () => {
    try {
      const { data: deletions, error } = await supabase
        .from('pending_question_deletions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (deletions) {
        const enrichedDeletions = await Promise.all(
          deletions.map(async (deletion) => {
            // Fetch question details
            const { data: question } = await supabase
              .from('exam_questions')
              .select('question_text, subject_id')
              .eq('id', deletion.question_id)
              .maybeSingle();

            // Fetch subject name
            let subjectName = 'غير معروف';
            if (question?.subject_id) {
              const { data: subject } = await supabase
                .from('exam_subjects')
                .select('name_ar')
                .eq('id', question.subject_id)
                .maybeSingle();
              subjectName = subject?.name_ar || 'غير معروف';
            }

            // Fetch requester name
            let requesterName = null;
            if (deletion.requested_by) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', deletion.requested_by)
                .maybeSingle();
              requesterName = profile?.full_name;
            }

            return {
              id: deletion.id,
              question_id: deletion.question_id,
              reason: deletion.reason,
              created_at: deletion.created_at,
              question_text: question?.question_text || 'سؤال محذوف',
              subject_name: subjectName,
              requester_name: requesterName
            };
          })
        );

        setPendingDeletions(enrichedDeletions);
      }
    } catch (error) {
      console.error('Error fetching pending deletions:', error);
      toast.error('خطأ في جلب طلبات الحذف');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (deletion: PendingDeletion) => {
    try {
      // Delete the question
      const { error: deleteQuestionError } = await supabase
        .from('exam_questions')
        .delete()
        .eq('id', deletion.question_id);

      if (deleteQuestionError) throw deleteQuestionError;

      // Remove the pending deletion record
      const { error: deletePendingError } = await supabase
        .from('pending_question_deletions')
        .delete()
        .eq('id', deletion.id);

      if (deletePendingError) throw deletePendingError;

      toast.success('تم حذف السؤال بنجاح');
      fetchPendingDeletions();
    } catch (error) {
      console.error('Error approving deletion:', error);
      toast.error('خطأ في حذف السؤال');
    }
  };

  const handleReject = async (deletionId: string) => {
    try {
      const { error } = await supabase
        .from('pending_question_deletions')
        .delete()
        .eq('id', deletionId);

      if (error) throw error;

      toast.success('تم رفض طلب الحذف');
      fetchPendingDeletions();
    } catch (error) {
      console.error('Error rejecting deletion:', error);
      toast.error('خطأ في رفض الطلب');
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          طلبات حذف الأسئلة
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingDeletions.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              لا توجد طلبات حذف معلقة
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">السؤال</TableHead>
                <TableHead className="text-right">المادة</TableHead>
                <TableHead className="text-right">طُلب بواسطة</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-center w-32">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingDeletions.map((deletion) => (
                <TableRow key={deletion.id}>
                  <TableCell className="max-w-xs truncate">
                    {deletion.question_text}
                  </TableCell>
                  <TableCell>{deletion.subject_name}</TableCell>
                  <TableCell>{deletion.requester_name || 'غير معروف'}</TableCell>
                  <TableCell>
                    {new Date(deletion.created_at).toLocaleDateString('ar-EG')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleApprove(deletion)}
                        title="موافقة وحذف"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleReject(deletion.id)}
                        title="رفض الطلب"
                      >
                        <X className="h-4 w-4" />
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

export default AdminPendingDeletions;
