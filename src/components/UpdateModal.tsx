import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: string;
  releaseDate: string;
}

const UpdateModal: React.FC<UpdateModalProps> = ({ isOpen, onClose, version, releaseDate }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6 text-center" dir="rtl">
        <button 
          onClick={onClose}
          className="absolute left-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Gold Seal */}
        <div className="w-24 h-24 mx-auto mb-4 gold-seal rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm relative overflow-hidden gold-seal-shine">
          نسخة جديدة
        </div>

        <h2 className="text-xl font-bold text-navy dark:text-foreground mb-3">
          🏛️ مرحباً بكم في الإصدار الرسمي <strong>{version}</strong> – منصة الناصر القانونية ⚖️
        </h2>

        <p className="text-muted-foreground text-sm mb-4">
          تم إطلاق التحديث الجديد بتاريخ <strong>{releaseDate}</strong>.
        </p>

        <div className="text-right bg-muted p-4 rounded-lg mb-4 text-sm leading-relaxed">
          <p className="font-semibold mb-2">📱 <strong>ما الجديد في هذه النسخة؟</strong></p>
          <p>✅ إصلاح شامل ونهائي لكل الأخطاء</p>
          <p>🚀 أداء أسرع وتجربة استخدام أكثر سلاسة</p>
          <p>🎨 تصميم أكثر أناقة واستقرارًا لمحترفي القانون</p>
          <p>⚙️ دعم العمل بدون إنترنت لأهم الأقسام</p>
        </div>

        <p className="text-destructive text-sm font-bold mb-4">
          🔔 يرجى حذف النسخ القديمة الآن، وحمّل النسخة الجديدة والمُحسّنة!
        </p>

        <p className="text-muted-foreground text-xs mb-5">
          © 2025 الناصر تِك للحلول الرقمية. جميع الحقوق محفوظة.
        </p>

        <Button onClick={onClose} variant="nav" size="lg">
          ✅ اضغط هنا للبدء
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateModal;
