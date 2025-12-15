import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Globe, Eye } from 'lucide-react';

interface FooterProps {
  downloadCount: number;
  version: string;
}

const Footer: React.FC<FooterProps> = ({ downloadCount, version }) => {
  return (
    <footer className="mt-8 pt-6 border-t border-border">
      {/* Download Button */}
      <a 
        href="https://www.upload-apk.com/UO1EHqgUTAZ0gdr" 
        target="_blank" 
        rel="noopener noreferrer"
        className="block mb-4"
      >
        <Button variant="navSuccess" size="lg" className="w-full">
          <Download className="h-5 w-5" />
          اضغط هنا لتحميل التطبيق
        </Button>
      </a>

      {/* Policy Link */}
      <a href="#" className="block mb-4">
        <Button variant="navMuted" className="w-full text-sm py-2">
          <FileText className="h-4 w-4" />
          سياسة المستخدم
        </Button>
      </a>

      {/* Install Notice */}
      <div className="bg-warning-bg border-r-[6px] border-warning py-3 px-4 rounded-lg text-sm text-amber-800 dark:text-amber-200 dark:bg-amber-900/30 text-center mb-6">
        <span className="text-lg ml-2">⚠️</span>
        يظهر تحذير عند التثبيت لأن التطبيق غير منشور في المتاجر الرسمية. التطبيق آمن ويمكنك السماح بالتثبيت مرة واحدة فقط.
      </div>

      {/* Social Links */}
      <div className="flex justify-center gap-6 mb-4">
        <a 
          href="https://lawyer-alnasser.vercel.app/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-3xl hover:scale-125 transition-transform"
          title="الموقع الإلكتروني"
        >
          <Globe className="h-8 w-8 text-muted-foreground hover:text-navy dark:hover:text-accent" />
        </a>
      </div>

      {/* Download Count */}
      <div className="text-center text-muted-foreground mb-4">
        <Eye className="inline h-4 w-4 ml-2" />
        عدد التحميلات: <strong className="text-foreground">{downloadCount.toLocaleString('ar-EG')}</strong>
      </div>

      {/* Copyright */}
      <div className="text-center text-sm text-muted-foreground bg-muted py-3 px-4 rounded-lg">
        <span className="text-gold text-lg ml-2">⚖️</span>
        © 2025 الناصر تِك للحلول الرقمية. جميع الحقوق محفوظة.
      </div>

      {/* Version */}
      <div className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-2">
        <span className="inline-block w-5 h-5 gold-seal rounded-full relative overflow-hidden gold-seal-shine"></span>
        ⚖️ منصة الناصر القانونية – الإصدار الرسمي <strong>{version}</strong> © 2026
      </div>
    </footer>
  );
};

export default Footer;
