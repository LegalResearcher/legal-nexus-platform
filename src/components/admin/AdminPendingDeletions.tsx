import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';

const AdminPendingDeletions: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          طلبات الحذف المعلقة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-8">
          لا توجد طلبات حذف معلقة
        </p>
      </CardContent>
    </Card>
  );
};

export default AdminPendingDeletions;
