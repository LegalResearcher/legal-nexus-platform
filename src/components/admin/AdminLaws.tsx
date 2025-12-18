import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
import { Scale, Plus, Pencil, Trash2, Eye, EyeOff, Download, Search, Upload, Link } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Category {
  id: string;
  name_ar: string;
}

interface Law {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  file_url: string | null;
  source_type: string;
  file_type: string | null;
  is_visible: boolean;
  allow_download: boolean;
  total_downloads: number;
  total_views: number;
  created_at: string;
}

interface Props {
  userRole: 'admin' | 'editor';
}

const AdminLaws: React.FC<Props> = ({ userRole }) => {
  const [laws, setLaws] = useState<Law[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLaw, setEditingLaw] = useState<Law | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sourceType, setSourceType] = useState<'upload' | 'link'>('upload');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('pdf');
  const [isVisible, setIsVisible] = useState(true);
  const [allowDownload, setAllowDownload] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchLaws();
    fetchCategories();
  }, []);

  const fetchLaws = async () => {
    const { data, error } = await supabase
      .from('legal_laws')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLaws(data);
    }
    setIsLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('content_categories')
      .select('id, name_ar')
      .eq('type', 'laws');
    setCategories(data || []);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategoryId('');
    setSourceType('upload');
    setFileUrl('');
    setFileType('pdf');
    setIsVisible(true);
    setAllowDownload(true);
    setSelectedFile(null);
    setEditingLaw(null);
  };

  const openEditDialog = (law: Law) => {
    setEditingLaw(law);
    setTitle(law.title);
    setDescription(law.description || '');
    setCategoryId(law.category_id || '');
    setSourceType(law.source_type as 'upload' | 'link');
    setFileUrl(law.file_url || '');
    setFileType(law.file_type || 'pdf');
    setIsVisible(law.is_visible);
    setAllowDownload(law.allow_download);
    setIsDialogOpen(true);
  };

  const handleFileUpload = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `laws/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage
      .from('legal-files')
      .upload(fileName, file);

    if (error) {
      toast.error('فشل في رفع الملف');
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('legal-files')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('يرجى إدخال عنوان القانون');
      return;
    }

    setIsSubmitting(true);

    let uploadedFileUrl = fileUrl;

    if (sourceType === 'upload' && selectedFile) {
      uploadedFileUrl = await handleFileUpload(selectedFile);
      if (!uploadedFileUrl) {
        setIsSubmitting(false);
        return;
      }
    }

    const lawData = {
      title: title.trim(),
      description: description.trim() || null,
      category_id: categoryId || null,
      source_type: sourceType,
      file_url: uploadedFileUrl || null,
      file_type: fileType,
      is_visible: isVisible,
      allow_download: allowDownload,
    };

    if (editingLaw) {
      const { error } = await supabase
        .from('legal_laws')
        .update(lawData)
        .eq('id', editingLaw.id);

      if (error) {
        toast.error('فشل في تحديث القانون');
      } else {
        toast.success('تم تحديث القانون بنجاح');
      }
    } else {
      const { error } = await supabase
        .from('legal_laws')
        .insert(lawData);

      if (error) {
        toast.error('فشل في إضافة القانون');
      } else {
        toast.success('تم إضافة القانون بنجاح');
      }
    }

    setIsSubmitting(false);
    setIsDialogOpen(false);
    resetForm();
    fetchLaws();
  };

  const handleDelete = async (id: string) => {
    if (userRole !== 'admin') {
      toast.error('ليس لديك صلاحية الحذف');
      return;
    }

    if (!confirm('هل أنت متأكد من حذف هذا القانون؟')) return;

    const { error } = await supabase
      .from('legal_laws')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('فشل في حذف القانون');
    } else {
      toast.success('تم حذف القانون بنجاح');
      fetchLaws();
    }
  };

  const toggleVisibility = async (law: Law) => {
    const { error } = await supabase
      .from('legal_laws')
      .update({ is_visible: !law.is_visible })
      .eq('id', law.id);

    if (!error) {
      fetchLaws();
      toast.success(law.is_visible ? 'تم إخفاء القانون' : 'تم إظهار القانون');
    }
  };

  const filteredLaws = laws.filter(law =>
    law.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (law.description && law.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return '-';
    const category = categories.find(c => c.id === categoryId);
    return category?.name_ar || '-';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            إدارة القوانين
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة قانون
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingLaw ? 'تعديل القانون' : 'إضافة قانون جديد'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>العنوان *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="عنوان القانون"
                  />
                </div>

                <div className="space-y-2">
                  <Label>الوصف</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="وصف مختصر"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>التصنيف</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون تصنيف</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name_ar}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>مصدر الملف</Label>
                  <Select value={sourceType} onValueChange={(v) => setSourceType(v as 'upload' | 'link')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upload">
                        <span className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          رفع ملف
                        </span>
                      </SelectItem>
                      <SelectItem value="link">
                        <span className="flex items-center gap-2">
                          <Link className="h-4 w-4" />
                          رابط خارجي
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {sourceType === 'upload' ? (
                  <div className="space-y-2">
                    <Label>الملف</Label>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFile(file);
                          const ext = file.name.split('.').pop()?.toLowerCase();
                          if (ext) setFileType(ext);
                        }
                      }}
                    />
                    {editingLaw?.file_url && !selectedFile && (
                      <p className="text-sm text-muted-foreground">الملف الحالي محفوظ</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>رابط الملف</Label>
                    <Input
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      dir="ltr"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>نوع الملف</Label>
                  <Select value={fileType} onValueChange={setFileType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="doc">DOC</SelectItem>
                      <SelectItem value="docx">DOCX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>ظاهر للزوار</Label>
                  <Switch checked={isVisible} onCheckedChange={setIsVisible} />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>السماح بالتحميل</Label>
                  <Switch checked={allowDownload} onCheckedChange={setAllowDownload} />
                </div>

                <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'جاري الحفظ...' : editingLaw ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث في القوانين..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : filteredLaws.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">لا توجد قوانين</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">العنوان</TableHead>
                  <TableHead className="text-right">التصنيف</TableHead>
                  <TableHead className="text-center">التحميلات</TableHead>
                  <TableHead className="text-center">المشاهدات</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLaws.map((law) => (
                  <TableRow key={law.id}>
                    <TableCell className="font-medium">{law.title}</TableCell>
                    <TableCell>{getCategoryName(law.category_id)}</TableCell>
                    <TableCell className="text-center">
                      <span className="flex items-center justify-center gap-1">
                        <Download className="h-3 w-3" />
                        {law.total_downloads}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="flex items-center justify-center gap-1">
                        <Eye className="h-3 w-3" />
                        {law.total_views}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleVisibility(law)}
                      >
                        {law.is_visible ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(law)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {userRole === 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(law.id)}
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

export default AdminLaws;
