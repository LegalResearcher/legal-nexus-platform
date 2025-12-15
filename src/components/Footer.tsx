import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Globe, Eye, Loader2, DownloadCloud } from 'lucide-react';

interface FooterProps {
  visitCount: number;
  downloadCount: number;
  isLoading?: boolean;
  version: string;
  onDownloadClick: () => void;
}

const Footer: React.FC<FooterProps> = ({ 
  visitCount, 
  downloadCount, 
  isLoading = false, 
  version,
  onDownloadClick 
}) => {
  const handleDownloadClick = () => {
    onDownloadClick();
    window.open('https://www.upload-apk.com/UO1EHqgUTAZ0gdr', '_blank', 'noopener,noreferrer');
  };

  return (
    <footer className="mt-8 pt-6 border-t border-border">
      {/* Download Button */}
      <Button 
        variant="navSuccess" 
        size="lg" 
        className="w-full mb-4"
        onClick={handleDownloadClick}
      >
        <Download className="h-5 w-5" />
        اضغط هنا لتحميل التطبيق
      </Button>

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

      {/* Statistics */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 mb-4 bg-muted/50 py-4 px-6 rounded-xl">
        {/* Visit Count */}
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Eye className="h-5 w-5 text-navy dark:text-accent" />
          <span>عدد الزيارات:</span>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <strong className="text-foreground text-lg">{visitCount.toLocaleString('ar-EG')}</strong>
          )}
        </div>

        {/* Download Count */}
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <DownloadCloud className="h-5 w-5 text-success" />
          <span>عدد التحميلات:</span>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <strong className="text-foreground text-lg">{downloadCount.toLocaleString('ar-EG')}</strong>
          )}
        </div>
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
