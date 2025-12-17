import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Trash2, UserCog } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'editor';
  user_id: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  
  // Add user form
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'editor'>('editor');
  
  // Profile edit form
  const [currentEmail, setCurrentEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentEmail(user.email || '');
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      setFullName(profile?.full_name || '');
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('id, user_id, role');

      if (error) throw error;

      if (roles) {
        const userPromises = roles.map(async (role) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', role.user_id)
            .maybeSingle();
          
          return {
            id: role.id,
            user_id: role.user_id,
            email: profile?.email || 'غير معروف',
            full_name: profile?.full_name,
            role: role.role as 'admin' | 'editor'
          };
        });

        const usersWithRoles = await Promise.all(userPromises);
        setUsers(usersWithRoles);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('خطأ في جلب المستخدمين');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUserRole = async () => {
    if (!newUserEmail.trim()) {
      toast.error('يرجى إدخال البريد الإلكتروني');
      return;
    }

    try {
      // Find user by email in profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newUserEmail.trim())
        .maybeSingle();

      if (profileError || !profile) {
        toast.error('المستخدم غير موجود. يجب أن يقوم بإنشاء حساب أولاً');
        return;
      }

      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (existingRole) {
        toast.error('هذا المستخدم لديه صلاحية بالفعل');
        return;
      }

      // Add role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: profile.id,
          role: newUserRole
        });

      if (error) throw error;

      toast.success('تم إضافة الصلاحية بنجاح');
      setIsDialogOpen(false);
      setNewUserEmail('');
      setNewUserRole('editor');
      fetchUsers();
    } catch (error) {
      console.error('Error adding user role:', error);
      toast.error('خطأ في إضافة الصلاحية');
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast.success('تم إزالة الصلاحية');
      fetchUsers();
    } catch (error) {
      console.error('Error removing role:', error);
      toast.error('خطأ في إزالة الصلاحية');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update profile name
      if (fullName) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ full_name: fullName })
          .eq('id', user.id);

        if (profileError) throw profileError;
      }

      // Update password if provided
      if (newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (passwordError) throw passwordError;
      }

      toast.success('تم تحديث البيانات بنجاح');
      setIsProfileDialogOpen(false);
      setNewPassword('');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('خطأ في تحديث البيانات');
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
      {/* Profile Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              بيانات الحساب
            </div>
            <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  تعديل البيانات
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>تعديل بيانات الحساب</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input value={currentEmail} disabled />
                    <p className="text-xs text-muted-foreground">لا يمكن تغيير البريد الإلكتروني</p>
                  </div>
                  <div className="space-y-2">
                    <Label>الاسم الكامل</Label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="أدخل اسمك"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>كلمة المرور الجديدة</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="اتركها فارغة إذا لم ترد التغيير"
                    />
                  </div>
                  <Button onClick={handleUpdateProfile} className="w-full">
                    حفظ التغييرات
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">البريد الإلكتروني:</span>
              <p className="font-medium">{currentEmail}</p>
            </div>
            <div>
              <span className="text-muted-foreground">الاسم:</span>
              <p className="font-medium">{fullName || 'غير محدد'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Management Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              إدارة المستخدمين
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة صلاحية
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة صلاحية لمستخدم</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني للمستخدم</Label>
                    <Input
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="user@example.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      يجب أن يكون المستخدم قد أنشأ حساباً مسبقاً
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>الصلاحية</Label>
                    <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as 'admin' | 'editor')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">محرر</SelectItem>
                        <SelectItem value="admin">مسؤول</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddUserRole} className="w-full">
                    إضافة الصلاحية
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              لا يوجد مستخدمين بصلاحيات
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">البريد الإلكتروني</TableHead>
                  <TableHead className="text-center">الصلاحية</TableHead>
                  <TableHead className="text-center w-20">حذف</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.full_name || 'غير محدد'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role === 'admin' ? 'مسؤول' : 'محرر'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemoveRole(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
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

export default AdminUsers;
