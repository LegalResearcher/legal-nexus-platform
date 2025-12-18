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
import { FolderOpen, Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Category {
  id: string;
  name_ar: string;
  name_en: string | null;
  type: string;
  created_at: string;
}

interface Props {
  userRole: 'admin' | 'editor';
}

const AdminCategories: React.FC<Props> = ({ userRole }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  // Form state
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [type, setType] = useState<string>('laws');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('content_categories')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCategories(data);
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setNameAr('');
    setNameEn('');
    setType('laws');
    setEditingCategory(null);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setNameAr(category.name_ar);
    setNameEn(category.name_en || '');
    setType(category.type);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!nameAr.trim()) {
      toast.error('يرجى إدخال اسم التصنيف');
      return;
    }

    setIsSubmitting(true);

    const categoryData = {
      name_ar: nameAr.trim(),
      name_en: nameEn.trim() || null,
      type,
    };

    if (editingCategory) {
      const { error } = await supabase
        .from('content_categories')
        .update(categoryData)
        .eq('id', editingCategory.id);

      if (error) {
        toast.error('فشل في تحديث التصنيف');
      } else {
        toast.success('تم تحديث التصنيف بنجاح');
      }
    } else {
      const { error } = await supabase
        .from('content_categories')
        .insert(categoryData);

      if (error) {
        toast.error('فشل في إضافة التصنيف');
      } else {
        toast.success('تم إضافة التصنيف بنجاح');
      }
    }

    setIsSubmitting(false);
    setIsDialogOpen(false);
    resetForm();
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (userRole !== 'admin') {
      toast.error('ليس لديك صلاحية الحذف');
      return;
    }

    if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return;

    const { error } = await supabase
      .from('content_categories')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('فشل في حذف التصنيف');
    } else {
      toast.success('تم حذف التصنيف بنجاح');
      fetchCategories();
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'laws': return 'القوانين';
      case 'books': return 'الكتب';
      case 'templates': return 'النماذج';
      default: return type;
    }
  };

  const filteredCategories = filterType === 'all'
    ? categories
    : categories.filter(c => c.type === filterType);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            إدارة التصنيفات
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة تصنيف
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>الاسم بالعربية *</Label>
                  <Input
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="اسم التصنيف"
                  />
                </div>

                <div className="space-y-2">
                  <Label>الاسم بالإنجليزية</Label>
                  <Input
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="Category name"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label>النوع</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="laws">القوانين</SelectItem>
                      <SelectItem value="books">الكتب</SelectItem>
                      <SelectItem value="templates">النماذج</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'جاري الحفظ...' : editingCategory ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="تصفية حسب النوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              <SelectItem value="laws">القوانين</SelectItem>
              <SelectItem value="books">الكتب</SelectItem>
              <SelectItem value="templates">النماذج</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">لا توجد تصنيفات</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم بالعربية</TableHead>
                  <TableHead className="text-right">الاسم بالإنجليزية</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name_ar}</TableCell>
                    <TableCell dir="ltr">{category.name_en || '-'}</TableCell>
                    <TableCell>{getTypeName(category.type)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {userRole === 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(category.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminCategories;
