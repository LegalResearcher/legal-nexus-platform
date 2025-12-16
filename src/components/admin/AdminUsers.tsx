import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

const AdminUsers: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          إدارة المستخدمين
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-8">
          قريباً - واجهة إدارة المستخدمين والمحررين
        </p>
      </CardContent>
    </Card>
  );
};

export default AdminUsers;
