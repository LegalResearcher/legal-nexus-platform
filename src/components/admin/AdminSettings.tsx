import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

interface Props {
  userRole: 'admin' | 'editor';
}

const AdminSettings: React.FC<Props> = ({ userRole }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          إعدادات الاختبارات
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-8">
          قريباً - واجهة إعدادات الاختبارات (الوقت، عدد الأسئلة، درجة النجاح)
        </p>
      </CardContent>
    </Card>
  );
};

export default AdminSettings;
