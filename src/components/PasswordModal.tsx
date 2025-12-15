import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Lock, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const CORRECT_PASSWORD = 'vipaccess';
  const EXPIRY_DATE = new Date('2025-12-30T23:59:59');

  const handleSubmit = () => {
    const now = new Date();
    
    if (now > EXPIRY_DATE) {
      toast.error('⛔ انتهت صلاحية كلمة المرور بتاريخ 30 ديسمبر 2025.');
      return;
    }

    if (password === CORRECT_PASSWORD) {
      onSuccess();
      onClose();
      toast.success('✅ تم الدخول بنجاح!');
    } else {
      setError(true);
    }
  };

  const isExpired = new Date() > EXPIRY_DATE;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm" dir="rtl">
        <button 
          onClick={onClose}
          className="absolute left-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2 justify-center">
            <Lock className="h-5 w-5" />
            كلمة المرور مطلوبة
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Expiry Notice */}
          <div className={`text-center text-sm p-3 rounded-lg border ${
            isExpired 
              ? 'bg-destructive/10 border-destructive text-destructive' 
              : 'bg-muted border-border text-muted-foreground'
          }`}>
            {isExpired ? (
              <span>⛔ انتهت صلاحية كلمة المرور بتاريخ <strong>30 ديسمبر 2025</strong></span>
            ) : (
              <span>🔒 صلاحية كلمة المرور حتى: <strong>30 ديسمبر 2025</strong></span>
            )}
          </div>

          <Input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            placeholder="أدخل كلمة المرور"
            className="text-center"
          />

          {error && (
            <p className="text-destructive text-center text-sm">❌ كلمة المرور غير صحيحة</p>
          )}

          <Button onClick={handleSubmit} variant="nav" className="w-full">
            دخول
          </Button>

          <div className="text-center text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            🔑 للحصول على كلمة المرور، تواصل معنا عبر تيليجرام:{' '}
            <a 
              href="https://t.me/MuenAlnaser" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-navy dark:text-accent underline inline-flex items-center gap-1"
            >
              @MuenAlnaser
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <Button onClick={onClose} variant="navMuted" className="w-full">
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordModal;
