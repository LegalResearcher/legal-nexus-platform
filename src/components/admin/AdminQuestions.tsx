import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

interface Props {
  userRole: 'admin' | 'editor';
}

const AdminQuestions: React.FC<Props> = ({ userRole }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          إدارة الأسئلة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-8">
          قريباً - واجهة إدارة الأسئلة
        </p>
      </CardContent>
    </Card>
  );
};

export default AdminQuestions;
