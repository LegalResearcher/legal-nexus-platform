import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Save, MessageCircle, Scale } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  userRole: 'admin' | 'editor';
}

const AdminSiteSettings: React.FC<Props> = ({ userRole }) => {
  const [telegramBotLink, setTelegramBotLink] = useState('');
  const [legalConsultantUrl, setLegalConsultantUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('setting_key, setting_value');

    if (data) {
      data.forEach(setting => {
        if (setting.setting_key === 'telegram_bot_link') {
          setTelegramBotLink(setting.setting_value || '');
        } else if (setting.setting_key === 'legal_consultant_url') {
          setLegalConsultantUrl(setting.setting_value || '');
        }
      });
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (userRole !== 'admin') {
      toast.error('ليس لديك صلاحية تعديل الإعدادات');
      return;
    }

    setIsSaving(true);

    // Update telegram_bot_link
    await supabase
      .from('site_settings')
      .update({ setting_value: telegramBotLink.trim() })
      .eq('setting_key', 'telegram_bot_link');

    // Update legal_consultant_url
    await supabase
      .from('site_settings')
      .update({ setting_value: legalConsultantUrl.trim() })
      .eq('setting_key', 'legal_consultant_url');

    toast.success('تم حفظ الإعدادات بنجاح');
    setIsSaving(false);
  };

  const isAdmin = userRole === 'admin';

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          إعدادات الموقع العامة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isAdmin && (
          <div className="bg-muted/50 p-4 rounded-lg text-center">
            <p className="text-muted-foreground">
              يمكنك فقط عرض الإعدادات. للتعديل، يرجى التواصل مع المسؤول.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              رابط بوت تيليجرام
            </Label>
            <Input
              value={telegramBotLink}
              onChange={(e) => setTelegramBotLink(e.target.value)}
              placeholder="https://t.me/YourBot"
              dir="ltr"
              disabled={!isAdmin}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              رابط المستشار القانوني
            </Label>
            <Input
              value={legalConsultantUrl}
              onChange={(e) => setLegalConsultantUrl(e.target.value)}
              placeholder="https://example.com/consultant"
              dir="ltr"
              disabled={!isAdmin}
            />
          </div>
        </div>

        {isAdmin && (
          <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminSiteSettings;
