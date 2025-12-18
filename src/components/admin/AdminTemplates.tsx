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
import { FileText, Plus, Pencil, Trash2, Eye, EyeOff, Download, Search, Upload, Link, Image, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Category {
  id: string;
  name_ar: string;
}

interface Template {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  file_url: string | null;
  source_type: string;
  file_type: string | null;
  image_urls: string[];
  is_visible: boolean;
  allow_download: boolean;
  total_downloads: number;
  total_views: number;
  created_at: string;
}

interface Props {
  userRole: 'admin' | 'editor';
}

const AdminTemplates: React.FC<Props> = ({ userRole }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
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
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  useEffect(() => {
    fetchTemplates();
    fetchCategories();
  }, []);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('legal_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const typedData = data.map(item => ({
        ...item,
        image_urls: Array.isArray(item.image_urls) ? item.image_urls : []
      }));
      setTemplates(typedData as Template[]);
    }
    setIsLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('content_categories')
      .select('id, name_ar')
      .eq('type', 'templates');
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
    setImageUrls([]);
    setSelectedImages([]);
    setEditingTemplate(null);
  };

  const openEditDialog = (template: Template) => {
    setEditingTemplate(template);
    setTitle(template.title);
    setDescription(template.description || '');
    setCategoryId(template.category_id || '');
    setSourceType(template.source_type as 'upload' | 'link');
    setFileUrl(template.file_url || '');
    setFileType(template.file_type || 'pdf');
    setIsVisible(template.is_visible);
    setAllowDownload(template.allow_download);
    setImageUrls(template.image_urls || []);
    setIsDialogOpen(true);
  };

  const handleFileUpload = async (file: File, folder: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

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
      toast.error('يرجى إدخال عنوان النموذج');
      return;
    }

    setIsSubmitting(true);

    let uploadedFileUrl = fileUrl;
    let uploadedImageUrls = [...imageUrls];

    // Upload main file if selected
    if (sourceType === 'upload' && selectedFile) {
      uploadedFileUrl = await handleFileUpload(selectedFile, 'templates');
      if (!uploadedFileUrl) {
        setIsSubmitting(false);
        return;
      }
    }

    // Upload images
    for (const image of selectedImages) {
      const imageUrl = await handleFileUpload(image, 'template-images');
      if (imageUrl) {
        uploadedImageUrls.push(imageUrl);
      }
    }

    const templateData = {
      title: title.trim(),
      description: description.trim() || null,
      category_id: categoryId || null,
      source_type: sourceType,
      file_url: uploadedFileUrl || null,
      file_type: fileType,
      image_urls: uploadedImageUrls,
      is_visible: isVisible,
      allow_download: allowDownload,
    };

    if (editingTemplate) {
      const { error } = await supabase
        .from('legal_templates')
        .update(templateData)
        .eq('id', editingTemplate.id);

      if (error) {
        toast.error('فشل في تحديث النموذج');
      } else {
        toast.success('تم تحديث النموذج بنجاح');
      }
    } else {
      const { error } = await supabase
        .from('legal_templates')
        .insert(templateData);

      if (error) {
        toast.error('فشل في إضافة النموذج');
      } else {
        toast.success('تم إضافة النموذج بنجاح');
      }
    }

    setIsSubmitting(false);
    setIsDialogOpen(false);
    resetForm();
    fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    if (userRole !== 'admin') {
      toast.error('ليس لديك صلاحية الحذف');
      return;
    }

    if (!confirm('هل أنت متأكد من حذف هذا النموذج؟')) return;

    const { error } = await supabase
      .from('legal_templates')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('فشل في حذف النموذج');
    } else {
      toast.success('تم حذف النموذج بنجاح');
      fetchTemplates();
    }
  };

  const toggleVisibility = async (template: Template) => {
    const { error } = await supabase
      .from('legal_templates')
      .update({ is_visible: !template.is_visible })
      .eq('id', template.id);

    if (!error) {
      fetchTemplates();
      toast.success(template.is_visible ? 'تم إخفاء النموذج' : 'تم إظهار النموذج');
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()))
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
            <FileText className="h-5 w-5" />
            إدارة النماذج القانونية
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة نموذج
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? 'تعديل النموذج' : 'إضافة نموذج جديد'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>العنوان *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="عنوان النموذج"
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
                    {editingTemplate?.file_url && !selectedFile && (
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

                {/* Image Gallery */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    معرض الصور
                  </Label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setSelectedImages(prev => [...prev, ...files]);
                    }}
                  />
                  {(imageUrls.length > 0 || selectedImages.length > 0) && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {imageUrls.map((url, index) => (
                        <div key={url} className="relative group">
                          <img src={url} alt="" className="w-full h-20 object-cover rounded" />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {selectedImages.map((file, index) => (
                        <div key={index} className="relative group">
                          <img src={URL.createObjectURL(file)} alt="" className="w-full h-20 object-cover rounded" />
                          <button
                            type="button"
                            onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
                  {isSubmitting ? 'جاري الحفظ...' : editingTemplate ? 'تحديث' : 'إضافة'}
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
              placeholder="بحث في النماذج..."
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
        ) : filteredTemplates.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">لا توجد نماذج</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">العنوان</TableHead>
                  <TableHead className="text-right">التصنيف</TableHead>
                  <TableHead className="text-center">الصور</TableHead>
                  <TableHead className="text-center">التحميلات</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.title}</TableCell>
                    <TableCell>{getCategoryName(template.category_id)}</TableCell>
                    <TableCell className="text-center">
                      <span className="flex items-center justify-center gap-1">
                        <Image className="h-3 w-3" />
                        {template.image_urls?.length || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="flex items-center justify-center gap-1">
                        <Download className="h-3 w-3" />
                        {template.total_downloads}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleVisibility(template)}
                      >
                        {template.is_visible ? (
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
                          onClick={() => openEditDialog(template)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {userRole === 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(template.id)}
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

export default AdminTemplates;
