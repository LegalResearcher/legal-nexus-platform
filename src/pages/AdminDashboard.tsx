import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, LogOut, Users, BookOpen, Settings, 
  BarChart3, Trash2, Home, Scale, FileText, FolderOpen
} from 'lucide-react';
import { toast } from 'sonner';
import AdminStats from '@/components/admin/AdminStats';
import AdminQuestions from '@/components/admin/AdminQuestions';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminPendingDeletions from '@/components/admin/AdminPendingDeletions';
import AdminLaws from '@/components/admin/AdminLaws';
import AdminBooks from '@/components/admin/AdminBooks';
import AdminTemplates from '@/components/admin/AdminTemplates';
import AdminCategories from '@/components/admin/AdminCategories';
import AdminSiteSettings from '@/components/admin/AdminSiteSettings';

type AppRole = 'admin' | 'editor';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer role fetching
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setIsLoading(false);
        navigate('/admin/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      toast.error('ليس لديك صلاحية الوصول');
      await supabase.auth.signOut();
      navigate('/admin/auth');
      return;
    }

    setUserRole(data.role as AppRole);
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('تم تسجيل الخروج');
    navigate('/admin/auth');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user || !userRole) {
    return null;
  }

  const isAdmin = userRole === 'admin';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-header text-primary-foreground py-4 px-4 sticky top-0 z-50">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6" />
            <div>
              <h1 className="font-bold">لوحة التحكم</h1>
              <p className="text-xs opacity-75">
                {isAdmin ? 'مسؤول' : 'محرر'} • {user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-primary-foreground hover:bg-white/20"
            >
              <Home className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-primary-foreground hover:bg-white/20"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container px-4 py-6">
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1 mb-6">
            <TabsTrigger value="stats" className="gap-1 text-xs">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">الإحصائيات</span>
            </TabsTrigger>
            <TabsTrigger value="questions" className="gap-1 text-xs">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">الأسئلة</span>
            </TabsTrigger>
            <TabsTrigger value="laws" className="gap-1 text-xs">
              <Scale className="h-4 w-4" />
              <span className="hidden sm:inline">القوانين</span>
            </TabsTrigger>
            <TabsTrigger value="books" className="gap-1 text-xs">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">الكتب</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-1 text-xs">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">النماذج</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-1 text-xs">
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">التصنيفات</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users" className="gap-1 text-xs">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">المستخدمين</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="settings" className="gap-1 text-xs">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">الإعدادات</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="pending" className="gap-1 text-xs">
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">طلبات الحذف</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="stats">
            <AdminStats />
          </TabsContent>

          <TabsContent value="questions">
            <AdminQuestions userRole={userRole} />
          </TabsContent>

          <TabsContent value="laws">
            <AdminLaws userRole={userRole} />
          </TabsContent>

          <TabsContent value="books">
            <AdminBooks userRole={userRole} />
          </TabsContent>

          <TabsContent value="templates">
            <AdminTemplates userRole={userRole} />
          </TabsContent>

          <TabsContent value="categories">
            <AdminCategories userRole={userRole} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="users">
              <AdminUsers />
            </TabsContent>
          )}

          <TabsContent value="settings">
            <div className="space-y-6">
              <AdminSettings userRole={userRole} />
              <AdminSiteSettings userRole={userRole} />
            </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="pending">
              <AdminPendingDeletions />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
